import "express-async-errors";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./lib/env.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { csrfProtection, issueCsrfToken } from "./middleware/csrf.js";
import { globalLimiter } from "./middleware/rateLimit.js";
import { activityRouter } from "./routes/activity.js";
import { appsRouter } from "./routes/apps.js";
import { authRouter } from "./routes/auth.js";
import { commentsRouter } from "./routes/comments.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { exportRouter } from "./routes/export.js";
import { searchRouter } from "./routes/search.js";
import { uploadRouter } from "./routes/upload.js";
import { milestonesRouter } from "./routes/milestones.js";
import { notificationsRouter } from "./routes/notifications.js";
import { collaborationRouter } from "./routes/collaboration.js";
import { shareRouter } from "./routes/share.js";
import { usersRouter } from "./routes/users.js";
import { vaultRouter } from "./routes/vault.js";

export const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", env.CLIENT_ORIGIN],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        baseUri: ["'self'"],
        formAction: ["'self'"]
      }
    }
  })
);
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(globalLimiter);

app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/api/csrf", issueCsrfToken);
app.use(csrfProtection);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api", dashboardRouter);
app.use("/api/apps", appsRouter);
app.use("/api", milestonesRouter);
app.use("/api", activityRouter);
app.use("/api", vaultRouter);
app.use("/api", commentsRouter);
app.use("/api", searchRouter);
app.use("/api", exportRouter);
app.use("/api", uploadRouter);
app.use("/api", notificationsRouter);
app.use("/api", collaborationRouter);
app.use("/api", shareRouter);

app.use(notFound);
app.use(errorHandler);
