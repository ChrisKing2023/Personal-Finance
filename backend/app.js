import "dotenv/config";
import express from "express";
import cors from "cors";
import connect from "./utils/db.connection";
import logger from "./utils/logger";
import userRouter from "./api/routes/user.routes";
import authRouter from "./api/routes/auth.routes";
import transactionRouter from "./api/routes/transaction.routes";
import budgetRouter from "./api/routes/budget.routes";
import currencyRouter from "./api/routes/currency.routes";
import categoryRouter from "./api/routes/category.routes";
import tagRouter from "./api/routes/tag.routes.js";
import reportRouter from "./api/routes/report.routes.js";
import goalRouter from "./api/routes/goal.routes.js";
import "./utils/recurringTransactions.js";
import helmet from "helmet";
import path from "path";

const PORT = process.env.PORT || 5000;

const app = express();

app.use(helmet());

// CSP for content security policy
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"], // Allow content from the same origin
      scriptSrc: ["'self'"], // Allow scripts from the same origin
      styleSrc: ["'self'", "https://fonts.googleapis.com"], // Allow styles from your origin and Google Fonts
      imgSrc: ["'self'"], // Allow images from your origin
      fontSrc: ["'self'", "https://fonts.gstatic.com"], // Allow fonts from Google Fonts
      connectSrc: ["'self'"], // Only allow connections to your own server
      objectSrc: ["'none'"], // Disallow object, embed, or applet tags
      formAction: ["'self'"], // Restrict form submissions to the same origin
      frameAncestors: ["'self'"], // Disallow embedding of the page in an iframe (Clickjacking protection)
      baseUri: ["'self'"], // Restrict base URI to the same origin
    },
  })
);

// Add X-Frame-Options for additional Clickjacking protection
app.use(
  helmet.frameguard({
    action: "sameorigin", // Allow embedding only from the same origin
  })
);

app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.send("User-agent: *\nDisallow: /admin/\n");
});

app.get("/sitemap.xml", (req, res) => {
  res.type("xml");
  res.sendFile(path.join(__dirname, "public", "sitemap.xml"));
});

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Add additional headers
app.use((req, res, next) => {
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

app.use(express.json({ limit: "50mb" }));

app.get("/", (req, res) => {
  res.send("Hello World! Server is running.");
});

app.use("/api/users", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/transaction", transactionRouter);
app.use("/api/budget", budgetRouter);
app.use("/api/currency", currencyRouter);
app.use("/api/category", categoryRouter);
app.use("/api/tags", tagRouter);
app.use("/api/report", reportRouter);
app.use("/api/goal", goalRouter);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    logger.info(`Server is running on port: ${PORT}`);
    connect();
  });
}

export default app;
