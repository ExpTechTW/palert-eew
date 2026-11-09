const global_data = require("../../global");

const moment = require("moment-timezone");

const WebSocket = require("ws");

let ws;
let ntp = 0;

function connectWS() {
	if (ws) ws.close();
	ws = null;
	ws = new WebSocket(process.env.PALERT_WS_URL);

	ws.onopen = () => {
		ws.send(JSON.stringify({ type: "subscribe", data: "station" }));
		console.log("WebSocket 已連線");
	};

	ws.onmessage = (event) => {
		try {
			const data = JSON.parse(event.data.toString());
			ntp = Date.now();
			if (data.type === "station")
				void 0;
			else if (data.type === "PGA")
				global_data.events.emit("data", {
					data : data.data.dataVals,
					time : moment(data.data.timestamp).tz("Asia/Taipei").valueOf(),
				});

		} catch (error) {
			console.error("處理 WebSocket 訊息時發生錯誤：", error);
		}
	};

	ws.onerror = (error) => {
		console.error("WebSocket 發生錯誤：", error);
	};

	ws.onclose = (event) => {
		console.log("WebSocket 已關閉連線", event);
	};
}

setInterval(() => {
	if (Date.now() - ntp > 5000) connectWS();
}, 3000);

connectWS();