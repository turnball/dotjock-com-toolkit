#!/usr/bin/env node

const { analyzeSEO } = require('./seoAnalyzer')

const url = process.argv[2]
if (!url) {
  console.error('Usage: seo-analyze <url>')
  process.exit(1)
}

analyzeSEO(url).then(report => {
  console.log(report)
}).catch(err => {
  console.error('Error analyzing SEO:', err.message)
  process.exit(1)
})
