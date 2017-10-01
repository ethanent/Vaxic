const Vaxic = require('./')

let app = new Vaxic()

app.use(Vaxic.static(__dirname))

app.listen(80, () => {
	console.log('Listening.')
})