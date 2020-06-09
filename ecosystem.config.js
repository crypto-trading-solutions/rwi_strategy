module.exports = {
    apps: [
      {
        name: "rwi_strategy",
        script: "./app.js",
        exec_mode: "cluster",
        watch: true,
        ignore_watch: ["node_modules"],
        env: {
          NODE_ENV: "development"
        },
        env_production: {
          PORT: 81,
          NODE_ENV: "production"
        }
      }
    ]
  };