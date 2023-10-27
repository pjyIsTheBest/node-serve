//生成token
const crypto = require("crypto");
const stringRandom = require('string-random');
const idiograph = 'idiograph.pjy.cool';
module.exports = {
    createToken: (str, times) => { //接受一个字符串和一个过期时间
        times = times || 30 * 60 * 1000;
        const jsonData = {
                data: str,
                timeout: times,
                createAt: Date.now()
            }
            //格式转成base64
        let base64Str = Buffer.from(JSON.stringify(jsonData), "utf8").toString("base64");
        //添加签名，防篡改        
        let hash = crypto.createHmac('sha256', idiograph);
        hash.update(base64Str);
        let signature = hash.digest('base64');
        return base64Str + "." + signature;
    },
    checkToken: (token) => {
        if (!token) {
            return false
        }
        let that = this;
        let decArr = token.split(".");
        if (decArr.length < 2) {
            //token不合法
            return false
        }
        try {
            //将第一段密文解析
            let res = JSON.parse(Buffer.from(decArr[0], "base64").toString("utf8"));
            //检验签名                
            let hash = crypto.createHmac('sha256', idiograph);
            hash.update(decArr[0]);
            let checkSignature = hash.digest('base64');
            //将第一段密文生成签名，与第二段比较是否一样
            if (checkSignature != decArr[1]) {
                return false
            }
            //签名校验通过返回解密后的数据
            return res
        } catch (error) {
            return false
        }

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