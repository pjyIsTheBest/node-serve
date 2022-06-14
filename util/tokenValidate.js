const { checkToken } = require("../util/index")
const { query } = require("../config/mysql.js")
const moment = require('moment');
module.exports = async (req, res, next) => {
    const token = req.headers['authorization'];
    let data = checkToken(token)
    if (!data) {
        res.json({
            code: 400,
            data: '',
            msg: '签名非法，请重新登录'
        })
    } else {
        try {
            let str = data.data;
            let [userInfo] = await query(`SELECT * FROM user WHERE id=:id`, { id: str })
            if (userInfo.status == '03') {
                res.json({
                    code: 400,
                    msg: '您的账号已被禁用，请联系管理员！',
                    data: null
                })
                return;
            }
            if (userInfo.token === token) {
                let now = new Date().getTime();
                let tokenCreateTime = new Date(userInfo.tokenUpdateTime).getTime();
                if (now - tokenCreateTime < data.timeout) {
                    await query(`UPDATE user set tokenUpdateTime=:tokenUpdateTime WHERE id=:id`, { tokenUpdateTime: moment(now).format('YYYY-MM-DD HH:mm:ss'), id: userInfo.id })
                    req.body.userInfo = userInfo; //将当前用户信息写入
                    next()
                } else {
                    res.json({
                        code: 400,
                        data: data.data,
                        msg: '登录超时，请重新登录'
                    })
                }
            } else {
                res.json({
                    code: 400,
                    data: data.data,
                    msg: '登录超时，请重新登录'
                })
            }
        } catch (e) {
            res.json({
                code: 500,
                msg: e
            })
            throw Error(e);
        }
    }

}