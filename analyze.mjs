#!/usr/bin/env node
import { createRequire } from 'module'
import {SeoCheck} from 'seord'
import * as cheerio from 'cheerio'
import nodeSeoChecker from 'node-seo-checker'
import { AnalysisWebWorker } from 'yoastseo'
import EnglishResearcher from 'yoastseo/build/languageProcessing/languages/en/Researcher'


const require = createRequire(import.meta.url)
const SeoAnalyzer = require('seo-analyzer')

// const Manager =  nodeSeoChecker.Manager
// const RuleBase = new nodeSeoChecker.RuleBase()
// const manager = nodeSeoChecker.Manager.getInstance()


// specify the URL of the site to crawl
const url = process.argv[2]

const main = async () => {

  // Instantiate the analyzer and run  it against the fetched HTML string.
  console.log(`Analyzing SEO for: ${url}\n`)
  var urlStudy = []
  if (url.startsWith('http://')) {
    urlStudy.push(url.replace('http://', 'https://'))
  }
  if (url.startsWith('https://')) {
    urlStudy.push(url.replace('https://', 'http://'))
  }
  if (!url.startsWith('http')) {
    urlStudy.push(`http://${url}`)
    urlStudy.push(`https://${url}`)
  }
  console.log(url)
  console.log(urlStudy)
//  manager.addRule('./rule.json')

  new SeoAnalyzer().inputUrls(urlStudy)
    .addRule('titleLengthRule', { min: 10, max: 50 })
    .ignoreUrls(['/404', '/500', '/login', '/wp-admin'])
    // .addRule('imgTagWithAltAttributeRule')
    // .addRule('aTagWithRelAttributeRule')
    // .addRule('metaBaseRule', { list: ['description', 'viewport'] })
    // .addRule('metaSocialRule', {
    //   properties: [
    //     'og:url',
    //     'og:type',
    //     'og:site_name',
    //     'og:title',
    //     'og:description',
    //     'og:image',
    //     'og:image:width',
    //     'og:image:height',
    //     'twitter:card',
    //     'twitter:text:title',
    //     'twitter:description',
    //     'twitter:image:src',
    //     'twitter:url'
    //   ],
    // })
    // .addRule('canonicalLinkRule')
  .outputConsole().run()
  

/*
  const response = await fetch(urlStudy)
  const html = await response.text()

  // Load the HTML into cheerio so that it can be parsed. `$` is now a
  // function that can take a CSS selector that targets the HTML elements on
  // the page that you want to scrape.
  const $ = cheerio.load(html)

  $("li a").each((idx, el) => {
    // This wraps up `el` with Cheerio so that we can call the `.text()`
    // method on it.
    const cheeriofied = $(el)

    // Generate the output.
    const output = `${idx + 1}.\t${cheeriofied.text()}`

    // Print the output.
    console.log(output)
  }) */
}

if (!url) {
  console.error('Usage: seo-analyze <url>')
  process.exit(1)
}

main()
