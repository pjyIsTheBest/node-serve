const express = require('express')
const router = express.Router();
const { pool, query } = require("../config/mysql.js")
const { logInput, logOutput, logError } = require("../config/log4")
const { getWxCode, getOpenID } = require('../util/wxapp')
    // var contentDisposition = require('content-disposition');
const { ORIGIN } = process.env;
const moment = require("moment");
const { encrypt, decrypt } = require("../util/rsa")
const { redis } = require("../config/redis");
const { randomString, createToken } = require("../util/index");
//生成授权码小程序码
router.get("/getCode", async(req, res) => {
        try {
            //生成随机数
            let certificates = randomString();
            redis.set(certificates, '0', 'ex', 5 * 60) //5分钟有效
            let fileName = await getWxCode("pages/auth/index", certificates);
            res.json({
                code: 200,
                data: {
                    url: `${ORIGIN}/static/${fileName}`,
                    certificates,
                },
                msg: '获取成功'
            })
        } catch (error) {
            res.json({
                code: 500,
                data: error,
                msg: '获取失败'
            })
        }

    })
    //查询授权状态
router.get("/getStatus", async(req, res) => {
        try {
            const { certificates } = req.query;
            let value = await redis.get(certificates)
            console.log(value)
            if (!value) {
                res.json({
                    code: 200,
                    data: {
                        status: -1
                    },
                    msg: '已失效'
                })
                return;
            }
            if (value == '0') {
                res.json({
                    code: 200,
                    data: {
                        status: 0
                    },
                    msg: '待授权'
                })
                return;
            }
            if (value == '1') {
                res.json({
                    code: 200,
                    data: {
                        status: 1
                    },
                    msg: '授权中'
                })
                return;
            }
            if (value == '3') {
                res.json({
                    code: 200,
                    data: {
                        status: 3
                    },
                    msg: '已取消'
                })
                return;
            }
            let info = JSON.parse(value);
            let {
                openId,
                avatr_url,
                nick_name
            } = info;
            let [user] = await query(`SELECT * FROM user WHERE openId=:openId`, {
                openId: openId,
            });
            if (user) {
                let token = createToken(user.id);
                await query(
                    `UPDATE user SET token=:token,tokenUpdateTime=:tokenUpdateTime,${pool.escapeId(
                    "limit"
                    )}=:limit WHERE id=:id`,

                    {
                        token,
                        tokenUpdateTime: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
                        limit: 5,
                        id: user.id,
                    }
                );
                res.json({
                    code: 200,
                    data: {
                        status: 2,
                        token: token,
                        name: nick_name, //用户名
                        avatrUrl: avatr_url
                    },
                    msg: "登录成功，欢迎您！",
                });
            } else {
                let add = await query(
                    `
                INSERT INTO user ( account,name, openId,avatr_url,remarks,createAt,updateAt) VALUES (:account,:name,:openId,:avatr_url,:remarks,:createAt,:updateAt)
                `, {
                        account: '小程序授权用户',
                        name: nick_name,
                        openId: openId,
                        avatr_url: avatr_url,
                        remarks: '小程序授权用户',
                        createAt: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
                        updateAt: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
                    }
                );

                if (add.affectedRows === 0) {
                    res.json({
                        code: 500,
                        msg: "添加失败",
                        data,
                    });
                    return;
                } else {
                    let token = createToken(add.insertId);
                    await query(
                        `UPDATE user SET token=:token,tokenUpdateTime=:tokenUpdateTime,${pool.escapeId(
                        "limit"
                        )}=:limit WHERE id=:id`,

                        {
                            token,
                            tokenUpdateTime: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
                            limit: 5,
                            id: add.insertId,
                        }
                    );
                    res.json({
                        code: 200,
                        data: {
                            status: 2,
                            token: token,
                            name: nick_name, //用户名
                            avatrUrl: avatr_url
                        },
                        msg: "登录成功，欢迎您！",
                    });
                }

            }

        } catch (error) {
            res.json({
                code: 500,
                data: error,
                msg: '获取失败'
            })
        }
    })
    //更新授权状态
router.post("/updateStatus", async(req, res) => {
        try {
            const { certificates } = req.body;

            let value = await redis.get(certificates)
            if (!value) {
                res.json({
                    code: 200,
                    data: {
                        status: -1
                    },
                    msg: '已失效'
                })
                return;
            }
            if (value == '0') {
                redis.set(certificates, '1', 'ex', 5 * 60) //5分钟有效
                res.json({
                    code: 200,
                    data: { status: 1 },
                    msg: '操作成功'
                })
            } else {
                res.json({
                    code: 200,
                    data: {
                        status: -1
                    },
                    msg: '已失效'
                })
            }

        } catch (error) {
            res.json({
                code: 500,
                data: error,
                msg: '获取失败'
            })
        }
    })
    //授权
router.post("/login", async(req, res) => {
        try {
            const { certificates, code, avatr_url, nick_name } = req.body;

            let value = await redis.get(certificates)
            if (!value) {
                res.json({
                    code: 500,
                    data: null,
                    msg: '已失效'
                })
                return;
            }
            if (value == '1') {
                let openId = await getOpenID(code)
                redis.set(certificates, JSON.stringify({
                        openId,
                        avatr_url,
                        nick_name
                    }), 'ex', 5 * 60) //5分钟有效
                res.json({
                    code: 200,
                    data: null,
                    msg: '授权成功'
                })
            } else {
                res.json({
                    code: 500,
                    data: null,
                    msg: '授权失败'
                })
            }

        } catch (error) {
            res.json({
                code: 500,
                data: error,
                msg: '获取失败'
            })
        }
    })
    //取消授权
router.post("/cancel", async(req, res) => {
    try {
        const { certificates } = req.body;

        let value = await redis.get(certificates)
        if (!value) {
            res.json({
                code: 200,
                data: {
                    status: -1
                },
                msg: '已失效'
            })
            return;
        }
        if (value == '0') {
            redis.set(certificates, '3', 'ex', 1 * 60) //5分钟有效
            res.json({
                code: 200,
                data: null,
                msg: '已取消'
            })
        } else {
            res.json({
                code: 200,
                data: {
                    status: -1
                },
                msg: '已失效'
            })
        }

    } catch (error) {
        res.json({
            code: 500,
            data: error,
            msg: '获取失败'
        })
    }
})
module.exports = router