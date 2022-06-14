/**
 * 卸载服务
 */
let path = require('path');
let Service = require('node-windows').Service;

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

svc.on('uninstall', function () {
    if (!svc.exists) {
        console.log('server uninstall')
    }
});
if (svc.exists) {
    svc.uninstall();
}
