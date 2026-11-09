const global_data = require("../global");

function findClosestIds(id) {
	const target = global_data.live_station_info[id];
	const targetLat = target.lat;
	const targetLon = target.lon;
	const distances = [];
	for (const [key, value] of Object.entries(global_data.live_station_info)) {
		const dis = distance(targetLat, targetLon)(value.lat, value.lon);
		distances.push({ id: key, dis });
	}
	distances.sort((a, b) => a.dis - b.dis);
	return distances.map(d => d.id);
}

function distance(latA, lngA) {
	return function(latB, lngB) {
		latA = latA * Math.PI / 180;
		lngA = lngA * Math.PI / 180;
		latB = latB * Math.PI / 180;
		lngB = lngB * Math.PI / 180;
		const sin_latA = Math.sin(Math.atan(Math.tan(latA)));
		const sin_latB = Math.sin(Math.atan(Math.tan(latB)));
		const cos_latA = Math.cos(Math.atan(Math.tan(latA)));
		const cos_latB = Math.cos(Math.atan(Math.tan(latB)));
		return Math.acos(sin_latA * sin_latB + cos_latA * cos_latB * Math.cos(lngA - lngB)) * 6371.008;
	};
}

function speed(Za, Xb) {
	let G0, G;
	if (Za <= 40) {
		G0 = 5.10298;
		G = 0.06659;
	} else {
		G0 = 7.804799;
		G = 0.004573;
	}
	const Zc = -1 * (G0 / G);
	const Xc = (Xb ** 2 - 2 * (G0 / G) * Za - Za ** 2) / (2 * Xb);
	let Theta_A = Math.atan((Za - Zc) / Xc);
	if (Theta_A < 0) Theta_A = Theta_A + Math.PI;
	Theta_A = Math.PI - Theta_A;
	const Theta_B = Math.atan(-1 * Zc / (Xb - Xc));
	let Ptime = (1 / G) * Math.log(Math.tan((Theta_A / 2)) / Math.tan((Theta_B / 2)));
	const G0_ = G0 / 1.732;
	const G_ = G / 1.732;
	const Zc_ = -1 * (G0_ / G_);
	const Xc_ = (Xb ** 2 - 2 * (G0_ / G_) * Za - Za ** 2) / (2 * Xb);
	let Theta_A_ = Math.atan((Za - Zc_) / Xc_);
	if (Theta_A_ < 0) Theta_A_ = Theta_A_ + Math.PI;
	Theta_A_ = Math.PI - Theta_A_;
	const Theta_B_ = Math.atan(-1 * Zc_ / (Xb - Xc_));
	let Stime = (1 / G_) * Math.log(Math.tan(Theta_A_ / 2) / Math.tan(Theta_B_ / 2));
	if (Xb / Ptime > 7) Ptime = Xb / 7;
	if (Xb / Stime > 4) Stime = Xb / 4;
	return { Ptime: Ptime, Stime: Stime };
}

module.exports = {
	findClosestIds,
	distance,
	speed,
};