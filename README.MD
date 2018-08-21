# Enlist a Cloudflare Worker as your Secure Password Scoring and Pwnage Protection API

(Prefer serverless? [See the AWS Lambda version here](https://github.com/detroitenglish/haveibeenpwned-zxcvbn-lambda-api))

Deploy a private, secure and serverless RESTful endpoint for sanely scoring users' new passwords using Dropbox's [`zxcvbn`](https://github.com/dropbox/zxcvbn) library while (k-)anonymously querying Troy Hunt's [`haveibeenpwned`](https://haveibeenpwned.com/) collection of +5.1 *billion* breached accounts.

![API in Action](.github/pwnage.gif?raw=true "API in Action")

&nbsp;&nbsp;&nbsp;&nbsp;*Example: handling results with [VuetifyJS](https://github.com/vuetifyjs/vuetify)*
<br>
<br>
## Motivation
<a href="https://twitter.com/DetroitEnglish/status/1008276231199055874" target="_blank">People seemed to think this concept was neat</a>, and a tiny RESTful API like this is a perfect use case for a mighty little [**Cloudflare Worker**](https://developers.cloudflare.com/workers/).

As a bonus, [over 90%](https://twitter.com/troyhunt/status/1011871596603060225) of `pwnedpassword` queries are already cached on and served from Cloudflare's edge, making our response times _spooky_ fast! 👻


---

## Quick Start

1. Rename `example.cloudflare.env` to `cloudflare.env` and edit the configuration as needed.
2. Install deps with `npm install`
3. Launch 🚀 with `npm run deploy`

### Configuration

The following options are configurable via `cloudflare.env`:

- `ROUTE_PATTERN`: Optionally include a route-matching pattern for your worker. Note that this will disable any other enabled patterns that (default: `undefined`)

- `ALLOWED_ORIGIN`: Whitelisted origin for Cross Origin Resource Sharing. If not provided, all origins are allowed (default: `*`)

- `ALLOWED_ORIGIN_PATTERNS`: Comma-seperated list of strings to be converted to `RegExp` patterns for testing the incoming request origin. If the origin matches, it's returned as allowed. If no pattern is matched, CORS falls back to the configured `ALLOWED_ORIGIN` (default: `undefined`)
    - Example: `"(foo|bar|buzz)\.example\.lol,yet\.another\.example\.omg"`

- `CORS_MAXAGE`: Value in seconds for the `Access-Control-Max-Age` CORS header (default: `"300"`)

- `ALWAYS_RETURN_SCORE`: Return the `zxcvbn` score even if the `pwnedpasswords` match value is > 0. See [Response](#Response) for details (default: `undefined`, thereby `false`)

- `CUSTOM_PW_DICT`: Comma-seperated list of words/phrases to be included in the `zxcvbn` strength estimation dictionary. It's a good idea to include e.g. your company or application name here (default: `''`)

- `RETURN_PW_METADATA`: Return the full result of the `zxcvbn` strength estimation as a `metadata` response key. Refer to the [zxcvbn documentation](https://github.com/dropbox/zxcvbn#usage) for details on what that includes (default: `undefined`, thereby `false`)

### Updating

Update configuration à la changes to `cloudflare.env` by re-running `npm run deploy`.

**NOTE**: For reasons unknown, the Cloudflare Dash may continue to show older scripts after a successful upload. Check the `x-worker-last-modified` response header to verify that your latest script is up and running.

### Request

POST user password input to your route as JSON with field `password` like so:

```javascript
// pwned password
{
  "password": "monkey123"
}
```
```javascript
// stronger password
{
  "password": "wonderful waffles"
}
```

### Response

Our little worker-bro will reply with an appropriate status code, and JSON body with `ok` indicating successful scoring and range search, a strength estimation `score` of 0 through 4 per `zxcvbn`, and `pwned` matches, indicating the number times the input appears in the `haveibeenpwned` database.

```javascript
// pwned password 'monkey123'
{
    "ok": true,
    "score": 0,
    "pwned": 56491
}
```
```javascript
// stronger password 'wonderful waffles'
{
    "ok": true,
    "score": 3,
    "pwned": 0
}
```
By default, if `pwned` is greater than 0, then `score` will **always** be 0. You can override this behavior by settings `"ALWAYS_RETURN_SCORE"` to `true` in `cloudflare.env`

If `RETURN_PW_METADATA` is truthy, responses will also include a `metadata` key with the complete `zxcvbn` [strength estimation result object](https://github.com/dropbox/zxcvbn#usage).

Each response will also contain a `x-worker-last-modified` header with a timestamp indicating when the script was built and deployed.

#### Errors

Failure will return JSON to inform you that something's not `ok` and a `message` as to why.

```json
{
    "ok": false,
    "message": "It went kaput 💩"
}
```

### Good to Know
Send a `GET` request to act as a little health-check. Response `204` means you're good to go. Useful for testing CORS configuration 👍


## Because Software

### Disclaimer
I am not affiliated with Cloudflare, Troy Hunt, Dropbox, haveibeenpwned, good software development in general, or any combination thereof.

Handling user passwords is no laughing matter, so handle them with care and respect.

Just like your own users, assume that I have no idea what I'm doing. This part is important, because I have no idea what I'm doing.

**REVIEW THE SOURCE**, and use at your own risk 🙈

### License
MIT
