import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toast";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0f1117",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "JobBuddy.ai — AI-Powered Job Application Agent",
  description: "Automate your job search with AI. JobBuddy.ai finds matching jobs, tailors your resume for ATS, and applies on your behalf — so you can focus on interviews.",
  openGraph: {
    title: "JobBuddy.ai — AI-Powered Job Application Agent",
    description: "Automate your job search with AI. Match jobs, tailor resumes, and submit applications automatically.",
    url: "https://jobbuddy.ai",
    siteName: "JobBuddy.ai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JobBuddy.ai — AI-Powered Job Application Agent",
    description: "Automate your job search with AI. Match jobs, tailor resumes, and submit applications automatically.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", "dark", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-white">
        <Toaster />
        {children}
      </body>
    </html>
  );
}
