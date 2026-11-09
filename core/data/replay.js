const global_data = require("../../global");

const fs = require("fs-extra");
const moment = require("moment-timezone");

let replay_index = 0;
let replay_list = [];

let replay_read_time = 0;
let replay_lock = false;

fs.readdir("./data", (err, list) => {
	replay_list = list;

	setInterval(() => {
		const now = Date.now();

		if (replay_lock || now - replay_read_time < 1000) return;

		replay_lock = true;
		const file_name = replay_list[replay_index];
		console.log(convertToUTC8(file_name));

		if (!file_name.endsWith(".json")) {
			replay_lock = false;
			replay_index++;
			return;
		}

		fs.readFile(`./data/${file_name}`, (err, data) => {
			replay_read_time = now;
			replay_lock = false;
			replay_index++;

			if (err) return;

			const json = JSON.parse(data);

			global_data.events.emit("data", {
				data : json.dataVals,
				time : moment(json.timestamp).tz("Asia/Taipei").valueOf(),
			});
		});
	}, 200);
});

function convertToUTC8(file_name) {
	const timePart = file_name.replace(".json", "");

	const utcTime = moment.utc(timePart, "YYYY-MM-DDTHH-mm-ss-SSSZ");

	const utc8Time = utcTime.tz("Asia/Taipei").format("YYYY-MM-DDTHH-mm-ss-SSSZ");

	return utc8Time;
}