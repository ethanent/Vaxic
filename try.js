const Vaxic = require('./')

let app = new Vaxic()

app.use(Vaxic.static(__dirname))

app.add((req, res) => {
	console.log(req.url.pathname + ' bye')
	res.endCompressed('hey', 404)
})

app.listen(80, () => {
	console.log('Listening.')
})