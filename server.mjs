import express from 'express'

const app = express()

app.get('/', (req, res) => {
  res.send('Welcome to the SEO Analysis from Toolkit by Dotjock.com')
})

app.listen(3000, () => {
  console.log('Server started on port 3000')
})
