#!/usr/bin/env bash
set -euo pipefail

# End-to-end SEO run script

# Usage: bash scripts/SEO.sh <domain>
# Example: bash scripts/SEO.sh loghomes.com


set -e

# Ensure SKIP_CRAWLER is always defined
SKIP_CRAWLER=false

DOMAIN="$1"
if [ -z "$DOMAIN" ]; then
  echo "Usage: bash scripts/SEO.sh <domain>"
  exit 1
fi

# Timestamp for report folder
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
REPORT_DIR="reports/$DOMAIN-$TIMESTAMP"
mkdir -p "$REPORT_DIR"

echo -e "Running SEO analysis for $DOMAIN..."

# Run analyzer
echo -e "\n\n     --- ------------------- ---"
echo -e "     ==> Performing Analysis <=="
echo -e "     --- ------------------- ---\n"
ANALYZER_LOG="$REPORT_DIR/analyzer.run.log"
node analyzer.mjs "$DOMAIN" > "$ANALYZER_LOG" # 2>&1 || 
echo -e "Analyzer finished (see $ANALYZER_LOG)\n"

# Run crawler
if [ "$SKIP_CRAWLER" = false ]; then
  if [ -f crawler.mjs ]; then
    echo -e "\n==> Running crawler (this may take a while)"
    CRAWLER_LOG="$REPORT_DIR/crawler.raw.log"
    CRAWLED_URLS_FILE="$REPORT_DIR/crawled-urls.txt"
    # Run crawler, log all output, and extract URLs to a separate file for audit
    node crawler.mjs "$DOMAIN" > "$CRAWLER_LOG" 2>&1 || echo "Crawler finished with non-zero exit (see $CRAWLER_LOG)"
    # Extract URLs from crawler.json if it exists
    if [ -f "$REPORT_DIR/crawler.json" ]; then
      jq -r '.urls[]? // .links[]? // empty' "$REPORT_DIR/crawler.json" | sort | uniq > "$CRAWLED_URLS_FILE"
      echo -e "Crawled URLs written to $CRAWLED_URLS_FILE"
    else
      echo -e "No crawler.json found, cannot extract crawled URLs."
    fi
    echo -e "Crawler logs: $CRAWLER_LOG"
  else
    echo -e "crawler.mjs not found; skipping crawler step"
  fi
else
  echo -e "Skipping crawler step as requested."
fi

# Run aggregator
echo -e "\n==> Running report aggregator"
AGG_LOG="$REPORT_DIR/aggregator.log"
node report-aggregator.mjs "$REPORT_DIR" > "$AGG_LOG" 2>&1 || echo "Aggregator finished with non-zero exit (see $AGG_LOG)"
echo "Aggregator log: $AGG_LOG"

echo -e "\n==> Run complete. Artifacts written to: $REPORT_DIR"
ls -la "$REPORT_DIR" || true

# Prompt for customer contact info (optional, after analysis)
echo -e "---"
echo -e "If you want to include customer contact details in the report, enter them below. Leave blank to skip."
read -p "Customer Name (e.g. Seth Turnbull): " CUSTOMER_NAME
read -p "Customer Email: " CUSTOMER_EMAIL
read -p "Customer Phone: " CUSTOMER_PHONE

if [ -n "$CUSTOMER_NAME" ]; then
  CUSTOMER_FIRST_NAME=$(echo "$CUSTOMER_NAME" | awk '{print $1}')
  CONTACT_FILE="$REPORT_DIR/contact.json"
  echo -e "{\n  \"name\": \"$CUSTOMER_NAME\",\n  \"first_name\": \"$CUSTOMER_FIRST_NAME\",\n  \"email\": \"$CUSTOMER_EMAIL\",\n  \"phone\": \"$CUSTOMER_PHONE\"\n}" > "$CONTACT_FILE"
  echo -e "Contact info saved to $CONTACT_FILE"
fi

echo -e "\n==> Running analyzer"
ANALYZER_LOG="analyzer.run.log"
node analyzer.mjs "$DOMAIN" > "$ANALYZER_LOG" 2>&1 || echo -e "Analyzer finished with non-zero exit (see $ANALYZER_LOG)"

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

echo -e "Analyzer run directory (picked): $RUN_DIR"

# 2) Optionally run crawler (keeps discovered links/logs under the run dir)
if [ "$SKIP_CRAWLER" = false ]; then
  if [ -f crawler.mjs ]; then
    echo -e "\n==> Running crawler (this may take a while)"
    CRAWLER_LOG="$RUN_DIR/crawler.raw.log"
    # Create run dir if not exist
    mkdir -p "$RUN_DIR"
    # run crawler and capture its stdout/stderr into the run dir
    node crawler.mjs "$DOMAIN" > "$CRAWLER_LOG" 2>&1 || echo -e "Crawler finished with non-zero exit (see $CRAWLER_LOG)"
    echo -e "Crawler logs: $CRAWLER_LOG"
  else
   echo -e "crawler.mjs not found; skipping crawler step"
  fi
else
  echo -e "Skipping crawler step as requested."
fi

# 3) Run aggregator to create project-plan and tasks
echo -e "\n==> Running report aggregator"
AGG_LOG="$RUN_DIR/aggregator.log"
node report-aggregator.mjs "$RUN_DIR" > "$AGG_LOG" 2>&1 || echo -e "Aggregator finished with non-zero exit (see $AGG_LOG)"
echo -e "Aggregator log: $AGG_LOG"

echo -e "\n==> Run complete. Artifacts written to: $RUN_DIR"
ls -la "$RUN_DIR" || true

# 4) Assemble markdown report (customer-seo-report.md)
if [ -f "$REPORT_DIR/executive-summary.txt" ] && [ -f "$REPORT_DIR/project-tasks.txt" ]; then
  echo -e "\n==> Assembling customer-seo-report.md"
  cat > "$REPORT_DIR/customer-seo-report.md" <<EOF
# SEO Improvement Proposal for $DOMAIN

![Dotjock.com Logo](https://lh3.googleusercontent.com/sitesv/AICyYdZAf03QlSAMUujiT3auUOYtTFEoj14vsXiQVJqa1K6hTQIlW5j3CNXepoZxoZJTXhcun8E3u4DR9VhbEaLReyk6WsM1RfX4yEldQNv6h0XqyjuiJ-7tYmAsA3Eha1TLH06fSNxjHriJhoQP0JC2brw4qVkxns4xAfWHjoKaVfZ7WMw4XVpX5pgHmOo=w1280)

---

EOF
  if [ -n "$CUSTOMER_FIRST_NAME" ]; then
    echo -e "## Dear $CUSTOMER_FIRST_NAME,\n" >> "$REPORT_DIR/customer-seo-report.md"
    echo -e "\nWe are pleased to present your SEO improvement proposal. Below you'll find a summary of findings and actionable recommendations tailored for your site.\n" >> "$REPORT_DIR/customer-seo-report.md"
  fi
  echo -e "## Executive Summary" >> "$REPORT_DIR/customer-seo-report.md"
  cat "$REPORT_DIR/executive-summary.txt" >> "$REPORT_DIR/customer-seo-report.md"
  echo -e "\n---\n\n## Project Tasks & Recommendations\n" >> "$REPORT_DIR/customer-seo-report.md"
  cat "$REPORT_DIR/project-tasks.txt" >> "$REPORT_DIR/customer-seo-report.md"
  echo -e "\n---\n\n## Next Steps\n\nOur process uses automated tools and expert review to ensure your site is discoverable, accessible, and competitive in search rankings.\nIf you have questions or would like a deeper manual audit, please contact our team.\n\n---\n\n*Report prepared by Dotjock.com — SEO & Web Engineering Experts*\n" >> "$REPORT_DIR/customer-seo-report.md"
fi

 node seo-crawler.mjs "$DOMAIN" > "$CRAWLER_LOG" 2>&1 || echo -e "Crawler finished with non-zero exit (see $CRAWLER_LOG)"
   
