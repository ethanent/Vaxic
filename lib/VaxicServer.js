const path = require('path')
const url = require('url')
const zlib = require('zlib')

const lightcookie = require('lightcookie')

const acceptParse = require(path.join(__dirname, 'accept-parse.js'))

class VaxicServer {
	constructor (handlers) {
		this.handlers = handlers || []
	}

	serverHandler (req, res) {
		let requestBody = Buffer.allocUnsafe(0)

		defaultReq.on('data', (chunk) => {
			requestBody = Buffer.concat(body, chunk)
		})

		defaultReq.on('end', () => {
			Object.assign(req, {
				'body': requestBody,
				'cookie': (req.headers.cookie ? lightcookie.parse(req.headers.cookie) : null),
				'url': url.parse(req.url)
			})

			Object.assign(res, {
				'endGzip': (body, cb) => {
					zlib.gzip((body instanceof Buffer ? body : Buffer.from(body)), (data) => {
						res.end(data, cb)
					})
				},
				'endDeflate': (body, cb) => {
					zlib.deflate((body instanceof Buffer ? body : Buffer.from(body)), (data) => {
						res.end(data, cb)
					})
				},
				'endCompressed': (body, cb) => {
					const acceptedEncodings = acceptParse((req.headers['accept-encoding'] || null))

					for (let i = 0; i < acceptedEncodings.length; i++) {
						if (acceptedEncodings[i] === 'gzip') {
							res.endGzip(body, (cb ? () => {
								cb('gzip')
							} : null))
							return
						}
						else if (acceptedEncodings[i] === 'deflate') {
							res.endDeflate(body, (cb ? () => {
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

			const useNextRule = () => {
				
			}

			for (let i = 0; i < handlers.length; i++) {
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
			}
		})
	}
}

module.exports = VaxicServer