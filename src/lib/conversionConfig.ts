// Centralized configuration for all conversion & retention features
export const conversionConfig = {
  // Exit-Intent Modal
  exitIntent: {
    discountPercent: 10,
    countdownMinutes: 15,
    idleTimeoutMs: 30000, // 30s for mobile idle detection
    showOncePerSession: true,
    whatsappNumber: "+923554421113",
  },

  // Free Shipping Progress
  freeShipping: {
    threshold: 5000, // PKR - orders above this get free shipping
    currency: "PKR",
  },

  // Social Proof
  socialProof: {
    intervalMs: 20000, // Show popup every 20s
    maxPerSession: 5,
    cities: [
      "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad",
      "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala",
    ],
    productNames: [
      "Pure Himalayan Shilajit (30g)",
      "Premium Shilajit Resin (20g)",
      "Shilajit Gold Pack",
    ],
  },

  // Cart Upsells
  upsells: {
    maxSuggestions: 2,
  },
};
