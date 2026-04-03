// backend/app.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";

// 🧩 Middleware Imports
// 🔐 Security Middlewares
import {
  helmetMiddleware,
  createRateLimiterMiddleware,
  createSanitizeMiddleware,
} from "./middleware/security/index.js";
import {
  credentialsMiddleware,
  createApiVersionMiddleware,
} from "./middleware/core/index.js";

// 📊 Logging & Monitoring Middlewares
import {
  createRequestIdMiddleware,
  createLoggingMiddleware,
  createUserActivityLogger,
} from "./middleware/core/index.js";

// 🔄 Processing Middlewares
import {
  bodyParserMiddleware,
  contentTypeNegotiationMiddleware,
} from "./middleware/core/index.js";

// ⚡ Error Handling
import {
  errorHandlerMiddleware,
  notFoundMiddleware,
} from "./middleware/errors/index.js";

// 🚦 Route Handlers
import authRoutes from "./routes/auth/auth-routes.js";
import healthRoutes from "./routes/health/health-routes.js";
import testRoutes from "./routes/test/test-routes.js";
import userRoutes from "./routes/user/user-routes.js";
import postRoutes from "./routes/post/post-routes.js";
import { mountSwagger } from "./docs/swagger/index.js";

// 🌍 Environment & Core Dependencies
// Cloudinary initialization moved to index.js to ensure env vars are loaded first

// 🔧 Initialization
const app = express();
app.set('trust proxy', 1);

// Swagger API Documentation
mountSwagger(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ========================
   🛡️ SECURITY MIDDLEWARES
   ======================== */
app.use(createApiVersionMiddleware({ currentVersion: "1" })); // API version headers
app.use(helmetMiddleware); // Security headers
app.use(createRateLimiterMiddleware()); // Rate limiting
app.use(credentialsMiddleware); // CORS credentials
app.use(createSanitizeMiddleware); // Input sanitization

/* ========================
   📊 MONITORING MIDDLEWARES
   ======================== */
app.use(createRequestIdMiddleware()); // Request ID generation
app.use(createLoggingMiddleware); // Request logging
app.use(
  createUserActivityLogger({ excludedRoutes: ["/test-error", "/assets"] })
); // User activity tracking

/* ========================
   🔄 PROCESSING MIDDLEWARES
   ======================== */
app.use(bodyParserMiddleware); // Body parsing
app.use(cookieParser()); // Cookie parsing
app.use(contentTypeNegotiationMiddleware); // Content negotiation

/* ========================
   📁 STATIC ASSETS
   ======================== */
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

/* ========================
   🚀 API ROUTES
   ======================== */
// 🔓 Public/Unauthenticated Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/health", healthRoutes);

// 🔒 Protected Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/posts", postRoutes);

// 🧪 Test Routes (Development only)
if (process.env.NODE_ENV === "development") {
  app.use("/test", testRoutes);
  console.log("🔬 Test routes enabled at /test/*");
}

// 404 Handler (catch all unhandled routes)
app.use("*", notFoundMiddleware);
app.use(errorHandlerMiddleware);

export default app;
