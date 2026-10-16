/** How orders travel, shown on the shipping page and on product pages. */
export const shippingModes = [
  {
    key: "air",
    name: "Air freight",
    transit: "Usually 5 to 10 days in transit",
    short: "5–10 days",
    bestFor: "Smaller orders, samples and urgent deliveries",
    priced: "By weight (per kg)",
  },
  {
    key: "sea",
    name: "Sea freight",
    transit: "Usually 20 to 45 days, depending on the destination",
    short: "20–45 days",
    bestFor: "Larger orders, where cost matters more than speed",
    priced: "By volume (per cubic meter); full containers on request",
  },
  {
    key: "forwarder",
    name: "Your own forwarder",
    transit: "You book the freight; we hand over the goods in Pakistan",
    short: "You book it",
    bestFor: "Buyers who already have a freight partner",
    priced: "Ex-factory (FOB) prices, no freight from us",
  },
] as const;
