const { TRACK_TIME, FREEZE_TIME } = require("../config");
const global_data = require("../global");
const { findClosestIds, distance, speed } = require("../utils/utils");
const webhook = require("../utils/webhook");
const loc_search = require("../utils/loc");

const config = require("../config");

const fs = require("fs-extra");

const levels = [0.6, 0.5, 0.4, 0.3, 0.2];
let save_clock = null;

global_data.events.on("trigger", (data) => {
	const ID = data.id;
	const TIME = data.time;
	const PGA = data.pga;

	let find = false;

	for (const eq of global_data.eq_list) {
		const index = eq.list.findIndex(station => station.id === ID);

		if (index != -1)
			if (TIME - eq.list[index].last_time < TRACK_TIME * 1000) {
				eq.list[index].last_time = TIME;
				find = true;
				break;
			}
	}

	if (!find)
		for (const eq of global_data.eq_list) {
			const trigger_index = eq.trigger_view.findIndex(station => station.id === ID);
			const index = eq.list.findIndex(station => station.id === ID);

			if (trigger_index != -1 && index == -1) {
				eq.last_time = TIME;
				eq.list.push({
					id         : ID,
					pga        : PGA,
					pgv        : 0,
					first_time : TIME,
					last_time  : TIME,
					max_time   : TIME,
				});
				find = true;
				break;
			}
		}

	if (!find)
		for (const eq of global_data.eq_list)
			if (TIME - eq.id < 15000) {
				const info = global_data.station_info[eq.trigger_view[0].id];
				const trigger_info = global_data.station_info[ID];
				const dis = distance(info.lat, info.lon)(trigger_info.lat, trigger_info.lon);
				if (dis < 30) {
					eq.last_time = TIME;
					eq.list.push({
						id         : ID,
						pga        : PGA,
						pgv        : 0,
						first_time : TIME,
						last_time  : TIME,
						max_time   : TIME,
					});
					find = true;
					break;
				}
			}

	if (!find)
		for (const eq of global_data.eq_list) {
			if (!eq.alert) continue;

			const dis = distance(global_data.station_info[ID].lat, global_data.station_info[ID].lon)(eq.eew.lat, eq.eew.lon);
			const tr = speed(eq.eew.depth, dis);

			const p_arrive = eq.eew.time + tr.Ptime * 1000;
			const s_arrive = eq.eew.time + tr.Stime * 1000;
			if (Math.abs(p_arrive - TIME) < 5000 || Math.abs(TIME - s_arrive) < 15000) {
				eq.last_time = TIME;
				eq.list.push({
					id         : ID,
					pga        : PGA,
					pgv        : 0,
					first_time : TIME,
					last_time  : TIME,
					max_time   : TIME,
				});
				find = true;
				break;
			}
		}

	if (!find) {
		const id_list = findClosestIds(ID);
		const trigger_view = id_list.slice(0, 5).map((id, index) => ({
			id    : id,
			level : levels[index],
		}));
		global_data.eq_list.push({
			id        : TIME,
			alert     : false,
			last_time : TIME,
			trigger_view,
			eew       : {
				lat   : Number(Number(global_data.station_info[ID].lat).toFixed(2)),
				lon   : Number(Number(global_data.station_info[ID].lon).toFixed(2)),
				depth : 10,
				mag   : 1,
				time  : TIME - 5000,
			},
			search: {
				serial    : 1,
				lat       : Number(Number(global_data.station_info[ID].lat).toFixed(2)),
				lon       : Number(Number(global_data.station_info[ID].lon).toFixed(2)),
				depth     : 10,
				mag       : 1,
				time      : TIME - 5000,
				last_time : TIME,
			},
			intensity: {
				area : {},
				max  : 0,
			},
			list: [
				{
					id         : ID,
					pga        : PGA,
					pgv        : 0,
					first_time : TIME,
					last_time  : TIME,
					max_time   : TIME,
				},
			],
		});
	}
});

global_data.events.on("data", (data) => {
	const now = data.time;

	for (let i = global_data.eq_list.length - 1; i >= 0; i--) {
		const eq = global_data.eq_list[i];

		if (eq.alert) continue;

		if (now - eq.id > 3000) {
			for (const station of eq.list) {
				global_data.freeze_list[station.id] = now + FREEZE_TIME * 1000;
				// console.log(`凍結 ${station.id}`);

				if (save_clock) clearTimeout(save_clock);
				save_clock = setTimeout(() => {
					save_clock = null;
					fs.writeFile("./resource/freeze.json", JSON.stringify(global_data.freeze_list), () => void 0);
				}, 1000);
			}
			global_data.eq_list.splice(i, 1);
			continue;
		}

		let count = 0;
		for (const trigger of eq.trigger_view) {
			const index = eq.list.findIndex(station => station.id == trigger.id);

			if (index != -1) count += trigger.level;
		}

		if (count >= 1.5) {
			eq.alert = true;
			console.log("地震！！！");

			const info = global_data.live_station_info[eq.list[0].id];

			const loc = loc_search(info.lon, info.lat);

			if (config.mode == "ONLINE") {
				webhook(process.env.TRIGGER_WEBHOOK, {
					"username"   : "ExpTech | 探索科技 (測試)",
					"avatar_url" : "https://cdn.jsdelivr.net/gh/ExpTechTW/API@master/ExpTech.jpg",
					content      : `${loc} 地震？？`,
				});

				webhook(process.env.EEW_WEBHOOK, {
					"username"   : "ExpTech | 探索科技 (測試)",
					"avatar_url" : "https://cdn.jsdelivr.net/gh/ExpTechTW/API@master/ExpTech.jpg",
					content      : `${loc} 地震！！！ | trigger level: ${count}`,
				});
			}
		}
	}
});