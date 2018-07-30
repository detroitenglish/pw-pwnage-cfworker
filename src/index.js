/* globals ALLOWED_ORIGIN, ALWAYS_RETURN_SCORE, CORS_MAXAGE */

// this +400kb beast of a library is why we'll let webpack build our worker script
const zxcvbn = require(`zxcvbn`)

// Release the hounds!
addEventListener(`fetch`, event => {
  event.respondWith(judgePassword(event.request))
})

/*
 "I will judge him with plague and bloodshed.
  I will rain down on him, his troops
  and the many peoples who are with him a torrential downpour,
  hailstones, fire, and brimstone."
    - Ezekiel 38:22
 */
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

async function checkForPwnage(password) {
  // hash the input and... arrayify it
  const hash = Array.from(await sha1(password))

  // snatch the first 5 characters
  const prefix = hash.splice(0, 5).join(``)

  // remaining hash characters back to string
  const suffix = hash.join(``)

  // range-search haveibeenpwned with the prefix
  const range = await fetch(
    `https://api.pwnedpasswords.com/range/${prefix}`
  ).then(data => data.text())

  // use regex to find the suffix and capture the number of matching breached accounts
  const reg = RegExp(`${suffix}:(?<pwned>\\d{1,})\\D`)

  // find our suffix in the gnarly haveibeenpwned monstrosity of a response
  const result = reg.exec(range)

  // not pwned - we're good to go
  if (!result) return 0

  // aw snap :( password has been pwned
  return +result.groups.pwned
}

// at least I didn't publish this function to npm...
function isNumber(val) {
  return Number.isSafeInteger(+val)
}

async function sha1(str) {
  const buffer = new TextEncoder(`utf-8`).encode(str)
  return await crypto.subtle.digest(`SHA-1`, buffer).then(hexify)
}

// definitlely did not copy and paste this from StackOverflow.
function hexify(buffer) {
  var hexCodes = []
  var view = new DataView(buffer)
  for (var i = 0; i < view.byteLength; i += 4) {
    var value = view.getUint32(i)
    var stringValue = value.toString(16)
    var padding = `00000000`
    var paddedValue = (padding + stringValue).slice(-padding.length)
    hexCodes.push(paddedValue)
  }
  return hexCodes.join(``).toUpperCase()
} // jk I totally copy and pasted this from StackOverflow 💩
