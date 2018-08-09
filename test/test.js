const path = require('path')

const w = require('whew')
const p = require('phin').promisified

const Vaxic = require(path.join(__dirname, '..'))

let app = new Vaxic()

app.use((req, res, next) => {
	res.setHeader('Fuel', 'Vaxic-Engine')
	next()
})

app.use((req, res, next) => {
	return new Promise((resolve, reject) => {
		if (req.url.pathname === '/asyncExtension') {
			res.writeHead(200)
			res.end('Ok.')
		}
		else {
			next()
		}

		reject(new Error('Catch this.'))
	})
})

app.add('GET', '/main', (req, res) => {
	res.writeHead(200)
	res.end('hello')
})

app.add('POST', /^\/take\//g, (req, res) => {
	res.writeHead(200)
	res.end('hey')
})

app.add('POST', '/testbody', (req, res) => {
	if (req.body.toString() === 'testing124') {
		res.writeHead(200)
		res.end('Okie dokie.')
	}
	else {
		res.writeHead(400)
		res.end()
	}
})

app.add('GET', '/asyncHandler', (req, res) => {
	return new Promise((resolve, reject) => {
		res.writeHead(200)
		res.end('Ok.')

		reject(new Error('Catch this.'))
	})
})

app.add('/testNotMethodSpecific', (req, res) => {
	res.writeHead(200)
	res.end('Hello!')
})

app.add((req, res) => {
	res.writeHead(404)
	res.end('Error 404: Resource not found!')
})

app.use(Vaxic.static(__dirname))

app.on('promiseExtensionRejection', (err) => {
	console.log('Handled extension handler rejection! (This is good.)')
})

app.on('promiseHandleRejection', (err) => {
	console.log('Handled handle handler rejection! (This is good.)')
})

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

w.add('POST body recieving', (result) => {
	p({
		'url': 'http://localhost:5138/testbody',
		'method': 'POST',
		'data': 'testing124'
	}).then((res) => {
		if (res.statusCode === 200) {
			result(true, 'Server correctly recieved body')
		}
		else {
			result(false, 'Server did not recieve body.')
		}
	}).catch((err) => {
		result(false, err)
	})
})

w.add('Async / Promise handlers', (result) => {
	p({
		'url': 'http://localhost:5138/asyncHandler',
		'method': 'GET',
		'timeout': 800
	}).then((res) => {
		if (res.statusCode === 200) {
			result(true, 'Async handler functioned as expected.')
		}
		else {
			result(false, 'Async handler did not function as expected.')
		}
	}).catch((err) => {
		result(false, err)
	})
})

w.add('Async / Promise extensions', (result) => {
	p({
		'url': 'http://localhost:5138/asyncExtension',
		'method': 'GET',
		'timeout': 800
	}).then((res) => {
		if (res.statusCode === 200) {
			result(true, 'Async extension functioned as expected.')
		}
		else {
			result(false, 'Async extension did not function as expected.')
		}
	}).catch((err) => {
		result(false, err)
	})
})

w.add('Non-method-specific request', (result) => {
	p({
		'url': 'http://localhost:5138/testNotMethodSpecific',
		'method': 'GET',
		'timeout': 800
	}).then((res) => {
		if (res.body.toString() === 'Hello!') {
			result(true, 'Utilized correct handle.')
		}
		else {
			result(false, 'Failed to utilize the correct handle.')
		}
	}).catch((err) => {
		result(false, err)
	})
})

w.add('Catchall handler', (result) => {
	p({
		'url': 'http://localhost:5138/thiswill404',
		'method': 'POST',
		'timeout': 800
	}).then((res) => {
		if (res.statusCode === 404) {
			result(true, 'Utilized correct handle.')
		}
		else {
			result(false, 'Failed to utilize the correct handle.')
		}
	}).catch((err) => {
		result(false, err)
	})
})

app.listen(5138, 'localhost', w.test)