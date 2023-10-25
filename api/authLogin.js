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
const { md5, createToken } = require("../util/index");
//生成授权码小程序码
router.get("/getCode", async(req, res) => {
        try {
            let { insertId } = await query(
                `
                INSERT INTO authorisation (status,create_at,update_at) VALUES (:status,:create_at,:update_at)
                `, {
                    status: 0,
                    create_at: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
                    update_at: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
                }
            );

            let sessionkey = encrypt(String(insertId))
            redis.set(`sessionkey${insertId}`, sessionkey, 'ex', 5 * 60) //5分钟有效
            let fileName = await getWxCode("pages/auth/index", sessionkey);
            res.json({
                code: 200,
                data: {
                    url: `${ORIGIN}/static/${fileName}`,
                    sessionkey,
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
            const { sessionKey } = req.query;
            let id = decrypt(sessionKey);

            let value = await redis.get(`sessionkey${id}`)
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
            let [data] = await query(
                `
                    SELECT status,open_id,nick_name,avatr_url FROM authorisation WHERE id=:id
                    `, {
                    id: Number(id)
                }
            );
            if (data) {
                let { status, open_id, nick_name, avatr_url } = data; //-1 已失效 0 等待授权 1 正在授权 2 授权完成 3 已结束
                console.log(status)
                if (status == 0 || status == 1) {
                    res.json({
                        code: 200,
                        data: { status },
                        msg: '操作成功'
                    })
                } else if (status == 2) {
                    let [user] = await query(`SELECT * FROM user WHERE openId=:openId`, {
                        openId: open_id,
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
                                account: open_id,
                                name: nick_name,
                                openId: open_id,
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
                                    token: token,
                                    name: nick_name, //用户名
                                    avatrUrl: avatr_url
                                },
                                msg: "登录成功，欢迎您！",
                            });
                        }

                    }

                } else {
                    res.json({
                        code: 200,
                        data: {
                            status
                        },
                        msg: '已失效'
                    })
                }


            } else {
                res.json({
                    code: 500,
                    data: null,
                    msg: '获取失败'
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
    //更新授权状态
router.post("/updateStatus", async(req, res) => {
        try {
            const { sessionKey } = req.body;
            let id = decrypt(sessionKey);
            let value = await redis.get(`sessionkey${id}`)
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
            await query(
                `
            UPDATE authorisation SET status=:status WHERE id=:id AND status=0
            `, {
                    status: 1,
                    id: Number(id)
                }
            );
            res.json({
                code: 200,
                data: null,
                msg: '操作成功'
            })
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
        const { sessionKey, code, avatr_url, nick_name } = req.body;
        let id = decrypt(sessionKey);
        let value = await redis.get(`sessionkey${id}`)
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
        let [data] = await query(
            `
                SELECT status,open_id,nick_name,avatr_url FROM authorisation WHERE id=:id
                `, {
                id: Number(id)
            }
        );
        if (data) {
            let { status } = data; //-1 已失效 0 等待授权 1 正在授权 2 授权完成 3 已结束
            if (status == 1) {
                let openId = await getOpenID(code)
                await query(
                    `
                UPDATE authorisation SET status=:status,open_id=:open_id,avatr_url=:avatr_url,nick_name=:nick_name WHERE id=:id
                `, {
                        id: Number(id),
                        status: 2,
                        open_id: openId,
                        avatr_url: avatr_url,
                        nick_name: nick_name
                    }
                );
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
        } else {
            res.json({
                code: 500,
                data: null,
                msg: '状态已过期'
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