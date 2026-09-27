# Incident Timeline Builder

Turn scattered incident updates into a readable record of what happened and how long response and resolution took. This Node.js 24 program sorts synthetic events by timestamp, validates the state sequence, and writes JSON plus a self-contained HTML timeline.

## Run

```powershell
node --test
node cli.mjs
node cli.mjs path/to/events.json path/to/output-directory
```

Default outputs are [`examples/timeline.json`](examples/timeline.json) and [`examples/timeline.html`](examples/timeline.html). The optional output directory is created and files with those names are overwritten. Open the HTML file offline; no npm installation or network service is needed.

Events require unique IDs, `OPENED` before `MITIGATED` or `RESOLVED`, and explicit timezone timestamps. The first mitigation defines response time; resolution time runs from opening to resolution. Notes are escaped before rendering. This handles one incident at a time and records elapsed wall-clock minutes, not a formal SLA calendar.
