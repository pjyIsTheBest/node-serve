const express = require('express')
const router = express.Router();
const { log,logError } = require("../config/log4")
// openAi
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    apiKey: process.env.OPEN_AI_KEY,
});
const openai = new OpenAIApi(configuration);

router.post("/chat", async (req, res) => {
    try {
        const {title} = req.body
        const {data} = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: title,
            temperature: 0,
            max_tokens: 2999,
            top_p: 1,
            frequency_penalty: 0.0,
            presence_penalty: 0.0,
            stop: ["{}"],
        })
        log(data)
        res.json({code: 200, data: data})
    } catch (error) {
        logError(error)
        res.json({
            code: 500,
            msg: '出错啦',
            data: null
        })
    }
})

router.post("/chat2", async (req, res) => {
    try {
        const {title} = req.body

        res.json({code: 200, data: title})
    } catch (error) {
        logError(error)
        res.json({
            code: 500,
            msg: '出错啦',
            data: null
        })
    }
})
module.exports = router
