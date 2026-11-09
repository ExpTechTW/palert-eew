const config = require("./config");

require("./core/init");
require("./core/station-info");

if (config.mode == "ONLINE") require("./core/data/realtime");
else require("./core/data/replay");

require("./core/trigger");
require("./core/eq");
require("./core/eew");