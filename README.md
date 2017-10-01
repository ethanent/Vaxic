<p align="center" style="text-align: center;"><img src="https://raw.githubusercontent.com/ethanent/phin/master/media/phin-textIncluded.png" width="250" alt="vaxic logo"/></p>

---

> The ultra-light superpower Node web framework

[Full documentation](https://ethanent.github.io/vaxic/) | [GitHub](https://github.com/ethanent/vaxic) | [NPM](https://www.npmjs.com/package/vaxic)

## Install

```shell
npm install --save vaxic
```

## Basic usage

```javascript
const Vaxic = require('vaxic')

const app = new Vaxic()

app.add('GET', '/getEndpoint', (req, res) => {
	res.writeHead(200)
	res.end('Hello.')
})
```

