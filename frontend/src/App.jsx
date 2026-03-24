import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const socket = io("http://localhost:3000");

const STOPS = [
  { id: "stop1", name: "Saddar" },
  { id: "stop2", name: "Nazimabad" },
  { id: "stop3", name: "Gulshan" },
  { id: "stop4", name: "Johar" },
];

export default function App() {
  const [selectedStop, setSelectedStop] = useState(STOPS[0]);
  const [busNumber, setBusNumber] = useState("");
  const [reports, setReports] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Real-time updates receive karo
    socket.on(`stop:${selectedStop.id}`, (data) => {
      setReports((prev) => [data, ...prev]);
    });

    // Existing reports load karo
    fetchReports(selectedStop.id);

    return () => {
      socket.off(`stop:${selectedStop.id}`);
    };
  }, [selectedStop]);

  const fetchReports = async (stopId) => {
    try {
      const res = await axios.get(
        `http://localhost:3000/api/reports/${stopId}`,
      );
      setReports(res.data.reports);
    } catch (err) {
      console.error(err);
    }
  };

  const submitReport = async () => {
    if (!busNumber) return;
    try {
      const res = await axios.post("http://localhost:3000/api/reports", {
        stopId: selectedStop.id,
        busNumber,
        userId: "user123",
      });
      setMessage(`Report submit! ${res.data.estimate}`);
      setBusNumber("");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      style={{
        maxWidth: "480px",
        margin: "0 auto",
        padding: "24px",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: "22px", marginBottom: "4px" }}>
        🚌 Karachi Bus Tracker
      </h1>
      <p style={{ color: "#666", marginBottom: "24px" }}>
        Community based real-time bus tracker
      </p>

      {/* Stop Select */}
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}
        >
          Apna stop select karo
        </label>
        <select
          value={selectedStop.id}
          onChange={(e) =>
            setSelectedStop(STOPS.find((s) => s.id === e.target.value))
          }
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ddd",
          }}
        >
          {STOPS.map((stop) => (
            <option key={stop.id} value={stop.id}>
              {stop.name}
            </option>
          ))}
        </select>
      </div>

      {/* Report Submit */}
      <div style={{ marginBottom: "24px" }}>
        <label
          style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}
        >
          Maine bus dekhi
        </label>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            value={busNumber}
            onChange={(e) => setBusNumber(e.target.value)}
            placeholder="Bus number (e.g. K1)"
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          />
          <button
            onClick={submitReport}
            style={{
              padding: "10px 16px",
              background: "#16a34a",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Report
          </button>
        </div>
        {message && (
          <p style={{ color: "#16a34a", marginTop: "8px" }}>{message}</p>
        )}
      </div>

      {/* Reports List */}
      <div>
        <h2
          style={{ fontSize: "16px", fontWeight: "500", marginBottom: "12px" }}
        >
          {selectedStop.name} — Latest Reports
        </h2>
        {reports.length === 0 && (
          <p style={{ color: "#999" }}>
            Abhi koi report nahi — pehle report karo!
          </p>
        )}
        {reports.map((r, i) => (
          <div
            key={i}
            style={{
              padding: "12px",
              border: "1px solid #eee",
              borderRadius: "8px",
              marginBottom: "8px",
            }}
          >
            <p style={{ fontWeight: "500", margin: "0 0 4px" }}>
              Bus {r.busNumber || r.bus_number}
            </p>
            <p style={{ color: "#666", margin: 0, fontSize: "14px" }}>
              {r.estimate || r.seen_at}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
