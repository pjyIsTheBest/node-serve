module.exports = {
    apps: [{
        name: "node-serve",
        script: "./app.js",
        env: {
            NODE_ENV: "production",
        },
        env_production: {
            NODE_ENV: "production",
        }
    }],
};