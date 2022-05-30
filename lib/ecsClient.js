'use strict';

const oss = require('ali-oss');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const shell = require('shelljs');
const ECSBase = require('./ecsBase');

class ECSClient extends ECSBase {
  constructor(src = null, dist = null, ips = [], port = 22) {
    super();
    this.src = src
    this.dist = dist
    this.ips = ips
    this.port = port
  }

  rollback (opts) {
    this.validateRollbackOpts(opts)
    return new Promise((resolve, reject) => {
      try {
        if (opts.ips != null && opts.ips.length > 0) this.ips = opts.ips
        if (opts.dist) this.dist = opts.dist
        if (opts.port) this.port = opts.port
        for (let ip of this.ips) {
          shell.exec(`ssh -p ${this.port} ${opts.userName}@${ip} 'cp -rf ${opts.backupDir}/${opts.project}_${opts.version}/* ${this.dist}/${opts.project}'`);
          // shell.exec(`scp -P ${this.port} -rCp ${opts.userName}@${ip}:${opts.backupDir}/${opts.project}_${opts.version} ${opts.project}`)
          // shell.exec(`scp -P ${this.port} -rCp ${opts.project}/* ${opts.userName}@${ip}:${this.dist}/${opts.project}`)
          // shell.exec(`rm -rf ${opts.project}`)
        }
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

  validateRollbackOpts (opts = {}) {
    let msg = '';
    if ((opts.ips == null || opts.ips.length <= 0) && (this.ips == null || this.ips.length <= 0)) {
      msg += "参数错误, 必须要设置待进行免密登录的服务器IP数组! ";
    }
    if (opts.userName == null && this.userName == null) {
      msg += "参数错误, 必须要设置待进行发布的远程ECS的登录账号名! ";
    }
    if (opts.dist == null && this.dist == null) {
      msg += "参数错误, 必须要设置待进行备份的远程ECS目录! ";
    }
    if (opts.backupDir == null) {
      msg += "参数错误, 必须要设置远程ECS的备份目录! ";
    }
    if (opts.project == null) {
      msg += "参数错误, 必须要设置备份的项目目录名称! ";
    }
    if (opts.version == null) {
      msg += "参数错误, 必须要设置远程ECS的备份版本! ";
    }
    if (msg != '') {
      throw new Error(msg);
    }
  }


  backup (opts) {
    this.validateBackupOpts(opts)
    return new Promise((resolve, reject) => {
      try {
        if (opts.ips != null && opts.ips.length > 0) this.ips = opts.ips
        if (opts.dist) this.dist = opts.dist
        if (opts.port) this.port = opts.port
        for (let ip of this.ips) {
          shell.exec(`ssh -p ${this.port} ${opts.userName}@${ip} 'mkdir ${opts.backupDir}/${opts.project}_${opts.version} && cp -rf ${this.dist}/${opts.project}/* ${opts.backupDir}/${opts.project}_${opts.version}'`);
          // shell.exec(`scp -P ${this.port} -rCp ${opts.userName}@${ip}:${this.dist}/${opts.project} ${opts.project}_${opts.version}`)
          // shell.exec(`scp -P ${this.port} -rCp ${opts.project}_${opts.version} ${opts.userName}@${ip}:${opts.backupDir}`)
          // shell.exec(`rm -rf ${opts.project}_${opts.version}`)
        }
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

  validateBackupOpts (opts = {}) {
    let msg = '';
    if ((opts.ips == null || opts.ips.length <= 0) && (this.ips == null || this.ips.length <= 0)) {
      msg += "参数错误, 必须要设置待进行免密登录的服务器IP数组! ";
    }
    if (opts.userName == null && this.userName == null) {
      msg += "参数错误, 必须要设置待进行发布的远程ECS的登录账号名! ";
    }
    if (opts.dist == null && this.dist == null) {
      msg += "参数错误, 必须要设置待进行备份的远程ECS目录! ";
    }
    if (opts.backupDir == null) {
      msg += "参数错误, 必须要设置远程ECS的备份目录! ";
    }
    if (opts.version == null) {
      msg += "参数错误, 必须要设置远程ECS的备份版本! ";
    }
    if (opts.project == null) {
      msg += "参数错误, 必须要设置备份的项目目录名称! ";
    }
    if (msg != '') {
      throw new Error(msg);
    }
  }

  publish (opts) {
    this.validatePublishOpts(opts)
    return new Promise((resolve, reject) => {
      try {
        if (opts.ips != null && opts.ips.length > 0) this.ips = opts.ips
        if (opts.src) this.src = opts.src
        if (opts.dist) this.dist = opts.dist
        if (opts.port) this.port = opts.port
        let fileFlag = false
        var stat = fs.statSync(filename)
        if (stat.isFile()) {
          fileFlag = true
        }
        console.log('fileFlag', fileFlag);
        for (let ip of this.ips) {
          let res = shell.exec(`ssh -p ${this.port} ${opts.userName}@${ip} 'mkdir ${this.dist}'`);
          console.log('publish', res);
          if (fileFlag) {
            shell.exec(`scp -P ${this.port} -r ${this.src} ${opts.userName}@${ip}:${this.dist}`)
          } else {
            shell.exec(`scp -P ${this.port} -r ${this.src}/* ${opts.userName}@${ip}:${this.dist}`)
          }
        }
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

  validatePublishOpts (opts = {}) {
    let msg = '';
    if ((opts.ips == null || opts.ips.length <= 0) && (this.ips == null || this.ips.length <= 0)) {
      msg += "参数错误, 必须要设置待进行免密登录的服务器IP数组! ";
    }
    if (opts.src == null && this.src == null) {
      msg += "参数错误, 必须要设置待进行发布的本地目录或文件! ";
    }
    if (opts.dist == null && this.dist == null) {
      msg += "参数错误, 必须要设置待进行发布的远程ECS目录! ";
    }
    if (opts.userName == null && this.userName == null) {
      msg += "参数错误, 必须要设置待进行发布的远程ECS的登录账号名! ";
    }
    if (msg != '') {
      throw new Error(msg);
    }
  }

  buildAvoidPwdTrust (opts) {
    this.validateBuildAvoidOpts(opts)
    return new Promise((resolve, reject) => {
      try {
        if (!fs.existsSync(opts.keyFilePath)) {
          shell.echo("创建本地公私钥,一路回车即可...")
          shell.exec(`ssh-keygen -t rsa -P "" -C ${opts.email}`)
        }
        if (opts.ips != null && opts.ips.length > 0) this.ips = opts.ips
        if (opts.port) this.port = opts.port
        for (let ip of this.ips) {
          shell.exec(`scp -P ${this.port} ${opts.keyFilePath} ${opts.userName}@${ip}:/home`);
          shell.exec(`ssh -p ${this.port} ${opts.userName}@${ip} 'cat /home/id_rsa.pub  >> /root/.ssh/authorized_keys'`);
          // shell.exec(`scp -P ${this.port} ${opts.keyFilePath} ${opts.userName}@${ip}:/home`)
          // shell.exec(`ssh -p ${this.port} ${opts.userName}@${ip} 'cat /home/id_rsa.pub  >> /root/.ssh/authorized_keys'`)
        }
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

  validateBuildAvoidOpts (opts = {}) {
    let msg = '';
    if (opts.keyFilePath == null) {
      msg += "参数错误, 必须要设置keyFilePath参数! ";
    }
    if (opts.email == null) {
      msg += "参数错误, 必须要设置email参数! ";
    }
    if ((opts.ips == null || opts.ips.length <= 0) && (this.ips == null || this.ips.length <= 0)) {
      msg += "参数错误, 必须要设置待进行免密登录的服务器IP数组! ";
    }
    if (opts.userName == null) {
      msg += "参数错误, 必须要设置userName参数! ";
    }
    if (msg != '') {
      throw new Error(msg);
    }
  }
}

module.exports = ECSClient;
