## Welcome to the Toolkit by Dotjock.com

This repository is intended to host the toolkit used by dotjock.com for proprietary application engineering, hosting and various other technical services offered by Dotjock.com since its inception in 1999.

### Quick start: SEO analyzer & aggregator

1. Run an analysis for a site (creates reports/<timestamp>/ with per-site files):

	node analyzer.mjs example.com

2. Generate a project plan and human-friendly task list from the latest run:

	node report-aggregator.mjs

3. Point the aggregator at a specific run directory:

	node report-aggregator.mjs reports/2025-10-20T12-00-00-000Z

Outputs written to the run directory:
- project-plan.json — structured tasks with severity
- project-tasks.txt — plain-text checklist for remediation

Note: `crawler.mjs` is a simple link crawler kept for reference; `report-aggregator.mjs` is the new aggregator that reads `reports/`.
