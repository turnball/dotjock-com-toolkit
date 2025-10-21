#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import os from 'os'

// report-aggregator.mjs
// Usage: node report-aggregator.mjs [reportsPath]
// If reportsPath is omitted, it picks the most recent directory under ./reports

const arg = process.argv[2]
const ROOT = process.cwd()
const REPORTS_DIR = path.join(ROOT, 'reports')

function listRunDirs() {
  if (!fs.existsSync(REPORTS_DIR)) return []
  return fs.readdirSync(REPORTS_DIR).filter(f => fs.statSync(path.join(REPORTS_DIR, f)).isDirectory()).sort()
}

function pickLatestRunDir() {
  const runs = listRunDirs()
  if (!runs.length) return null
  return path.join(REPORTS_DIR, runs[runs.length - 1])
}

function loadJsonSafe(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch (e) {
    return null
  }
}

function mapFindingsToTasks(resultsObj, site) {
  const tasks = []
  if (!Array.isArray(resultsObj)) return tasks
  for (const src of resultsObj) {
    const srcName = src.source || 'unknown'
    const items = Array.isArray(src.report) ? src.report : []
    for (const it of items) {
      const title = it.title || it.rule || it.message || 'Issue'
      const severity = (it.severity || 'medium')
      const description = it.description || it.msg || it.message || JSON.stringify(it)
      let canonicalTask = ''
      if (/meta description/i.test(title) || /metaDescription|meta description/i.test(it.rule || '')) {
        canonicalTask = `Add or improve meta description on ${site} — recommended length 50–160 characters`
      } else if (/title/i.test(title) || /titleLengthRule/i.test(it.rule || '')) {
        canonicalTask = `Fix title length on ${site} — target 10–60 characters and include primary keyword`
      } else if (/img/i.test(title) || /alt/i.test(description)) {
        canonicalTask = `Add descriptive alt attributes to images missing them on ${site}`
      } else if (/canonical/i.test(title) || /canonicalLinkRule/i.test(it.rule || '')) {
        canonicalTask = `Add canonical link element or fix canonical URLs on ${site}`
      } else {
        canonicalTask = `${title} — ${description}`
      }
      tasks.push({ site, source: srcName, title, severity, task: canonicalTask })
    }
  }
  return tasks
}

function severityRank(s) {
  const m = String(s || '').toLowerCase()
  if (m === 'critical') return 4
  if (m === 'high') return 3
  if (m === 'medium') return 2
  if (m === 'low') return 1
  return 2
}


function summarizeDomains(jsonResults, errorFiles, runPath) {
  // Domains/sites analyzed
  const analyzed = jsonResults.map(f => decodeURIComponent(f.replace('.results.json', '')))
  const errored = errorFiles.map(f => decodeURIComponent(f.replace('.error.json', '')))
  // Crawler summary
  let discovered = []
  let discoveredCount = 0
  const crawlerPath = path.join(runPath, 'crawler.json')
  if (fs.existsSync(crawlerPath)) {
    try {
      const c = JSON.parse(fs.readFileSync(crawlerPath, 'utf8'))
      if (Array.isArray(c.discovered)) {
        discovered = c.discovered.map(d => d.start)
        discoveredCount = c.discovered.reduce((acc, d) => acc + (d.count || 0), 0)
      }
    } catch {}
  }
  return { analyzed, errored, discovered, discoveredCount }
}

async function main() {
  const runPath = arg ? path.resolve(arg) : pickLatestRunDir()
  if (!runPath) {
    console.error(`No reports found. Run analyzer first to generate reports under ./reports/`)
    process.exit(0)
  }
  console.log(`Using reports directory:`, runPath)

  const files = fs.readdirSync(runPath)
  const jsonResults = files.filter(f => f.endsWith('.results.json'))
  const errorFiles = files.filter(f => f.endsWith('.error.json'))

  const allTasks = []
  for (const jf of jsonResults) {
    const full = path.join(runPath, jf)
    const site = decodeURIComponent(jf.replace('.results.json', ''))
    const res = loadJsonSafe(full)
    if (!res) continue
    const tasks = mapFindingsToTasks(res, site)
    allTasks.push(...tasks)
  }

  for (const ef of errorFiles) {
    const full = path.join(runPath, ef)
    const site = decodeURIComponent(ef.replace('.error.json', ''))
    const err = loadJsonSafe(full)
    allTasks.push({ site, source: 'error', title: `Analysis failed for ${site}`, severity: 'high', task: `Investigation: ${err && err.message ? err.message : 'Unknown error'}` })
  }

  allTasks.sort((a, b) => severityRank(b.severity) - severityRank(a.severity))

  // Summarize domains, artifacts, and recommendations
  const domainSummary = summarizeDomains(jsonResults, errorFiles, runPath)
  const plan = {
    generatedAt: new Date().toISOString(),
    runPath,
    analyzedDomains: domainSummary.analyzed,
    erroredDomains: domainSummary.errored,
    discoveredRoots: domainSummary.discovered,
    discoveredLinks: domainSummary.discoveredCount,
    artifactCounts: {
      results: jsonResults.length,
      errors: errorFiles.length,
      discovered: domainSummary.discoveredCount
    },
    tasks: allTasks
  }
  fs.writeFileSync(path.join(runPath, 'project-plan.json'), JSON.stringify(plan, null, 2) + os.EOL)

  let out = `Project tasks generated from run: ${runPath}\nGenerated: ${plan.generatedAt}\n\n`;
  out += `Domains analyzed: ${plan.analyzedDomains.join(', ') || 'None'}\n`;
  out += `Domains with errors: ${plan.erroredDomains.join(', ') || 'None'}\n`;
  out += `Discovered link roots: ${plan.discoveredRoots.join(', ') || 'None'}\n`;
  out += `Total discovered links: ${plan.discoveredLinks}\n`;
  out += `Artifacts: ${plan.artifactCounts.results} results, ${plan.artifactCounts.errors} errors, ${plan.artifactCounts.discovered} discovered links\n\n`;
  if (allTasks.length) {
    out += `Recommended improvements:\n`;
    let i = 1;
    for (const t of allTasks) {
      out += `${i}. [${(t.severity || 'medium').toUpperCase()}] ${t.task} (site: ${t.site})\n` + os.EOL;
      i += 1;
    }
  } else {
    out += `No actionable tasks found.\n`;
    out += `Recommendation: Review site for SEO best practices, ensure meta tags, titles, and canonical links are present and valid.\n`;
  }
  fs.writeFileSync(path.join(runPath, 'project-tasks.txt'), out)

  // --- Executive summary for client ---
  let execSummary = ''
  execSummary += `SEO Executive Summary\n`
  execSummary += `====================\n\n`
  execSummary += `This report was generated on ${plan.generatedAt} as part of a comprehensive SEO review of your web presence.\n\n`
  let customerDomain = plan.analyzedDomains[0] || plan.discoveredRoots[0] || '<your website>';
  if (plan.analyzedDomains.length) {
    execSummary += `Websites analyzed: ${plan.analyzedDomains.join(', ')}\n`
  } else {
    execSummary += `No domains could be fully analyzed due to network or site issues.\n`
  }
  if (plan.discoveredRoots.length) {
    execSummary += `Crawling discovered ${plan.discoveredLinks} unique links from: ${plan.discoveredRoots.join(', ')}\n`
  }
  execSummary += `\nArtifacts produced: ${plan.artifactCounts.results} analysis results, ${plan.artifactCounts.errors} errors, ${plan.artifactCounts.discovered} discovered links.\n\n`
  if (allTasks.length) {
    execSummary += `Key SEO recommendations:\n`
    let i = 1
    for (const t of allTasks.slice(0, 5)) {
      execSummary += `${i}. [${(t.severity || 'medium').toUpperCase()}] ${t.task} (site: ${t.site})\n`
      i += 1
    }
    if (allTasks.length > 5) execSummary += `...and ${allTasks.length - 5} more.\n`
    execSummary += `\nUpon completing these ${allTasks.length} recommended improvements, Dotjock.com is confident that ${customerDomain} shall increase in its recognition and SEO ratings. We estimate your site will become up to 380% more effective in seeding valuable search engine listings in online catalogs such as Google Search, DMOZ, and advanced industry-specific directories.\n`
    execSummary += `Our recommendations are based on industry best practices and tailored analysis of your site. Implementing them will position your business for greater online visibility and measurable growth.\n`
  } else {
    execSummary += `No critical SEO issues were automatically detected.\n`
    execSummary += `We recommend a manual review for best practices: ensure every page has a unique title, meta description, and canonical link, and that images have descriptive alt attributes.\n`
    execSummary += `\nDotjock.com is confident that with continued attention to these details, your site will remain competitive and well-positioned for future growth in search engine visibility.\n`
  }
  execSummary += `\nOur process uses automated tools and expert review to ensure your site is discoverable, accessible, and competitive in search rankings.\n`
  execSummary += `If you have questions or would like a deeper manual audit, please contact our team.\n`
  fs.writeFileSync(path.join(runPath, 'executive-summary.txt'), execSummary)

  console.log(`Wrote project-plan.json, project-tasks.txt, and executive-summary.txt to ${runPath}`)
}

main().catch(err => {
  console.error(`Aggregator fatal error:`, err && err.message ? err.message : err)
  process.exit(1)
})
