const path = require('path')

const w = require('whew')
const p = require('phin').promisified

const Vaxic = require(path.join(__dirname, '..'))

let app = new Vaxic()

app.use((req, res, next) => {
	res.setHeader('Fuel', 'Vaxic-Engine')
	next()
})

app.add('GET', '/main', (req, res) => {
	res.writeHead(200)
	res.end('hello')
})

app.add('POST', /^\/take\//g, (req, res) => {
	res.writeHead(200)
	res.end('hey')
})

app.use(Vaxic.static(__dirname))

w.add('Extensions changing request and response objects', (result) => {
	p({
		'url': 'http://localhost:5138/main',
		'method': 'GET',
		'timeout': 500
	}).then((res) => {
		if (res.headers['fuel'] === 'Vaxic-Engine') {
			result(true, 'Got correct header at client.')
		}
		else {
			result(false, 'Did not get correct header at client.')
		}
	}).catch((err) => {
		result(false, err)
	})
})

w.add('Catchall URL definitions in handles', (result) => {
	p({
		'url': 'http://localhost:5138/take/this',
		'method': 'POST',
		'timeout': 500
	}).then((res) => {
		result((res.statusCode === 200), 'Correct handle assigned to request.')
	}).catch((err) => {
		result(false, 'Incorrect handler assigned to request. ' + err)
	})
})

w.add('Vaxic static serves files properly', (result) => {
	p({
		'url': 'http://localhost:5138/test.js',
		'method': 'GET',
		'timeout': 400
	}).then((res) => {
		if (res.statusCode === 200 && res.body.toString().indexOf('my-test-code726483') !== -1) {
			result(true, 'Got own file.')
		}
		else {
			result(false, 'Didn\'t recieve expected response.')
		}
	}).catch((err) => {
		result(false, err)
	})
})

w.add('No handler by default for unhandled requests', (result) => {
	p({
		'url': 'http://localhost:5138/donothandle',
		'method': 'GET',
		'timeout': 400
	}).then((res) => {
		result(false, 'Recieved response to (should-be) unhandled request.')
	}).catch((err) => {
		result(true, 'Response was not recieved for request without corresponding handler.')
	})
})

app.listen(5138, 'localhost', w.test)