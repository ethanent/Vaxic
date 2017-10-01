class VaxicServer {
	constructor (handlers) {
		this.handlers = handlers || []
	}

	serverHandler (req, res) {
		for (let i = 0; i < handlers.length; i++) {
			if (handlers[i].type === 'rule') {
				const rules = handlers[i].target

				if (rules.method ? (rules.method !== req.method) : false) continue

				if (rules.url ? (rules.url instanceof RegExp ? !rules.url.test(req.url) : (res.url.indexOf('*') === res.url.length - 1 ? res.url.indexOf(rules.url) !== 0 : res.url !== rules.url)) : false) continue

				handlers[i].handler(req, res)
			}
			else if (handlers[i].type === 'mid') {
				handlers[i].handler(req, res, () => {
					continue
				})
				break
			}
		}
	}
}

module.exports = VaxicServer