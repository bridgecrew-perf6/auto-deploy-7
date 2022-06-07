# Deploy CLI for Digitalcnzz

该工具包提供项目的发版，目前支持 OSS、ECS 两种发版方式

## 安装

```js
yarn add @digital/deploy@1.0.3 -D --registry http://192.168.200.6:4873
```

## 使用

```js
'use strict'

import { OSSDeployClient, ECSDeployClient } from '@digital/deploy'

// 云服务器部署
// deployConfig.js
let path = require('path')

const ossOptions = {
  appName: "xxx应用系统",          //应用名称
  webName: "digitalcnzz-xx-web",               //应用目录名称
  ossConfig: {
    accessKeyId: "121212",   //应用名称
    accessKeySecret: "23232323",   //应用名称
    bucket: 'digitalzz',   //应用名称
    endpoint: 'oss-cn-north-2-gov-1.aliyuncs.com',   //应用名称
    region: 'oss-cn-north-2-gov-1',   //应用名称
  },
  deployConfig: {
    localDir: path.resolve(__dirname, './dist'), //本地发版目录
    remoteDir: "/syf/test",                   //远程发版目录(注意是绝对路径)
    backupDir: "syf/test/backup"             //远程备份目录(注意是相对路径)
  },
  noticeConfig: {                                   //钉钉消息推送配置
    dingList: [                                    //钉钉消息推送人员手机号列表
      "15923902511"
    ],
    switch: true,                                   //钉钉消息推送开关配置(true:开 false:关)
    webHookUrl: ""                                 //钉钉消息推送webHookUrl地址
  }
}

const ecsOptions = {
  appName: 'xxx应用系统', //应用名称
  webName: 'appSystem', //应用目录名称
  serverList: [
    //应用发布服务器列表
    {
      host: '1.1.1.1', //服务器IP
      port: 22, //服务器端口
      user: 'root', //服务器登录用户名
      password: '!QA@G#$WSX#ED' //服务器登录密码
    },
    {
      host: '1.1.1.2', //服务器IP
      port: 22, //服务器端口
      user: 'root', //服务器登录用户名
      password: '!QA@G#$WSX#ED' //服务器登录密码
    }
  ],
  config: {
    localDir: path.resolve(__dirname, './dist'), //本地发版目录
    remoteDir: '/data/webapp', //远程发版目录
    backupDir: '/data/webapp/backup' //远程备份目录
  },
  notice: {
    //钉钉消息推送配置
    dingList: [
      //钉钉消息推送人员列表
      '159xxxxxxxx'
    ],
    switch: false, //钉钉消息推送开关配置(true:开 false:关)
    webHookUrl: '' //钉钉消息推送webHookUrl地址
  }
}
module.exports = { ecsOptions, ossOptions }

const ecsDeployClient = new ECSDeployClient()

//云主机发版回滚
const { ecsOptions } = require('./deployConfig')
let server = new ECSDeployClient(ecsOptions)
server.upload()
server.rollback()

const ossDeployClient = new OSSDeployClient()
//OSS发版回滚
const { ossOptions } = require('./deployConfig')
let server = new OSSDeployClient(ossOptions)
server.upload()
server.rollback()

//package.json
"scripts": {
  "deploy:ecs": "yarn build:prod && node script/ecsDeploy.js",
  "rollback:ecs": "node script/ecsRollback.js",
  "deploy:oss": "yarn build:prod && node script/ossDeploy.js",
  "rollback:oss": "node script/ossRollback.js"
}

//注意事项
1. 配置文件deployConfig.js内容必须书写正确，注意切勿上传到远程仓库
2. 执行回滚的时候需要输入待会滚的版本号，需要去备份目录查找回滚的版本名称
3. 钉钉群配置通知机器人需要在安全设置选择自定义关键词，添加 发版、回滚 两个关键词，将生成的Webhook地址配置到deployConfig.js配置文件
```

## License

The MIT License
