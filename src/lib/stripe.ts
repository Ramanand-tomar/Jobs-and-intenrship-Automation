import Stripe from "stripe"

const secretKey = process.env.STRIPE_SECRET_KEY || "sk_test_mock_key_job_buddy"

export const stripe = new Stripe(secretKey)
