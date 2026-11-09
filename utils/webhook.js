function webhook(url, body) {
	fetch(url, {
		method  : "POST",
		headers : { "Content-Type": "application/json" },
		body    : JSON.stringify(body),
	})
		.then(response => response.text())
		.catch(err => console.error(err));
}

module.exports = webhook;