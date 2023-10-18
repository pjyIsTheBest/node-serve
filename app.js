//注入环境变量
const dotenv = require("dotenv")
dotenv.config({ path: `./.env.${process.env.NODE_ENV}` })

const express = require('express')
const app = express()
const bodyParser = require('body-parser');

const { originWhiteList } = require('./config/index')
const api = require("./api/index");
const { log } = require("./config/log4")



app.all('*', function(req, res, next) {
    //白名单
    // if (originWhiteList.includes(req.headers.origin)) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length,Authorization, Accept, X-Requested-With,x-custom-header');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    // }

    if (req.method == 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    if (req.url === '/favicon.ico' || req.url == '/robots.txt') {
        res.sendStatus(200);
        return
    }
    console.log(req.headers)
    log(`ip来源: ${req.ip} origin ${req.headers.origin}`)
    next();
});
app.use('/static', express.static('static'));
//接口文档目录
app.use('/apidoc', express.static('apidoc'));
app.use(bodyParser.json());

// 创建 application/x-www-form-urlencoded 编码解析 如果你传输的内容不是string类型时 extended: true;
app.use(bodyParser.urlencoded({ extended: false }));
//测试
app.get('/', function(req, res) {
    res.send('哟呵，雷猴呀');
});
app.post("/test", function(req, res) {
    res.send('666')
})
api(app)

app.listen(process.env.PORT, () => {
    console.log(`服务已启动，端口号：${process.env.PORT}`);
});