require('dotenv').config();

module.exports = {
    apps: [
      {
        name: "rwi_strategy_" + process.env.NODE_ENV,
        script: "./app.js",
        exec_mode: "cluster",
        watch: true,
        error_file: 'logs/rwiStrategyErr.log',
        out_file: 'logs/rwiStrategyOut.log',
        log_file: 'logs/rwiStrategy.log',
        time: true,
        ignore_watch: ["node_modules","logs"],
        env: {
          NODE_ENV: "development",
          PORT: process.env.PORT
        },
        env_production: {
          PORT: 81,
          NODE_ENV: "production"
        }
      }
    ]
  };