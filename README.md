# Deploy CLI for Digitalcnzz

该工具包提供项目的发版，目前支持 OSS、ECS 两种发版方式

## 安装

```js
yarn add @digitalzz/deploy
```

## 使用

```js
'use strict'

import { OSSClient, ECSClient } from '@digitalzz/deploy'

// 创建csbClient实例的时候如果传了ak、sk则不需要在请求参数里面传入
// 如果两个地方都有传入，则使用请求参数里面的ak、sk
const ossClient = new OSSClient(accessKeyId, accessKeySecret, bucketName)

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
```

## License

The MIT License
