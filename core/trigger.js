const { TRIGGER, FREEZE_TIME, OFFLINE_TIME, TRACK_TIME } = require("../config");
const global_data = require("../global");

const data_list = new Map();

global_data.events.on("data", (data) => {
	const now = data.time;

	for (const [id, entry] of data_list)
		if (now - entry.time > OFFLINE_TIME * 1000)
			data_list.delete(id);

	for (const [id, value] of Object.entries(data.data)) {
		if (!global_data.station_info[id]) continue;

		for (const eq of global_data.eq_list) {
			const index = eq.list.findIndex(station => station.id === id);

			if (index != -1)
				if (now - eq.list[index].last_time < TRACK_TIME * 1000) {
					if (value > eq.list[index].pga) {
						eq.list[index].pga = value;
						eq.list[index].max_time = now;
						eq.last_time = now;
					}
					break;
				}
		}

		if (!data_list.has(id))
			data_list.set(id, { data: [], time: now, sta: 0, lta: 0, sta_lta: 0 });

		const entry = data_list.get(id);
		entry.time = now;
		entry.data.push(value);

		if (entry.data.length > TRIGGER.LTA_WINDOW) entry.data.shift();

		const sta_values = entry.data.slice(-TRIGGER.STA_WINDOW);
		const lta_values = entry.data;

		entry.sta = sta_values.reduce((sum, v) => sum + v, 0) / sta_values.length;
		entry.lta = lta_values.reduce((sum, v) => sum + v, 0) / lta_values.length || 1e-10;

		entry.sta_lta = entry.sta / entry.lta;

		if (entry.sta_lta > TRIGGER.THRESHOLD)
			if (!global_data.freeze_list[id] || data.time > global_data.freeze_list[id]) {
				delete global_data.freeze_list[id];
				global_data.events.emit("trigger", {
					id,
					pga  : value,
					time : data.time,
				});
				// console.log(`⚠️ [${id}] STA/LTA 超過 ${TRIGGER.THRESHOLD}，可能有異常訊號！ ${entry.sta_lta} ${entry.sta} ${entry.lta}`);
			} else global_data.freeze_list[id] = data.time + FREEZE_TIME * 1000;
	}
});

setInterval(() => {
	global_data.live_station_info = {};

	for (const key of data_list.keys())
		if (global_data.station_info[key]) global_data.live_station_info[key] = global_data.station_info[key];
}, 5000);