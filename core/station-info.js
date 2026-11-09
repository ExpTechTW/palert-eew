const global_data = require("../global");
const parseCSVtoJSON = require("../utils/csv-to-json");

const fs = require("fs-extra");

const csv_data = fs.readFileSync("./resource/station.csv").toString();

global_data.station_info = parseCSVtoJSON(csv_data);