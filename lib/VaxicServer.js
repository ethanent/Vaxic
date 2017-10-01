const path = require('path')
const url = require('url')
const zlib = require('zlib')

const lightcookie = require('lightcookie')

const acceptParse = require(path.join(__dirname, 'accept-parse.js'))

class VaxicServer {
	constructor (rules, extensions) {
		this.extensions = extensions || []
		this.catches = rules || []

		this.serverHandler = (req, res) => {
			let requestBody = Buffer.allocUnsafe(0)

			req.on('data', (chunk) => {
				requestBody = Buffer.concat(body, chunk)
			})

			req.on('end', () => {
				Object.assign(req, {
					'body': requestBody,
					'cookie': (req.headers.cookie ? lightcookie.parse(req.headers.cookie) : null),
					'url': url.parse(req.url)
				})

				Object.assign(res, {
					'endGzip': (body, headers, statusCode, cb) => {
						zlib.gzip((body instanceof Buffer ? body : Buffer.from(body)), (err, data) => {
							if (err) {
								res.end(data)
							}
							else {
								if (statusCode) res.writeHead(statusCode, Object.assign((headers | {}), {'content-encoding': 'gzip'}))
								res.end(data, cb)
							}
						})
					},
					'endDeflate': (body, headers, statusCode, cb) => {
						zlib.deflate((body instanceof Buffer ? body : Buffer.from(body)), (err, data) => {
							if (err) {
								res.end(data)
							}
							else {
								if (statusCode) res.writeHead(statusCode, Object.assign((headers || {}), {'content-encoding': 'deflate'}))
								res.end(data, cb)
							}
						})
					},
					'endCompressed': (body, statusCode, headers, cb) => {
						const acceptedEncodings = acceptParse((req.headers['accept-encoding'] || null))

						for (let i = 0; i < acceptedEncodings.length; i++) {
							if (acceptedEncodings[i] === 'gzip') {
								res.endGzip(body, headers, statusCode, (cb ? () => {
									cb('gzip')
								} : null))
								return
							}
							else if (acceptedEncodings[i] === 'deflate') {
								res.endDeflate(body, headers, statusCode, (cb ? () => {
									cb('deflate')
								} : null))
								return
							}
						}

						res.end(body, (cb ? () => {
							cb(null)
						} : null))
					}
				})

				const requestedPath = req.url.pathname

				let currentRule = 0

				const testNextRule = () => {
					if (this.catches[currentRule]) {
						const activeTarget = this.catches[currentRule].target

						if (activeTarget.method ? (activeTarget.method !== req.method) : false) {
							currentRule++
							testNextRule()
							return
						}

						if (activeTarget.url) {
							if (activeTarget.url instanceof RegExp) {
								if (!activeTarget.url.test(requestedPath)) {
									currentRule++
									testNextRule()
									return
								}
							}
							else {
								if (activeTarget.url.indexOf('*') === activeTarget.url.length - 1) {
									if (requestedPath.indexOf(activeTarget.url) !== 0) {
										currentRule++
										testNextRule()
										return
									}
								}
								else {
									if (requestedPath !== activeTarget.url) {
										currentRule++
										testNextRule()
										return
									}
								}
							}
						}

						this.catches[currentRule].handler(req, res)
					}
				}
				
				let currentExtension = 0

				const useNextExtension = () => {
					if (this.extensions[currentExtension]) {
						this.extensions[currentExtension].handler(req, res, () => {
							useNextExtension()
						})

						currentExtension++
					}
					else {
						testNextRule()
					}
				}

				useNextExtension()

				/*for (let i = 0; i < handlers.length; i++) {
					const requestedPath = req.url.pathname

					if (handlers[i].type === 'rule') {
						const rules = handlers[i].target

						if (rules.method ? (rules.method !== req.method) : false) continue

						if (rules.url) {
							if (rules.url instanceof RegExp) {
								if (!rules.url.test(requestedPath)) {
									continue
								}
							}
							else {
								if (rules.url.indexOf('*') === rules.url.length - 1) {
									if (requestedPath.indexOf(rules.url) !== 0) {
										continue
									}
								}
								else {
									if (requestedPath !== rules.url) {
										continue
									}
								}
							}
						}

						handlers[i].handler(req, res)
					}
					else if (handlers[i].type === 'extension') {
						handlers[i].handler(req, res, function () {
							continue
						})
						break
					}
				}*/
			})
		}
	}
}

module.exports = VaxicServer