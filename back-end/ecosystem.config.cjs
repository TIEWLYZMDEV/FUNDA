module.exports = {
  apps: [
    {
      name: "rtrs-backend",
      script: "./src/app.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
    },
  ],
};
