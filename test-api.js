import http from "http";

const req = http.request(
  {
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/auth/send-otp",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  },
  (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      console.log(`BODY: ${data}`);
    });
  }
);

req.on("error", (e) => {
  console.error(`problem with request: ${e.message}`);
});
req.write(JSON.stringify({ email: "ruhandharpurkayastha@gmail.com" }));
req.end();
