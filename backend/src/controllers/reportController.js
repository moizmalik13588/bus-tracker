const pool = require("../config/db");
const redis = require("../config/redis");
const { estimateArrival } = require("../services/estimateService");

const submitReport = async (req, res) => {
  try {
    const { stopId, busNumber, userId } = req.body;

    if (!stopId || !busNumber) {
      return res
        .status(400)
        .json({ error: "stopId aur busNumber required hai" });
    }

    // PostgreSQL mein save karo
    await pool.query(
      "INSERT INTO reports (stop_id, bus_number, user_id, seen_at) VALUES ($1, $2, $3, NOW())",
      [stopId, busNumber, userId],
    );

    // Redis mein latest report cache karo (10 min TTL)
    const key = `stop:${stopId}:bus:${busNumber}`;
    await redis.set(
      key,
      JSON.stringify({ stopId, busNumber, seenAt: new Date() }),
      { EX: 600 },
    );

    // Socket.io se broadcast karo
    const io = req.app.get("io");
    const estimate = await estimateArrival(stopId, busNumber);
    io.emit(`stop:${stopId}`, { busNumber, estimate });

    res.json({ success: true, estimate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const getReports = async (req, res) => {
  try {
    const { stopId } = req.params;

    // Pehle Redis check karo
    const keys = await redis.keys(`stop:${stopId}:bus:*`);
    if (keys.length > 0) {
      const reports = await Promise.all(keys.map((k) => redis.get(k)));
      return res.json({
        source: "cache",
        reports: reports.map((r) => JSON.parse(r)),
      });
    }

    // Redis mein nahi — PostgreSQL se lo
    const result = await pool.query(
      "SELECT * FROM reports WHERE stop_id = $1 ORDER BY seen_at DESC LIMIT 10",
      [stopId],
    );
    res.json({ source: "db", reports: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { submitReport, getReports };
