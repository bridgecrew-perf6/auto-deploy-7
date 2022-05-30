'use strict';

const oss = require('ali-oss');
const OssBase = require('./ossBase');
const fs = require('fs')
const path = require('path')

class OSSClient extends OssBase {
  constructor(accessKeyId = null, accessKeySecret = null, bucket = 'digitalzz', endpoint = 'oss-cn-north-2-gov-1.aliyuncs.com', region = 'oss-cn-north-2-gov-1', timeout = 5000, secure = true) {
    super();
    this.accessKeyId = accessKeyId;
    this.accessKeySecret = accessKeySecret;
    this.bucket = bucket;
    this.endpoint = endpoint;
    this.region = region;
    this.timeout = timeout;
    this.secure = secure;
    this.client = null;
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

  rollback (opts) {
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

  downloadDir (opts) {
    this.validateDownloadDirOpts(opts);
    return new Promise(async (resolve, reject) => {
      try {
        const { code, msg, data } = await this.listFiles({ dir: opts.dir })
        if (code == 0) {
          for (let item of data) {
            let arr = item.name.split('/')
            let list = arr.slice(0, arr.length - 1)
            if (!fs.existsSync(`${opts.path}/${list.join('/')}`)) {
              this.mkdirsSync(`${opts.path}/${list.join('/')}`)
            }
            await this.client.get(item.name, `${opts.path}/${list.join('/')}/${arr[arr.length - 1]}`)
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
    this.validatePublishOpts(opts)
    return new Promise(async (resolve, reject) => {
      try {
        await this.client.put(opts.dist, opts.src);
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

  publishDir (opts) {
    this.validatePublishOpts(opts)
    let list = fs.readdirSync(opts.src);
    return new Promise(async (resolve, reject) => {
      try {
        for (let file of list) {
          let _src = opts.src + '/' + file,
            _dist = opts.dist + '/' + file;
          let st = fs.statSync(_src);
          if (st.isFile() && file !== '.DS_Store') {
            console.log('上传中:', _src, '--->', _dist);
            await this.publishFile({ dist: _dist, src: _src })
          } else if (st.isDirectory()) {
            await this.publishDir({ dist: _dist, src: _src });
          }
        }
        resolve({
          code: 0,
          msg: 'success',
          data: `https://cdn.digitalcnzz.com/${opts.dist}/index.html`
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

  validatePublishOpts (opts = {}) {
    let msg = '';
    if (opts.src == null) {
      msg += "参数错误, 必须要设置本地待上传的文件路径! ";
    }
    if (opts.dist == null) {
      msg += "参数错误, 必须要设置远程OSS的文件路径(不带bucket名称)! ";
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
    if (opts.bucket) this.changeBucket(opts.bucket)
    return new Promise(async (resolve, reject) => {
      try {
        let params = {}
        if (opts.dir) params['prefix'] = opts.dir
        if (opts.delimiter) params['delimiter'] = opts.delimiter
        if (opts['max-keys']) params['max-keys'] = opts['max-keys']
        if (opts['fetch-owner']) params['fetch-owner'] = opts['fetch-owner']
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
        reject({
          code: 9999,
          msg: err
        })
        throw new Error(msg);
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

module.exports = OSSClient;
