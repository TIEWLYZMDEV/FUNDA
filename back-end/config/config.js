const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const parseNumber = (value, fallbackValue) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallbackValue;
};

const sharedConfig = {
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || "127.0.0.1",
  dialect: process.env.DB_DIALECT || "mysql",
  port: parseNumber(process.env.DB_PORT, 3306),
  server_port: parseNumber(process.env.PORT, 5000),
};

module.exports = {
  development: {
    database: process.env.DB_NAME,
    ...sharedConfig,
  },
  test: {
    database: process.env.DB_NAME_TEST,
    ...sharedConfig,
  },
  production: {
    database: process.env.DB_NAME,
    ...sharedConfig,
  },
};
