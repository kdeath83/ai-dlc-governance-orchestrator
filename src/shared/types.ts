export interface SteeringFile {
  jurisdiction: string;
  version: string;
  generated: string;
  security: {
    requireEncryption: boolean;
    approvedDependencies: string[];
    maxCveScore: number;
    requireSecretsRotation: boolean;
  };
  architecture: {
    allowedRegions: string[];
    requireApiVersioning: boolean;
    requireMultiAz: boolean;
  };
  regulatory: {
    documentRiskClassification: boolean;
    requireHumanReview: boolean;
    requireAuditTrail: boolean;
  };
  ai: {
    allowedAgents: string[];
    requireSteeringFile: boolean;
    maxCodeGenerationRatio: number;
  };
}

export interface AuditReport {
  commit: string;
  timestamp: string;
  requirementLinked: boolean;
  testCoverage: boolean;
  steeringFilePresent: boolean;
  aiGenerated: boolean;
  files: string[];
  pass: boolean;
  messages: string[];
}

export interface GateReport {
  pr: string;
  timestamp: string;
  materiality: 'material' | 'routine';
  blocked: boolean;
  blockReason?: string;
  message: string;
  files: {
    path: string;
    materiality: 'material' | 'routine';
    reason: string;
  }[];
  steering: {
    jurisdiction: string;
    version: string;
  };
}

export interface JurisdictionConfig {
  id: string;
  name: string;
  description: string;
  security: SteeringFile['security'];
  architecture: SteeringFile['architecture'];
  regulatory: SteeringFile['regulatory'];
  materialityPatterns: {
    material: string[];
    routine: string[];
  };
}
