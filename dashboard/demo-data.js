/**
 * Demo data for the AI-DLC Governance Orchestrator Dashboard
 * Simulates realistic governance activity across three jurisdictions
 */

const DEMO_DATA = {
  'MAS-SG': {
    steering: {
      files: 12,
      rules: 47,
      coverage: 100,
      chart: {
        labels: ['Security', 'Architecture', 'Regulatory', 'AI'],
        data: [15, 12, 14, 6]
      }
    },
    traceability: {
      passRate: 94,
      aiCommits: 23,
      reqLinked: 89,
      chart: {
        labels: ['Pass', 'Fail'],
        data: [94, 6]
      }
    },
    gate: {
      passRate: 97,
      blocked: 8,
      humanReviewed: 8,
      chart: {
        labels: ['Pass', 'Blocked'],
        data: [97, 3]
      }
    },
    overall: 'Compliant',
    activities: [
      { time: '2026-05-30 09:15', type: 'Steering', jurisdiction: 'MAS-SG', status: 'Pass', details: 'Generated steering file for payment service' },
      { time: '2026-05-30 08:42', type: 'Audit', jurisdiction: 'MAS-SG', status: 'Pass', details: 'Commit a3f2d1: AI-generated auth module, REQ-2024 linked' },
      { time: '2026-05-30 07:30', type: 'Gate', jurisdiction: 'MAS-SG', status: 'Blocked', details: 'PR #234: Material change detected in core banking API' },
      { time: '2026-05-29 16:20', type: 'Audit', jurisdiction: 'MAS-SG', status: 'Fail', details: 'Commit b7e9a2: Missing requirement link, no test coverage' },
      { time: '2026-05-29 14:10', type: 'Steering', jurisdiction: 'MAS-SG', status: 'Pass', details: 'Updated steering file for digital wallet feature' },
      { time: '2026-05-29 11:05', type: 'Gate', jurisdiction: 'MAS-SG', status: 'Pass', details: 'PR #233: Routine UI changes, auto-approved' },
      { time: '2026-05-28 17:45', type: 'Audit', jurisdiction: 'MAS-SG', status: 'Pass', details: 'Commit c8f4e5: AI-generated encryption module, tests included' },
      { time: '2026-05-28 15:30', type: 'Gate', jurisdiction: 'MAS-SG', status: 'Blocked', details: 'PR #231: Material change in payment gateway' },
      { time: '2026-05-28 10:20', type: 'Steering', jurisdiction: 'MAS-SG', status: 'Pass', details: 'Generated steering file for KYC module' },
      { time: '2026-05-27 14:15', type: 'Audit', jurisdiction: 'MAS-SG', status: 'Pass', details: 'Commit d2a9b7: AI-generated data validation, REQ-2025 linked' }
    ],
    trend: {
      labels: ['May 1', 'May 5', 'May 10', 'May 15', 'May 20', 'May 25', 'May 30'],
      steering: [100, 100, 100, 100, 100, 100, 100],
      traceability: [85, 88, 90, 92, 93, 94, 94],
      gate: [95, 96, 96, 97, 97, 97, 97]
    }
  },
  'EU-AI-ACT': {
    steering: {
      files: 8,
      rules: 34,
      coverage: 100,
      chart: {
        labels: ['Security', 'Architecture', 'Regulatory', 'AI'],
        data: [10, 8, 12, 4]
      }
    },
    traceability: {
      passRate: 91,
      aiCommits: 18,
      reqLinked: 85,
      chart: {
        labels: ['Pass', 'Fail'],
        data: [91, 9]
      }
    },
    gate: {
      passRate: 95,
      blocked: 12,
      humanReviewed: 12,
      chart: {
        labels: ['Pass', 'Blocked'],
        data: [95, 5]
      }
    },
    overall: 'Compliant',
    activities: [
      { time: '2026-05-30 08:30', type: 'Steering', jurisdiction: 'EU-AI-ACT', status: 'Pass', details: 'Generated steering file for credit scoring system' },
      { time: '2026-05-30 07:15', type: 'Audit', jurisdiction: 'EU-AI-ACT', status: 'Pass', details: 'Commit e5g3h2: AI-generated risk model, Article 6 compliance' },
      { time: '2026-05-29 16:45', type: 'Gate', jurisdiction: 'EU-AI-ACT', status: 'Blocked', details: 'PR #156: Material change in biometric authentication' },
      { time: '2026-05-29 13:20', type: 'Audit', jurisdiction: 'EU-AI-ACT', status: 'Fail', details: 'Commit f1i9j4: Missing risk classification documentation' },
      { time: '2026-05-28 11:10', type: 'Steering', jurisdiction: 'EU-AI-ACT', status: 'Pass', details: 'Updated steering file for high-risk AI system' },
      { time: '2026-05-28 09:30', type: 'Gate', jurisdiction: 'EU-AI-ACT', status: 'Pass', details: 'PR #155: Routine documentation updates' },
      { time: '2026-05-27 15:40', type: 'Audit', jurisdiction: 'EU-AI-ACT', status: 'Pass', details: 'Commit g6k2l8: AI-generated GDPR compliance check, tests included' },
      { time: '2026-05-27 10:25', type: 'Gate', jurisdiction: 'EU-AI-ACT', status: 'Blocked', details: 'PR #153: Material change in automated decision system' },
      { time: '2026-05-26 14:50', type: 'Steering', jurisdiction: 'EU-AI-ACT', status: 'Pass', details: 'Generated steering file for chatbot system' },
      { time: '2026-05-26 09:15', type: 'Audit', jurisdiction: 'EU-AI-ACT', status: 'Pass', details: 'Commit h3m7n1: AI-generated data pipeline, Article 10 compliance' }
    ],
    trend: {
      labels: ['May 1', 'May 5', 'May 10', 'May 15', 'May 20', 'May 25', 'May 30'],
      steering: [100, 100, 100, 100, 100, 100, 100],
      traceability: [82, 85, 87, 89, 90, 91, 91],
      gate: [93, 94, 94, 95, 95, 95, 95]
    }
  },
  'AU-APRA': {
    steering: {
      files: 10,
      rules: 41,
      coverage: 100,
      chart: {
        labels: ['Security', 'Architecture', 'Regulatory', 'AI'],
        data: [12, 10, 15, 4]
      }
    },
    traceability: {
      passRate: 88,
      aiCommits: 31,
      reqLinked: 82,
      chart: {
        labels: ['Pass', 'Fail'],
        data: [88, 12]
      }
    },
    gate: {
      passRate: 93,
      blocked: 15,
      humanReviewed: 15,
      chart: {
        labels: ['Pass', 'Blocked'],
        data: [93, 7]
      }
    },
    overall: 'Warning',
    activities: [
      { time: '2026-05-30 09:00', type: 'Steering', jurisdiction: 'AU-APRA', status: 'Pass', details: 'Generated steering file for superannuation platform' },
      { time: '2026-05-30 07:45', type: 'Audit', jurisdiction: 'AU-APRA', status: 'Pass', details: 'Commit i4o8p3: AI-generated CPS 234 compliance module' },
      { time: '2026-05-29 16:30', type: 'Gate', jurisdiction: 'AU-APRA', status: 'Blocked', details: 'PR #189: Material change in member data processing' },
      { time: '2026-05-29 14:00', type: 'Audit', jurisdiction: 'AU-APRA', status: 'Fail', details: 'Commit j2q6r9: Missing audit trail, no requirement link' },
      { time: '2026-05-29 10:30', type: 'Steering', jurisdiction: 'AU-APRA', status: 'Pass', details: 'Updated steering file for insurance claims module' },
      { time: '2026-05-28 15:15', type: 'Gate', jurisdiction: 'AU-APRA', status: 'Pass', details: 'PR #188: Routine config updates, auto-approved' },
      { time: '2026-05-28 11:00', type: 'Audit', jurisdiction: 'AU-APRA', status: 'Pass', details: 'Commit k5s1t7: AI-generated reporting module, tests included' },
      { time: '2026-05-27 16:30', type: 'Gate', jurisdiction: 'AU-APRA', status: 'Blocked', details: 'PR #186: Material change in core banking integration' },
      { time: '2026-05-27 09:45', type: 'Steering', jurisdiction: 'AU-APRA', status: 'Pass', details: 'Generated steering file for risk management system' },
      { time: '2026-05-26 13:20', type: 'Audit', jurisdiction: 'AU-APRA', status: 'Fail', details: 'Commit l8u3v5: AI-generated module without steering file reference' }
    ],
    trend: {
      labels: ['May 1', 'May 5', 'May 10', 'May 15', 'May 20', 'May 25', 'May 30'],
      steering: [100, 100, 100, 100, 100, 100, 100],
      traceability: [78, 82, 84, 86, 87, 88, 88],
      gate: [90, 91, 92, 92, 93, 93, 93]
    }
  }
};

// Export for use in dashboard
if (typeof window !== 'undefined') {
  window.DEMO_DATA = DEMO_DATA;
}
