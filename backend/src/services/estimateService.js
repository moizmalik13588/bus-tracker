const redis = require("../config/redis");

const estimateArrival = async (stopId, busNumber) => {
  try {
    const key = `stop:${stopId}:bus:${busNumber}`;
    const cached = await redis.get(key);

    if (!cached) return "Data nahi hai abhi";

    const { seenAt } = JSON.parse(cached);
    const diff = Math.floor((new Date() - new Date(seenAt)) / 1000 / 60);

    if (diff < 2) return "Abhi abhi dekhi gayi";
    if (diff < 8) return `${diff} min pehle dekhi — jaldi aao`;
    if (diff < 15)
      return `${diff} min pehle dekhi — roughly ${15 - diff} min mein`;
    return "Purana data — koi nahi bataa sakta";
  } catch (err) {
    console.error(err);
    return "Estimate unavailable";
  }
};

module.exports = { estimateArrival };
