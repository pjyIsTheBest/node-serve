const { checkToken, updateToken } = require("../util/index")
const { query } = require("../config/mysql.js")
module.exports = async(req, res, next) => {
    const token = req.headers['authorization'];
    let userId = checkToken(token)
    if (!userId) {
        res.json({
            code: 400,
            data: null,
            msg: '令牌失效，请重新登录'
        })
    } else {
        try {
            let [userInfo] = await query(`SELECT * FROM user WHERE id=:id`, { id: userId })
            if (userInfo.status == '03') {
                res.json({
                    code: 400,
                    msg: '您的账号已被禁用，请联系管理员！',
                    data: null
                })
                return;
            }
            //延长时间
            updateToken(token, userId)
            req.body.userInfo = userInfo; //将当前用户信息写入
            next()
        } catch (e) {
            res.json({
                code: 500,
                data: null,
                msg: e
            })
        }
    }

}