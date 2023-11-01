// 引入 crypto
const crypto = require("crypto");
// 3 定义 key 和 iv
const key = "abcdef0123456789";
const iv = "0123456789abcdef";
//加密方法
function encrypt(data) {
    // 创建加密对象：三个参数（加密的算法，加密的key，加密的iv）
    const cipher = crypto.createCipheriv("aes-128-cbc", key, iv);

    // 开始加密：三个参数（要加密的数据、加密前的数据类型以及加密后的数据格式）
    let crypted = cipher.update(data, "binary", "hex");

    // 加密结束：结尾加上 cipher.final('hex') 表示结束
    crypted += cipher.final("hex");

    // 返回密文
    return crypted;
}

//解密方法
function decrypt(crypted) {
    // 转换解密数据：把需要解密的数据，转化成 buffer 格式，再转换成二进制
    crypted = Buffer.from(crypted, "hex").toString("binary");

    // 创建解密对象
    const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);

    // 开始解密：三个参数（要解密的数据、解密前的数据类型以及解密后的数据格式）
    let decrypted = decipher.update(crypted, "binary", "utf8");
    // 解密结束
    decrypted += decipher.final("utf8");

    // 返回明文
    return decrypted;
}
module.exports = {
    encrypt,
    decrypt
}