const express = require("express");
const router = express.Router();
const { logInput, logOutput, logError, log } = require("../config/log4");
const { ORIGIN } = process.env;

const multer = require('multer')
    //磁盘存储引擎，可以控制文件的存储，省略的话这些文件会保存在内存中，不会写入磁盘
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        //控制文件的存储路径
        cb(null, 'static')
    },
    filename: function(req, file, cb) {
        //定义上传文件存储时的文件名
        cb(null, `avatar-${new Date().getTime()}.png`)
    }
})
const upload = multer({ storage: storage })
    //接受单文件上传


router.post("/image", upload.single('file'), async(req, res) => {
    res.send({
        code: 200,
        data: `${ORIGIN}/static/${req.file.filename}`,
        msg: '上传成功'
    })
})


module.exports = router;