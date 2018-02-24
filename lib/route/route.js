const url = require('url')
const p = require('phin').promisified

module.exports = (req, res, next) => {
	res['route'] = async (opts) => {
		if (!opts.hasOwnProperty('host') && !opts.hasOwnProperty('url')) throw new Error('Missing host or url property for route options.')

		let newHeaders = req.headers

		if (newHeaders.hasOwnProperty('host')) newHeaders.host = opts.host

		try {
			let forwardRes = await p(Object.assign({
				'method': req.method,
				'headers': newHeaders,
				'url': new url.URL(req.path, opts.host)
			}, opts, {
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