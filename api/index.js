const { logInput } = require("../config/log4")

const user = require('./user.js')
const role = require("./role")
const menu = require("./menu")
module.exports = (app) => {
    app
        .use((req, res, next) => {
            logInput(`method: ${req.method} url: ${req.url}`)
            next()
        })
        .use('/api/user', user)
        .use('/api/role', role)
        .use("/api/menu", menu)
}