import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Supabase environment variables missing" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Execute query to keep Supabase database instance active
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)

    if (error) {
      console.error("Keep-alive database query error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("Supabase keep-alive ping successful at:", new Date().toISOString())

    return NextResponse.json({
      success: true,
      message: "Supabase database instance keep-alive ping successful",
      timestamp: new Date().toISOString(),
      rowsReturned: data?.length || 0
    })
  } catch (err: any) {
    console.error("Keep-alive route failure:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
