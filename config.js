const LOCAL = "LOCAL";
const SERVER = "SERVER";
const side = SERVER;

const REPLAY = "REPLAY";
const ONLINE = "ONLINE";
const mode = ONLINE;

const TRIGGER = {
	STA_WINDOW : 1,
	LTA_WINDOW : 60,
	THRESHOLD  : 2.4,
};

const FREEZE_TIME = 90;
const OFFLINE_TIME = 3;
const TRACK_TIME = 5;

const PGA_LEVEL = {
	EEW     : 35,
	EEW_MAX : 50,
	MAG     : 0.5,
	MAG_MAX : 50,
};

module.exports = {
	side,
	mode,

	TRIGGER,
	FREEZE_TIME,
	OFFLINE_TIME,
	TRACK_TIME,
	PGA_LEVEL,
};