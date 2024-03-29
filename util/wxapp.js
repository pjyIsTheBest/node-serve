const { WX_APP_ID, WX_APP_SECRET } = process.env;
const { redis } = require("../config/redis");
const request = require('request');
const fs = require("fs")
const path = require("path")
const { logInput, logOutput, logError } = require("../config/log4")
    //获取微信接口调用凭据
const getAccessToken = async function() {
        let cache = await redis.get("access_token");
        if (!cache) {
            let data = {
                grant_type: 'client_credential',
                appid: WX_APP_ID,
                secret: WX_APP_SECRET,
                force_refresh: false
            };
            return new Promise((resolve, reject) => {
                request({
                    url: 'https://api.weixin.qq.com/cgi-bin/stable_token',
                    method: "POST",
                    json: true,
                    headers: {
                        "content-type": "application/json",
                    },
                    body: data
                }, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        const { errcode, errmsg, access_token, expires_in } = body;
                        if (errcode) {
                            reject({ errcode, errmsg })
                        } else {
                            redis.set("access_token", access_token, 'ex', expires_in)
                            resolve(access_token)
                        }
                    }
                })
            })
        } else {
            return Promise.resolve(cache)
        }
    }
    //获取小程序码
const getWxCode = async(page, scene) => {
        let data = {
            page,
            scene,
            check_path: true,
            env_version: "release"
                // env_version: 'trial'
        }
        let access_token = await getAccessToken();
        return new Promise((resolve, reject) => {

            request({
                url: 'https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=' + access_token,
                method: "POST",
                encoding: null,
                body: JSON.stringify(data),


            }, function(error, response, body) {

                if (!error && response.statusCode == 200) {
                    const { errcode, errmsg } = body;
                    if (errcode) {
                        logError(`生成小程序码失败，errcode=${errcode}，errmsg=${errmsg}`)
                        reject({ errcode, errmsg })
                    } else {
                        let fileName = `wxcode-${new Date().getTime()}.png`
                        fs.writeFile(path.join(__dirname, '../', `static/${fileName}`), body, 'binary', (err) => {
                            if (!err) {
                                resolve(fileName)
                            } else {
                                reject(err)
                            }
                        })
                    }
                }

            })


        })

    }
    //获取openId
const getOpenID = async(code) => {
        return new Promise((resolve, reject) => {
            request.get({
                url: `https://api.weixin.qq.com/sns/jscode2session?grant_type=authorization_code&appid=${WX_APP_ID}&secret=${WX_APP_SECRET}&js_code=${code}`,
            }, function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    let data = JSON.parse(body)
                    const { errcode, errmsg, openid } = data;
                    if (errcode) {
                        reject({ errcode, errmsg })
                    } else {
                        resolve(openid)
                    }
                }
            });
        })
    }
    //发送登录成功订阅消息
    //模板id：zI7MshZEeL1jxzZWqEJth2r0SkIQhyqb5Sdr9t9BgR0
const sendMsg = (openid, { name, date }) => {
    return new Promise(async(resolve, reject) => {
        let access_token = await getAccessToken();
        request({
            url: 'https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=' + access_token,
            method: "POST",
            json: true,
            headers: {
                "content-type": "application/json",
            },
            body: {
                template_id: 'zI7MshZEeL1jxzZWqEJth2r0SkIQhyqb5Sdr9t9BgR0',
                touser: openid,
                data: {
                    //登录人
                    'thing1': {
                        value: name
                    },
                    //登录时间
                    'time2': {
                        value: date
                    },
                },
                miniprogram_state: 'formal', //developer为开发版；trial为体验版；formal为正式版；默认为正式版
                lang: 'zh_CN'
            }
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                const { errcode, errmsg } = body;
                if (errcode != 0) {
                    logOutput(`消息推送失败，openId=${openid}，errcode=${errcode}，errmsg=${errmsg}`)
                } else {
                    logOutput(`消息推送成功，openId=${openid}`)
                }
                resolve(errcode)
            }
        })
    })
}
module.exports = {
    getAccessToken,
    getWxCode,
    getOpenID,
    sendMsg
}