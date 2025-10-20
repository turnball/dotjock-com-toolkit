#!/usr/bin/env bash
set -euo pipefail

# End-to-end SEO run script

# Usage: bash scripts/SEO.sh <domain>
# Example: bash scripts/SEO.sh loghomes.com

set -e

DOMAIN="$1"
if [ -z "$DOMAIN" ]; then
  echo "Usage: bash scripts/SEO.sh <domain>"
  exit 1
fi

# Timestamp for report folder
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
REPORT_DIR="reports/$DOMAIN-$TIMESTAMP"
mkdir -p "$REPORT_DIR"

echo "Running SEO analysis for $DOMAIN..."


# Prompt for customer contact info (interactive)
echo "---"
echo "Please enter customer contact details for $DOMAIN. These will be used in all reports and summaries."
read -p "Customer Name (e.g. Seth Turnbull): " CUSTOMER_NAME
read -p "Customer Email: " CUSTOMER_EMAIL
read -p "Customer Phone: " CUSTOMER_PHONE

# Extract first name for personalized salutations
CUSTOMER_FIRST_NAME=$(echo "$CUSTOMER_NAME" | awk '{print $1}')

# Save contact info (including first name)
CONTACT_FILE="$REPORT_DIR/contact.json"
echo "{\n  \"name\": \"$CUSTOMER_NAME\",\n  \"first_name\": \"$CUSTOMER_FIRST_NAME\",\n  \"email\": \"$CUSTOMER_EMAIL\",\n  \"phone\": \"$CUSTOMER_PHONE\"\n}" > "$CONTACT_FILE"
echo "Contact info saved to $CONTACT_FILE"

echo "\n==> Running analyzer"
ANALYZER_LOG="analyzer.run.log"
node analyzer.mjs "$DOMAIN" > "$ANALYZER_LOG" 2>&1 || echo "Analyzer finished with non-zero exit (see $ANALYZER_LOG)"

# Find the most recent run directory
if [ -d reports ]; then
  RUN_DIR=$(ls -1rt reports | tail -n1)
  if [ -n "$RUN_DIR" ]; then
    RUN_DIR="reports/$RUN_DIR"
  else
    RUN_DIR="reports"
  fi
else
  RUN_DIR="reports"
fi

echo "Analyzer run directory (picked): $RUN_DIR"

# 2) Optionally run crawler (keeps discovered links/logs under the run dir)
if [ "$SKIP_CRAWLER" = false ]; then
  if [ -f crawler.mjs ]; then
    echo "\n==> Running crawler (this may take a while)"
    CRAWLER_LOG="$RUN_DIR/crawler.raw.log"
    # Create run dir if not exist
    mkdir -p "$RUN_DIR"
    # run crawler and capture its stdout/stderr into the run dir
    node crawler.mjs "$DOMAIN" > "$CRAWLER_LOG" 2>&1 || echo "Crawler finished with non-zero exit (see $CRAWLER_LOG)"
    echo "Crawler logs: $CRAWLER_LOG"
  else
   echo "crawler.mjs not found; skipping crawler step"
  fi
else
  echo "Skipping crawler step as requested."
fi

# 3) Run aggregator to create project-plan and tasks
echo "\n==> Running report aggregator"
AGG_LOG="$RUN_DIR/aggregator.log"
node report-aggregator.mjs "$RUN_DIR" > "$AGG_LOG" 2>&1 || echo "Aggregator finished with non-zero exit (see $AGG_LOG)"
echo "Aggregator log: $AGG_LOG"

echo "\n==> Run complete. Artifacts written to: $RUN_DIR"
ls -la "$RUN_DIR" || true


# 4) Assemble markdown report (customer-seo-report.md) with personalized salutation
if [ -f "$RUN_DIR/executive-summary.txt" ] && [ -f "$RUN_DIR/project-tasks.txt" ]; then
  echo "\n==> Assembling customer-seo-report.md"
  cat > "$RUN_DIR/customer-seo-report.md" <<EOF
# SEO Improvement Proposal for $DOMAIN

![Dotjock.com Logo](https://lh3.googleusercontent.com/sitesv/AICyYdZAf03QlSAMUujiT3auUOYtTFEoj14vsXiQVJqa1K6hTQIlW5j3CNXepoZxoZJTXhcun8E3u4DR9VhbEaLReyk6WsM1RfX4yEldQNv6h0XqyjuiJ-7tYmAsA3Eha1TLH06fSNxjHriJhoQP0JC2brw4qVkxns4xAfWHjoKaVfZ7WMw4XVpX5pgHmOo=w1280)

---

## Dear $CUSTOMER_FIRST_NAME,

We are pleased to present your SEO improvement proposal. Below you'll find a summary of findings and actionable recommendations tailored for your site.

## Executive Summary
EOF
  cat "$RUN_DIR/executive-summary.txt" >> "$RUN_DIR/customer-seo-report.md"
  echo -e "\n---\n\n## Project Tasks & Recommendations\n" >> "$RUN_DIR/customer-seo-report.md"
  cat "$RUN_DIR/project-tasks.txt" >> "$RUN_DIR/customer-seo-report.md"
  echo -e "\n---\n\n## Next Steps\n\nOur process uses automated tools and expert review to ensure your site is discoverable, accessible, and competitive in search rankings.\nIf you have questions or would like a deeper manual audit, please contact our team.\n\n---\n\n*Report prepared by Dotjock.com — SEO & Web Engineering Experts*\n" >> "$RUN_DIR/customer-seo-report.md"
fi

# 5) Produce PDF from markdown
if command -v pandoc >/dev/null 2>&1; then
  echo "\n==> Generating PDF report from markdown"
  pandoc "$RUN_DIR/customer-seo-report.md" -o "$RUN_DIR/customer-seo-report.pdf" || echo "PDF generation failed."
  if [ -f "$RUN_DIR/customer-seo-report.pdf" ]; then
    echo "PDF report generated: $RUN_DIR/customer-seo-report.pdf"
  fi
else
  echo "Pandoc not found. Please install pandoc to generate PDF reports."
fi

echo "You can share $RUN_DIR/customer-seo-report.pdf, $RUN_DIR/project-plan.json and $RUN_DIR/project-tasks.txt with the client."
exit 0

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <url> [--skip-crawler]"
  exit 1
fi

URL=$1
SKIP_CRAWLER=false
if [ "${2-}" = "--skip-crawler" ]; then
  SKIP_CRAWLER=true
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Starting SEO run for: $URL"
echo "Output root: $ROOT_DIR/reports"

# 1) Run analyzer
echo "\n==> Running analyzer"
ANALYZER_LOG="analyzer.run.log"
node analyzer.mjs "$URL" > "$ANALYZER_LOG" 2>&1 || echo "Analyzer finished with non-zero exit (see $ANALYZER_LOG)"

# Find the most recent run directory
if [ -d reports ]; then
  RUN_DIR=$(ls -1rt reports | tail -n1)
  if [ -n "$RUN_DIR" ]; then
    RUN_DIR="reports/$RUN_DIR"
  else
    RUN_DIR="reports"
  fi
else
  RUN_DIR="reports"
fi

echo "Analyzer run directory (picked): $RUN_DIR"

# 2) Optionally run crawler (keeps discovered links/logs under the run dir)
if [ "$SKIP_CRAWLER" = false ]; then
  if [ -f crawler.mjs ]; then
    echo "\n==> Running crawler (this may take a while)"
    CRAWLER_LOG="$RUN_DIR/crawler.raw.log"
    # Create run dir if not exist
    mkdir -p "$RUN_DIR"
    # run crawler and capture its stdout/stderr into the run dir
    node crawler.mjs "$URL" > "$CRAWLER_LOG" 2>&1 || echo "Crawler finished with non-zero exit (see $CRAWLER_LOG)"
    echo "Crawler logs: $CRAWLER_LOG"
  else
   echo "crawler.mjs not found; skipping crawler step"
  fi
else
  echo "Skipping crawler step as requested."
fi

# 3) Run aggregator to create project-plan and tasks
echo "\n==> Running report aggregator"
AGG_LOG="$RUN_DIR/aggregator.log"
node report-aggregator.mjs "$RUN_DIR" > "$AGG_LOG" 2>&1 || echo "Aggregator finished with non-zero exit (see $AGG_LOG)"
echo "Aggregator log: $AGG_LOG"

echo "\n==> Run complete. Artifacts written to: $RUN_DIR"
ls -la "$RUN_DIR" || true

# 4) Assemble markdown report (customer-seo-report.md)
if [ -f "$RUN_DIR/executive-summary.txt" ] && [ -f "$RUN_DIR/project-tasks.txt" ]; then
  echo "\n==> Assembling customer-seo-report.md"
  cat > "$RUN_DIR/customer-seo-report.md" <<EOF
# SEO Improvement Proposal for $URL

![Dotjock.com Logo](https://lh3.googleusercontent.com/sitesv/AICyYdZAf03QlSAMUujiT3auUOYtTFEoj14vsXiQVJqa1K6hTQIlW5j3CNXepoZxoZJTXhcun8E3u4DR9VhbEaLReyk6WsM1RfX4yEldQNv6h0XqyjuiJ-7tYmAsA3Eha1TLH06fSNxjHriJhoQP0JC2brw4qVkxns4xAfWHjoKaVfZ7WMw4XVpX5pgHmOo=w1280)

---

## Executive Summary

EOF
  cat "$RUN_DIR/executive-summary.txt" >> "$RUN_DIR/customer-seo-report.md"
  echo -e "\n---\n\n## Project Tasks & Recommendations\n" >> "$RUN_DIR/customer-seo-report.md"
  cat "$RUN_DIR/project-tasks.txt" >> "$RUN_DIR/customer-seo-report.md"
  echo -e "\n---\n\n## Next Steps\n\nOur process uses automated tools and expert review to ensure your site is discoverable, accessible, and competitive in search rankings.\nIf you have questions or would like a deeper manual audit, please contact our team.\n\n---\n\n*Report prepared by Dotjock.com — SEO & Web Engineering Experts*\n" >> "$RUN_DIR/customer-seo-report.md"
fi

# 5) Produce PDF from markdown
if command -v pandoc >/dev/null 2>&1; then
  echo "\n==> Generating PDF report from markdown"
  pandoc "$RUN_DIR/customer-seo-report.md" -o "$RUN_DIR/customer-seo-report.pdf" || echo "PDF generation failed."
  if [ -f "$RUN_DIR/customer-seo-report.pdf" ]; then
    echo "PDF report generated: $RUN_DIR/customer-seo-report.pdf"
  fi
else
  echo "Pandoc not found. Please install pandoc to generate PDF reports."
fi

echo "You can share $RUN_DIR/customer-seo-report.pdf, $RUN_DIR/project-plan.json and $RUN_DIR/project-tasks.txt with the client."
exit 0
