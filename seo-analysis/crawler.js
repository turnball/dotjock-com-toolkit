// npm install axios cheerio 
const axios = require('axios')

// specify the URL of the site to crawl
const url = process.argv[2]
const targetUrl = url

// define a crawler function
const crawler = async () => {
    try {
        // request the target website
      const response = await axios.get(targetUrl)
      console.log(`Fetched ${targetUrl} - Status: ${response.status}`)
    } catch (error) {
        // handle any error that occurs during the HTTP request
        console.error(`Error fetching ${targetUrl}: ${error.message}`)
    }
}
