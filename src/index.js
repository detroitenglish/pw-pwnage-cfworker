/* globals ALLOWED_ORIGIN, ALWAYS_RETURN_SCORE, CORS_MAXAGE */

const zxcvbn = require(`zxcvbn`)

const contentType = { 'content-type': `application/json` }

addEventListener(`fetch`, event => {
  event.respondWith(judgePassword(event.request))
})

async function judgePassword(request) {
  if (!/POST|GET|OPTIONS/.test(request.method)) return await fetch(request)

  const bail = (err = {}) =>
    new Response(
      JSON.stringify({
        ok: false,
        message: err.message || `Something done goofed 💩`,
      }),
      {
        headers: { ...headers, ...contentType },
        statusCode: 500,
      }
    )

  const headers = {
    'access-control-allow-origin': ALLOWED_ORIGIN,
    'access-control-expose-headers': `content-type`,
    'access-control-allow-headers': `content-type`,
    'access-control-max-age': isNumber(CORS_MAXAGE) ? +CORS_MAXAGE : 300,
  }

  if (request.method !== `POST`) {
    return new Response(void 0, {
      headers,
      status: 204,
    })
  }

  let password
  try {
    password = await request.json().then(body => body.password)
  } catch (err) {
    return bail(err)
  }

  let results = await Promise.all([
    zxcvbn(password),
    checkForPwnage(password),
  ]).catch(err => [err, void 0])

  if (results instanceof Error) {
    return bail(results)
  }

  let [strength, pwned] = results

  let { score } = strength

  if (!isNumber(score) || !isNumber(pwned)) return bail()

  if (!ALWAYS_RETURN_SCORE && pwned) score = 0

  return new Response(JSON.stringify({ ok: true, score, pwned }), {
    headers: { ...headers, ...contentType },
  })
}

async function checkForPwnage(password) {
  const hash = Array.from(await sha1(password))

  const prefix = hash.splice(0, 5).join('')

  const suffix = hash.join('')

  const range = await fetch(
    `https://api.pwnedpasswords.com/range/${prefix}`
  ).then(data => data.text())

  const reg = RegExp(`${suffix}:(?<pwned>\\d{1,10})\\D`)

  const result = reg.exec(range)

  if (!result) return 0

  return +result.groups.pwned
}

function isNumber(val) {
  return Number.isSafeInteger(+val)
}

async function sha1(str) {
  const buffer = new TextEncoder(`utf-8`).encode(str)
  return await crypto.subtle.digest(`SHA-1`, buffer).then(hexify)
}

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
}
