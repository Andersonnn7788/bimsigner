import type { UserProfile, VisitRecord, IntentPrediction } from "@/types";

export const MOCK_PROFILE: UserProfile = {
  id: "usr_001",
  name: "Ahmad Fadzillah bin Mohd Yusof",
  ic_number: "870514-14-5623",
  deaf: true,
  photo_placeholder_initials: "AF",
  visit_count: 9,
  registered_since: "2020-06-10",
};

export const MOCK_HISTORY: VisitRecord[] = [
  {
    id: "v001",
    date: "2026-02-10",
    department: "Dept. of National Registration",
    counter: "Counter 3",
    purpose: "New IC Application",
    outcome: "IN_PROGRESS",
    notes: "Documents complete, awaiting printing.",
  },
  {
    id: "v002",
    date: "2025-11-28",
    department: "Road Transport Dept.",
    counter: "Counter 2",
    purpose: "Driving License Renewal",
    outcome: "COMPLETED",
  },
  {
    id: "v003",
    date: "2025-09-14",
    department: "Dept. of National Registration",
    counter: "Counter 1",
    purpose: "IC Application Status Check",
    outcome: "COMPLETED",
    notes: "IC in printing process.",
  },
  {
    id: "v004",
    date: "2025-05-20",
    department: "Inland Revenue Board",
    counter: "Counter 4",
    purpose: "BE Form Submission 2024",
    outcome: "COMPLETED",
  },
  {
    id: "v005",
    date: "2025-01-08",
    department: "Social Welfare Dept.",
    counter: "Counter 2",
    purpose: "OKU Allowance Inquiry",
    outcome: "COMPLETED",
    notes: "Monthly allowance confirmed active.",
  },
  {
    id: "v006",
    date: "2024-08-30",
    department: "Land and Survey Dept.",
    counter: "Counter 5",
    purpose: "Land Grant Status Check",
    outcome: "INCOMPLETE",
    notes: "Supporting documents incomplete.",
  },
];

export const MOCK_INTENT: IntentPrediction = {
  primary_intent: "Collect New IC After Application Was Approved",
  primary_probability: 0.82,
  alternatives: [
    { intent: "Check IC Application Processing Status", probability: 0.10 },
    { intent: "Update Personal Information in NRD Records", probability: 0.05 },
    { intent: "Enquiry About Family Member Birth Document", probability: 0.03 },
  ],
  reasoning:
    "New IC application was submitted in Feb 2026 and is currently in progress. Visitor likely returning to collect the completed document.",
  confidence_label: "Very Likely",
};

export function simulatePredictIntent(): Promise<IntentPrediction> {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_INTENT), 1500));
}
