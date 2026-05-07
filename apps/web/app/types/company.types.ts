/** @format */

export type CompanySize =
  | "1-10"
  | "11-50"
  | "51-200"
  | "201-500"
  | "501-1000"
  | "1000+";

export interface Company {
  id: string;
  companyName: string;
  industry: string;
  location: string;
  city: string | null;
  country: string;
  timezone: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  about?: string | null;
  description: string | null;
  tagline: string | null;
  culture: string | null;
  size: CompanySize | null;
  foundedYear: number | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  verificationStatus: "pending" | "verified" | "rejected" | "unverified";
  perks: string[];
}

export interface CompanyForm {
  companyName: string;
  industry: string;
  location: string;
  city: string;
  country: string;
  timezone: string;
  websiteUrl: string;
  description: string;
  tagline: string;
  culture: string;
  size: string;
  foundedYear: string;
  linkedinUrl: string;
  twitterUrl: string;
  instagramUrl: string;
}

export const COMPANY_SIZES: { value: CompanySize; label: string }[] = [
  { value: "1-10", label: "1–10 employees" },
  { value: "11-50", label: "11–50 employees" },
  { value: "51-200", label: "51–200 employees" },
  { value: "201-500", label: "201–500 employees" },
  { value: "501-1000", label: "501–1000 employees" },
  { value: "1000+", label: "1000+ employees" },
];

export const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Retail",
  "Manufacturing",
  "Media",
  "Real Estate",
  "Consulting",
  "Other",
] as const;
