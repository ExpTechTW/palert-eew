const global_data = require("../global");
const webhook = require("../utils/webhook");
const loc_search = require("../utils/loc");
const config = require("../config");

const { fork } = require("child_process");
const fs = require("fs-extra");

const child = fork(require.resolve("./search"), { windowsHide: true });

global_data.events.on("data", (data) => {
	const now = data.time;

	for (let i = global_data.eq_list.length - 1; i >= 0; i--) {
		const eq = global_data.eq_list[i];
		if (!eq.alert) continue;
		if (now - eq.last_time > 30000) {
			fs.outputFileSync(`./history/${eq.id}.json`, JSON.stringify(eq));

			const date = new Date(eq.search.time);

			const formattedTime = date.toLocaleString("zh-TW", {
				timeZone : "Asia/Taipei",
				year     : "numeric",
				month    : "2-digit",
				day      : "2-digit",
				hour     : "2-digit",
				minute   : "2-digit",
				second   : "2-digit",
			}).replace(/\//g, "-");

			const loc = loc_search(eq.search.lon, eq.search.lat);

			if (config.side == "SERVER")
				webhook(process.env.EEW_WEBHOOK, {
					"username"   : "ExpTech | 探索科技 (測試)",
					"avatar_url" : "https://cdn.jsdelivr.net/gh/ExpTechTW/API@master/ExpTech.jpg",
					content      : `第${eq.search.serial}報(最終報)\nM${eq.search.mag.toFixed(1)} ${formattedTime}\n${eq.search.lat}°N ${eq.search.lon}°E ${eq.search.depth}km\n${loc}\ntriggered: ${eq.list.length}`,
				});

			global_data.eq_list.splice(i, 1);
			continue;
		}
		if (eq.search.last_time == eq.last_time) continue;
		child.send({
			eq,
			global_data,
			now,
		});
	}
});

child.on("message", (result) => {
	const { eq, lat, lon, depth, mag, time } = result;

	for (const _eq of global_data.eq_list) {
		if (_eq.id != eq.id) continue;

		if (_eq.search.time != time || _eq.search.mag != mag || _eq.search.depth != depth || _eq.search.lon != lon || _eq.search.lat != lat) {

			console.log(lat, lon, depth, mag, time);

			const date = new Date(time);

			const formattedTime = date.toLocaleString("zh-TW", {
				timeZone : "Asia/Taipei",
				year     : "numeric",
				month    : "2-digit",
				day      : "2-digit",
				hour     : "2-digit",
				minute   : "2-digit",
				second   : "2-digit",
			}).replace(/\//g, "-");

			const loc = loc_search(lon, lat);

			if (config.side == "SERVER")
				webhook(process.env.EEW_WEBHOOK, {
					"username"   : "ExpTech | 探索科技 (測試)",
					"avatar_url" : "https://cdn.jsdelivr.net/gh/ExpTechTW/API@master/ExpTech.jpg",
					content      : `第${_eq.search.serial}報\nM${mag.toFixed(1)} ${formattedTime}\n${lat}°N ${lon}°E ${depth}km\n${loc}\ntriggered: ${_eq.list.length}`,
				});

			_eq.search.lat = lat;
			_eq.search.lon = lon;
			_eq.search.depth = depth;
			_eq.search.mag = mag;
			_eq.search.time = time;
			_eq.search.serial++;
		}

		_eq.search.last_time = _eq.last_time;

		break;
	}
});