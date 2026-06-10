// ---------------------------------------------------------------
// license-store.ts — License Center store (demo / ready for real data)
// ---------------------------------------------------------------

import demoData from "./license-store.json";

// ── Types ──

export type BusinessType = "salon" | "clinic" | "spa" | "barber" | "aesthetic_center";
export type PlanType = "basic" | "pro" | "premium" | "enterprise";
export type LicenseStatus = "active" | "overdue" | "blocked" | "trial" | "cancelled";
export type PaymentStatus = "paid" | "pending" | "overdue" | "failed";
export type AiMode = "disabled" | "basic" | "full";

export interface LicenseFeatures {
  whatsapp: boolean;
  aiReceptionist: boolean;
  campaigns: boolean;
  growthEngine: boolean;
  customerMemory: boolean;
  agenda: boolean;
  reports: boolean;
  teamManagement: boolean;
}

export interface LicenseLimits {
  monthlyAiRequests: number;
  monthlyCampaigns: number;
  maxUsers: number;
  maxBranches: number;
}

export interface BusinessLicense {
  id: string;
  tenantId: string;
  businessName: string;
  businessType: BusinessType;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  plan: PlanType;
  status: LicenseStatus;
  paymentStatus: PaymentStatus;
  licenseStartDate: string;
  nextBillingDate: string;
  contractedAt: string;
  monthlyPriceClp: number;
  totalGeneratedClp: number;
  aiEnabled: boolean;
  aiMode: AiMode;
  features: LicenseFeatures;
  limits: LicenseLimits;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface LicenseSummary {
  totalBusinesses: number;
  activeLicenses: number;
  paidLicenses: number;
  overdueLicenses: number;
  blockedLicenses: number;
  monthlyRecurringRevenueClp: number;
  totalGeneratedClp: number;
}

export interface LicenseReport {
  ok: boolean;
  adminOnly: boolean;
  summary: LicenseSummary;
  businesses: BusinessLicense[];
}

// ── Store ──

let store: BusinessLicense[] = [];

function ensureLoaded(): void {
  if (store.length === 0) {
    store = demoData as BusinessLicense[];
  }
}

export function getLicenseReport(): LicenseReport {
  ensureLoaded();

  const totalBusinesses = store.length;
  const activeLicenses = store.filter((b) => b.status === "active").length;
  const paidLicenses = store.filter((b) => b.paymentStatus === "paid").length;
  const overdueLicenses = store.filter((b) => b.status === "overdue").length;
  const blockedLicenses = store.filter((b) => b.status === "blocked").length;
  const monthlyRecurringRevenueClp = store.reduce((sum, b) => {
    if (b.status === "active" || b.status === "overdue") {
      return sum + b.monthlyPriceClp;
    }
    return sum;
  }, 0);
  const totalGeneratedClp = store.reduce((sum, b) => sum + b.totalGeneratedClp, 0);

  return {
    ok: true,
    adminOnly: true,
    summary: {
      totalBusinesses,
      activeLicenses,
      paidLicenses,
      overdueLicenses,
      blockedLicenses,
      monthlyRecurringRevenueClp,
      totalGeneratedClp,
    },
    businesses: store,
  };
}

/** Get a single business license by tenantId */
export function getLicenseByTenant(tenantId: string): BusinessLicense | undefined {
  ensureLoaded();
  return store.find((b) => b.tenantId === tenantId);
}

// ── Ready for real data: swap demoData import with DB/API calls ──
