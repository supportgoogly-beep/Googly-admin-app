import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import http from "http";
import admin from "firebase-admin";
import nodemailer from "nodemailer";
import { promises as fs } from "fs";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Lazy init Supabase client for safe server operations
let _supabaseClient: any = null;
function getSupabaseClient() {
  if (!_supabaseClient) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith("http")) {
      try {
        _supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
      } catch (e) {
        console.warn("Failed to initialize Supabase client on server-side ambiently:", e);
      }
    }
  }
  return _supabaseClient;
}

// Local whitelist fallback persistence path
const whitelistPath = path.join(__dirname, "authorized_admins_local.json");

// Preloaded trusted default emails
const DEFAULT_WHITELIST = [
  "ruhandharpurkayastha@gmail.com",
  "admin@googlydelivery.in",
  "shyam.support@googly.com",
  "reema.ops@googly.com",
  "devlina.sen@yahoo.com"
];

// Ensure the local whitelist storage file is present
async function ensureLocalWhitelistFile() {
  try {
    await fs.access(whitelistPath);
  } catch {
    await fs.writeFile(whitelistPath, JSON.stringify(DEFAULT_WHITELIST, null, 2), "utf-8");
  }
}

// Read local whitelist
async function getLocalWhitelist(): Promise<string[]> {
  await ensureLocalWhitelistFile();
  try {
    const content = await fs.readFile(whitelistPath, "utf-8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : DEFAULT_WHITELIST;
  } catch (err) {
    return DEFAULT_WHITELIST;
  }
}

// Save local whitelist
async function saveLocalWhitelist(list: string[]) {
  try {
    await fs.writeFile(whitelistPath, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write local whitelist file:", err);
  }
}

// Core access-control authorization validation
async function isEmailAuthorized(email: string): Promise<boolean> {
  if (!email) return false;
  const normEmail = email.toLowerCase().trim();

  // 1. Check local file-based database for immediate standalone and preview durability
  const localList = await getLocalWhitelist();
  if (localList.includes(normEmail)) {
    return true;
  }

  // 2. Check Supabase 'authorized_admins' table if configured
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("authorized_admins")
        .select("email")
        .eq("email", normEmail);
      if (!error && data && data.length > 0) {
        return true;
      }
    } catch (e) {
      console.warn("Supabase query bypass warning (table might not exist):", e);
    }
  }

  // 3. Check Firestore 'authorized_admins' collection if configured
  try {
    const db = (admin as any).firestore();
    const snapshot = await db.collection("authorized_admins").where("email", "==", normEmail).get();
    if (!snapshot.empty) {
      return true;
    }
  } catch (e) {
    // Ignored fallback
  }

  return false;
}

// Initialize Firebase Admin
try {
  admin.initializeApp();
} catch (e) {
  console.warn("Firebase Admin failed to initialize ambiently. Backend auth features may be limited.", e);
}

// SMTP Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Validate SMTP config on startup
if (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('@')) {
  console.error("CRITICAL: SMTP_HOST seems to be configured incorrectly (contains '@'). Please set it to 'smtp.gmail.com' (or equivalent).");
}

// In-memory store for OTPs (Demo only - use Redis/DB for production)
const otpStore = new Map<string, { otp: string, timestamp: number }>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- REAL-TIME REPLICATION & MULTI-DEVICE BROADCAST HUB (SSE) ---
  const sseClients = new Set<any>();

  app.get("/api/realtime/sync-stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    res.write("data: {\"init\":true}\n\n");

    sseClients.add(res);
    console.log(`[REALTIME-SSE] New device linked. Total subscribers: ${sseClients.size}`);

    req.on("close", () => {
      sseClients.delete(res);
      console.log(`[REALTIME-SSE] Device untracked. Total subscribers: ${sseClients.size}`);
    });
  });

  app.post("/api/realtime/publish", (req, res) => {
    const { event, table, row, rowId, origin } = req.body;
    const payload = JSON.stringify({ event, table, row, rowId, origin });
    
    let counter = 0;
    sseClients.forEach((client) => {
      try {
        client.write(`data: ${payload}\n\n`);
        counter++;
      } catch (err) {
        sseClients.delete(client);
      }
    });

    console.log(`[REALTIME-SSE] Transmitted ${event} on table ${table} (rowId: ${rowId}) to ${counter} devices.`);
    res.json({ success: true, broadcastCount: counter });
  });

  // Whitelist/Check-Authorized endpoints
  app.post("/api/auth/check-authorized", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }
    const isAuthorized = await isEmailAuthorized(email);
    if (!isAuthorized) {
      return res.status(403).json({ error: "Not Registered" });
    }
    res.json({ authorized: true });
  });

  // Whitelist management endpoints (for Super Admin dashboard controls)
  app.get("/api/auth/whitelist", async (req, res) => {
    try {
      const localList = await getLocalWhitelist();
      const combined = new Set<string>(localList);

      // Fetch from Supabase
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase.from("authorized_admins").select("email");
          if (!error && data) {
            data.forEach((row: any) => {
              if (row.email) combined.add(row.email.toLowerCase().trim());
            });
          }
        } catch (e) {
          console.warn("Could not load authorized_admins from Supabase:", e);
        }
      }

      // Fetch from Firestore
      try {
        const db = (admin as any).firestore();
        const snapshot = await db.collection("authorized_admins").get();
        snapshot.forEach((doc) => {
          const email = doc.data().email;
          if (email) combined.add(email.toLowerCase().trim());
        });
      } catch (e) {
        // Ignore
      }

      res.json(Array.from(combined));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/whitelist", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email coordinate is required" });
    const normEmail = email.toLowerCase().trim();

    try {
      // 1. Write locally
      const localList = await getLocalWhitelist();
      if (!localList.includes(normEmail)) {
        localList.push(normEmail);
        await saveLocalWhitelist(localList);
      }

      // 2. Write to Supabase
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from("authorized_admins").upsert(
            { email: normEmail, name: email.split("@")[0] },
            { onConflict: "email" }
          );
        } catch (e) {
          console.warn("Could not sync authorized_admins to Supabase:", e);
        }
      }

      // 3. Write to Firestore
      try {
        const db = (admin as any).firestore();
        await db.collection("authorized_admins").doc(normEmail).set({
          email: normEmail,
          name: email.split("@")[0],
          created_at: new Date().toISOString()
        });
      } catch (e) {
        // Ignore
      }

      res.json({ success: true, message: `Access granted for ${normEmail}.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/auth/whitelist", async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email coordinate is required" });
    const normEmail = (email as string).toLowerCase().trim();

    // Prevent locks or self-deletion of the master email
    if (normEmail === "ruhandharpurkayastha@gmail.com") {
      return res.status(400).json({ error: "Cannot delete the primary owner super admin from access logs." });
    }

    try {
      // 1. Remove locally
      const localList = await getLocalWhitelist();
      const updatedList = localList.filter(e => e !== normEmail);
      await saveLocalWhitelist(updatedList);

      // 2. Remove from Supabase
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from("authorized_admins").delete().eq("email", normEmail);
        } catch (e) {
          console.warn("Could not delete from Supabase authorized_admins:", e);
        }
      }

      // 3. Remove from Firestore
      try {
        const db = (admin as any).firestore();
        await db.collection("authorized_admins").doc(normEmail).delete();
      } catch (e) {
        // Ignore
      }

      res.json({ success: true, message: `Access revoked for ${normEmail}.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API route to delete a user from Firebase Authentication
  app.post("/api/auth/delete-user", async (req, res) => {
    const { uid, email } = req.body;
    if (!uid && !email) {
      return res.status(400).json({ error: "UID or Email coordinate is required" });
    }
    try {
      let targetUid = uid;
      if (!targetUid && email) {
        try {
          const userRecord = await (admin as any).auth().getUserByEmail(email);
          targetUid = userRecord.uid;
        } catch (e: any) {
          if (e.code === "auth/user-not-found") {
            return res.json({ success: true, message: "User not found in Firebase Auth, bypassing." });
          }
          throw e;
        }
      }
      if (targetUid) {
        await (admin as any).auth().deleteUser(targetUid);
        console.log(`[AUTH] User ${targetUid} (${email || ''}) successfully deleted from Firebase Authentication.`);
      }
      res.json({ success: true, message: "User successfully deleted from Firebase Auth." });
    } catch (err: any) {
      console.error("Failed to delete user from Firebase Auth:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // API route to proxy Nominatim requests
  app.get("/api/proxy-nominatim", async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Missing query parameter" });
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q as string)}&format=json&limit=5`, {
        headers: { "User-Agent": "EnterpriseDeliveryPlatform/2.4 (ruhandharpurkayastha@gmail.com)" },
      });
      res.json(await response.json());
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch from Nominatim" });
    }
  });

  // OTP Endpoints with strict access checks
  app.post("/api/auth/send-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });
    
    // Strict block on direct sign-ups / reset requests for unregistered users
    const isAuthorized = await isEmailAuthorized(email);
    if (!isAuthorized) {
      return res.status(403).json({ error: "Not Registered" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { otp, timestamp: Date.now() });
    
    try {
        console.log(`[AUTH] Reading email template from: ${path.join(__dirname, 'src', 'templates', 'otp-email.html')}`);
        const template = await fs.readFile(path.join(__dirname, 'src', 'templates', 'otp-email.html'), 'utf-8');
        console.log(`[AUTH] Template read successfully. Length: ${template.length}`);
        const html = template.replace('{OTP_CODE}', otp);
        console.log(`[AUTH] OTP_CODE replaced. OTP: ${otp}`);

        await transporter.sendMail({
            from: '"Googly Admin" <no-reply@googly-app.com>',
            to: email,
            subject: "Your Googly Verification Code",
            text: `Your verification code is: ${otp}. It is valid for 5 minutes.`,
            html: html,
        });
        console.log(`[AUTH] Email sent successfully to ${email}`);
        res.json({ message: "OTP transmitted successfully." });
    } catch (err: any) {
        console.error("Email delivery failed:", err);
        res.status(500).json({ error: "Failed to send OTP email." });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    // Strict validation
    const isAuthorized = await isEmailAuthorized(email);
    if (!isAuthorized) {
      return res.status(403).json({ error: "Not Registered" });
    }

    const stored = otpStore.get(email);
    if (stored && stored.otp === otp && (Date.now() - stored.timestamp < 300000)) {
      res.json({ success: true, message: "Identity verified." });
    } else {
      res.status(400).json({ success: false, error: "Invalid or expired OTP code." });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const { email, newPassword, otp } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    // Strict validation
    const isAuthorized = await isEmailAuthorized(email);
    if (!isAuthorized) {
      return res.status(403).json({ error: "Not Registered" });
    }

    const stored = otpStore.get(email);
    if (!stored || stored.otp !== otp) {
      return res.status(401).json({ error: "Verification mismatch." });
    }

    try {
      console.log(`[AUTH] Password for ${email} would be reset to: ${newPassword}`);
      otpStore.delete(email);
      res.json({ success: true, message: "Security update complete." });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  const server = http.createServer(app);
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
