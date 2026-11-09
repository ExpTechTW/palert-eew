const logger = require("./logger");

const ntpClient = require("ntp-client");
const moment = require("moment-timezone");

class SyncedTime {
	constructor() {
		if (SyncedTime._instance)
			return SyncedTime._instance;

		this.syncedTime = null;
		this.lastSync = null;
		SyncedTime._instance = this;
	}

	static getInstance() {
		if (!SyncedTime._instance)
			SyncedTime._instance = new SyncedTime();

		return SyncedTime._instance;
	}

	syncTime() {
		const t = Date.now();
		ntpClient.getNetworkTime("time.cloudflare.com", 123, (err, date) => {
			if (err) {
				console.log(err);
				return;
			}

			const lag = Date.now() - t;
			if (lag < 500) {
				this.syncedTime = moment(date).tz("Asia/Taipei").valueOf();
				this.lastSync = Date.now();
			} else
				logger.error("[ntp] => time out " + lag);
		});
	}

	now() {
		if (!this.syncedTime || !this.lastSync) return Date.now();
		const offset = Date.now() - this.lastSync;
		return this.syncedTime + offset;
	}
}

const syncedTimeInstance = SyncedTime.getInstance();
syncedTimeInstance.syncTime();

module.exports = SyncedTime;
