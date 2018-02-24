<p align="center" style="text-align: center;"><img src="https://github.com/ethanent/vaxic/blob/master/media/VaxicLogo.png?raw=true" width="300" alt="vaxic logo"/></p>

---

> The ultra-light superpower Node web framework

[GitHub](https://github.com/ethanent/vaxic) | [NPM](https://www.npmjs.com/package/vaxic)

## Install

```shell
npm install --save vaxic
```

## Basic usage

```javascript
const Vaxic = require('vaxic')

const app = new Vaxic()

app.add('GET', '/getEndpoint', (req, res) => {
	res.writeHead(200)
	res.end('Hello.')
})

app.listen(80, '0.0.0.0')
```

## Extensions

Extensions are super powerful overlays you can add onto your app to add new functionality!

Two built-in extensions exist. One is called `static`. It can be used to serve static files.

```js
app.use(Vaxic.static('/site'))
```

The other built-in extension is called route. It can be used to route requests.

```js
app.use(Vaxic.route)

app.add('POST', async (req, res) => {
	try {
		await res.route({
			'origin': 'http://localhost:5135'
		})
	}
	catch (err) {
		res.writeHead(500)
		res.end('Failed to route!')
	}
})
```

## Handles

Handles are methods you provide to be used as request handlers for specific requests.

You can target them by request method or by URL (or both or neither!)

Creating handles is as easy as...

```js
app.add('POST', (req, res) => {
	// This handle handles all POST requests.

	console.log(req.body)
})
```

### Regular expressions in handles

Regular expressions can be used as handle URL targets!

```js
app.add('GET', /^\/api/, (req, res) => {
	// This handle handles all GET requests to /api and all subpaths of /api!
})
```

## The Request and Response classes, extended

Vaxic `request` and `response` objects passed to handlers extend the `http.ClientRequest` and `http.ServerResponse` objects.

### How Vaxic changes `ClientRequest`

Vaxic adds the `body` property to requests which contain a body. (Ex. POST requests with bodies.)

Vaxic changes the url property of ClientRequest by URL parsing it into a [URL object](https://nodejs.org/api/url.html#url_class_url). (Without its querystring parsed.)

### How Vaxic changes `ServerResponse`

Vaxic adds the endGzip, endDeflate, and endCompressed methods to the `http.ServerResponse` object.

`ServerResponse.endGzip(body, statusCode, ?headers, ?cb)`

`ServerResponse.endDeflate(body, statusCode, ?headers, ?cb)`

`ServerResponse.endCompressed(body, ?statusCode:200, ?headers, ?cb)`

All of the compression methods add the appropriate `content-encoding` header. Use `endCompressed` to autodetect the preferred compression method of the client based on the `accept-encoding` header.

## Using another HTTP server package (such as HTTPS)

If you'd like to use your Vaxic app with another HTTP server such as Node's built-in HTTPS module, you can do so using `app.serverHandler`.

For example:

```javascript
const https = require('https')

https.createServer(app.serverHandler).listen(80)
```

## Creating extensions

Making extensions is easy! Extensions are just methods to which requests are passed before (or instead of) being handed over to handles.

```javascript
(req, res, next) => {
	res.setHeader('Powered-By': 'Vaxic-Engine')
	next()
}
```

Calling `next()` in extension handler methods is important because it allows the request to propagate to the next applicable handler. (An extension or handle.)

## Async / Promise handler methods for handles and extensions

Async or Promise-returning functions may be used as handlers in handles and extensions.

If a promise returned by a Promise-based handler is rejected, the rejection will be caught and a `promiseHandleRejection` (for handles) or a `promiseExtensionRejection` (for extensions) will be emitted with the error from the Vaxic instance.

Ex. for Async handle handlers:

```javascript
app.add('GET', '/async', async function (req, res) {
	// Perform await / other logic if desired and handle request.
})
```

Ex. for async extension handlers:

```javascript
app.use(async function (req, res, next) {
	// Perform await / other logic if desired and handle request.
})
```