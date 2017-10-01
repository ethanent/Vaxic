const path = require('path')
const url = require('url')
const fs = require('fs')

module.exports = (baseDir) => {
	if (!baseDir) throw new Error('The required \'baseDir\' argument is missing for Vaxic static extension.')

	return (req, res, next) => {
		const requestedPath = req.url.pathname.replace(\/.\.\//g, '')

		requestedPath = (requestedPath.test(/\/$/g) ? requestedPath + 'index.html' : requestedPath)

		fs.readFile(path.join(baseDir, requestedPath), (err, data) => {
			if (err) {
				console.error(err)
				next()
			}
			else {
				res.writeHead(200)
				res.endCompressed(data)
			}
		})
	}
}