const { logInput } = require("../config/log4")

const user = require('./user.js')
const role = require("./role")
const menu = require("./menu")
const openAi = require("./openAi.js")
const authLogin = require('./authLogin')
module.exports = (app) => {
    app
        .use((req, res, next) => {
            logInput(`method: ${req.method} url: ${req.url}`)
            next()
        })
        .use('/api/user', user)
        .use('/api/role', role)
        .use("/api/menu", menu)
        .use("/api/openAi", openAi)
        .use('/api/auth', authLogin)
}