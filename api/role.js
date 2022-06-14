const express = require('express')
const router = express.Router();
const moment = require('moment');
const { pool, query } = require("../config/mysql.js")
const { md5, createToken } = require("../util/index")
const tokenValidate = require("../util/tokenValidate")
const { logInput, logOutput, logError } = require("../config/log4")
/**
 * 
 * @api {get} /role/find 分页查询角色列表
 * @apiVersion 1.0.0
 * @apiName 分页查询角色列表
 * @apiGroup role
 * @apiQuery {String} name 角色名称
 * @apiQuery {NUmber} pageIndex 页面
 * @apiQuery {NUmber} pageSize
 * @apiSuccess {Number} code 200
 * @apiSuccess {Object} data 角色信息
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  code: 200,
 *  data: {
 *    id: '',
 *    name:'',
 *    remarks:"",
 *    status:'',
 *    createAt:'',
 *    updateAt
 *  },
 *  total
 * }
 * 
 */
router.get("/find", tokenValidate, async (req, res) => {
    let { name, pageIndex, pageSize } = req.query;
    try {
        pageSize = Number(pageSize);
        pageIndex = Number(pageIndex);
        let [role, [{ total }]] = await query(`
            SELECT * FROM role WHERE name=:name OR :name=NULL OR :name='' 
            ORDER BY createAt DESC
            LIMIT :limit OFFSET :offset;
            SELECT COUNT(*) as total FROM role;
        `,
            { name, limit: pageSize, offset: (pageIndex - 1) * pageSize }
        )
        res.json({
            code: 200,
            data: role,
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
 * @api {get} /role/findAll 查询所有角色
 * @apiVersion 1.0.0
 * @apiName 查询所有角色
 * @apiGroup role
 * @apiSuccess {Number} code 200
 * @apiSuccess {Object} data 角色信息
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  code: 200,
 *  data: {
 *    id: '',
 *    name:'',
 *    remarks:"",
 *    status:'',
 *    createAt:'',
 *    updateAt
 *  }
 * }
 * 
 */
router.get("/findAll", tokenValidate, async (req, res) => {
    try {
        let roles = await query(`
            SELECT id,name FROM role WHERE status='01';
        `,
        )
        res.json({
            code: 200,
            data: roles,
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
 * @api {post} /role/add 新增角色
 * @apiVersion 1.0.0
 * @apiName 新增角色
 * @apiGroup role
 * @apiBody {String} name 名称
 * @apiBody {String} remarks 备注
 * @apiSuccess {Number} code 200
 * @apiSuccess {Object} data 角色信息
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  code: 200,
 *  data: null
 * }
 * 
 */
router.post('/add', tokenValidate, async (req, res) => {
    let { name, remarks } = req.body;
    try {
        let findRole = await query(`
            SELECT name FROM role WHERE name=:name
        `,
            { name })
        if (findRole.length > 0) {
            res.json({
                code: 500,
                msg: '已有同名角色存在',
                data: null
            })
            return;
        }
        let role = await query(`
            INSERT INTO role (name,remarks,createAt,updateAt) VALUES (:name,:remarks,:createAt,:updateAt)
        `,
            { name, remarks, createAt: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'), updateAt: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'), })

        if (role.affectedRows == 0) {
            res.json({
                code: 500,
                msg: '添加失败',
                data: null
            })
            return;
        }
        res.json({
            code: 200,
            msg: '添加成功',
            data: role
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
 * @api {post} /role/update 修改角色
 * @apiVersion 1.0.0
 * @apiName 修改角色
 * @apiGroup role
 * @apiBody {int} id 主键
 * @apiBody {String} name 名称
 * @apiBody {String} remarks 备注
 * @apiSuccess {Number} code 200
 * @apiSuccess {Object} data 角色信息
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  code: 200,
 *  data: null
 * }
 * 
 */
router.post("/update", tokenValidate, async (req, res) => {
    let { id, name, remarks } = req.body;
    try {
        let role = await query(`
            UPDATE role SET name=:name,remarks=:remarks WHERE id=:id
        `,
            { id, name, remarks })
        if (role.affectedRows == 0) {
            res.json({
                code: 500,
                msg: '修改失败',
                data: null
            })
            return;
        }
        res.json({
            code: 200,
            msg: '修改成功',
            data: role
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
 * @api {post} /role/delete 删除角色
 * @apiVersion 1.0.0
 * @apiName 删除角色
 * @apiGroup role
 * @apiBody {int} id 主键
 * @apiSuccess {Number} code 200
 * @apiSuccess {Object} data 角色信息
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  code: 200,
 *  data: null
 * }
 * 
 */
router.post("/delete", tokenValidate, async (req, res) => {
    let { id } = req.body;
    try {
        let role = await query(`
            DELETE FROM role WHERE id=:id
        `,
            { id })
        if (role.affectedRows == 0) {
            res.json({
                code: 500,
                msg: '删除失败',
                data: null
            })
            return;
        }
        res.json({
            code: 200,
            msg: '删除成功',
            data: role
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
 * @api {post} /role/updateStatus 禁用、解禁角色
 * @apiVersion 1.0.0
 * @apiName 禁用、解禁角色
 * @apiGroup role
 * @apiBody {int} id 主键
 * @apiBody {string} status 状态
 * @apiSuccess {Number} code 200
 * @apiSuccess {Object} data 角色信息
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  code: 200,
 *  data: null
 * }
 * 
 */
router.post('/updateStatus', tokenValidate, async (req, res) => {
    let { id, status } = req.body;
    try {
        if (!['01', '02'].includes(status)) {
            res.json({
                code: 500,
                msg: 'status非法',
                data: null
            })
            return;
        }
        let role = await query(`
            UPDATE role SET status=:status WHERE id=:id
        `,
            { id, status })
        if (role.affectedRows == 0) {
            res.json({
                code: 500,
                msg: '操作失败',
                data: null
            })
            return;
        }
        res.json({
            code: 200,
            msg: '操作成功',
            data: role
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
 * @api {get} /role/findById 查询单个角色信息
 * @apiVersion 1.0.0
 * @apiName 查询单个角色信息
 * @apiGroup role
 * @apiQuery {int} id 主键
 * @apiSuccess {Number} code 200
 * @apiSuccess {Object} data 角色信息
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  code: 200,
 *  data: null
 * }
 * 
 */
router.get("/findById", tokenValidate, async (req, res) => {
    let { id } = req.query;
    try {
        let [role] = await query(`
            SELECT * FROM role WHERE id=:id
        `, {
            id
        })
        if (role) {
            res.json({
                code: 200,
                msg: '查询成功',
                data: role
            })
        } else {
            res.json({
                code: 500,
                msg: '角色不存在',
                data: role
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
 * @api {post} /role/updateMenuIds 设置角色绑定的菜单
 * @apiVersion 1.0.0
 * @apiName 设置角色绑定的菜单
 * @apiGroup role
 * @apiBody {int} id 主键
 * @apiBody {String} menuIds 菜单id字符串拼接
 * @apiBody {string} status 状态
 * @apiSuccess {Number} code 200
 * @apiSuccess {Object} data 角色信息
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  code: 200,
 *  data: null
 * }
 * 
 */
router.post('/updateMenuIds', tokenValidate, async (req, res) => {
    let { id, menuIds } = req.body;
    try {
        let role = await query(`
            UPDATE role SET menuIds=:menuIds WHERE id=:id
        `, {
            id, menuIds
        })
        if (role.affectedRows == 0) {
            res.json({
                code: 500,
                msg: '操作失败',
                data: null
            })
            return;
        }
        res.json({
            code: 200,
            msg: '操作成功',
            data: role
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