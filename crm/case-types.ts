export type CaseEvent = {
  n: number;
  timestamp: string;
  channel: string;
  stage?: string;
  from: string;
  to: string;
  body: string;
  attachments: string[];
};

export type CaseSummary = {
  track: string;
  id: string;
  title: string;
  status: string;
  events: number;
  attachments: number;
};

export type CaseDetail = CaseSummary & {
  details: Record<string, string>;
  sections: Record<string, string>;
  history: CaseEvent[];
  attachmentFiles: string[];
  defaultCutoff: number;
};

export type Verdict = "pass" | "partial" | "fail";

export type RunResult = {
  track: string;
  id: string;
  cutoff: number;
  runner: string;
  ranAt: string;
  durationMs: number;
  context: string;
  output?: string;
  error?: string;
  verdict?: Verdict;
  note?: string;
};
