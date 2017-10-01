const path = require('path')
const http = require('http')

const VaxicServer = require(path.join(__dirname, 'VaxicServer.js'))
const staticExtension = require(path.join(__dirname, 'static.js'))

class Vaxic extends VaxicServer {
	constructor () {
		super()

		this.internalServer = http.createServer(this.serverHandler)
	}

	add (a1, a2, a3) {
		const handler = {
			'target': {
				'method': (a3 ? a1 : null),
				'url': (a3 ? a2 : (typeof a1 === 'string' ? a1 : null)),
			},
			'handler': (a3 || a2 || a1)
		}

		this.catches.push(handler)
	}

	use (extension) {
		const handler = {
			'handler': extension
		}

		this.extensions.push(handler)
	}

	listen (a1, a2, a3) { // [port], [host], [cb]
		this.internalServer.listen((typeof a1 === 'number' ? a1 : 80), (typeof a2 === 'string' ? a2 : '0.0.0.0'), (a3 || (typeof a2 === 'function' ? a2 : null)))
	}
}

Vaxic['static'] = staticExtension

module.exports = Vaxic