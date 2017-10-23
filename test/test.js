const path = require('path')

const useAsync = !(process.version.indexOf('v6') === 0)

const w = require('whew')
const p = require('phin').promisified

const Vaxic = require(path.join(__dirname, '..'))

let app = new Vaxic()

app.use((req, res, next) => {
	res.setHeader('Fuel', 'Vaxic-Engine')
	next()
})

if (useAsync) {
	app.use(async function (req, res, next) {
		if (req.url.pathname === '/asyncExtension') {
			res.writeHead(200)
			res.end('Ok.')
		}
		else {
			next()
		}

		throw new Error('Catch this.')
	})
}

app.add('GET', '/main', (req, res) => {
	res.writeHead(200)
	res.end('hello')
})

app.add('POST', /^\/take\//g, (req, res) => {
	res.writeHead(200)
	res.end('hey')
})

app.add('GET', '/parsecookie', (req, res) => {
	let cookie = req.cookie
	if (cookie.hey === 'hi') {
		res.writeHead(200)
		res.end('Recieved correct cookie data. hey=' + cookie.hey)
	}
	else {
		res.writeHead(500)
		res.end('Did not recieve correct cookie data. ' + req.cookie)
	}
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

if (useAsync) {
	app.add('GET', '/asyncHandler', async function (req, res) {
		res.writeHead(200)
		res.end('Ok.')

		throw new Error('Catch this.')
	})
}

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

w.add('Cookie parsing', (result) => {
	p({
		'url': 'http://localhost:5138/parsecookie',
		'method': 'GET',
		'headers': {
			'cookie': 'HttpOnly;hey=hi;hello=hi;test=vaxic'
		}
	}).then((res) => {
		if (res.statusCode === 200) {
			result(true, res.body)
		}
		else {
			result(false, res.body)
		}
	}).catch((err) => {
		result(false, err)
	})
})

if (useAsync) {
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
}

app.listen(5138, 'localhost', w.test)