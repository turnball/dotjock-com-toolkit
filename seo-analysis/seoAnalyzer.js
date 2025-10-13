const fetch = require('node-fetch')
const cheerio = require('cheerio')

async function analyzeSEO(url) {
  let html
  try {
    const res = await fetch(url)
    html = await res.text()
  } catch (err) {
    throw new Error('Failed to fetch URL: ' + err.message)
  }

  const $ = cheerio.load(html)
  const title = $('title').text()
  const metaDesc = $('meta[name="description"]').attr('content') || ''
  const h1 = $('h1').first().text()

  let report = `SEO Report for ${url}\n`
  report += `Title: ${title || 'Missing'}\n`
  report += `Meta Description: ${metaDesc || 'Missing'}\n`
  report += `First H1: ${h1 || 'Missing'}\n`

  return report
}

module.exports = { analyzeSEO }
