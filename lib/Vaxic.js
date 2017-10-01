const path = require('path')
const http = require('http')
const VaxicServer = require(path.join(__dirname, 'VaxicServer.js'))

class Vaxic extends VaxicServer {
	constructor () {
		super()

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

	use (midhandler) {
		const handler = {
			'type': 'mid',
			'handler': midhandler
		}

		this.handlers.push(handler)
	}

	listen (port, host, cb) {
		this.internalServer.listen(port, host, (cb || null))
	}
}