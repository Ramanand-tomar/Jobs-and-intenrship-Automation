import { Inngest } from "inngest"

type Events = {
  "job/application.scan": {
    data: {
      applicationId: string
      jobUrl: string
      platform: string
      userId: string
    }
  }
  "job/application.submit": {
    data: {
      applicationId: string
      jobUrl: string
      platform: string
      userId: string
    }
  }
}

// Create the Inngest client
export const inngest = new Inngest({
  id: "ai-job-agent",
})
