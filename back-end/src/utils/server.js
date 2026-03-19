const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const notFound = require("../middleware/notFound");
const errorHandler = require("../middleware/errorHandler");
const tableRouter = require("../routes/table.router");
const reservationRouter = require("../routes/reservation.router");

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = allowedOrigins.length
  ? {
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error("Origin is not allowed by CORS"));
      },
    }
  : {};

const createServer = () => {
  const app = express();

  app.set("trust proxy", 1);
  app.use(cors(corsOptions));
  app.use(helmet({ crossOriginResourcePolicy: false })); // middleware for more secure response headers
  app.use(express.json());
  app.use("/api/v1", require("../routes"));
  app.use("/api/v1/tables", tableRouter);
  app.use("/api/v1/reservations", reservationRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
};

module.exports = createServer;
