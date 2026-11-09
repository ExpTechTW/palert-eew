const EventEmitter = require("events");

const global_data = {
	events            : new EventEmitter(),
	station_info      : {},
	live_station_info : {},
	eq_list           : [],
	freeze_list       : {},
};

module.exports = global_data;