/* globals ALLOWED_ORIGIN, ALLOWED_ORIGIN_PATTERNS, ALWAYS_RETURN_SCORE, CORS_MAXAGE, LAST_MODIFIED, CUSTOM_PW_DICT, RETURN_PW_METADATA  */

// this +400kb beast of a library is why we'll let webpack build our worker script
const zxcvbn = require(`zxcvbn`)

// Release the hounds!
addEventListener(`fetch`, event => {
  event.respondWith(judgePassword(event.request))
})

// Rain down the judgement...
async function judgePassword(request) {
  // Ignore any other request methods
  if (!/POST|GET|OPTIONS/.test(request.method)) return await fetch(request)

  let password, metadata

  // set default origin for CORS
  let allowOrigin = ALLOWED_ORIGIN

  let customDict = []

  // origin of incoming request
  const origin = request.headers.get('origin')

  // const originPatterns = []

  if (ALLOWED_ORIGIN_PATTERNS.length) {
    // create array of regex patterns to test origin
    const originPatterns = ALLOWED_ORIGIN_PATTERNS.split(',').map(pattern =>
      RegExp(pattern)
    )
    // test request origin against allowed patters
    if (originPatterns.some(pattern => pattern.test(origin))) {
      // if there's a match, return request origin as allowed
      // if not, allowed origin falls back to ALLOWED_ORIGIN (or default '*')
      allowOrigin = origin
    }
  }

  if (CUSTOM_PW_DICT.length) {
    customDict.push(...CUSTOM_PW_DICT.split(','))
  }

  // Return failure indication and error message if shit gets weird somehow
  function bail(err = new Error(`Something done goofed 💩`), status = 500) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: err.message,
      }),
      {
        headers: theHeaders(true),
        status,
      }
    )
  }

  // Goofy looking utility for our response headers
  const theHeaders = includeContentType => ({
    'access-control-allow-origin': allowOrigin,
    'access-control-expose-headers': `content-type`,
    'access-control-allow-headers': `content-type`,
    'access-control-max-age': isNumber(CORS_MAXAGE) ? +CORS_MAXAGE : 300,
    'x-worker-last-modified': LAST_MODIFIED,
    'content-type': includeContentType ? `application/json` : void 0,
  })

  // Unless it's a POST, we're done here...
  if (request.method !== `POST`) {
    return new Response(void 0, {
      headers: theHeaders(),
      status: 204,
    })
  }

  try {
    password = await request.json().then(body => body.password)
    if (!password) {
      throw new Error(`JSON body must include the field 'password'`)
    }
    if (!password.length) {
      throw new Error(`Input must include 1 or more characters`)
    }
  } catch (err) {
    return bail(err, 400)
  }

  // run strength estimation and range query in parallel because why not
  let results = await Promise.all([
    zxcvbn(password, customDict),
    checkForPwnage(password),
  ]).catch(err => err)

  // Array or gtfo!
  if (!Array.isArray(results)) {
    return bail(results)
  }

  let [strength, pwned] = results

  let { score } = strength

  if (RETURN_PW_METADATA) metadata = strength
  // not sure how this could even happen, but I don't trust me, so we'll validate
  if (!isNumber(score) || !isNumber(pwned)) {
    return bail()
  }

  // always set score to zero if a password is pwned unless configured otherwise
  if (!ALWAYS_RETURN_SCORE && pwned) {
    score = 0
  }

  // The worker has spoken:
  return new Response(JSON.stringify({ ok: true, score, pwned, metadata }), {
    headers: theHeaders(true),
  })
}

// Search haveibeenpwned by range using k-anonymity model. Docs for that here:
//    https://haveibeenpwned.com/API/v2#SearchingPwnedPasswordsByRange
async function checkForPwnage(password) {
  // hash the input
  const hash = await sha1(password)

  // snatch the first 5 characters
  const prefix = hash.slice(0, 5)

  // remaining hash characters
  const suffix = hash.slice(5)

  // range-search haveibeenpwned with the prefix
  const range = await fetch(
    `https://api.pwnedpasswords.com/range/${prefix}`
  ).then(data => data.text())

  // if the suffix nowhere in response, there's no pwnage
  if (!range.includes(suffix)) {
    return 0
  }

  // split the API results into an array and search for the suffix
  const match = range.split('\r\n').find(r => r.includes(suffix))

  // return number of pwned password matches
  return +match.split(':').pop()
}

function isNumber(val) {
  return Number.isSafeInteger(+val)
}

async function sha1(str) {
  const buffer = new TextEncoder(`utf-8`).encode(str)
  return await crypto.subtle.digest(`SHA-1`, buffer).then(hexify)
}

function hexify(buffer) {
  let hexCodes = ''
  const view = new DataView(buffer)
  for (let i = 0; i < view.byteLength; i += 4) {
    hexCodes += view
      .getUint32(i)
      .toString(16)
      .padStart(8, '0')
  }
  return hexCodes.toUpperCase()
}
