//生成token
const crypto = require("crypto");
const stringRandom = require('string-random');
const idiograph = 'idiograph.pjy.cool';
const { redis } = require("../config/redis");
const { encrypt, decrypt } = require("./rsa")
module.exports = {
    createToken: async(userId, times = 30 * 60) => { //接受一个字符串和一个过期时间
        let token = encrypt(String(userId))
        await redis.set(token, userId, 'ex', times)
        return token;
    },
    checkToken: async(token) => {
        if (!token) {
            return false
        }
        let userId = await redis.get(token);
        if (!userId) {
            return false
        }
        if (userId != decrypt(token)) {
            return false
        }
        return userId;

    },
    updateToken(token, userId, times = 30 * 60) {
        redis.set(token, userId, 'ex', times)
    },
    md5: function(str) { //字符串加密
        let md5 = crypto.createHash('md5');
        return md5.update(str).digest('hex');
    },
    dateFormat: (fmt, date) => {
        let ret;
        const opt = {
            "Y+": date.getFullYear().toString(), // 年
            "m+": (date.getMonth() + 1).toString(), // 月
            "d+": date.getDate().toString(), // 日
            "H+": date.getHours().toString(), // 时
            "M+": date.getMinutes().toString(), // 分
            "S+": date.getSeconds().toString() // 秒
                // 有其他格式化字符需求可以继续添加，必须转化成字符串
        };
        for (let k in opt) {
            ret = new RegExp("(" + k + ")").exec(fmt);
            if (ret) {
                fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
            };
        };
        return fmt;
    },
    getIp: function(req) {
        var ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddres || req.socket.remoteAddress || '';
        if (ip.split(',').length > 0) {
            ip = ip.split(',')[0];
        }
        return ip;
    },
    randomString: (len = 32) => {
        return stringRandom(len)
    }

}