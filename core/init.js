const fs = require("fs-extra");
const global_data = require("../global");

fs.ensureDirSync("./data");
fs.ensureDirSync("./resource");

if (!fs.existsSync("./resource/station.csv")) process.exit(1);

try {
	global_data.freeze_list = JSON.parse(fs.readFileSync("./resource/freeze.json").toString());
} catch (err) {
	fs.writeFileSync("./resource/freeze.json", JSON.stringify({}));
}