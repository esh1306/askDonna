# Submission

| Field | Value |
|---|---|
| Project | Donna: AI-native maintenance operations agent for lettings |
| Track | Property Management |
| Team | _names_ |
| Repository | https://github.com/esh1306/askDonna |
| Commit at 16:30 code freeze | _hash_ |
| Reality Test results | `ANSWERS/` (one folder per case: `ANSWER.md`, `REASONING.md`, `events.ndjson`, `run.json`; summary in `ANSWERS/INDEX.md`) |
| Demo video | _path in repo, e.g. `demo/donna-demo.mp4`_ |
| LinkedIn post | _url_ |
| X post | _url_ |

## How the Reality Test results were produced

```bash
npx eve dev --no-ui        # or: npx eve build && npx eve start
npm run reality -- "<path to the Reality Test case folders>"
```

Every `ANSWER.md` and `REASONING.md` is rendered from the recorded eve event stream (`events.ndjson`) and the CRM before/after state. Failed runs are reported as failed; no output was edited by hand.
