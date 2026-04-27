// Stripe product and price IDs
// Reference: https://dashboard.stripe.com/products

export const STRIPE_PRODUCTS = {
  FREE_TRIAL: {
    id: "prod_UPfBtbKlc6hBuK",
    prices: {
      oneTime: "price_1TQprFQQchLsdaEfltktbPsK",
    },
  },
  STARTER: {
    id: "prod_UPfHVaUZZpAXz5",
    name: "Starter",
    monthlyPrice: "$19",
    annualPrice: "$182.4",
    features: ["3 boards", "1,500 submissions/month", "3 team members"],
    prices: {
      monthly: "price_1TQpweQQchLsdaEfeIg5uZ2A",
      annual: "price_1TQpweQQchLsdaEfzijJNcqm",
    },
  },
  GROWTH: {
    id: "prod_UPfJZboIYY9UKJ",
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
      monthly: "price_1TQpyZQQchLsdaEfY5UPPMRL",
      annual: "price_1TQpyZQQchLsdaEf6PmISi15",
    },
  },
  PRO: {
    id: "prod_UPfKZraG2EOj25",
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
      monthly: "price_1TQq0KQQchLsdaEf0RQA54Kb",
      annual: "price_1TQq0KQQchLsdaEfEsV7xMaa",
    },
  },
};

// Public Stripe key
export const STRIPE_PUBLIC_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
