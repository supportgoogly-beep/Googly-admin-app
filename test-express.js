import express from "express";

const app = express();
const apiRouter = express.Router();

app.use((req, res, next) => {
  const originalUrl = req.url;
  
  // Strip standard /api prefix
  if (req.url.startsWith("/api")) {
    req.url = req.url.slice("/api".length);
  }
  if (!req.url.startsWith("/")) {
    req.url = "/" + req.url;
  }
  next();
});

apiRouter.post("/auth/send-otp", (req, res) => {
  res.json({ message: "Hello" });
});

app.use("/api", apiRouter);
app.use("/", apiRouter);

// Catch-all
app.use('*', (req, res) => res.status(404).send('Not Found html'));

import http from "http";
const server = http.createServer(app);
server.listen(3333, "127.0.0.1", () => {
    
    // now we fetch test
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: 3333,
        path: "/api/auth/send-otp",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      },
      (res) => {
        let d = "";
        res.on("data", c => d += c);
        res.on("end", () => {
           console.log("RESPONSE: ", res.statusCode, d);
           process.exit(0);
        });
      }
    );
    req.end();
});
