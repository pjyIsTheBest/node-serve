const express = require('express')
const router = express.Router();
const moment = require('moment');
const { pool, query } = require("../config/mysql.js")
const { md5, createToken } = require("../util/index")
const tokenValidate = require("../util/tokenValidate")
const { logInput, logOutput, logError } = require("../config/log4")
/**
 * 
 * @api {post} /user/login 登录
 * @apiVersion 1.0.0
 * @apiName 登录
 * @apiGroup user
 * @apiBody {String} account 账号
 * @apiBody {String} passowrd 密码
 * @apiSuccess {Number} code 200
 * @apiSuccess {Object} data 用户信息
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  code: 200,
 *  data: {
 *    token: '',
 *    name:'',
 *    account:"",
 *    role:'',
 *    status:'',
 * 
 *  }
 * }
 * 
 */
router.post("/login", async (req, res) => {
    const { account, password } = req.body;

    if (!account) {
        res.json({
            code: 500,
            data: null,
            msg: '账号不能为空！'
        })
        return
    }
    if (!password) {
        res.json({
            code: 500,
            data: null,
            msg: '密码不能为空！'
        })
        return
    }
    if (password.length < 6 || password.length > 20) {
        res.json({
            code: 500,
            data: null,
            msg: '请填写6-20位密码'
        })
        return
    }
    try {
        let [user] = await query(`SELECT * FROM user WHERE account=:account`, { account })
        if (!user) {
            res.json({
                code: 500,
                data: null,
                msg: '账号或密码错误'
            })
            return;
        }
        if (user.status == '02') {
            res.json({
                code: 500,
                msg: '您的账号已被锁定，请联系管理员！',
                data: null
            })
            return;
        }
        if (user.status == '03') {
            res.json({
                code: 500,
                msg: '您的账号已被禁用，请联系管理员！',
                data: null
            })
            return;
        }
        if (user.password == md5(password)) {
            let token = createToken(user.id);
            await query(`UPDATE user SET token=:token,tokenUpdateTime=:tokenUpdateTime,${pool.escapeId('limit')}=:limit WHERE id=:id`,

                { token, tokenUpdateTime: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'), limit: 5, id: user.id }
            )
            res.json({
                code: 200,
                data: {
                    token: token,
                    name: user.name,//用户名
                    account: user.account,//账号
                    role: user.role,//角色
                    status: user.status,//账号状态：01 正常 02 锁定 03 禁用

                },
                msg: '登录成功，欢迎您！'
            })

        } else {
            let limit = user.limit - 1;
            let status = limit <= 0 ? '02' : '01';

            await query(`UPDATE user SET ${pool.escapeId('limit')}=:limit,status=:status WHERE id=:id`, { limit, status, id: user.id })
            res.json({
                code: 500,
                data: null,
                msg: limit <= 0 ? '您的账号已被锁定，请联系管理员！' : `密码错误，您还有${limit}次机会重新输入！`
            })
        }
    } catch (error) {
        logError(error)
        res.json({
            code: 500,
            msg: '出错啦',
            data: null
        })
    }


})

/**
 * 
 * @api {get} /user/find 查询用户列表
 * @apiVersion 1.0.0
 * @apiName 查询用户列表
 * @apiGroup user
 * @apiQuery {String} account 账号
 * @apiQuery {String} name 用户名称
 * @apiQuery {String} phone 手机号
 * @apiQuery {String} pageIndex 页码
 * @apiQuery {String} pageSize 容量
 * @apiSuccess {Number} code 200
 * @apiSuccess {Object} data 用户信息
 * @apiSuccess {Object} total 总条目数
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  code: 200,
 *  data: {
 *      id，
 *      account,
 *      name,
 *      phone,
 *      role,
 *      remarks,
 *      status,
 *      createAt
 *  },
 *  total:1
 * }
 * 
 */
router.get('/find', tokenValidate, async (req, res) => {
    let { account, name, phone, pageIndex = 1, pageSize = 20 } = req.query;

    try {
        pageIndex = Number(pageIndex)
        pageSize = Number(pageSize)
        let [user, [{ total }]] = await query(`
        SELECT 
        a.id, a.account, a.name, a.phone, a.remarks, a.status, a.createAt, 
        b.id AS roleId, b.name AS roleName 
        FROM user AS a, role AS b 
        WHERE 
        (a.account=:account || :account IS NULL || :account='') AND (a.name=:name || :name IS NULL || :name='') AND (a.phone=:phone || :phone IS NULL || :phone='') 
        AND a.role = b.id
        ORDER BY createAt DESC
        LIMIT :limit OFFSET :offset;
        SELECT COUNT(*) as total FROM user;
        `,
            {
                account, name, phone, limit: pageSize, offset: (pageIndex - 1) * pageSize
            }
        )

        res.json({
            code: 200,
            data: user,
            total,
            msg: '查询成功'
        })
    } catch (error) {
        logError(error)
        res.json({
            code: 500,
            msg: '出错啦',
            data: null
        })
    }
})
/**
 * 
 * @api {post} /user/add 新增用户
 * @apiVersion 1.0.0
 * @apiName 新增用户
 * @apiGroup user
 * @apiBody {String} account 账号
 * @apiBody {String} password 密码
 * @apiBody {String} name 用户名称
 * @apiBody {String} phone 手机号
 * @apiBody {String} role 角色id
 * @apiBody {String} remarks 备注
 * @apiSuccess {Number} code 200
 * @apiSuccess {Object} data 用户信息
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  code: 200,
 *  data: null
 * }
 * 
 */
router.post("/add", tokenValidate, async (req, res) => {
    const { account, password, name, phone, role, remarks } = req.body;
    try {
        let hasUser = await query(`
            SELECT account FROM user WHERE account=:account
        `,
            { account })
        if (hasUser.length > 0) {
            res.json({
                code: 500,
                msg: '用户已存在',
                data: null
            })
            return;
        }
        let data = await query(`
        INSERT INTO user (account, password, name, phone, role, remarks,createAt,updateAt) VALUES (:account, :password, :name, :phone, :role, :remarks,:createAt,:updateAt)
        `,
            { account, password: md5(password), name, phone, role: Number(role), remarks, createAt: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'), updateAt: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss') }
        )
        if (data.affectedRows === 0) {
            res.json({
                code: 500,
                msg: '添加失败',
                data
            })
            return;
        }
        res.json({
            code: 200,
            msg: '添加成功',
            data
        })
    } catch (error) {
        logError(error)
        res.json({
            code: 500,
            msg: '出错啦',
            data: null
        })
    }
})
/**
 * 
 * @api {post} /user/update 修改用户
 * @apiVersion 1.0.0
 * @apiName 修改用户
 * @apiGroup user
 * @apiBody {String} id user id
 * @apiBody {String} account 账号
 * @apiBody {String} name 用户名称
 * @apiBody {String} phone 手机号
 * @apiBody {String} role 角色id
 * @apiBody {String} remarks 备注
 * @apiSuccess {Number} code 200
 * @apiSuccess {Object} data 用户信息
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  code: 200,
 *  data: null
 * }
 * 
 */
router.post('/update', tokenValidate, async (req, res) => {
    const { id, account, name, phone, role, remarks } = req.body;
    try {
        let data = await query(`
        UPDATE user SET account=:account, name=:name, phone=:phone, role=:role, remarks=:remarks
        WHERE id=:id
        `,
            { id, account, name, phone, role, remarks }
        )
        if (data.affectedRows === 0) {
            res.json({
                code: 500,
                msg: '修改失败',
                data
            })
            return;
        }
        res.json({
            code: 200,
            msg: '修改成功',
            data
        })
    } catch (error) {
        logError(error)
        res.json({
            code: 500,
            msg: '出错啦',
            data: null
        })
    }
})
/**
 * 
 * @api {post} /user/update 删除用户
 * @apiVersion 1.0.0
 * @apiName 删除用户
 * @apiGroup user
 * @apiBody {String} id user id
 * @apiSuccess {Number} code 200
 * @apiSuccess {Object} data 用户信息
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  code: 200,
 *  data: null
 * }
 * 
 */
router.post('/delete', tokenValidate, async (req, res) => {
    let { id } = req.body;
    try {
        let data = await query(`
        DELETE FROM user WHERE id=:id
        `,
            { id })
        if (data.affectedRows === 0) {
            res.json({
                code: 500,
                msg: '删除失败',
                data
            })
            return;
        }
        res.json({
            code: 200,
            msg: '删除成功',
            data
        })
    } catch (error) {
        logError(error)
        res.json({
            code: 500,
            msg: '出错啦',
            data: null
        })
    }
})
/**
 * 
 * @api {post} /user/updateStatus 禁用 锁定、解锁
 * @apiVersion 1.0.0
 * @apiName 禁用 锁定、解锁
 * @apiGroup user
 * @apiBody {String} id user id
 * @apiBody {String} status user status
 * @apiSuccess {Number} code 200
 * @apiSuccess {Object} data 用户信息
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  code: 200,
 *  data: null
 * }
 * 
 */
router.post("/updateStatus", tokenValidate, async (req, res) => {
    let { id, status } = req.body;
    try {
        if (!id) {
            res.json({
                code: 500,
                msg: 'id必填',
                data: null
            })
            return
        }
        if (!['01', '02', '03'].includes(status)) {
            res.json({
                code: 500,
                msg: 'status非法',
                data: null
            })
            return;

        }
        let data = await query(`
        UPDATE user set status=:status WHERE id=:id
        `,
            {
                id, status
            })
        if (data.affectedRows === 0) {
            res.json({
                code: 500,
                msg: '操作失败',
                data
            })
            return;
        }
        res.json({
            code: 200,
            msg: '操作成功',
            data
        })

    } catch (error) {
        logError(error)
        res.json({
            code: 500,
            msg: '出错啦',
            data: null
        })
    }
})
/**
 * 
 * @api {post} /user/changePwd 修改密码
 * @apiVersion 1.0.0
 * @apiName 修改密码
 * @apiGroup user
 * @apiBody {String} oldPwd 原密码
 * @apiBody {String} newPwd 新密码
 * @apiSuccess {Number} code 200
 * @apiSuccess {Object} data 用户信息
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  code: 200,
 *  data: null
 * }
 * 
 */
router.post("/changePwd", tokenValidate, async (req, res) => {
    let { oldPwd, newPwd, userInfo } = req.body;
    try {
        if (md5(oldPwd) != userInfo.password) {
            res.json({
                code: 500,
                data: null,
                msg: '原密码输入错误！'
            })
            return;
        }
        let data = await query(`
        UPDATE user SET password=:password WHERE id=:id
        `,
            { password: md5(newPwd), id: userInfo.id })
        if (data.affectedRows === 0) {
            res.json({
                code: 500,
                msg: '操作失败',
                data
            })
            return;
        }
        res.json({
            code: 200,
            msg: '操作成功',
            data
        })
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