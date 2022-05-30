# Deploy CLI for Digitalcnzz

该工具包提供项目的发版，目前支持 OSS、ECS 两种发版方式

## 安装

```js
yarn add @digital/deploy -D --registry http://192.168.200.6:4873
```

## 使用

```js
'use strict'

import { OSSDeployClient, AutoDeployClient } from '@digital/deploy'

// 创建csbClient实例的时候如果传了ak、sk则不需要在请求参数里面传入
// 如果两个地方都有传入，则使用请求参数里面的ak、sk
const ossDeployClient = new OSSDeployClient(accessKeyId, accessKeySecret, bucketName)

// 列举所有bucket信息
ossClient.listBuckets().then((res) => {})

// 删除oss指定目录里面的所有文件
listFiles({ dir: '2021/es5/' }).then((res) => {
  for (let item of list.data) {
    ossClient.deleteFile({ file: item.name }).then((res) => {})
  }
})

// 下载oss指定目录里面的所有文件
ossClient.downloadFile({ dir: '2021/es5/' }).then((res) => {})

// 发版到指定的oss目录
ossClient
  .publishDir({
    src: '/Users/es5',
    dist: '2021/es5'
  })
  .then((res) => {})

// 备份oss上面指定的目录
ossClient
  .backup({
    origin: '2021',
    target: '2021/backup',
    version: '20220205',
    project: 'es5'
  })
  .then((res) => {})

// 备份oss上面指定的目录
ossClient
  .rollback({
    origin: '2021/backup',
    target: '2021',
    version: '20220205',
    project: 'es5'
  })
  .then((res) => {})

// 删除oss上指定的文件目录
ossClient.deleteDir({ dir: '2021/es5/' }).then((res) => {})

const ecsClient = new ECSClient()

// 云服务器部署
// deployConfig.js
let path = require('path')

const options = {
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
module.exports = options

//deploy.js
const { AutoDeployClient } = require('@digital/deploy')
const options = require('./deployConfig')
let server = new AutoDeployClient(options)
server.upload()

//rollback.js
const { AutoDeployClient } = require('@digital/deploy')
const options = require('./deployConfig')
let server = new AutoDeployClient(options)
server.rollback()

//package.json
"scripts": {
  "deploy": "yarn build:prod && node script/deploy.js",
  "rollback": "node script/rollback.js"
}

//注意事项
1. 配置文件deployConfig.js内容必须书写正确，注意切勿上传到远程仓库
2. 执行回滚的时候需要输入待会滚的版本号，需要去备份目录查找回滚的版本名称
3. 钉钉群配置通知机器人需要在安全设置选择自定义关键词，添加 发版、回滚 两个关键词，将生成的Webhook地址配置到deployConfig.js配置文件
```

## License

The MIT License
