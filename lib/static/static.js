const path = require('path')
const url = require('url')
const fs = require('fs')

const mimes = JSON.parse(fs.readFileSync(path.join(__dirname, 'mimes.json')).toString())

module.exports = (baseDir, indexFile) => {
	if (!baseDir) throw new Error('The required \'baseDir\' argument is missing for Vaxic static extension.')

	indexFile = typeof indexFile === 'string' ? indexFile : 'index.html'

	return (req, res, next) => {
		let requestedPath = req.url.pathname.replace(/\/.\.\//g, '')

		requestedPath = (/\/$/g.test(requestedPath) ? requestedPath + indexFile : requestedPath)

		const requestedExt = path.extname(requestedPath)

		fs.readFile(path.join(baseDir, requestedPath), (err, data) => {
			if (err) {
				next()
			}
			else {
				res.endCompressed(data, 200, {
					'Content-Type': (mimes.hasOwnProperty(requestedExt) ? mimes[requestedExt] : 'application/octet-stream')
				})
			}
		})
	}
}