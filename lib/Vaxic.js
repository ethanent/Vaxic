const path = require('path')
const http = require('http')

const VaxicServer = require(path.join(__dirname, 'VaxicServer.js'))
const staticExtension = require(path.join(__dirname, 'static.js'))

class Vaxic extends VaxicServer {
	constructor () {
		this.internalServer = http.createServer(this.serverHandler)
	}

	add (a1, a2, a3) {
		const handler = {
			'type': 'rule',
			'target': {
				'method': (a3 ? a1 : null),
				'url': (a3 ? a2 : a1),
			},
			'handler': (a3 || a2)
		}

		this.handlers.push(handler)
	}

	use (extension) {
		const handler = {
			'type': 'extension',
			'handler': extension
		}

		this.handlers.push(handler)
	}

	listen (port, host, cb) {
		this.internalServer.listen(port, host, (cb || null))
	}
}

Vaxic['static'] = staticExtension

module.exports = Vaxic