import http from "http";

const req = http.request(
  {
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/bad-route",
    method: "POST",
    headers: { "Content-Type": "application/json" },
  },
  (res) => {
    let d = "";
    res.on("data", c => d += c);
    res.on("end", () => {
      console.log("STATUS:", res.statusCode);
      console.log("BODY STR:", d);
    });
  }
);
req.end();
