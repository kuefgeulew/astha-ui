import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import voiceRoutes from "./routes/voice.ts";



dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: true, // allow dev from any origin; tighten for prod
    credentials: true,
  })
);

app.get("/v1/health", (_req, res) =>
  res.json({ ok: true, service: "astha-voice-server" })
);

// Retell + Vapi endpoints
app.use("/v1/voice", voiceRoutes);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Voice server listening on http://localhost:${port}`);
});
