'use strict';

const oss = require('ali-oss');
const OssDeployBase = require('./ossDeployBase');
const path = require('path')
const ProgressBar = require('./progress-bar');
const fs = require('fs');
const sd = require('silly-datetime');
const readlineSync = require('readline-sync');
const axios = require('axios');
const ossMutiUploadClient = require('./ossUploadDir');

class OssDeployClient extends OssDeployBase {
  //accessKeyId = null, accessKeySecret = null, bucket = 'digitalzz', endpoint = 'oss-cn-north-2-gov-1.aliyuncs.com', region = 'oss-cn-north-2-gov-1', timeout = 5000, secure = true
  constructor(options) {
    super();
    this.dingUrl = options.noticeConfig.webHookUrl || 'https://oapi.dingtalk.com/robot/send?access_token=5b612fb4c276f4ea604ac61ff4a8c70c3cb54fc9a89ceb262f4602e15c52c2d1'
    this.appName = options.appName;
    this.webName = options.webName;
    this.ossConfig = options.ossConfig;
    this.deployConfig = options.deployConfig;
    this.noticeConfig = options.noticeConfig;
    this.accessKeyId = options.ossConfig.accessKeyId;
    this.accessKeySecret = options.ossConfig.accessKeySecret;
    this.bucket = options.ossConfig.bucket;
    this.endpoint = options.ossConfig.endpoint;
    this.region = options.ossConfig.region;
    this.timeout = options.ossConfig.timeout;
    this.secure = options.ossConfig.secure;
    this.client = null;
    this.num = 0
    this.total = 100;
    this.interval = null;
    this.ossMutiClient = null;
    this.backupName = `${options.webName}_${sd.format(new Date(), 'YYYYMMDDHHmmss')}`;
    this.init()
  }

  init () {
    this.validateOpts({ accessKeyId: this.accessKeyId, accessKeySecret: this.accessKeySecret })
    this.client = new oss({
      region: this.region,
      accessKeyId: this.accessKeyId,
      accessKeySecret: this.accessKeySecret,
      bucket: this.bucket,
      endpoint: this.endpoint,
      timeout: this.timeout,
      secure: this.secure
    });
    this.ossMutiClient = ossMutiUploadClient(this.client); //上传文件目录实例对象
  }

  backup (opts) {
    this.validateBackupOpts(opts)
    return new Promise(async (resolve, reject) => {
      try {
        this.listFiles({ dir: `${opts.origin}/${opts.project}` }).then(list => {
          for (let item of list.data) {
            this.backupFile({
              origin: item.name,
              target: `${opts.target}/${opts.project}_${opts.version}${item.name.split(opts.project)[1]}`
            })
          }
          resolve({
            code: 0,
            msg: 'success'
          })
        })
      } catch (err) {
        reject({
          code: 9999,
          msg: err
        })
        throw new Error(err);
      }
    })
  }

  validateBackupOpts (opts = {}) {
    let msg = '';
    if (opts.origin == null) {
      msg += "参数错误, 必须要设置待备份的OSS文件路径! ";
    }
    if (opts.target == null) {
      msg += "参数错误, 必须要设置备份后的OSS的文件路径(不带bucket名称)! ";
    }
    if (opts.project == null) {
      msg += "参数错误, 必须要设置待备份的项目名称 ";
    }
    if (opts.version == null) {
      msg += "参数错误, 必须要设置待备份的项目版本! ";
    }
    if (msg != '') {
      throw new Error(msg);
    }
  }

  rollbackOld (opts) {
    this.validateRollbackOpts(opts)
    return new Promise(async (resolve, reject) => {
      try {
        this.listFiles({ dir: `${opts.origin}/${opts.project}_${opts.version}` }).then(list => {
          for (let item of list.data) {
            this.backupFile({
              origin: item.name,
              target: `${opts.target}/${opts.project}${item.name.split(opts.version)[1]}`
            })
          }
          resolve({
            code: 0,
            msg: 'success'
          })
        })
      } catch (err) {
        reject({
          code: 9999,
          msg: err
        })
        throw new Error(err);
      }
    })
  }

  validateRollbackOpts (opts = {}) {
    let msg = '';
    if (opts.origin == null) {
      msg += "参数错误, 必须要设置待备份的OSS文件路径! ";
    }
    if (opts.target == null) {
      msg += "参数错误, 必须要设置备份后的OSS的文件路径(不带bucket名称)! ";
    }
    if (opts.project == null) {
      msg += "参数错误, 必须要设置待备份的项目名称 ";
    }
    if (opts.version == null) {
      msg += "参数错误, 必须要设置待备份的项目版本! ";
    }
    if (msg != '') {
      throw new Error(msg);
    }
  }

  deleteDir (opts) {
    this.validateDeleteDirOpts(opts)
    return new Promise(async (resolve, reject) => {
      try {
        const { code, msg, data } = await this.listFiles({ dir: opts.dir })
        if (code == 0) {
          for (let item of data) {
            await this.client.delete(item.name);
          }
          resolve({
            code: 0,
            msg: 'success'
          })
        } else {
          reject({
            code: 9999,
            msg: 'error'
          })
        }
      } catch (err) {
        reject({
          code: 9999,
          msg: err
        })
        throw new Error(msg);
      }
    })
  }

  validateDeleteDirOpts (opts) {
    let msg = '';
    if (opts.dir == null) {
      msg += "参数错误, 必须要设置待下删除的OSS目录! ";
    }
    if (msg != '') {
      throw new Error(msg);
    }
  }

  deleteFile (opts) {
    this.validateDeleteFileOpts(opts);
    return new Promise(async (resolve, reject) => {
      try {
        await this.client.delete(opts.file);
        resolve({
          code: 0,
          msg: 'success'
        })
      } catch (err) {
        reject({
          code: 9999,
          msg: err
        })
        throw new Error(msg);
      }
    })
  }

  validateDeleteFileOpts (opts) {
    let msg = '';
    if (opts.file == null) {
      msg += "参数错误, 必须要设置待下删除的OSS文件! ";
    }
    if (msg != '') {
      throw new Error(msg);
    }
  }

  mkdirsSync (dirname) {
    if (fs.existsSync(dirname)) {
      return true;
    } else {
      if (this.mkdirsSync(path.dirname(dirname))) {
        fs.mkdirSync(dirname);
        return true;
      }
    }
  }

  rollback () {
    // this.validateDownloadDirOpts(opts);
    const input = readlineSync.question('请输入待会滚的版本号?');
    const version = input.trim();
    if (version == "") {
      this.rollback()
      return
    }
    return new Promise(async (resolve, reject) => {
      try {
        const { code, msg, data } = await this.listFiles({ dir: `${this.deployConfig.backupDir}/${version}` })
        console.log(`CDN上应用${this.appName}版本${version}回滚开始...`)
        if (code == 0 && data.length > 0) {
          for (let item of data) {
            let arr = item.name.split(`${version}/`)[1].split('/')
            let list = arr.slice(0, arr.length - 1)
            if (!fs.existsSync(`${this.deployConfig.localDir}/${list.join('/')}`)) {
              this.mkdirsSync(`${this.deployConfig.localDir}/${list.join('/')}`)
            }
            await this.client.get(item.name, `${this.deployConfig.localDir}/${list.join('/')}/${arr[arr.length - 1]}`)
          }
          let res = await this.ossMutiClient.upload(this.deployConfig.localDir).to(`${this.deployConfig.remoteDir}/${this.webName}`);
          if (res?.length > 0 && res[0]?.res?.status == 200) {
            console.log(`CDN上应用${this.appName}版本${version}回滚完成...`)
            this.sendDingMsg({ success: true, message: "回滚", url: `https://cdn.digitalcnzz.com${this.deployConfig.remoteDir}/${this.webName}/index.html` })
          } else {
            throw new Error(msg);
          }
        } else {
          throw new Error(`发版失败：版本号${version}不存在!`);
        }
      } catch (err) {
        console.log(`CDN上应用${this.appName}版本${version}回滚失败, ${err}...`);
        this.sendDingMsg({ success: false, data: err, message: "回滚" })
      }
    })
  }

  downloadFile (opts) {
    this.validateDownloadFileOpts(opts)
    return new Promise(async (resolve, reject) => {
      try {
        await this.client.get(opts.name, opts.path)
        resolve({
          code: 0,
          msg: 'success'
        })
      } catch (err) {
        reject({
          code: 9999,
          msg: err
        })
        throw new Error(msg);
      }
    })
  }

  validateDownloadDirOpts (opts = {}) {
    let msg = '';
    if (opts.dir == null) {
      msg += "参数错误, 必须要设置待下载的OSS文件目录! ";
    }
    if (opts.path == null) {
      msg += "参数错误, 必须要设置下载到本地的路径! ";
    }
    if (msg != '') {
      throw new Error(msg);
    }
  }

  validateDownloadFileOpts (opts = {}) {
    let msg = '';
    if (opts.name == null) {
      msg += "参数错误, 必须要设置待下载的OSS文件路径! ";
    }
    if (opts.path == null) {
      msg += "参数错误, 必须要设置下载到本地的路径! ";
    }
    if (msg != '') {
      throw new Error(msg);
    }
  }

  backupFile (opts) {
    this.validateBackupFileOpts(opts);
    return new Promise(async (resolve, reject) => {
      try {
        await this.client.copy(opts.target, opts.origin);
        resolve({
          code: 0,
          msg: 'success'
        })
      } catch (err) {
        reject({
          code: 9999,
          msg: err
        })
        throw new Error(msg);
      }
    })
  }

  validateBackupFileOpts (opts = {}) {
    let msg = '';
    if (opts.origin == null) {
      msg += "参数错误, 必须要设置待备份的OSS文件路径! ";
    }
    if (opts.target == null) {
      msg += "参数错误, 必须要设置备份后的OSS的文件路径(不带bucket名称)! ";
    }
    if (msg != '') {
      throw new Error(msg);
    }
  }

  publishFile (opts) {
    // this.validatePublishOpts(opts)
    return new Promise(async (resolve, reject) => {
      try {
        await this.client.put(opts.dist, opts.src);
        resolve({
          code: 0,
          msg: 'success',
          data: null
        })
      } catch (err) {
        reject({
          code: 9999,
          msg: err,
          data: null
        })
      }
    })
  }

  uploading (progressBar, num, total) {
    if (num <= total) {
      progressBar.render({ completed: num, total: total });
    }
  }

  getFileList (dir, filesList = []) {
    const files = fs.readdirSync(dir);
    files.forEach((item, index) => {
      var fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        this.getFileList(path.join(dir, item), filesList);
      } else {
        filesList.push(fullPath);
      }
    });
    return filesList;
  }

  publishDir () {
    this.validatePublishOpts(this.deployConfig)
    let list = fs.readdirSync(this.deployConfig.localDir);
    console.log(`CDN上应用${this.appName}发版中...`);
    return new Promise(async (resolve, reject) => {
      try {
        let fileList = await this.getFileList(this.deployConfig.localDir);
        let progressBar = new ProgressBar('发版进度', fileList.length);
        this.num = 0;
        this.total = fileList.length;
        this.interval = setInterval(() => {
          this.num++;
          this.uploading(progressBar, this.num, this.total);
        }, 100)
        let res = await this.ossMutiClient.upload(this.deployConfig.localDir).to(`${this.deployConfig.remoteDir}/${this.webName}`);
        if (res?.length > 0 && res[0]?.res?.status == 200) {
          this.num = this.total;
          this.uploading(progressBar, this.num, this.total);
          console.log(`\nCDN上应用${this.appName}发版完成...`);
          this.interval && clearInterval(this.interval);
          console.log(`CDN上应用${this.appName}开始进行备份...`)
          res = await this.ossMutiClient.upload(this.deployConfig.localDir).to(`${this.deployConfig.backupDir}/${this.backupName}`);
          if (res?.length > 0 && res[0]?.res?.status == 200) {
            console.log(`CDN上应用${this.appName}备份完成!`)
            resolve({
              code: 0,
              msg: '发版成功',
              data: `https://cdn.digitalcnzz.com/${this.deployConfig.remoteDir}/${this.webName}/index.html`
            })
          } else {
            throw new Error("error: upload failed...");
          }
        } else {
          throw new Error("error: upload failed...");
        }
      } catch (err) {
        console.log(`\nCDN上应用${this.appName}发版失败, ${err}...`);
        this.sendDingMsg({ success: false, data: err, message: "发版" })
        reject({
          code: 9999,
          msg: err,
          data: null
        })
      } finally {
        //todo...
        this.sendDingMsg({ success: true, message: "发版", url: `https://cdn.digitalcnzz.com${this.deployConfig.remoteDir}/${this.webName}/index.html` })
      }
    })
  }

  uploadDir (params) {
    let list = fs.readdirSync(params.src);
    return new Promise(async (resolve, reject) => {
      for (let file of list) {
        console.log(12121);
        let _src = params.src + '/' + file,
          _dist = params.dist + '/' + file;
        let st = fs.statSync(_src);
        if (st.isFile() && file !== '.DS_Store') {
          await this.publishFile({ dist: _dist, src: _src })
        } else if (st.isDirectory()) {
          await this.uploadDir({ dist: _dist, src: _src });
        }
      }
    })
  }

  sendDingMsg (options) {
    if (!this.noticeConfig.switch) return
    let webHookConfig = {}
    if (options.success) {
      webHookConfig = {
        method: 'post',
        url: this.dingUrl,
        headers: {
          'Content-Type': 'application/json'
        },
        data: JSON.stringify({
          "at": {
            "atMobiles": this.noticeConfig.dingList,
            "isAtAll": false
          },
          "text": {
            "content": `${this.appName}应用${options.message}完成，请进行功能验证! 访问地址: ${options.url}`
          },
          "msgtype": "text"
        })
      };
    } else {
      webHookConfig = {
        method: 'post',
        url: this.dingUrl,
        headers: {
          'Content-Type': 'application/json'
        },
        data: JSON.stringify({
          "at": {
            "atMobiles": this.noticeConfig.dingList,
            "isAtAll": false
          },
          "text": {
            "content": `${this.appName}应用${options.message}失败，请确认并及时处理! ${options.data}`
          },
          "msgtype": "text"
        })
      };
    }
    axios(webHookConfig)
  }

  validatePublishOpts (opts = {}) {
    console.log("opts", opts);
    let msg = '';
    if (opts.localDir == null) {
      msg += "参数错误, 必须要设置本地待上传的文件路径! ";
    }
    if (opts.remoteDir == null) {
      msg += "参数错误, 必须要设置远程OSS的文件路径(不带bucket名称)! ";
    }
    if (opts.backupDir == null) {
      msg += "参数错误, 必须要设置远程OSS的备份路径(不带bucket名称)! ";
    }
    if (msg != '') {
      throw new Error(msg);
    }
  }


  changeBucket (bucket) {
    this.client.useBucket(bucket);
  }

  listBuckets () {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.client.listBuckets()
        let list = []
        for (let item of result.buckets) {
          list.push(item.name)
        }
        resolve({
          code: 0,
          msg: 'success',
          data: list
        })
      } catch (err) {
        reject({
          code: 9999,
          msg: err
        })
        throw new Error(msg);
      }
    })
  }

  listFiles (opts) {
    return new Promise(async (resolve, reject) => {
      try {
        let params = {
          prefix: opts.dir
        }
        let result = await this.client.listV2(params)
        let list = []
        for (let item of result.objects) {
          list.push({
            name: item.name,
            url: item.url.replace('digitalzz.oss-cn-north-2-gov-1.aliyuncs.com', 'cdn.digitalcnzz.com')
          })
        }
        resolve(
          {
            code: 0,
            msg: 'success',
            data: list
          }
        )
      } catch (err) {
        resolve({
          code: 9999,
          msg: err,
          data: null
        })
      }
    })
  }

  validateOpts (opts = {}) {
    let msg = '';
    if (opts.accessKeyId == null) {
      msg += "参数错误, 必须要设置accessKeyId参数! ";
    }
    if (opts.accessKeySecret == null) {
      msg += "参数错误, 必须要设置accessKeySecret参数! ";
    }
    if (opts.accessKeyId != null && opts.accessKeySecret == null) {
      msg += "参数错误, 如果已经设置accessKeyId必须要设置accessKeySecret! ";
    }
    if (opts.accessKeyId == null && opts.accessKeySecret != null) {
      msg += "参数错误, 如果已经设置accessKeyId必须要设置accessKeySecret! ";
    }
    if (opts.accessKeyId == null && opts.accessKeySecret == null && this.accessKeyId == '' && this.accessKeySecret == '') {
      msg += "参数错误, 实例化OSSClient或者请求参数里面必须要传入accessKeyId和accessKeySecret! ";
    }

    if (msg != '') {
      throw new Error(msg);
    }
  }
}

module.exports = OssDeployClient;
