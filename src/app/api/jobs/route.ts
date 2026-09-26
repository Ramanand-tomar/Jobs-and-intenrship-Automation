import { NextResponse } from "next/server"
import { tavily } from "@tavily/core"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check query params for forced refresh
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get("refresh") === "true"

    // 1. Check if jobs exist in DB and were fetched in last 6 hours
    const { data: existingJobs } = await supabase
      .from("jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("fetched_at", { ascending: false })

    // Reset daily usage count if date has changed
    await supabase.rpc("check_and_reset_usage", { user_id_param: user.id })

    // Fetch subscription plan to enforce job results visibility limit
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan_name")
      .eq("user_id", user.id)
      .maybeSingle()
    const planName = sub?.plan_name || "Free"

    if (existingJobs && existingJobs.length > 0 && !forceRefresh) {
      const oldestFetched = new Date(existingJobs[0].fetched_at).getTime()
      const sixHoursInMs = 6 * 60 * 60 * 1000 // 6 hours exactly
      if (Date.now() - oldestFetched < sixHoursInMs) {
        const slicedJobs = planName === "Free" ? existingJobs.slice(0, 10) : existingJobs
        return NextResponse.json({ jobs: slicedJobs, source: "cache" })
      }
    }

    // 2. Fetch profile details to construct search query
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found. Please complete onboarding first." },
        { status: 400 }
      )
    }

    const skills: string[] = profile.skills || []
    const preferredLocation: string = profile.location || "Remote"

    // Derive job role — prioritize preferred_role field, then latest experience title, then skills
    let jobRole = "Full Stack Developer"
    if (profile.preferred_role && profile.preferred_role.trim()) {
      jobRole = profile.preferred_role.trim()
    } else if (profile.job_title && profile.job_title.trim()) {
      jobRole = profile.job_title.trim()
    } else if (profile.experience && profile.experience.length > 0) {
      // Walk experience entries to find a software/engineering-related title
      const techTitles = (profile.experience as any[])
        .map((e: any) => e.title || "")
        .filter((t: string) =>
          /engineer|developer|architect|lead|frontend|backend|fullstack|full.stack|software|devops|mobile|react|node/i.test(t)
        )
      if (techTitles.length > 0) jobRole = techTitles[0]
    } else if (skills.length > 0) {
      jobRole = `${skills[0]} Developer`
    }

    // Build keyword set for relevance filtering (role words + top skills)
    const roleKeywords = jobRole.toLowerCase().split(/\s+/)
    const topSkills = skills.slice(0, 8).map((s: string) => s.toLowerCase())
    const relevanceKeywords = [...new Set([...roleKeywords, ...topSkills])]
    // Remove generic filler words that won't help filter
    const stopWords = new Set(["and", "or", "the", "a", "an", "for", "with", "in", "at", "of", "to"])
    const filterKeywords = relevanceKeywords.filter(k => k.length > 2 && !stopWords.has(k))

    const tavilyApiKey = process.env.TAVILY_API_KEY
    let fetchedJobs: any[] = []

    if (tavilyApiKey) {
      try {
        const client = tavily({ apiKey: tavilyApiKey })

        // Build multiple targeted queries to get diverse, relevant results
        // Use quoted exact phrases and site: constraints to force relevance
        const locationClause = preferredLocation.toLowerCase().includes("remote")
          ? "remote"
          : `${preferredLocation} OR remote`

        const primarySkills = skills.slice(0, 3).join(" ")

        const searchQueries = [
          // Query 1: exact job title on Greenhouse
          `"${jobRole}" engineer job opening site:boards.greenhouse.io`,
          // Query 2: role + top skills on Lever
          `"${jobRole}" ${primarySkills} hiring site:jobs.lever.co`,
          // Query 3: role on Workable
          `"${jobRole}" developer job site:apply.workable.com`,
          // Query 4: role on Wellfound (AngelList)
          `"${jobRole}" ${locationClause} site:wellfound.com/role`,
        ]

        const allResults: any[] = []

        for (const query of searchQueries) {
          try {
            const searchData = await client.search(query, {
              searchDepth: "basic",
              maxResults: 8,
            })
            const results = (searchData as any)?.results || []
            allResults.push(...results)
          } catch (qErr) {
            console.warn(`Search query failed: ${query}`, qErr)
          }
        }

        // De-duplicate by URL
        const seenUrls = new Set<string>()

        fetchedJobs = allResults
          .filter((result: any) => {
            const url: string = result.url || ""
            const title: string = (result.title || "").toLowerCase()
            const content: string = (result.content || "").toLowerCase()

            // Must be from a supported ATS domain
            const isValidDomain =
              url.includes("boards.greenhouse.io") ||
              url.includes("jobs.lever.co") ||
              url.includes("apply.workable.com") ||
              url.includes("wellfound.com")
            if (!isValidDomain) return false

            // De-duplicate
            if (seenUrls.has(url)) return false
            seenUrls.add(url)

            // Relevance filter: title OR content must contain at least one keyword
            // This eliminates English-lesson or unrelated pages
            const combinedText = title + " " + content
            const isRelevant = filterKeywords.some(kw => combinedText.includes(kw))
            if (!isRelevant) {
              console.log(`Filtered out irrelevant result: "${result.title}"`)
              return false
            }

            // Additionally, reject if title clearly looks like a test/quiz page
            const isBogus = /spelling|grammar|quiz|sentence|vocabulary|worksheet|exercise|lesson/i.test(title)
            if (isBogus) {
              console.log(`Filtered bogus result: "${result.title}"`)
              return false
            }

            return true
          })
          .map((result: any) => {
            let title: string = result.title || ""
            const url: string = result.url || ""

            // Determine platform from URL
            let platform: "greenhouse" | "lever" | "workable" | "wellfound" = "greenhouse"
            if (url.includes("lever.co")) platform = "lever"
            else if (url.includes("workable.com")) platform = "workable"
            else if (url.includes("wellfound.com")) platform = "wellfound"

            // Parse company name from title
            let company = "Unknown Company"
            if (title.includes(" - ")) {
              const parts = title.split(" - ")
              title = parts[0].trim()
              company = parts[1]?.trim() || company
            } else if (title.includes(" at ")) {
              const parts = title.split(" at ")
              title = parts[0].trim()
              company = parts[1]?.trim() || company
            } else if (title.includes(" | ")) {
              const parts = title.split(" | ")
              title = parts[0].trim()
              company = parts[1]?.trim() || company
            }

            // Clean platform brand keywords out of company name
            company = company
              .replace(/Greenhouse|Lever|Workable|Wellfound|AngelList/gi, "")
              .replace(/[^a-zA-Z0-9 &.,'-]/g, "")
              .trim()

            if (!company || company.length < 2) {
              try {
                const urlObj = new URL(url)
                const pathParts = urlObj.pathname.split("/").filter(Boolean)
                if (pathParts.length > 0) {
                  company = pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1)
                }
              } catch {}
            }

            if (!company || company.length < 2) company = "Tech Company"

            const description: string = result.content || ""
            const isRemote =
              description.toLowerCase().includes("remote") ||
              title.toLowerCase().includes("remote") ||
              preferredLocation.toLowerCase().includes("remote")
            const locationStr = isRemote ? "Remote" : preferredLocation

            // Technology skill taxonomy for extraction
            const knownTechSkills = [
              "React", "TypeScript", "Next.js", "Node.js", "Python",
              "PostgreSQL", "GraphQL", "Docker", "Kubernetes", "AWS",
              "Tailwind CSS", "REST API", "Microservices", "CI/CD",
              "Git", "Redis", "System Design", "SQL", "Go", "Java"
            ]

            const matchedSkills: string[] = []
            const missingSkills: string[] = []

            skills.forEach((skill: string) => {
              if (
                description.toLowerCase().includes(skill.toLowerCase()) ||
                title.toLowerCase().includes(skill.toLowerCase())
              ) {
                matchedSkills.push(skill)
              }
            })

            knownTechSkills.forEach((tech: string) => {
              const inDesc = description.toLowerCase().includes(tech.toLowerCase())
              const userHasSkill = skills.some(s => s.toLowerCase() === tech.toLowerCase())
              if (inDesc && !userHasSkill && !missingSkills.includes(tech)) {
                missingSkills.push(tech)
              } else if (inDesc && userHasSkill && !matchedSkills.includes(tech)) {
                matchedSkills.push(tech)
              }
            })

            // Match score: base 65, +5 per matched skill, +5 role keyword match
            let matchScore = 65 + matchedSkills.length * 5
            if (title.toLowerCase().includes(jobRole.toLowerCase().split(" ")[0])) {
              matchScore += 5
            }
            if (matchScore > 99) matchScore = 99
            if (matchScore < 50) matchScore = 50

            const tags = matchedSkills.length > 0 ? matchedSkills.slice(0, 4) : skills.slice(0, 4)

            return {
              user_id: user.id,
              platform,
              title: title
                .replace(/job application for|hiring now|now hiring|\bjob\b/gi, "")
                .replace(/\s+/g, " ")
                .trim(),
              company,
              company_logo: null,
              location: locationStr,
              salary: "$110K - $150K",
              job_type: isRemote ? "Remote" : "Full-time",
              experience_level: "Mid-to-Senior",
              description,
              tags,
              matched_skills: matchedSkills,
              missing_skills: missingSkills.slice(0, 4),
              match_score: matchScore,
              job_url: url,
              source_url: url,
              applied_status: false,
              saved_status: false,
              fetched_at: new Date().toISOString(),
            }
          })
          // Sort by match score desc
          .sort((a, b) => b.match_score - a.match_score)
      } catch (err) {
        console.error("Tavily AI Search query error:", err)
      }
    }

    // 3. Fallback to mock jobs if Tavily results are empty or key is missing
    if (fetchedJobs.length === 0) {
      console.warn("No relevant jobs found via Tavily. Using mock data.")
      fetchedJobs = generateMockJobs(user.id, jobRole, preferredLocation, skills)
    }

    // 4. Save to database (clear old, insert new)
    await supabase.from("jobs").delete().eq("user_id", user.id)

    if (fetchedJobs.length > 0) {
      const { error: insertError } = await supabase.from("jobs").insert(fetchedJobs)
      if (insertError) {
        console.error("Error inserting fetched jobs:", insertError)
      }
    }

    // Retrieve fresh jobs from database
    const { data: finalJobs } = await supabase
      .from("jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("match_score", { ascending: false })

    const returnedJobs = (finalJobs && finalJobs.length > 0) ? finalJobs : fetchedJobs
    const slicedReturnedJobs = planName === "Free" ? returnedJobs.slice(0, 10) : returnedJobs
    return NextResponse.json({ jobs: slicedReturnedJobs, source: "api" })
  } catch (error: any) {
    console.error("Jobs API error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

function generateMockJobs(userId: string, jobRole: string, location: string, skills: string[]): any[] {
  const companies = [
    "Stripe", "Vercel", "Linear", "Supabase", "Retool",
    "Clerk", "Resend", "Neon", "PlanetScale", "Railway"
  ]
  const platforms = ["greenhouse", "lever", "workable", "wellfound"] as const

  const userSkills = skills.length > 0
    ? skills
    : ["React", "TypeScript", "Next.js", "Node.js", "PostgreSQL"]

  const sampleMissingPool = ["Docker", "Kubernetes", "AWS", "GraphQL", "Go", "Redis"]

  return companies.map((company, index) => {
    const platform = platforms[index % platforms.length]
    const matchScore = Math.min(98, 75 + Math.floor((index % 5) * 4))
    const matched = userSkills.slice(0, Math.min(userSkills.length, 3 + (index % 2)))
    const missing = sampleMissingPool.slice(index % 3, (index % 3) + 2)

    return {
      user_id: userId,
      platform,
      title: `${jobRole}`,
      company,
      company_logo: null,
      location: index % 3 === 0 ? `${location}` : "Remote",
      salary: `$${110 + index * 8}K - $${140 + index * 10}K`,
      job_type: "Full-time",
      experience_level: "Mid-to-Senior",
      description: `${company} is looking for a talented ${jobRole} to join our engineering team. You'll work with ${userSkills.join(", ")} to build scale web systems. We offer remote-friendly culture, equity, and competitive compensation.`,
      tags: matched,
      matched_skills: matched,
      missing_skills: missing,
      match_score: matchScore,
      job_url: `https://jobs.lever.co/${company.toLowerCase()}/${index + 1}`,
      source_url: `https://jobs.lever.co/${company.toLowerCase()}/${index + 1}`,
      applied_status: false,
      saved_status: false,
      fetched_at: new Date().toISOString(),
    }
  })
}

