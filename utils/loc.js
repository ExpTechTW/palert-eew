const fs = require("fs-extra");
const turf = require("@turf/turf");

const town_data = require("../resource/town.json").features;
const sea_data = require("../resource/sea.json").features;

function loc_search(lon, lat) {
	let loc_str;
	for (const town of town_data)
		if (turf.booleanPointInPolygon([ lon, lat ], town.geometry)) {
			loc_str = town.properties.COUNTYNAME + town.properties.TOWNNAME;
			break;
		}

	if (!loc_str)
		for (const sea of sea_data)
			if (turf.booleanPointInPolygon([ lon, lat ], sea.geometry)) {
				loc_str = sea.properties.name;
				break;
			}

	return loc_str || "未知區域";
}

module.exports = loc_search;