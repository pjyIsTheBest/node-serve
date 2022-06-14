/**数据库配置 连接池 */
const mysql = require("mysql");
const { logSql } = require("./log4")
const { DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE } = process.env;
const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    insecureAuth: true,
    multipleStatements: true,
    connectionLimit: 10,
});
// pool.on('acquire', function (connection) {
//     console.log('acquire');
// });
pool.on('connection', function (connection) {
    //自定义标识符 params = :params
    connection.config.queryFormat = function (query, values) {
        if (!values) return query;
        let sql = query.replace(/\:(\w+)/g, function (txt, key) {
            if (values.hasOwnProperty(key)) {
                return this.escape(values[key]);
            }
            return txt;
        }.bind(this))
        logSql(sql)
        return sql
    };
});
const query = (sql, val) => {
    return new Promise((resolve, reject) => {
        pool.query(sql, val, function (error, results, fields) {
            if (error) {
                reject(error)
                throw Error(error);
            } else {
                resolve(results)
            }
        })
    })
}
module.exports = {
    pool, query
};