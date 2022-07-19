# node-serve

### 介绍
node+express+node-mysql搭建的服务端,搭配前端项目，完成了一个管理系统模板，实现的登录鉴权，新建路由，添加用户，添加角色和分配路由的基本功能
## 线上体验地址 
http://www.pjy.cool/

## 前端项目仓库
https://gitee.com/peng-jiangyong/admin-template

## 接口文档
http://serve.pjy.cool/apidoc

# 项目文件说明
- `api` 业务api接口
  - `index.js` api入口
- `apidoc` 接口文档
- `config` 配置文件
  - `index.js` 一些参数配置
  - `log4.js` log4配置
  - `mysql.js` mysql连接池配置
- `logs` 日志文件
- `sql` 数据库文件
- `static` 静态资源文件 
- `util` 封装的工具库
- `app.js` 入口文件
- `start.js` node服务启动文件
- `stop.js` node服务卸载文件

## 环境
node + mysql
  # 安装依赖
  npm i
  # 启动
  npm run dev
  # 生成api文档
  npm run doc

## windows服务器部署

node start




