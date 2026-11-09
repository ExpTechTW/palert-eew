function parseCSVtoJSON(csvData) {
	const lines = csvData.trim().split("\n");
	if (lines.length === 0) return {};

	const headers = lines[0].split(",");

	const result = {};

	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;

		const values = line.split(",");

		const entry = {};
		headers.forEach((header, index) => {
			entry[header] = values[index];
		});

		result[entry.station] = entry;
		delete result[entry.station].station;
	}

	return result;
}

module.exports = parseCSVtoJSON;