// Stripe product and price IDs
// Reference: https://dashboard.stripe.com/products

export const STRIPE_PRODUCTS = {
  FREE_TRIAL: {
    id: "prod_USJ6nsHahCoXXT",
    prices: {
      oneTime: "price_1TTOUYKKYKi1ENnWi9iP7nCa",
    },
  },
  STARTER: {
    id: "prod_USJGbuK0xaqgdD",
    name: "Starter",
    monthlyPrice: "$19",
    annualPrice: "$182.4",
    features: ["3 boards", "1,500 submissions/month", "3 team members"],
    prices: {
      monthly: "price_1TTOeDKKYKi1ENnWB8xsFV63",
      annual: "price_1TTOeDKKYKi1ENnWheWG3xLG",
    },
  },
  GROWTH: {
    id: "prod_USJ9qlXreHgbe7",
    name: "Growth",
    monthlyPrice: "$49",
    annualPrice: "$470.4",
    features: [
      "10 boards",
      "5,000 submissions/month",
      "10 team members",
      "Custom branding",
      "Submitter replies",
    ],
    prices: {
      monthly: "price_1TTOXUKKYKi1ENnW9aZVhzOX",
      annual: "price_1TTOYGKKYKi1ENnWJknmLvUy",
    },
  },
  BUSINESS: {
    id: "prod_USJKKdXE2IkAxR",
    name: "Pro",
    monthlyPrice: "$79",
    annualPrice: "$758.4",
    features: [
      "20 boards",
      "15,000 submissions/month",
      "Unlimited team",
      "Advanced analytics",
      "API access",
    ],
    prices: {
      monthly: "price_1TTOhdKKYKi1ENnWKVKiF4Tu",
      annual: "price_1TTOhdKKYKi1ENnWLm5GmPOx",
    },
  },
};

// Public Stripe key (Vite env var — set VITE_STRIPE_PUBLIC_KEY in .env)
export const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY as
  | string
  | undefined;
