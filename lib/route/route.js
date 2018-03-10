const url = require('url')
const p = require('phin').promisified

module.exports = (req, res, next) => {
	res['route'] = async (opts) => {
		if (!opts) throw new Error('Missing opts property.')
		if (!opts.hasOwnProperty('origin') && !opts.hasOwnProperty('url')) throw new Error('Missing origin or url property for route options.')

		let newHeaders = req.headers

		if (newHeaders.hasOwnProperty('host')) newHeaders.host = url.parse(opts.origin).host

		try {
			let forwardRes = await p(Object.assign({
				'method': req.method,
				'headers': newHeaders,
				'url': new url.URL(req.url.pathname, opts.origin).toString()
			}, req.body ? {
				'data': req.body
			} : {}, opts, {
				'stream': true
			}))

			res.writeHead(forwardRes.statusCode, forwardRes.headers)
			forwardRes.stream.on('data', (chunk) => res.write(chunk))
			forwardRes.stream.on('end', () => res.end())
		}
		catch (err) {
			throw err
		}
	}

	next()
}