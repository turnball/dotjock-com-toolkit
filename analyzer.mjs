#!/usr/bin/env node
import SeoAnalyzer from 'seo-analyzer'
import fs from 'fs'
import path from 'path'
import os from 'os'

const url = process.argv[2]

if (!url) {
  console.error(`Usage: analyzer.mjs <url>`)
  process.exit(1)
}

// prepare reports folder for this run
const REPORTS_DIR = path.resolve(process.cwd(), 'reports')
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true })
const RUN_TS = new Date().toISOString().replace(/[:.]/g, '-')
const RUN_DIR = path.join(REPORTS_DIR, RUN_TS)
fs.mkdirSync(RUN_DIR, { recursive: true })

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
  try {
    await runAnalyzerForSite(urlStudy)
  } catch (err) {
    const m = err && err.message ? err.message : String(err)
    console.error(`Unexpected error analyzing ${urlStudy}: ${m}`)
  }
}

function summarizeResults(obj) {
  if (!Array.isArray(obj)) {
    return 'No structured results'
  }
  const totalIssues = obj.reduce((acc, cur) => acc + ((cur.report && cur.report.length) || 0), 0)
  const perSource = obj.map(s => ({ source: s.source, issues: (s.report && s.report.length) || 0 }))
  let summary = `Total issues: ${totalIssues}` + os.EOL
  perSource.forEach(p => { summary += `- ${p.source}: ${p.issues} issues` + os.EOL })
  return summary
}

const runAnalyzerForSite = async () => {
  const attempt = async (urlStudy) => {
    console.log(`Analyzing candidate URL: ${urlStudy}`)
    const a = new SeoAnalyzer() //{ verbose: false })
      .inputUrls(urlStudy)
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
    console.log(`just before execution`)
    const capturedResult = await a.outputObject().run()

    console.log(`capturedResult`, capturedResult)
    
    const originalConsoleError = console.error
    const originalConsoleLog = console.log
    const originalConsoleWarn = console.warn
    const buffered = { error: [], log: [], warn: [] }

    console.error = (...args) => buffered.error.push(args.map(String).join(' '))
    console.log = (...args) => buffered.log.push(args.map(String).join(' '))
    console.warn = (...args) => buffered.warn.push(args.map(String).join(' '))
    try {
      return { ok: true, results: capturedResult, rawLogs: buffered }
    } catch (err) {
      // restore console immediately
      console.error = originalConsoleError
      console.log = originalConsoleLog
      console.warn = originalConsoleWarn

      // normalize axios/network errors and attach buffered logs
      const normalized = (() => {
        try {
          if (!err) {
            return {
              message: 'Unknown error', rawLogs: buffered
            }
          }
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

  console.log(`\nAnalyzing ${urlStudy}...`)
  const first = await attempt(urlStudy)
  console.log(`first`, first)
  if (first.ok) {
    // write results to file
    const base = path.join(RUN_DIR, encodeURIComponent(urlStudy))
    fs.writeFileSync(base + '.results.json', JSON.stringify(first.results || {}, null, 2) + os.EOL)
    fs.writeFileSync(base + '.raw.log', JSON.stringify(first.rawLogs || {}, null, 2) + os.EOL)
    // write summary
    fs.writeFileSync(base + '.summary.txt', summarizeResults(first.results) + os.EOL)
    console.log(`Saved report for ${urlStudy} -> ${base}.*`)
    return
  }

  const errObj = first.err || { message: 'Unknown error' }
  const msg = errObj.message || String(errObj)
  const code = errObj.code || errObj.status || ''

  const isNetworkError = errObj.type === 'network' || /TLS|socket|ECONNRESET|ECONNREFUSED|ENOTFOUND|certificate|Client network socket disconnected/i.test(msg) || /ECONNRESET|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ECONNABORTED/i.test(String(code))

  console.log(`Error type for ${urlStudy}: ${errObj.type || 'unknown'}, isNetworkError=${isNetworkError}`)
  if (!isNetworkError) {
    console.error(`Error analyzing ${urlStudy}: ${msg}`)
    // save error
    const base = path.join(RUN_DIR, encodeURIComponent(urlStudy))
    fs.writeFileSync(base + '.error.json', JSON.stringify(errObj, null, 2) + os.EOL)
    fs.writeFileSync(base + '.raw.log', JSON.stringify(errObj.rawLogs || {}, null, 2) + os.EOL)
    return
  }

  const failBase = path.join(RUN_DIR, encodeURIComponent(urlStudy))
  fs.writeFileSync(failBase + '.error.json', JSON.stringify(errObj, null, 2) + os.EOL)
  fs.writeFileSync(failBase + '.raw.log', JSON.stringify(errObj.rawLogs || {}, null, 2) + os.EOL)
  console.error(`Failed to analyze ${urlStudy}: ${code} ${msg} (saved logs to ${failBase}.*)`)
}


analyze().catch(err => {
  console.error(`Fatal error:`, err && err.message ? err.message : err)
  process.exit(1)
})

