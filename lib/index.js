const path = require('path')
const http = require('http')

const VaxicServer = require(path.join(__dirname, 'VaxicServer.js'))
const staticExtension = require(path.join(__dirname, 'static', 'static.js'))

class Vaxic extends VaxicServer {
	constructor () {
		super()

		this.internalServer = http.createServer(this.serverHandler)
	}

	add (method = 'GET', route, cb) {
		const handler = {
			'target': {
				'method': (typeof method === 'string' ? method : null),
				'url': ((typeof route === 'string' || route instanceof RegExp) ? route : null)
			},
			'handler': (cb || route || method)
		}

		this.handles.push(handler)
	}

	use (extension) {
		this.extensions.push(extension)
	}

	listen (port = 80, host = '0.0.0.0', cb = null) { // [port], [host], [cb]
		this.internalServer.listen(port, host, cb)
	}
}

Vaxic['static'] = staticExtension

module.exports = () => new Vaxic()