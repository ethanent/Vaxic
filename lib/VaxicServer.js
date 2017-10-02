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
					'endGzip': (body, statusCode, headers, cb) => {
						zlib.gzip((body instanceof Buffer ? body : Buffer.from(body)), (err, data) => {
							if (err) {
								res.writeHead(statusCode, (headers || {}))
								res.end(data)
							}
							else {
								if (statusCode) res.writeHead(statusCode, Object.assign((headers || {}), {'content-encoding': 'gzip'}))
								res.end(data, cb)
							}
						})
					},
					'endDeflate': (body, statusCode, headers, cb) => {
						zlib.deflate((body instanceof Buffer ? body : Buffer.from(body)), (err, data) => {
							if (err) {
								res.writeHead(statusCode, (headers || {}))
								res.end(data)
							}
							else {
								if (statusCode) res.writeHead(statusCode, Object.assign((headers || {}), {'content-encoding': 'deflate'}))
								res.end(data, cb)
							}
						})
					},
					'endCompressed': (body, statusCode, headers, cb) => { // (body, [statusCode], [headers], [cb])
						const acceptedEncodings = acceptParse((req.headers['accept-encoding'] || null))

						for (let i = 0; i < acceptedEncodings.length; i++) {
							if (acceptedEncodings[i] === 'gzip') {
								res.endGzip(body, statusCode, headers, (cb ? () => {
									cb('gzip')
								} : null))
								return
							}
							else if (acceptedEncodings[i] === 'deflate') {
								res.endDeflate(body, statusCode, headers, (cb ? () => {
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
						this.extensions[currentExtension](req, res, () => {
							currentExtension++
							useNextExtension()
						})
					}
					else {
						testNextRule()
					}
				}

				useNextExtension()
			})
		}
	}
}

module.exports = VaxicServer