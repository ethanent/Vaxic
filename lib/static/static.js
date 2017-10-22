const path = require('path')
const url = require('url')
const fs = require('fs')

const mimes = JSON.parse(fs.readFileSync(path.join(__dirname, 'mimes.json')).toString())

module.exports = (baseDir, indexFile) => {
	if (!baseDir) throw new Error('The required \'baseDir\' argument is missing for Vaxic static extension.')

	indexFile = typeof indexFile === 'string' ? indexFile : 'index.html'

	return (req, res, next) => {
		if (!req.method === 'GET') {
			next()
			return
		}

		let requestedPath = req.url.pathname.replace(/\/.\.\//g, '')

		requestedPath = (/\/$/g.test(requestedPath) ? requestedPath + indexFile : requestedPath)

		const requestedExt = path.extname(requestedPath)
		const filePath = path.join(baseDir, requestedPath)

		fs.stat(filePath, (err, stats) => {
			if (err) {
				next()
			}
			else {
				stats.mtime.setMilliseconds(0)
				if (stats.mtime <= new Date(req.headers['if-modified-since'])) {
					res.writeHead(304)
					res.end()
				} else {
					fs.readFile(filePath, (err, data) => {
						if (err) {
							next()
						}
						else {
							res.endCompressed(data, 200, {
								'Content-Type': (mimes.hasOwnProperty(requestedExt) ? mimes[requestedExt] : 'application/octet-stream'),
								'Last-Modified': stats.mtime.toString()
							})
						}
					})
				}
			}
		})
	}
}