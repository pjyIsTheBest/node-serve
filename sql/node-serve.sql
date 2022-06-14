/*
Navicat MySQL Data Transfer

Source Server         : tx-mysql
Source Server Version : 80027
Source Host           : 42.192.11.55:3306
Source Database       : node-serve

Target Server Type    : MYSQL
Target Server Version : 80027
File Encoding         : 65001

Date: 2022-06-06 15:27:03
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for menu
-- ----------------------------
DROP TABLE IF EXISTS `menu`;
CREATE TABLE `menu` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `type` int unsigned NOT NULL COMMENT '类型 0 带单标题，1 菜单页，2 跳转外部链接',
  `name` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '路由名称',
  `title` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '路由标题',
  `path` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT 'url',
  `component` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT 'vue文件相对src的路径',
  `parentId` int unsigned DEFAULT '0' COMMENT '父级id',
  `menu` tinyint(1) DEFAULT '1' COMMENT '是否显示在菜单栏，默认是true 1',
  `order` int unsigned DEFAULT '1' COMMENT '同级排序',
  `layout` tinyint(1) DEFAULT '1' COMMENT '是否为layout子路由,默认是true 1 ',
  `validate` tinyint(1) DEFAULT '1' COMMENT '是否校验登录状态',
  `createAt` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '创建时间',
  `updateAt` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb3 COLLATE=utf8_bin;

-- ----------------------------
-- Records of menu
-- ----------------------------
INSERT INTO `menu` VALUES ('1', '0', null, '权限管理', null, null, '0', '1', '1', '1', '1', '2022-06-06 11:00:59', '2022-06-06 11:00:59');
INSERT INTO `menu` VALUES ('2', '1', 'asyncRoute', '路由配置', '/config/asyncRoute', 'system-pages/async-route.vue', '1', '1', '2', '1', '1', '2022-06-06 14:58:45', '2022-06-06 14:58:45');
INSERT INTO `menu` VALUES ('3', '1', 'userList', '用户管理', '/config/userList', 'system-pages/user-list.vue', '1', '1', '1', '1', '1', '2022-06-06 14:58:45', '2022-06-06 14:58:45');
INSERT INTO `menu` VALUES ('4', '1', 'roleList', '角色管理', '/config/roleList', 'system-pages/role-list.vue', '1', '1', '3', '1', '1', '2022-06-06 15:03:57', '2022-06-06 15:03:59');
INSERT INTO `menu` VALUES ('5', '1', 'menu2role', '分配权限', '/config/menu2role', 'system-pages/menu2role.vue', '1', '0', '1', '1', '1', '2022-06-06 15:05:06', '2022-06-06 15:05:09');
INSERT INTO `menu` VALUES ('6', '1', 'updatePwd', '修改密码', '/config/updatePwd', 'system-pages/updatePwd.vue', '1', '0', '1', '1', '1', '2022-06-06 15:06:20', '2022-06-06 15:06:23');

-- ----------------------------
-- Table structure for role
-- ----------------------------
DROP TABLE IF EXISTS `role`;
CREATE TABLE `role` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '角色名称',
  `remarks` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '备注',
  `menuIds` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '菜单Id拼接字符串',
  `status` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT '01' COMMENT '状态，01 正常 02 禁用',
  `createAt` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '创建时间',
  `updateAt` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3 COLLATE=utf8_bin;

-- ----------------------------
-- Records of role
-- ----------------------------
INSERT INTO `role` VALUES ('1', '管理员', '管理员专用', '1,2,3,4,5,6', '01', '2022-06-06 15:09:11', '2022-06-06 15:09:11');
INSERT INTO `role` VALUES ('2', 'test321', null, '1,3,6', '01', '2022-06-06 15:23:48', '2022-06-06 15:23:48');

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `account` varchar(255) COLLATE utf8_bin NOT NULL COMMENT '登录账号',
  `phone` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '手机号',
  `name` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '姓名',
  `password` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '密码',
  `remarks` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '备注',
  `token` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '权限凭证',
  `tokenUpdateTime` timestamp NULL DEFAULT NULL,
  `role` int DEFAULT NULL COMMENT '角色id',
  `status` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT '01' COMMENT '状态，01 正常 02 锁定 03 禁用',
  `limit` int DEFAULT '5' COMMENT '登录失败限制次数，默认5次超出锁定账号',
  `createAt` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '创建时间',
  `updateAt` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3 COLLATE=utf8_bin;

-- ----------------------------
-- Records of user
-- ----------------------------
INSERT INTO `user` VALUES ('1', 'test', '17602127941', '彭江勇', 'f735292e5d7e3a3a2d11d2f1085510ba', '', 'eyJkYXRhIjoxLCJ0aW1lb3V0IjoxODAwMDAwLCJjcmVhdGVBdCI6MTY1NDQ5OTYxNDUwMX0=.58VpRy17Iv2gheL7EOS5RqVVcJ9s8wHw/oY41oewiUw=', '2022-06-06 15:24:13', '1', '01', '5', '2022-06-06 15:24:10', '2022-06-06 15:24:10');
INSERT INTO `user` VALUES ('2', 'test2', '13212344321', '666', 'f735292e5d7e3a3a2d11d2f1085510ba', '1', 'eyJkYXRhIjoyLCJ0aW1lb3V0IjoxODAwMDAwLCJjcmVhdGVBdCI6MTY1NDUwMDI4Mzk1OH0=.OmmNzIUm5IYBZSiwIbQCNu5zKmt3BpM1vzrfdbL8K0o=', '2022-06-06 15:26:08', '2', '01', '5', '2022-06-06 15:26:04', '2022-06-06 15:26:04');
