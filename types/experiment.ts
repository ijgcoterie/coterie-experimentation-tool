export interface ExperimentVariation {
  id: string;
  name: string;
  code: string;
  weight: number;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: "draft" | "published" | "archived";
  targeting: {
    conditions: TargetingCondition[];
    environments: string[];
  };
  variations: ExperimentVariation[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  // Statsig-specific fields
  statsigId?: string;
  statsigLayer?: string;
  isFromStatsig?: boolean;
}

export interface TargetingCondition {
  type: "user" | "device" | "location" | "custom";
  attribute: string;
  operator: "equals" | "not_equals" | "contains" | "not_contains" | "in" | "not_in" | "matches";
  value: string | string[] | number | boolean;
}

export interface ExperimentFormData {
  name: string;
  description: string;
  targeting: {
    conditions: TargetingCondition[];
    environments: string[];
  };
  variations: ExperimentVariation[];
}