const path = require('path')
const url = require('url')
const fs = require('fs')

module.exports = (baseDir) => {
	if (!baseDir) throw new Error('The required \'baseDir\' argument is missing for Vaxic static extension.')

	return (req, res, next) => {
		let requestedPath = req.url.pathname.replace(/\/.\.\//g, '')

		requestedPath = (/\/$/g.test(requestedPath) ? requestedPath + 'index.html' : requestedPath)

		fs.readFile(path.join(baseDir, requestedPath), (err, data) => {
			if (err) {
				next()
			}
			else {
				res.endCompressed(data, 200)
			}
		})
	}
}