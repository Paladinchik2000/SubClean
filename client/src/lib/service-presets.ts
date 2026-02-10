import type { Category, BillingCycle } from "@shared/schema";

export interface ServicePreset {
  name: string;
  cost: number;
  currency: string;
  billingCycle: BillingCycle;
  category: Category;
}

export const servicePresets: ServicePreset[] = [
  { name: "Netflix", cost: 1549, currency: "USD", billingCycle: "monthly", category: "streaming" },
  { name: "Spotify", cost: 1099, currency: "USD", billingCycle: "monthly", category: "music" },
  { name: "YouTube Premium", cost: 1399, currency: "USD", billingCycle: "monthly", category: "streaming" },
  { name: "Disney+", cost: 799, currency: "USD", billingCycle: "monthly", category: "streaming" },
  { name: "Apple Music", cost: 1099, currency: "USD", billingCycle: "monthly", category: "music" },
  { name: "Apple TV+", cost: 999, currency: "USD", billingCycle: "monthly", category: "streaming" },
  { name: "Amazon Prime", cost: 1499, currency: "USD", billingCycle: "monthly", category: "streaming" },
  { name: "HBO Max", cost: 1599, currency: "USD", billingCycle: "monthly", category: "streaming" },
  { name: "Hulu", cost: 799, currency: "USD", billingCycle: "monthly", category: "streaming" },
  { name: "Adobe Creative Cloud", cost: 5499, currency: "USD", billingCycle: "monthly", category: "productivity" },
  { name: "Microsoft 365", cost: 999, currency: "USD", billingCycle: "monthly", category: "productivity" },
  { name: "ChatGPT Plus", cost: 2000, currency: "USD", billingCycle: "monthly", category: "productivity" },
  { name: "iCloud+", cost: 299, currency: "USD", billingCycle: "monthly", category: "cloud" },
  { name: "Google One", cost: 299, currency: "USD", billingCycle: "monthly", category: "cloud" },
  { name: "Dropbox Plus", cost: 1199, currency: "USD", billingCycle: "monthly", category: "cloud" },
  { name: "PlayStation Plus", cost: 1799, currency: "USD", billingCycle: "quarterly", category: "gaming" },
  { name: "Xbox Game Pass", cost: 1699, currency: "USD", billingCycle: "monthly", category: "gaming" },
  { name: "Nintendo Switch Online", cost: 399, currency: "USD", billingCycle: "monthly", category: "gaming" },
  { name: "Notion", cost: 1000, currency: "USD", billingCycle: "monthly", category: "productivity" },
  { name: "Slack Pro", cost: 875, currency: "USD", billingCycle: "monthly", category: "productivity" },
  { name: "Figma", cost: 1500, currency: "USD", billingCycle: "monthly", category: "productivity" },
  { name: "GitHub Pro", cost: 400, currency: "USD", billingCycle: "monthly", category: "productivity" },
  { name: "NordVPN", cost: 1299, currency: "USD", billingCycle: "monthly", category: "other" },
  { name: "Paramount+", cost: 599, currency: "USD", billingCycle: "monthly", category: "streaming" },
  { name: "Peacock", cost: 599, currency: "USD", billingCycle: "monthly", category: "streaming" },
  { name: "Tidal", cost: 1099, currency: "USD", billingCycle: "monthly", category: "music" },
  { name: "Crunchyroll", cost: 799, currency: "USD", billingCycle: "monthly", category: "streaming" },
];
