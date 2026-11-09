const calculateWeightedResidualSquared = require("../utils/calculateResidualSquared");
const { distance, speed } = require("../utils/utils");

const { PGA_LEVEL } = require("../config");

process.on("message", (data) => {
	const { global_data, eq, now } = data;

	let lat = eq.search.lat;
	let lon = eq.search.lon;
	let depth = eq.search.depth;
	const mag = eq.search.mag;
	let time = eq.search.time;

	const latVariations = [0, -0.1, 0.1];
	const lonVariations = [0, -0.1, 0.1];

	const eew_list = [];

	for (const latVar of latVariations)
		for (const lonVar of lonVariations) {
			const _lat = lat + latVar;
			const _lon = lon + lonVar;
			const _eew = eew(global_data, eq, now, _lat, _lon, depth);

			eew_list.push({
				lat   : _lat,
				lon   : _lon,
				count : _eew.count,
				time  : _eew.eq_time,
			});
		}

	const element = findMinCount(eew_list);

	lat = Number(element.lat.toFixed(2));
	lon = Number(element.lon.toFixed(2));

	const _depthVariations = [0, -10, 10];

	const _eew_list_ = [];

	for (const latVar of latVariations)
		for (const lonVar of lonVariations)
			for (const depthVar of _depthVariations) {
				const _lat = lat + latVar;
				const _lon = lon + lonVar;
				let _depth = depth + depthVar;
				if (_depth < 10) _depth = 10;
				if (_depth > 150) _depth = 150;
				const _eew = eew(global_data, eq, now, _lat, _lon, _depth);

				_eew_list_.push({
					lat   : _lat,
					lon   : _lon,
					depth : _depth,
					count : _eew.count,
					time  : _eew.eq_time,
				});
			}

	const _element_ = findMinCount(_eew_list_);

	lat = Number(_element_.lat.toFixed(2));
	lon = Number(_element_.lon.toFixed(2));
	depth = _element_.depth;
	time = _element_.time;

	const __latVariations = [0, -0.02, 0.02];
	const __lonVariations = [0, -0.02, 0.02];
	const __depthVariations = [0, -2, 2];

	const __eew_list = [];

	for (const latVar of __latVariations)
		for (const lonVar of __lonVariations)
			for (const depthVar of __depthVariations) {
				const _lat = lat + latVar;
				const _lon = lon + lonVar;
				let _depth = depth + depthVar;
				if (_depth < 10) _depth = 10;
				if (_depth > 150) _depth = 150;
				const _eew = eew(global_data, eq, now, _lat, _lon, _depth);

				__eew_list.push({
					lat   : _lat,
					lon   : _lon,
					depth : _depth,
					count : _eew.count,
					time  : _eew.eq_time,
				});
			}

	const __element = findMinCount(__eew_list);

	lat = Number(__element.lat.toFixed(2));
	lon = Number(__element.lon.toFixed(2));
	depth = __element.depth;
	time = __element.time;

	eq.list.sort((a, b) => a.first_time - b.first_time);
	const raw_list = eq.list.map(item => item.id);

	const stationInfo = global_data.station_info[raw_list[0]];
	const search_list = findClosestIds(global_data, stationInfo.lat, stationInfo.lon, raw_list);

	const startIndex = Math.floor(search_list.length * 0.1);
	const endIndex = Math.ceil(search_list.length * 0.9);

	const filtered_search_list = search_list.slice(startIndex, endIndex);

	const stationObj = {};
	for (const s of eq.list)
		stationObj[s.id] = s.pga;

	let maxScore = -Infinity;
	let bestMag = null;

	for (let testMag = 0.1; testMag <= 7.5; testMag += 0.1) {
		let s_count = 0;
		let all_count = 0;

		for (const station of filtered_search_list) {
			const info = global_data.station_info[station];

			const dist_surface = distance(lat, lon)(info.lat, info.lon);
			const tr = speed(depth, dist_surface);
			const dist = Math.sqrt(dist_surface ** 2 + depth ** 2);
			const e_pga = 1.657 * Math.exp(1.533 * testMag) * Math.pow(dist, -1.607);
			const r_pga = stationObj[station] || 0;

			if (r_pga < PGA_LEVEL.MAG || r_pga > PGA_LEVEL.MAG_MAX) continue;

			// console.log(`testMag: ${testMag.toFixed(1)}, e_pga: ${e_pga}, r_pga: ${r_pga}, dist: ${dist}`);

			if (now > time + tr.Stime * 1000)
				if (r_pga > 0 && e_pga > 0) {
					const ratio = Math.min(r_pga, e_pga) / Math.max(r_pga, e_pga);
					const weight = Math.log10(Math.max(r_pga, e_pga) + 1);
					const score = Math.pow(ratio, weight) * 100;

					s_count += score;
					all_count++;
				}
		}

		const skip = all_count ? s_count / all_count : 0;
		// console.log(`testMag: ${testMag.toFixed(1)}, skip: ${skip} ${s_count} ${all_count}`);

		if (skip > maxScore) {
			maxScore = skip;
			bestMag = testMag;
			// console.log(`更新最佳值: bestMag=${bestMag}, minSkip=${minSkip}`);
		}

		// break;
	}

	// console.log(`最終最佳 mag: ${bestMag}, 最小 skip: ${minSkip}`);

	process.send({ eq, lat, lon, depth, mag: Number(bestMag.toFixed(1)), time });
});

function eew(global_data, eq, now, lat, lon, depth) {
	const list = eq.list;
	list.sort((a, b) => a.first_time - b.first_time);

	const raw_list = list.map(item => item.id);
	const stationInfo = global_data.station_info[raw_list[0]];
	const search_list = findClosestIds(global_data, stationInfo.lat, stationInfo.lon, raw_list);

	let eq_all = 0;
	let amount = 0;
	let first_dist = 0;
	const station_list = {};

	for (const station of list) {
		if (!search_list.includes(station.id)) continue;

		const info = global_data.station_info[station.id];
		const Dis = distance(info.lat, info.lon)(lat, lon);
		const tr = speed(depth, Dis);

		let eq_t = 0;
		if (station.pga > PGA_LEVEL.EEW) {
			eq_t = station.first_time - tr.Ptime * 1000;
			if (station.first_time != station.max_time) {
				eq_t += station.max_time - tr.Stime * 1000;
				eq_t /= 2;
			}
		} else if (station.pga > PGA_LEVEL.EEW_MAX)
			continue;
		else
			eq_t = station.max_time - tr.Stime * 1000;

		eq_all += eq_t;
		amount++;

		let w = 1;
		if (!first_dist)
			first_dist = Dis;
		else
			if (Dis > 50)
				w = first_dist / Dis;

		station_list[station.id] = {
			eq_t,
			w,
		};
	}

	const eq_time = eq_all / amount;

	const observedTimes = [];
	const theoreticalTimes = [];
	const weights = [];

	for (const stationId of Object.keys(station_list)) {
		observedTimes.push(station_list[stationId].eq_t);
		theoreticalTimes.push(0);
		weights.push(station_list[stationId].w);
	}

	const count = calculateWeightedResidualSquared(
		observedTimes,
		eq_time,
		theoreticalTimes,
		0,
		weights,
	);

	return { count, eq_time: Math.round(eq_time) };
}

function findClosestIds(global_data, lat, lon, ids) {
	const dist = ids
		.map(id => {
			const station = global_data.station_info[id];
			const stationLat = station.lat;
			const stationLon = station.lon;
			const dis = distance(lat, lon)(stationLat, stationLon);
			return { id, dis };
		})
		.sort((a, b) => a.dis - b.dis);
	return dist.slice(0, 75).map(d => d.id);
}

function findMinCount(eew_list) {
	if (eew_list.length === 0) return null;
	let minElement = eew_list[0];
	for (const element of eew_list)
		if (element.count < minElement.count) minElement = element;
	return minElement;
}