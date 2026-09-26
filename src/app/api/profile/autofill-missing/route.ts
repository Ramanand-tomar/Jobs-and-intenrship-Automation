import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GoogleGenAI } from "@google/genai"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Ensure authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { missingFields } = await request.json()
    if (!missingFields || !Array.isArray(missingFields)) {
      return NextResponse.json({ error: "Missing fields parameter" }, { status: 400 })
    }

    // 1. Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

    // 2. Build context text
    let contextText = ""
    if (profile) {
      contextText += `User Name: ${profile.full_name || ""}\n`
      contextText += `Email: ${profile.email || ""}\n`
      contextText += `Phone: ${profile.phone || ""}\n`
      contextText += `Location: ${profile.location || ""}\n`
      contextText += `Skills: ${JSON.stringify(profile.skills || [])}\n`
      contextText += `Experience: ${JSON.stringify(profile.experience || [])}\n`
      contextText += `Education: ${JSON.stringify(profile.education || [])}\n`
      contextText += `Summary: ${profile.summary || ""}\n`
    }

    // 3. Request extraction from Gemini
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 })
    }

    const ai = new GoogleGenAI({ apiKey })

    const properties: any = {}
    const required: string[] = []

    missingFields.forEach((field: any) => {
      properties[field.key] = {
        type: "STRING",
        description: `Value for field "${field.label}". For social links, generate a clean URL based on their name if not found. For phone, generate a clean number format if not found.`
      }
      required.push(field.key)
    })

    const prompt = `Based on the following user profile data, extract the values for these missing fields:
${JSON.stringify(missingFields)}

User Profile Context:
${contextText}

If a value is not present in the context, please generate or predict a highly realistic value based on the user's name or experience (e.g. github URL as "https://github.com/${(profile?.full_name || "candidate").toLowerCase().replace(/\s+/g, "")}", phone number as "+1 (555) 019-2834").`

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties,
          required
        }
      }
    })

    const textResult = response.text
    const autofilledValues = JSON.parse(textResult || "{}")

    return NextResponse.json({ success: true, values: autofilledValues })
  } catch (error: any) {
    console.error("Autofill missing error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
