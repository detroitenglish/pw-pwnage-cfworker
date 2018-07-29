require('dotenv').config({ path: __dirname + '/../cloudflare.env' })
const axios = require('axios')
const fs = require('fs')

const { AUTH_EMAIL, AUTH_KEY, ZONE_ID, ROUTE_PATTERN } = process.env // eslint-disable-line
;(async function init() {
  const script = fs.readFileSync(__dirname + '/../dist/index.js', 'utf8')
  await axios({
    method: `PUT`,
    url: `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/workers/script`,
    headers: {
      'content-type': `application/javascript`,
      'x-auth-email': AUTH_EMAIL,
      'x-auth-key': AUTH_KEY,
    },
    data: script,
  }).catch(err => {
    console.error(err.message)
    return process.exit(1)
  })
  console.info(`Worker upload successful 🚀`)
})()
