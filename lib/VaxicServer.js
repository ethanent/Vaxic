const path = require('path')
const url = require('url')
const zlib = require('zlib')
const EventEmitter = require('events')

const acceptParse = require(path.join(__dirname, 'accept-parse.js'))

class VaxicServer extends EventEmitter {
	constructor (rules, extensions) {
		super()

		this.extensions = extensions || []
		this.handles = rules || []

		this.serverHandler = (req, res) => {
			let requestBody = Buffer.allocUnsafe(0)

			req.on('data', (chunk) => {
				requestBody = Buffer.concat([requestBody, chunk])
			})

			req.on('end', () => {
				Object.assign(req, {
					'body': requestBody,
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
								res.endGzip(body, (statusCode || 200), headers, (cb ? () => {
									cb('gzip')
								} : null))
								return
							}
							else if (acceptedEncodings[i] === 'deflate') {
								res.endDeflate(body, (statusCode || 200), headers, (cb ? () => {
									cb('deflate')
								} : null))
								return
							}
						}

						res.writeHead((statusCode || 200), headers)
						res.end(body, cb)
					}
				})

				const requestedPath = req.url.pathname

				let currentRule = 0

				const testNextRule = () => {
					if (this.handles[currentRule]) {
						const activeTarget = this.handles[currentRule].target

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
								if (requestedPath !== activeTarget.url) {
									currentRule++
									testNextRule()
									return
								}
							}
						}

						let handleReturn = this.handles[currentRule].handler(req, res)

						if (handleReturn instanceof Promise) {
							handleReturn.then(() => {}).catch((err) => {
								this.emit('promiseHandleRejection', err)
							})
						}
					}
				}
				
				let currentExtension = 0

				const useNextExtension = () => {
					if (this.extensions[currentExtension]) {
						let extensionReturn = this.extensions[currentExtension](req, res, () => {
							currentExtension++
							useNextExtension()
						})

						if (extensionReturn instanceof Promise) {
							extensionReturn.then(() => {}).catch((err) => {
								this.emit('promiseExtensionRejection', err)
							})
						}
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