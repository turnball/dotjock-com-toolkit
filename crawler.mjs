// robust sequential crawler

import axios from 'axios'
import * as cheerio from 'cheerio'
import fs from 'fs'
import path from 'path'

// Helper to append to the raw log file
function logRaw(runPath, msg) {
  const logFile = path.join(runPath, 'crawler.raw.log')
  fs.appendFileSync(logFile, msg + '\n')
}

const inputUrl = process.argv[2]
if (!inputUrl) {
  console.error('Usage: node crawler.mjs <url>')
  process.exit(1)
}

const MAX_LINKS = 30

function candidatesFor(url) {
  if (url.startsWith('http://') || url.startsWith('https://')) return [url]
  return [`http://${url}`, `https://${url}`]
}

async function fetchWithFallback(u) {
  try {
    return await axios.get(u, { timeout: 15000 })
  } catch (err) {
    // if https failed, try http variant
    try {
      if (u.startsWith('https://')) {
        const alt = u.replace('https://', 'http://')
        return await axios.get(alt, { timeout: 15000 })
      }
    } catch (e) {
      throw err
    }
    throw err
  }
}

async function crawl(root) {
  const runDir = fs.existsSync('reports') ? fs.readdirSync('reports').filter(f => fs.statSync(path.join('reports', f)).isDirectory()).sort().pop() : null
  const runPath = runDir ? path.join('reports', runDir) : 'reports'
  const out = { root, discovered: [], errors: [] }
  const cands = candidatesFor(root)
  let anySuccess = false
  cands.forEach(async (c) => {
    console.log(`Crawling: ${c}`)
    const res = await fetchWithFallback(c)
    const $ = cheerio.load(res.data)
    const links = []
    $('a').each((i, el) => {
      const href = $(el).attr('href')
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        links.push(href)
      }
    })
    out.discovered.push({ start: c, count: links.length, links: links.slice(0, MAX_LINKS) })
    // Logging each crawled link to crawler.raw.log
    fs.mkdirSync(runPath, { recursive: true })
    logRaw(runPath, `Crawled: ${c} - found ${links.length} links`)
    links.slice(0, MAX_LINKS).forEach(link => logRaw(runPath, `  Found: ${link}`))
    fs.writeFileSync(path.join(runPath, 'crawler.json'), JSON.stringify(out, null, 2))
    anySuccess = true
    return out
  })
  // }).catch(err => {
  //   // Log error for this candidate
  //   fs.mkdirSync(runPath, { recursive: true })
  //   const msg = `Error crawling ${c}: ${err && err.message ? err.message : err}`
  //   logRaw(runPath, msg)
  //   out.errors.push({ url: c, error: (err && err.message ? err.message : String(err)) })
  // })

  // If all fetches failed, write crawler.json with errors and log
  fs.mkdirSync(runPath, { recursive: true })
  logRaw(runPath, `Crawl failed for all candidates: ${cands.join(', ')}`)
  fs.writeFileSync(path.join(runPath, 'crawler.json'), JSON.stringify(out, null, 2))
  throw new Error(`All fetch attempts failed`)
}

crawl(inputUrl).then(r => {
  console.log(`Crawl completed, wrote crawler.json`)
}).catch(e => {
  console.error(`Crawler failed:`, e && e.message ? e.message : e)
  process.exit(1)
})

export default crawl
