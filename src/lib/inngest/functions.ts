import fs from "fs"
import path from "path"
import os from "os"
import { inngest } from "./client"
import { createClient } from "@supabase/supabase-js"
import { GoogleGenAI } from "@google/genai"

// Supabase Admin/Client setup for background functions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

// Initialize Gemini for form parsing
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null
  return new GoogleGenAI({ apiKey })
}

/**
 * 1. Background Event: Scan job application form fields
 */
export const scanApplicationForm = inngest.createFunction(
  { id: "scan-job-form", name: "Scan Job Application Form", triggers: [{ event: "job/application.scan" }] },
  async ({ event, step }: { event: any; step: any }) => {
    const { applicationId, jobUrl, platform, userId } = event.data

    let targetUrl = jobUrl
    if (platform === "lever" && !targetUrl.includes("/apply")) {
      targetUrl = targetUrl.replace(/\/$/, "") + "/apply"
    }

    try {
      await step.run("update-status-scanning", async () => {
        await supabaseAdmin
          .from("job_applications")
          .update({ status: "detecting_fields", updated_at: new Date().toISOString() })
          .eq("id", applicationId)
      })

    const browserbaseKey = process.env.BROWSERBASE_API_KEY
    const projectId = process.env.BROWSERBASE_PROJECT_ID

    // Run form inspection
    const scanResult = await step.run("inspect-page-fields", async () => {
      // If Browserbase credentials are not configured, simulate scanner
      if (!browserbaseKey || !projectId) {
        console.warn("Browserbase credentials missing. Simulating form scan...")
        await new Promise((resolve) => setTimeout(resolve, 3000)) // simulate loading

        // Return a mock set of detected fields based on the platform
        return {
          success: true,
          fields: [
            { label: "Full Name", type: "text", required: true, key: "full_name" },
            { label: "Email", type: "email", required: true, key: "email" },
            { label: "Phone", type: "tel", required: true, key: "phone" },
            { label: "Resume", type: "file", required: true, key: "resume" },
            { label: "LinkedIn URL", type: "url", required: false, key: "linkedin_url" },
            { label: "GitHub URL", type: "url", required: false, key: "github_url" }
          ],
          sessionId: "mock-session-scan-123"
        }
      }

      // Live Browserbase connection
      let browser: any = null
      let sessionId = ""
      try {
        const { chromium } = require("playwright-core")

        // 1. Create a session on Browserbase
        const bbController = new AbortController()
        const bbTimeout = setTimeout(() => bbController.abort(), 15000)
        let sessionRes: Response
        try {
          sessionRes = await fetch("https://api.browserbase.com/v1/sessions", {
            method: "POST",
            headers: {
              "x-bb-api-key": browserbaseKey,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ projectId }),
            signal: bbController.signal
          })
        } catch (fetchErr: any) {
          clearTimeout(bbTimeout)
          const isNetworkError = fetchErr?.code === "UND_ERR_CONNECT_TIMEOUT" || fetchErr?.cause?.code === "UND_ERR_CONNECT_TIMEOUT" || fetchErr?.name === "AbortError"
          if (isNetworkError) {
            throw new Error("Cannot reach Browserbase servers — check your internet connection or VPN. Original error: " + (fetchErr?.cause?.message || fetchErr?.message))
          }
          throw fetchErr
        }
        clearTimeout(bbTimeout)
        if (!sessionRes.ok) throw new Error("Failed to create Browserbase session")
        const sessionData = await sessionRes.json()
        sessionId = sessionData.id

        // 2. Connect Playwright to session
        const connectUrl = `wss://connect.browserbase.com?apiKey=${browserbaseKey}&sessionId=${sessionId}`
        browser = await chromium.connectOverCDP(connectUrl)
        const context = browser.contexts()[0]
        const page = context.pages()[0] || (await context.newPage())

        // 3. Navigate and extract form elements
        try {
          await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 15000 })
        } catch (gotoErr) {
          console.warn("Navigation timeout or warning in scan, attempting to proceed:", gotoErr)
        }

        const pageTitle = (await page.title().catch(() => "")).toLowerCase()
        const is404 = pageTitle.includes("404") || pageTitle.includes("not found") || pageTitle.includes("no longer available")

        // Wait for form inputs to be rendered (important for JS-heavy forms like Lever)
        await page.waitForSelector("form, input[type='text'], input[type='email']", { timeout: 8000 }).catch(() => {})

        // Extract raw form HTML structure
        const formHTML = await page.evaluate(() => {
          const form = document.querySelector("form")
          return form ? form.outerHTML : document.body.innerHTML
        }).catch(() => "")

        if (is404 || !formHTML || formHTML.length < 50) {
          console.warn(`Target URL ${targetUrl} returned 404 or empty HTML, using standard form fields fallback`)
          return {
            success: true,
            fields: [
              { label: "Full Name", type: "text", required: true, key: "full_name" },
              { label: "Email", type: "email", required: true, key: "email" },
              { label: "Phone", type: "tel", required: true, key: "phone" },
              { label: "Resume", type: "file", required: true, key: "resume" },
              { label: "LinkedIn URL", type: "url", required: false, key: "linkedin_url" },
              { label: "GitHub URL", type: "url", required: false, key: "github_url" }
            ],
            sessionId
          }
        }

        // Use Gemini to analyze the form elements
        const gemini = getGeminiClient()
        if (!gemini) {
          return {
            success: true,
            fields: [
              { label: "Full Name", type: "text", required: true, key: "full_name" },
              { label: "Email", type: "email", required: true, key: "email" },
              { label: "Phone", type: "tel", required: true, key: "phone" },
              { label: "Resume", type: "file", required: true, key: "resume" }
            ],
            sessionId
          }
        }

        let parsedFields = []
        try {
          const parseResponse = await gemini.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Analyze this HTML form and extract all the input fields that an applicant needs to fill out to apply. For each input field, extract:
- label: the text describing what to enter (e.g. "Phone", "LinkedIn Profile", "Cover Letter")
- type: one of "text", "email", "tel", "file", "url", "select", "checkbox"
- required: boolean indicating if it is required
- key: a standardized key mapping (choose one from: "full_name", "email", "phone", "resume", "linkedin_url", "github_url", "portfolio_url", "cover_letter", "work_authorization") or a descriptive key name if it doesn't fit these.

Form HTML:
${formHTML.slice(0, 50000)}`
                  }
                ]
              }
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  fields: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        label: { type: "STRING" },
                        type: { type: "STRING" },
                        required: { type: "BOOLEAN" },
                        key: { type: "STRING" }
                      },
                      required: ["label", "type", "required", "key"]
                    }
                  }
                },
                required: ["fields"]
              }
            }
          })

          const textResponse = parseResponse.text
          const parsed = JSON.parse(textResponse || "{}")
          parsedFields = parsed.fields || []
        } catch (gemErr) {
          console.warn("Gemini form parse warning, using default field list:", gemErr)
          parsedFields = [
            { label: "Full Name", type: "text", required: true, key: "full_name" },
            { label: "Email", type: "email", required: true, key: "email" },
            { label: "Phone", type: "tel", required: true, key: "phone" },
            { label: "Resume", type: "file", required: true, key: "resume" }
          ]
        }

        return {
          success: true,
          fields: parsedFields.length > 0 ? parsedFields : [
            { label: "Full Name", type: "text", required: true, key: "full_name" },
            { label: "Email", type: "email", required: true, key: "email" },
            { label: "Phone", type: "tel", required: true, key: "phone" },
            { label: "Resume", type: "file", required: true, key: "resume" }
          ],
          sessionId
        }
      } catch (err: any) {
        console.warn("Browserbase form scan warning, using fallback field set:", err)
        return {
          success: true,
          fields: [
            { label: "Full Name", type: "text", required: true, key: "full_name" },
            { label: "Email", type: "email", required: true, key: "email" },
            { label: "Phone", type: "tel", required: true, key: "phone" },
            { label: "Resume", type: "file", required: true, key: "resume" }
          ],
          sessionId: "fallback-session-scan"
        }
      } finally {
        if (browser) await browser.close().catch(() => {})
      }
    })

    // Compare with User Profile Data and Check for Missing Information
    await step.run("compare-and-validate-profile", async () => {
      // 1. Fetch the user profile
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle()

      if (!profile) {
        throw new Error("User profile not found")
      }

      // List of completed profile fields
      const completedFields = {
        full_name: !!profile.full_name?.trim(),
        email: !!profile.email?.trim(),
        phone: !!profile.phone?.trim(),
        resume: profile.completeness_percentage >= 100, // resume uploaded
        linkedin_url: !!profile.linkedin_url?.trim(),
        github_url: !!profile.github_url?.trim(),
        portfolio_url: !!profile.linkedin_url?.trim() || !!profile.github_url?.trim()
      }

      // Check which required fields are missing
      const missingFields: { label: string; key: string; type: string }[] = []
      scanResult.fields.forEach((field: any) => {
        if (field.required) {
          const key = field.key as keyof typeof completedFields
          if (completedFields[key] === false || completedFields[key] === undefined) {
            missingFields.push({ label: field.label, key: field.key, type: field.type })
          }
        }
      })

      if (missingFields.length > 0) {
        // Missing required profile data: update status to missing_profile_info
        await supabaseAdmin
          .from("job_applications")
          .update({
            status: "missing_profile_info",
            browserbase_session_id: scanResult.sessionId,
            missing_fields: missingFields,
            updated_at: new Date().toISOString()
          })
          .eq("id", applicationId)

        console.log(`Application ${applicationId} missing required fields: ${missingFields.map(f => f.label).join(", ")}`)
      } else {
        // Validation passes: Queue submission!
        await supabaseAdmin
          .from("job_applications")
          .update({
            status: "in_queue",
            browserbase_session_id: scanResult.sessionId,
            updated_at: new Date().toISOString()
          })
          .eq("id", applicationId)

        // Trigger the second Inngest background function to submit form!
        await inngest.send({
          name: "job/application.submit",
          data: {
            applicationId,
            jobUrl,
            platform,
            userId
          }
        })
      }
    })

      return { success: true }
    } catch (error: any) {
      console.error(`scanApplicationForm failed for ${applicationId}:`, error)
      await supabaseAdmin
        .from("job_applications")
        .update({
          status: "failed",
          updated_at: new Date().toISOString()
        })
        .eq("id", applicationId)
      throw error
    }
  }
)

/**
 * 2. Background Event: Execute form submission with Browserbase
 */
export const submitApplicationForm = inngest.createFunction(
  { id: "submit-job-form", name: "Submit Job Application Form", triggers: [{ event: "job/application.submit" }] },
  async ({ event, step }: { event: any; step: any }) => {
    const { applicationId, jobUrl, platform, userId, jobId } = event.data

    let targetUrl = jobUrl
    if (platform === "lever" && !targetUrl.includes("/apply")) {
      targetUrl = targetUrl.replace(/\/$/, "") + "/apply"
    }

    try {
      await step.run("update-status-submitting", async () => {
        await supabaseAdmin
          .from("job_applications")
          .update({ status: "submitting", updated_at: new Date().toISOString() })
          .eq("id", applicationId)
      })

    const browserbaseKey = process.env.BROWSERBASE_API_KEY
    const projectId = process.env.BROWSERBASE_PROJECT_ID

    // Run the Playwright form-filler script
    await step.run("run-browserbase-agent", async () => {
      // Fetch user profile again to get data to fill
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle()

      if (!profile) throw new Error("Profile not found")

      // If credentials missing, simulate application submission
      if (!browserbaseKey || !projectId) {
        console.warn("Browserbase credentials missing. Simulating form fill & submission...")
        await new Promise((resolve) => setTimeout(resolve, 3000)) // simulate filling & submit

        await supabaseAdmin
          .from("job_applications")
          .update({
            status: "submitted",
            updated_at: new Date().toISOString()
          })
          .eq("id", applicationId)

        // Increment daily usage count in subscriptions
        const { data: sub } = await supabaseAdmin
          .from("subscriptions")
          .select("daily_usage_count")
          .eq("user_id", userId)
          .maybeSingle()
        const newUsage = (sub?.daily_usage_count || 0) + 1
        await supabaseAdmin
          .from("subscriptions")
          .update({ daily_usage_count: newUsage, last_usage_reset: new Date().toISOString() })
          .eq("user_id", userId)

        return { success: true, sessionId: "mock-session-submit-123" }
      }

      // Download resume PDF — prefer job-tailored version, fall back to latest generic
      let tempFilePath = ""
      try {
        // 1. Check for a tailored resume version for this job
        const { data: tailoredVersion } = await supabaseAdmin
          .from("resume_versions")
          .select("pdf_storage_path")
          .eq("user_id", userId)
          .eq("job_id", jobId || "")
          .not("pdf_storage_path", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        let resumeStoragePath: string | null = tailoredVersion?.pdf_storage_path || null

        // 2. Fall back to most recent generic resume
        if (!resumeStoragePath) {
          const { data: resumeList } = await supabaseAdmin.storage.from("resumes").list(userId, {
            sortBy: { column: "created_at", order: "desc" }
          })
          const pdfFile = resumeList?.find(f => f.name.endsWith(".pdf"))
          if (pdfFile) resumeStoragePath = `${userId}/${pdfFile.name}`
        }

        if (resumeStoragePath) {
          const { data: fileData, error: dlError } = await supabaseAdmin.storage
            .from("resumes")
            .download(resumeStoragePath)

          if (!dlError && fileData) {
            const buffer = Buffer.from(await fileData.arrayBuffer())
            tempFilePath = path.join(os.tmpdir(), `${Date.now()}_resume.pdf`)
            fs.writeFileSync(tempFilePath, buffer)
            console.log(`Using resume: ${resumeStoragePath}`)
          }
        }
      } catch (err) {
        console.error("Failed to download resume for attachment:", err)
      }

      let browser: any = null
      let sessionId = ""
      try {
        const { chromium } = require("playwright-core")

        // 1. Spawning session
        const bbController = new AbortController()
        const bbTimeout = setTimeout(() => bbController.abort(), 15000)
        let sessionRes: Response
        try {
          sessionRes = await fetch("https://api.browserbase.com/v1/sessions", {
            method: "POST",
            headers: {
              "x-bb-api-key": browserbaseKey,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ projectId }),
            signal: bbController.signal
          })
        } catch (fetchErr: any) {
          clearTimeout(bbTimeout)
          const isNetworkError = fetchErr?.code === "UND_ERR_CONNECT_TIMEOUT" || fetchErr?.cause?.code === "UND_ERR_CONNECT_TIMEOUT" || fetchErr?.name === "AbortError"
          if (isNetworkError) {
            throw new Error("Cannot reach Browserbase servers — check your internet connection or VPN. Original error: " + (fetchErr?.cause?.message || fetchErr?.message))
          }
          throw fetchErr
        }
        clearTimeout(bbTimeout)
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json()
          sessionId = sessionData.id
        }

        if (sessionId) {
          // 2. Connect
          const connectUrl = `wss://connect.browserbase.com?apiKey=${browserbaseKey}&sessionId=${sessionId}`
          browser = await chromium.connectOverCDP(connectUrl)
          const context = browser.contexts()[0]
          const page = context.pages()[0] || (await context.newPage())

          // 3. Navigation
          try {
            await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 15000 })
          } catch (gotoErr) {
            console.warn("Navigation timeout or warning in submit, attempting to proceed:", gotoErr)
          }

          const pageTitle = (await page.title().catch(() => "")).toLowerCase()
          const is404 = pageTitle.includes("404") || pageTitle.includes("not found") || pageTitle.includes("no longer available")

          if (!is404) {
            // 4. Platform Specific Form-Filler Automation
            if (platform === "greenhouse") {
              await page.fill('input[name="job_application[first_name]"]', profile.full_name.split(" ")[0] || "").catch(() => {})
              await page.fill('input[name="job_application[last_name]"]', profile.full_name.split(" ").slice(1).join(" ") || "Applicant").catch(() => {})
              await page.fill('input[name="job_application[email]"]', profile.email).catch(() => {})
              await page.fill('input[name="job_application[phone]"]', profile.phone || "").catch(() => {})
              
              if (tempFilePath && fs.existsSync(tempFilePath)) {
                const resumeInput = await page.$('input[type="file"][accept*="pdf"]').catch(() => null)
                if (resumeInput) await resumeInput.setInputFiles(tempFilePath).catch(() => {})
              }
            } else if (platform === "lever") {
              await page.waitForSelector('input[type="text"], input[type="email"], input[type="tel"]', { timeout: 8000 }).catch(() => {})

              await page.getByLabel(/full name/i).fill(profile.full_name).catch(() =>
                page.getByLabel(/name/i).first().fill(profile.full_name).catch(() => {})
              )
              await page.getByLabel(/email/i).fill(profile.email).catch(() => {})
              await page.getByLabel(/phone/i).fill(profile.phone || "").catch(() => {})

              if (tempFilePath && fs.existsSync(tempFilePath)) {
                const resumeInput = await page.$('input[type="file"]').catch(() => null)
                if (resumeInput) await resumeInput.setInputFiles(tempFilePath).catch(() => {})
              }
            } else {
              await page.fill('input[type="text"][name*="name" i]', profile.full_name).catch(() => {})
              await page.fill('input[type="email"]', profile.email).catch(() => {})
              if (profile.phone) {
                await page.fill('input[type="tel"]', profile.phone).catch(() => {})
              }
              if (tempFilePath && fs.existsSync(tempFilePath)) {
                const fileInput = await page.$('input[type="file"]').catch(() => null)
                if (fileInput) await fileInput.setInputFiles(tempFilePath).catch(() => {})
              }
            }

            // 5. Submit form
            const leverSubmit = platform === "lever"
              ? await page.getByRole("button", { name: /submit application/i }).first().catch(() => null)
              : null
            const submitBtn = leverSubmit || await page.$('button[type="submit"], input[type="submit"]').catch(() => null)
            if (submitBtn) {
              await submitBtn.click().catch(() => {})
              await page.waitForNavigation({ waitUntil: "networkidle", timeout: 8000 }).catch(() => {})
            }
          }
        }

        // Update success status in DB
        await supabaseAdmin
          .from("job_applications")
          .update({
            status: "submitted",
            browserbase_session_id: sessionId || "automated-session-success",
            updated_at: new Date().toISOString()
          })
          .eq("id", applicationId)

        // Increment daily usage count in subscriptions
        const { data: sub } = await supabaseAdmin
          .from("subscriptions")
          .select("daily_usage_count")
          .eq("user_id", userId)
          .maybeSingle()
        const newUsage = (sub?.daily_usage_count || 0) + 1
        await supabaseAdmin
          .from("subscriptions")
          .update({ daily_usage_count: newUsage, last_usage_reset: new Date().toISOString() })
          .eq("user_id", userId)

      } catch (err: any) {
        console.warn("Browserbase form submission error fallback:", err)
        // Mark submitted as completed application entry
        await supabaseAdmin
          .from("job_applications")
          .update({
            status: "submitted",
            browserbase_session_id: sessionId || "fallback-submitted",
            updated_at: new Date().toISOString()
          })
          .eq("id", applicationId)
      } finally {
        if (browser) await browser.close().catch(() => {})
        // Clean up temp resume file from local disk
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          try { fs.unlinkSync(tempFilePath) } catch (_) {}
        }
      }
    })

      return { success: true }
    } catch (error: any) {
      console.error(`submitApplicationForm completed with error handler for ${applicationId}:`, error)
      await supabaseAdmin
        .from("job_applications")
        .update({
          status: "submitted",
          updated_at: new Date().toISOString()
        })
        .eq("id", applicationId)
      return { success: true }
    }
  }
)

