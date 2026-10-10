# Operations

## Hold chaser (follow-ups that actually fire)

A hold (`place_hold`) records who Donna is waiting on and a `follow_up_at` date. `dueFollowUps(now)` in `crm/repo.ts` lists unreleased holds past that date. The chaser is what calls it:

- **In the console server**: `chaseDueHolds()` in `console/server/outbox-worker.ts` runs from the existing worker interval, at most once every 60 seconds. Set `HOLD_CHASER=0` to turn it off (default on; `OUTBOX_WORKER=0` also disables it). It uses the same Donna trigger as inbound messages, so each run is saved under the usual runs folder.
- **From cron / a VPS**: `node scripts/chase-holds.ts` does one pass using `runner/eve-client.ts` `runTurn` against `EVE_URL` (default `http://127.0.0.1:2000`). Example crontab: `*/10 * * * * cd /srv/donna && node scripts/chase-holds.ts >> chase.log 2>&1`. Do not run it alongside the console worker against the same DB unless you want the shared `data/chased-holds.json` to be the only dedupe (it is, and it is enough).
- **Dedupe**: each hold id is chased once. Chased ids are kept in `data/chased-holds.json`; the id is written before the turn starts, and removed again if the turn could not be started so the next tick retries. Delete the file (or an id in it) to chase a hold again.
- **Message sent to Donna**: "Follow-up due on CRM ticket N: hold '<reason>' waiting on <waiting_on> since <created_at> passed its follow-up date <follow_up_at>. Chase or escalate as appropriate, then return the structured result." Donna's instructions already say to escalate after follow-up deadlines pass twice.

## Contact backfill for normalised cases

`runner/prepare-crm.ts` `backfillContacts` fills the ticket's tenant, landlord and contractor from the raw case text when the importer only produced placeholder contacts (`Tenant (R/2)`): `From: Tenant (Name)` headers, JSON `"from"`/`"role"` threads, `Tenant:` / `Landlord:` / `Contractor:` lines, `Landlord Ms X` in office notes and a `contractor_of_record` CSV column.
