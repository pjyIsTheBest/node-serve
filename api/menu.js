const express = require('express')
const router = express.Router();
const moment = require('moment');
const { pool, query } = require("../config/mysql.js")
const { md5, createToken } = require("../util/index")
const tokenValidate = require("../util/tokenValidate")
const { logInput, logOutput, logError } = require("../config/log4")
/**
 * 查询所有菜单
 * @api {get} /menu/findAll 查询所有菜单
 * @apiVersion 1.0.0
 * @apiName 查询所有菜单
 * @apiGroup menu
 * @apiSuccess {Number} code 200
 * @apiSuccess {Object} data 菜单信息
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  code: 200,
 *  data: {
 *    id: '',
 *    type:' 0 标题，1 菜单页，2 跳转外部链接',
 *    name:"路由名称 唯一",
 *    title:'路由标题',
 *    path:'url',
 *    component:"vue文件相对src的路径",
 *    parentId:"父级id",
 *    menu:'是否显示在菜单栏',
 *    order:'同级排序',
 *    layout:'是否为layout子路由',
 *    validate:'是否校验登录状态'
 *  }
 * }
 * 
 */
router.get("/findAll", tokenValidate, async (req, res) => {
    try {
        let menus = await query(`
            SELECT * FROM menu
        `)
        res.json({
            code: 200,
            msg: '查询成功',
            data: menus
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
 * @api {get} /menu/findByUser 查询当前账号所属角色的菜单
 * @apiVersion 1.0.0
 * @apiName 查询当前账号所属角色的菜单
 * @apiGroup menu
 * @apiSuccess {Number} code 200
 * @apiSuccess {Object} data 菜单信息
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  code: 200,
 *  data: {
 *    id: '',
 *    type:' 0 标题，1 菜单页，2 跳转外部链接',
 *    name:"路由名称 唯一",
 *    title:'路由标题',
 *    path:'url',
 *    component:"vue文件相对src的路径",
 *    parentId:"父级id",
 *    menu:'是否显示在菜单栏',
 *    order:'同级排序',
 *    layout:'是否为layout子路由',
 *    validate:'是否校验登录状态'
 *  }
 * }
 * 
 */
router.get("/findByUser", tokenValidate, async (req, res) => {
    let { userInfo } = req.body
    try {
        if (!userInfo.role) {
            res.json({
                code: 500,
                data: null,
                msg: '当前账号未绑定角色'
            })
            return;
        }
        let [role] = await query(`
        SELECT id,menuIds,status FROM role WHERE id=:id
       `,
            { id: userInfo.role })
        if (!role) {
            res.json({
                code: 500,
                data: null,
                msg: '绑定角色不存在'
            })
            return;
        }
        if (role && role.status == '02') {
            res.json({
                code: 500,
                data: null,
                msg: '绑定角色已被禁用'
            })
            return;
        }
        let menuIds = role.menuIds ? role.menuIds.split(",") : [];
        let menus = await query(`
            SELECT * FROM menu WHERE id IN (:menuIds)
        `,
            { menuIds })
        res.json({
            code: 200,
            data: menus,
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
 * @api {get} /menu/findByUserAndParentId 根据用户权限和父节点id查询对应子节点
 * @apiVersion 1.0.0
 * @apiName 根据用户权限和父节点id查询对应子节点
 * @apiGroup menu
 * @apiQuery {Int} parentId 父节点id
 * @apiSuccess {Number} code 200
 * @apiSuccess {Object} data 菜单信息
 * @apiSuccessExample {json} Success-Response:
 */
router.get("/findByUserAndParentId", tokenValidate, async (req, res) => {
    let { userInfo } = req.body
    let { parentId = 0 } = req.query;//默认查询根节点
    try {
        if (!userInfo.role) {
            res.json({
                code: 500,
                data: null,
                msg: '当前账号未绑定角色'
            })
            return;
        }
        let [role] = await query(`
        SELECT id,menuIds,status FROM role WHERE id=:id
       `,
            { id: userInfo.role })
        if (!role) {
            res.json({
                code: 500,
                data: null,
                msg: '绑定角色不存在'
            })
            return;
        }
        if (role && role.status == '02') {
            res.json({
                code: 500,
                data: null,
                msg: '绑定角色已被禁用'
            })
            return;
        }
        let menuIds = role.menuIds ? role.menuIds.split(",") : [];
        let menus = await query(`
            SELECT * FROM menu WHERE id IN (:menuIds) AND parentId=:parentId
        `,
            { menuIds, parentId })
        res.json({
            code: 200,
            data: menus,
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
 *  @api {get} /menu/findAllByUserAndParentId
 * @apiVersion 1.0.0
 * @apiName 根据父节点id查询所有对应子节点
 * @apiGroup menu
 * @apiQuery {Int} parentId 父节点id
 * @apiSuccess {Number} code 200
 * @apiSuccess {Object} data 菜单信息
 * @apiSuccessExample {json} Success-Response:
 */
router.get("/findAllByUserAndParentId", tokenValidate, async (req, res) => {
    let { userInfo } = req.body
    let { parentId = 0 } = req.query;//默认查询根节点
    try {
        if (!userInfo.role) {
            res.json({
                code: 500,
                data: null,
                msg: '当前账号未绑定角色'
            })
            return;
        }
        let [role] = await query(`
        SELECT id,menuIds,status FROM role WHERE id=:id
       `,
            { id: userInfo.role })
        if (!role) {
            res.json({
                code: 500,
                data: null,
                msg: '绑定角色不存在'
            })
            return;
        }
        if (role && role.status == '02') {
            res.json({
                code: 500,
                data: null,
                msg: '绑定角色已被禁用'
            })
            return;
        }
        let menuIds = role.menuIds ? role.menuIds.split(",") : [];
        let menus = await query(`
        SELECT * FROM menu WHERE id IN (:menuIds)
        `,
            { menuIds })
        let arr = [];
        function test(id) {
            let a = [...menus].filter(i => i.parentId == id);

            if (a.length > 0) {
                a.forEach(e => {
                    arr.push(e);
                    test(e.id)
                })
            }

        }
        test(parentId)
        res.json({
            code: 200,
            data: arr,
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
 * @api {get} /menu/findByParentId 根据父节点id查询对应子节点
 * @apiVersion 1.0.0
 * @apiName 根据父节点id查询对应子节点
 * @apiGroup menu
 * @apiQuery {Int} parentId 父节点id
 * @apiSuccess {Number} code 200
 * @apiSuccess {Object} data 菜单信息
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  code: 200,
 *  data: {
 *    id: '',
 *    type:' 0 标题，1 菜单页，2 跳转外部链接',
 *    name:"路由名称 唯一",
 *    title:'路由标题',
 *    path:'url',
 *    component:"vue文件相对src的路径",
 *    parentId:"父级id",
 *    menu:'是否显示在菜单栏',
 *    order:'同级排序',
 *    layout:'是否为layout子路由',
 *    validate:'是否校验登录状态'
 *  }
 * }
 * 
 */
router.get('/findByParentId', tokenValidate, async (req, res) => {
    let { parentId } = req.query;
    try {
        let menus = await query(`
            SELECT * FROM menu WHERE parentId=:parentId
        `,
            { parentId })
        res.json({
            code: 200,
            data: menus,
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
 * @api {post} /menu/add 新增
 * @apiVersion 1.0.0
 * @apiName 新增菜单
 * @apiGroup menu
 * @apiBody {string} type 类型 0 标题，1 菜单页，2 跳转外部链接
 * @apiBody {string } name 路由名称 唯一
 * @apiBody {string } title 路由标题
 * @apiBody {string } path url地址
 * @apiBody {string } component vue文件相对src的路径
 * @apiBody {string } parentId 父级id
 * @apiBody {int } menu 是否显示在菜单栏 1是0否
 * @apiBody {int } layout 是否为layout子路由 1是0否
 * @apiBody {int } validate 是否校验登录状态 1是0否
 * @apiSuccess {Number} code 200
 * @apiSuccess {Object} data 菜单信息
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  code: 200,
 *  data: null
 * }
 * 
 */
router.post("/add", tokenValidate, async (req, res) => {
    let { type, name, title, path, component, parentId, menu, layout, validate } = req.body;
    try {
        //判断是否存在相同的name
        let hasSameName = await query('SELECT name FROM menu WHERE name=:name', { name });
        if (hasSameName.length > 0) {
            res.json({
                code: 500,
                msg: '存在相同name,请确认name的唯一性',
                data: null
            })
            return;
        }
        let brother = await query(`SELECT ${pool.escapeId('order')} FROM menu WHERE parentId=:parentId`, { parentId });
        //同级排序自增
        let order = brother.length > 0 ? Math.max(...brother.map(i => i.order)) : 0;
        let menus = await query(`
            INSERT INTO menu (type, name, title, path, component, parentId, menu, ${pool.escapeId('order')},layout, validate,createAt,updateAt) 
            VALUES (:type, :name, :title, :path, :component, :parentId, :menu, :order,:layout, :validate,:createAt,:updateAt) 
        `,
            {
                type, name, title, path, component, parentId, menu, order, layout, validate, createAt: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'), updateAt: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
            })
        if (menus.affectedRows == 0) {
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
            data: menu
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
 * @api {post} /menu/update 修改
 * @apiVersion 1.0.0
 * @apiName 修改菜单
 * @apiGroup menu
 * @apiBody {int} id 主键
 * @apiBody {string} type 类型 0 标题，1 菜单页，2 跳转外部链接
 * @apiBody {string } name 路由名称 唯一
 * @apiBody {string } title 路由标题
 * @apiBody {string } path url地址
 * @apiBody {string } component vue文件相对src的路径
 * @apiBody {string } parentId 父级id
 * @apiBody {int } menu 是否显示在菜单栏 1是0否
 * @apiBody {int } layout 是否为layout子路由 1是0否
 * @apiBody {int } validate 是否校验登录状态 1是0否
 * @apiSuccess {Number} code 200
 * @apiSuccess {Object} data 菜单信息
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  code: 200,
 *  data: null
 * }
 * 
 */
router.post('/update', tokenValidate, async (req, res) => {
    let { id, type, name, title, path, component, menu, layout, validate } = req.body;
    try {
        //判断是否存在相同的name
        let hasSameName = await query('SELECT name FROM menu WHERE name=:name AND id!=:id', { name, id });
        if (hasSameName.length > 0) {
            res.json({
                code: 500,
                msg: '存在相同name,请确认name的唯一性',
                data: null
            })
            return;
        }
        let menuData = await query(`
            UPDATE menu SET type=:type,name=:name,title=:title,path=:path,component=:component,menu=:menu,layout=:layout,validate=:validate,updateAt=:updateAt WHERE id=:id
        `,
            { id, type, name, title, path, component, menu, layout, validate, updateAt: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss') })
        if (menuData.affectedRows == 0) {
            res.json({
                code: 500,
                msg: '修改失败',
                data: null
            })
            return;
        }
        res.json({
            code: 200,
            msg: '添加成功',
            data: menuData
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
 * @api {post} /menu/delete 删除
 * @apiVersion 1.0.0
 * @apiName 删除菜单
 * @apiGroup menu
 * @apiBody {int} id 主键
 * @apiSuccess {Number} code 200
 * @apiSuccess {Object} data 菜单信息
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
        let menu = await query(`
            DELETE munu WHERE id=:id
        `,
            { id })
        if (menu.affectedRows == 0) {
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
            data: menu
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
 * @api {post} /menu/drop 节点拖拽排序
 * @apiVersion 1.0.0
 * @apiName 节点拖拽排序
 * @apiGroup menu
 * @apiBody {int} draggingId 被拖拽的id
 * @apiBody {int} dropId 被影响的id
 * @apiSuccess {Number} code 200
 * @apiSuccess {Object} data 菜单信息
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  code: 200,
 *  data: null
 * }
 * 
 */
router.post('/drop', tokenValidate, async (req, res) => {
    let { draggingId, dropId } = req.body;
    try {
        //交换order
        let menu = await query('UPDATE menu AS m1,menu AS m2 SET m1.`order`=m2.`order`,m2.`order`=m1.`order` WHERE m1.id=:draggingId AND m2.id=:dropId',
            {
                draggingId, dropId
            })
        if (menu.affectedRows == 0) {
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
            data: menu
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