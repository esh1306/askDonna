# Lessons module contract (crm/lessons.ts)

Shared by the learning engine (crm/, agent/tools/, scripts/) and the console (console/). Implemented in `crm/lessons.ts`.

```ts
export type Lesson = {
  id: number;
  situation: string;          // generalised situation, no names/amounts ("landlord approved attendance, no contractor named")
  trigger: string | null;     // e.g. "landlord_reply", "contractor_completion", "invoice_received", "tenant_reply", "no_response"
  stage: string | null;       // CRM stage when it applies
  category: string | null;    // job category (plumbing, appliance, ...)
  action: string;             // what to do ("assign a contractor used before at the property or from the panel for the trade; brief tenant + contractor")
  rationale: string;          // why a human did it
  source: "dataset" | "human" | "feedback";
  source_ref: string | null;  // e.g. "PM042 event 9", "console ticket 12 by ops"
  weight: number;             // starts 1; accept +1, reject -1 (never below 0)
  uses: number;
  created_at: string;
};

export function addLesson(l: Omit<Lesson, "id" | "weight" | "uses" | "created_at"> & { weight?: number }): Lesson;
export function listLessons(opts?: { q?: string; source?: string; limit?: number }): Lesson[];
export function recallLessons(q: { text: string; stage?: string | null; trigger?: string | null; category?: string | null }, k?: number): (Lesson & { score: number })[];
export function voteLesson(id: number, delta: 1 | -1): Lesson | null;
export function markUsed(ids: number[]): void;

/** Explain a human action as a reusable lesson (Claude Sonnet), store it with source "human" (or "feedback"). */
export async function learnFromHumanAction(input: {
  ticketId: number;
  action: string;            // e.g. "assign_contractor", "resolve_escalation", "approve", "send_message", "reject_suggestion", "edit_suggestion"
  details: Record<string, unknown>;
  note?: string;             // the employee's own words, if any
  source?: "human" | "feedback";
}): Promise<{ ok: true; lesson: Lesson } | { ok: false; error: string }>;
```

Table `lessons` is created idempotently by the module. Human actions are also written to `action_log` with `actor = 'human'`.
Feature flag: `DONNA_LESSONS` (default on); when `0`, `recall_lessons` returns an empty list.
