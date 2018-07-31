/* globals ALLOWED_ORIGIN, ALWAYS_RETURN_SCORE, CORS_MAXAGE */

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

  let password

  // Return failure indication and error message if shit gets weird somehow
  const bail = (err = new Error(`Something done goofed 💩`), status = 500) =>
    new Response(
      JSON.stringify({
        ok: false,
        message: err.message,
      }),
      {
        headers: theHeaders(true),
        status,
      }
    )

  // Goofy looking utility for our response headers
  const theHeaders = includeContentType => ({
    'access-control-allow-origin': ALLOWED_ORIGIN,
    'access-control-expose-headers': `content-type`,
    'access-control-allow-headers': `content-type`,
    'access-control-max-age': isNumber(CORS_MAXAGE) ? +CORS_MAXAGE : 300,
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
    zxcvbn(password),
    checkForPwnage(password),
  ]).catch(err => err)

  // Array or gtfo!
  if (!Array.isArray(results)) {
    return bail(results)
  }

  let [strength, pwned] = results

  let { score } = strength

  // not sure how this could even happen, but I don't trust me, so we'll validate
  if (!isNumber(score) || !isNumber(pwned)) {
    return bail()
  }

  // always set score to zero if a password is pwned unless configured otherwise
  if (!ALWAYS_RETURN_SCORE && pwned) {
    score = 0
  }

  // The worker has spoken:
  return new Response(JSON.stringify({ ok: true, score, pwned }), {
    headers: theHeaders(true),
  })
}

// Search haveibeenpwned by range using k-anonymity model. Docs for that here:
//    https://haveibeenpwned.com/API/v2#SearchingPwnedPasswordsByRange
async function checkForPwnage(password) {
  // hash the input and... don't arrayify it?
  const hash = await sha1(password)

  // snatch the first 5 characters
  const prefix = hash.slice(0, 5)

  // remaining hash characters
  const suffix = hash.slice(5)

  // range-search haveibeenpwned with the prefix
  const range = await fetch(
    `https://api.pwnedpasswords.com/range/${prefix}`
  ).then(data => data.text());
  
  // split the API results into an array and search for the suffix
  const match = range.split('\r\n').find(r => r.includes(suffix));
  
  // if match is undefined return zero (no pwnage), 
  // otherwise spill the beans on how pwned it is
  return !match ? 0 : +match.slice(36);
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
