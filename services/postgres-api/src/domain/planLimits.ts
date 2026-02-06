export interface PlanLimits {
  maxProducts: number;
  maxMonthlyOrders: number;
  maxOriginCalculations: number;
  maxHsCodeLookups: number;
  maxTeamMembers: number;
  prioritySupport: "none" | "email" | "chat" | "dedicated";
  analytics: "basic" | "advanced" | "full" | "custom";
  apiAccess: "none" | "limited" | "full";
}

export const DEFAULT_PLAN_LIMITS: Record<string, PlanLimits> = {
  starter: {
    maxProducts: 10,
    maxMonthlyOrders: 50,
    maxOriginCalculations: 5,
    maxHsCodeLookups: 10,
    maxTeamMembers: 1,
    prioritySupport: "none",
    analytics: "basic",
    apiAccess: "none"
  },
  growth: {
    maxProducts: 50,
    maxMonthlyOrders: 200,
    maxOriginCalculations: 25,
    maxHsCodeLookups: 50,
    maxTeamMembers: 3,
    prioritySupport: "email",
    analytics: "advanced",
    apiAccess: "limited"
  },
  pro: {
    maxProducts: 200,
    maxMonthlyOrders: 1000,
    maxOriginCalculations: 100,
    maxHsCodeLookups: 200,
    maxTeamMembers: 10,
    prioritySupport: "chat",
    analytics: "full",
    apiAccess: "full"
  },
  enterprise: {
    maxProducts: -1,
    maxMonthlyOrders: -1,
    maxOriginCalculations: -1,
    maxHsCodeLookups: -1,
    maxTeamMembers: -1,
    prioritySupport: "dedicated",
    analytics: "custom",
    apiAccess: "full"
  }
};
