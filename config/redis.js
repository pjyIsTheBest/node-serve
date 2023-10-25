const Redis = require('ioredis');
const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;
const redis = new Redis({ host: REDIS_HOST, port: REDIS_PORT, password: REDIS_PASSWORD });
redis.on('error', err => {
    if (err) {
        console.log('Redis链接错误');
        console.log(err);
        redis.quit() // 链接失败退出链接
    }
})

redis.on('ready', () => {
    console.log('Redis链接成功');
})
module.exports = {
    redis
}