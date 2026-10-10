import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

export const STAGES = [
  "intake",
  "landlord_approval",
  "provider_selection",
  "scheduling",
  "works",
  "closeout",
  "closed",
  "paused",
] as const;
export type Stage = (typeof STAGES)[number];

const SCHEMA = `
CREATE TABLE IF NOT EXISTS properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT NOT NULL UNIQUE,
  tenanted INTEGER,
  notes TEXT
);
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL CHECK (role IN ('tenant','landlord','contractor','agency')),
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  preferred_channel TEXT CHECK (preferred_channel IN ('email','call','sms') OR preferred_channel IS NULL)
);
CREATE TABLE IF NOT EXISTS property_contacts (
  property_id INTEGER NOT NULL,
  contact_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  PRIMARY KEY (property_id, contact_id, role)
);
CREATE TABLE IF NOT EXISTS profile_facts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('property','contact')),
  entity_id INTEGER NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  source_ref TEXT,
  confidence REAL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','superseded','conflict')),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_facts_entity ON profile_facts(entity_type, entity_id, key);
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_ref TEXT NOT NULL UNIQUE,
  property_id INTEGER,
  tenant_id INTEGER,
  landlord_id INTEGER,
  contractor_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  severity TEXT,
  stage TEXT NOT NULL DEFAULT 'intake' CHECK (stage IN ('intake','landlord_approval','provider_selection','scheduling','works','closeout','closed','paused')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','on_hold','closed')),
  priority TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ticket_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL,
  ts TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('email','sms','call','note','update','hold','agent_action')),
  direction TEXT NOT NULL CHECK (direction IN ('in','out','internal')),
  party TEXT,
  body TEXT,
  attachments_json TEXT,
  source_ref TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_ticket ON ticket_events(ticket_id, ts);
CREATE TABLE IF NOT EXISTS holds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL,
  reason TEXT,
  waiting_on TEXT,
  follow_up_at TEXT,
  created_at TEXT NOT NULL,
  released_at TEXT
);
CREATE TABLE IF NOT EXISTS approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL,
  landlord_id INTEGER,
  summary TEXT,
  amount_gbp REAL,
  channel TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired')),
  response_text TEXT,
  requested_at TEXT NOT NULL,
  resolved_at TEXT
);
CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email','sms','call')),
  to_contact_id INTEGER,
  to_label TEXT,
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed')),
  error TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS human_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  summary TEXT,
  checked TEXT,
  uncertain TEXT,
  recommendation TEXT,
  priority TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS action_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER,
  actor TEXT NOT NULL CHECK (actor IN ('agent','system','human')),
  action TEXT NOT NULL,
  input_json TEXT,
  output_json TEXT,
  ok INTEGER NOT NULL,
  ts TEXT NOT NULL
);
`;

const TABLES = [
  "action_log",
  "human_queue",
  "outbox",
  "approvals",
  "holds",
  "ticket_events",
  "tickets",
  "profile_facts",
  "property_contacts",
  "contacts",
  "properties",
];

export function dbPath(): string {
  return process.env.CRM_DB ?? path.resolve(process.cwd(), "data/crm.db");
}

const handles = new Map<string, DatabaseSync>();

export function openDb(): DatabaseSync {
  const p = dbPath();
  let db = handles.get(p);
  if (db) return db;
  if (p !== ":memory:") fs.mkdirSync(path.dirname(p), { recursive: true });
  db = new DatabaseSync(p);
  db.exec(SCHEMA);
  handles.set(p, db);
  return db;
}

export function closeDb(): void {
  const p = dbPath();
  handles.get(p)?.close();
  handles.delete(p);
}

/** Drop all data and recreate the schema. */
export function resetDb(): DatabaseSync {
  const db = openDb();
  for (const t of TABLES) db.exec(`DROP TABLE IF EXISTS ${t}`);
  db.exec(SCHEMA);
  return db;
}
