#!/usr/bin/env node
import SeoAnalyzer from 'seo-analyzer'
import fs from 'fs'
import path from 'path'
import os from 'os'

const url = process.argv[2]

if (!url) {
  console.error('Usage: analyzer.mjs <url>')
  process.exit(1)
}

// prepare reports folder for this run
const REPORTS_DIR = path.resolve(process.cwd(), 'reports')
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true })
const RUN_TS = new Date().toISOString().replace(/[:.]/g, '-')
const RUN_DIR = path.join(REPORTS_DIR, RUN_TS)
fs.mkdirSync(RUN_DIR, { recursive: true })

function summarizeResults(obj) {
  if (!Array.isArray(obj)) return 'No structured results'
  const totalIssues = obj.reduce((acc, cur) => acc + ((cur.report && cur.report.length) || 0), 0)
  const perSource = obj.map(s => ({ source: s.source, issues: (s.report && s.report.length) || 0 }))
  let summary = `Total issues: ${totalIssues}` + os.EOL
  perSource.forEach(p => { summary += `- ${p.source}: ${p.issues} issues` + os.EOL })
  return summary
}

async function runAnalyzerForSite(siteRaw) {
  const site = siteRaw.endsWith('/') ? siteRaw.slice(0, -1) : siteRaw

  const configure = (a, target) => a
    .inputUrls([target])
    .useRule('titleLengthRule', { min: 10, max: 50 })
    .useRule('metaDescriptionRule', { min: 50, max: 160 })
    .useRule('imgTagWithAltAttributeRule')
    .useRule('headingsStructureRule')
    .useRule('canonicalLinkRule')
    .useRule('metaSocialRule', {
      properties: [
        'og:url','og:type','og:site_name','og:title','og:description','og:image','og:image:width','og:image:height','twitter:card','twitter:text:title','twitter:description','twitter:image:src','twitter:url'
      ]
    })

  const attempt = async (candidate) => {
    const a = new SeoAnalyzer({ verbose: false })
    configure(a, candidate)

    // capture console output produced by the analyzer so we can filter/suppress progress bars
    const originalConsoleError = console.error
    const originalConsoleLog = console.log
    const originalConsoleWarn = console.warn
    const buffered = { error: [], log: [], warn: [] }
    console.error = (...args) => buffered.error.push(args.map(String).join(' '))
    console.log = (...args) => buffered.log.push(args.map(String).join(' '))
    console.warn = (...args) => buffered.warn.push(args.map(String).join(' '))

    // capture results via outputObject callback
    let capturedResults = null
    a.outputObject((res) => { capturedResults = res })

    try {
      await a.run()
      return { ok: true, results: capturedResults, rawLogs: buffered }
    } catch (err) {
      // restore console immediately
      console.error = originalConsoleError
      console.log = originalConsoleLog
      console.warn = originalConsoleWarn

      // normalize axios/network errors and attach buffered logs
      const normalized = (() => {
        try {
          if (!err) return { message: 'Unknown error', rawLogs: buffered }
          if (err.response) {
            return {
              type: 'http',
              status: err.response.status,
              url: (err.config && err.config.url) || candidate,
              code: err.code || null,
              message: err.message || `HTTP ${err.response.status}`,
              rawLogs: buffered
            }
          }
          if (err.request) {
            return {
              type: 'network',
              url: (err.config && err.config.url) || candidate,
              code: err.code || null,
              message: err.message || 'Network error',
              rawLogs: buffered
            }
          }
          return { type: 'other', message: err.message || String(err), rawLogs: buffered }
        } catch (e) {
          return { type: 'other', message: String(err), rawLogs: buffered }
        }
      })()

      return { ok: false, err: normalized }
    } finally {
      // ensure we always restore console
      console.error = originalConsoleError
      console.log = originalConsoleLog
      console.warn = originalConsoleWarn
    }
  }

  console.log(`\nAnalyzing ${site}...`)
  const first = await attempt(site)
  if (first.ok) {
    // write results to file
    const base = path.join(RUN_DIR, encodeURIComponent(site))
    fs.writeFileSync(base + '.results.json', JSON.stringify(first.results || {}, null, 2) + os.EOL)
    fs.writeFileSync(base + '.raw.log', JSON.stringify(first.rawLogs || {}, null, 2) + os.EOL)
    // write summary
    fs.writeFileSync(base + '.summary.txt', summarizeResults(first.results) + os.EOL)
    console.log(`Saved report for ${site} -> ${base}.*`)
    return
  }

  const errObj = first.err || { message: 'Unknown error' }
  const msg = errObj.message || String(errObj)
  const code = errObj.code || errObj.status || ''

  const isNetworkError = errObj.type === 'network' || /TLS|socket|ECONNRESET|ECONNREFUSED|ENOTFOUND|certificate|Client network socket disconnected/i.test(msg) || /ECONNRESET|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ECONNABORTED/i.test(String(code))

  if (!isNetworkError) {
    console.error(`Error analyzing ${site}: ${msg}`)
    // save error
    const base = path.join(RUN_DIR, encodeURIComponent(site))
    fs.writeFileSync(base + '.error.json', JSON.stringify(errObj, null, 2) + os.EOL)
    fs.writeFileSync(base + '.raw.log', JSON.stringify(errObj.rawLogs || {}, null, 2) + os.EOL)
    return
  }

  if (site.startsWith('https://')) {
    const fallback = site.replace(/^https:\/\//, 'http://')
    console.warn(`Network/TLS error for ${site}: ${code} ${msg} — retrying with ${fallback}`)
    const second = await attempt(fallback)
    const base = path.join(RUN_DIR, encodeURIComponent(fallback))
    if (second.ok) {
      fs.writeFileSync(base + '.results.json', JSON.stringify(second.results || {}, null, 2) + os.EOL)
      fs.writeFileSync(base + '.raw.log', JSON.stringify(second.rawLogs || {}, null, 2) + os.EOL)
      fs.writeFileSync(base + '.summary.txt', summarizeResults(second.results) + os.EOL)
      console.log(`Saved report for ${fallback} -> ${base}.*`)
      return
    }
    const sErr = second.err || {}
    fs.writeFileSync(base + '.error.json', JSON.stringify(sErr, null, 2) + os.EOL)
    fs.writeFileSync(base + '.raw.log', JSON.stringify(sErr.rawLogs || {}, null, 2) + os.EOL)
    console.error(`Fallback failed for ${fallback}: ${sErr.code || sErr.status || ''} ${sErr.message || String(sErr)} (logs: ${base}.*)`)
    return
  }

  const failBase = path.join(RUN_DIR, encodeURIComponent(site))
  fs.writeFileSync(failBase + '.error.json', JSON.stringify(errObj, null, 2) + os.EOL)
  fs.writeFileSync(failBase + '.raw.log', JSON.stringify(errObj.rawLogs || {}, null, 2) + os.EOL)
  console.error(`Failed to analyze ${site}: ${code} ${msg} (saved logs to ${failBase}.*)`)
}

const analyze = async () => {
  const urlStudy = []
  if (!url.startsWith('http')) {
    urlStudy.push(`https://${url}`)
    urlStudy.push(`http://${url}`)
  } else if (url.startsWith('https://')) {
    urlStudy.push(url)
    urlStudy.push(url.replace('https://', 'http://'))
  } else if (url.startsWith('http://')) {
    urlStudy.push(url)
    urlStudy.push(url.replace('http://', 'https://'))
  }
  for (const site of urlStudy) {
    try {
      await runAnalyzerForSite(site)
    } catch (err) {
      const m = err && err.message ? err.message : String(err)
      console.error(`Unexpected error analyzing ${site}: ${m}`)
    }
  }
}

analyze().catch(err => {
  console.error('Fatal error:', err && err.message ? err.message : err)
  process.exit(1)
})

