/**安装服务 */
let path = require('path');

let Service = require('node-windows').Service;

// Create a new service object
let svc = new Service({
    name: 'Node Server PJY', //名称
    description: '管理系统node服务',//描述
    script: path.resolve('./app.js'),//node执行入口
    nodeOptions: [
        '--harmony',
        '--max_old_space_size=4096'
    ],
    env: {
        name: "NODE_ENV",
        value: "production"
    }
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function () {
    console.log('server install')
    //自启动
    svc.start();
});
svc.on("start", function () {
    console.log(process.env.NODE_ENV)
    console.log('server start')
});
svc.on("stop", function () {
    console.log('server stop')
});
svc.on("error", function (e) {
    console.log('server fail：' + e)
})
/**已安装则重启服务 */
if (!svc.exists) {
    svc.install();
} else {
    svc.restart()
}