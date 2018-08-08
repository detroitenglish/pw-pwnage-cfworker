require('dotenv').config({ path: __dirname + '/../cloudflare.env' })
const axios = require('axios')
const fs = require('fs')
const esprima = require('esprima')

const { AUTH_EMAIL, AUTH_KEY, ZONE_ID } = process.env
;(async function init() {
  const script = fs
    .readFileSync(__dirname + '/../dist/index.js', 'utf8')
    .toString()

  console.info(`Script is valid JS? ${isValidJS(script)}`)

  const result = await axios({
    method: `PUT`,
    url: `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/workers/script`,
    headers: {
      'content-type': `application/javascript`,
      'x-auth-email': AUTH_EMAIL,
      'x-auth-key': AUTH_KEY,
    },
    data: Buffer.from(script),
  }).catch(err => {
    console.error(JSON.stringify(err.data, null, 2))
    console.error(err.message)
    return process.exit(1)
  })
  if (result.data.success) {
    return console.info(`Worker upload successful 🚀`)
  } else {
    console.error(JSON.stringify(result.data, null, 2))
    return console.error(`Worker upload failed! 💩`)
  }
})()

function isValidJS(str) {
  let isValid
  try {
    esprima.parseScript(str)
    isValid = true
  } catch (err) {
    console.error(err)
    isValid = false
  }
  return isValid
}
