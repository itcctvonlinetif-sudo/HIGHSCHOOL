const path = require("node:path");

module.exports = {
  apps: [
    {
      name: "zein-page-api",
      cwd: path.resolve(__dirname, "../.."),
      script: "./artifacts/api-server/dist/index.mjs",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: 8080,
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      time: true,
    },
  ],
};