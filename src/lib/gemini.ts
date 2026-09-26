import { GoogleGenAI } from "@google/genai"

interface GeminiRequestParams {
  contents: any
  config?: any
}

/**
 * Executes a Gemini content generation request with automatic exponential backoff retries
 * and fallback models when encountering 503 High Demand / UNAVAILABLE errors.
 */
export async function callGeminiWithRetry(
  gemini: GoogleGenAI,
  params: GeminiRequestParams,
  maxRetries = 2
) {
  const models = ["gemini-2.5-flash", "gemini-2.5-pro"]
  let lastError: any = null

  for (const model of models) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await gemini.models.generateContent({
          model,
          ...params,
        })
        return response
      } catch (err: any) {
        lastError = err
        console.error(`Gemini model ${model} attempt ${attempt} failed:`, err?.message || err)
        const errString = typeof err === "object" ? JSON.stringify(err) : String(err)
        const isTransientError =
          errString.includes("503") ||
          errString.includes("UNAVAILABLE") ||
          errString.includes("high demand") ||
          errString.includes("RESOURCE_EXHAUSTED") ||
          errString.includes("Overloaded")

        if (isTransientError && attempt < maxRetries) {
          // Exponential backoff delay: 1000ms, 2000ms
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
          continue
        }

        // If not a transient error or retries exhausted for this model, try next model
        break
      }
    }
  }

  throw lastError
}

/**
 * Formats raw JSON or API errors into a clean, human-readable message.
 */
export function cleanGeminiErrorMessage(err: any): string {
  if (!err) return "An unexpected error occurred. Please try again."

  let rawMessage = err?.message || String(err)

  // Try parsing JSON error structure
  try {
    const parsed = typeof rawMessage === "string" && rawMessage.startsWith("{") ? JSON.parse(rawMessage) : null
    if (parsed?.error?.message) {
      rawMessage = parsed.error.message
    }
  } catch {
    // Keep rawMessage as string
  }

  if (
    rawMessage.includes("503") ||
    rawMessage.includes("UNAVAILABLE") ||
    rawMessage.includes("high demand") ||
    rawMessage.includes("Overloaded")
  ) {
    return "The AI engine is currently experiencing high demand. Please click 'Try Again' in a moment."
  }

  if (rawMessage.includes("GEMINI_API_KEY") || rawMessage.includes("API key")) {
    return "Gemini API key is invalid or missing in server environment."
  }

  return rawMessage
}

/**
 * Parses a base64 encoded PDF or document resume using Gemini with structured JSON output.
 */
export async function parseResume(base64: string, mimeType = "application/pdf"): Promise<Record<string, any>> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY")

  const gemini = new GoogleGenAI({ apiKey })

  const prompt = `You are an expert executive resume parser. Extract ALL candidate details from this resume document and return a valid JSON object.

JSON Schema Requirements:
- full_name: string
- title: string (target role / professional headline)
- bio: string
- email: string
- phone: string
- location: string
- github_url: string
- linkedin_url: string
- website_url: string (portfolio)
- leetcode_url: string
- summary: string (2-3 sentence overview)
- skills: string[] (all technical & soft skills)
- skills_categorized: Record of category name (e.g., "Databases", "Frameworks & Libraries", "Programming Languages", "Tools & Platforms", "Soft Skills") to string[]
- experience: Array of { company: string, title: string, role_type: string, start: string, end: string, location: string, details: string, bullets: string[], tech: string[] }
- education: Array of { school: string, degree: string, field: string, graduation: string, year: string, cgpa: string }
- projects: Array of { title: string, subtitle: string, role_type: string, start: string, end: string, description: string, bullets: string[], tech: string[], link: string, github: string, live: string }
- certifications: string[]
- awards: string[] (awards, hackathon wins, competitive programming stats)

Return ONLY valid JSON.`

  const response = await callGeminiWithRetry(gemini, {
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: prompt },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
    },
  })

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "{}"
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}
