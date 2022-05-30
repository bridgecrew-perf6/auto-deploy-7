const path = require('path')
const axios = require('axios');
const shell = require("shelljs");
const Client = require('ssh2-sftp-client');
const AutoDeployBase = require('./autoDeployBase');
const ProgressBar = require('./progress-bar');
const ssh2 = require('ssh2');
const fs = require('fs');
const sd = require('silly-datetime');
const readlineSync = require('readline-sync');

class AutoDeployClient extends AutoDeployBase {
  constructor(options) {
    super();
    this.dingUrl = options.notice.webHookUrl || 'https://oapi.dingtalk.com/robot/send?access_token=5b612fb4c276f4ea604ac61ff4a8c70c3cb54fc9a89ceb262f4602e15c52c2d1'
    this.noticeList = options.noticeList
    this.appName = options.appName
    this.serverList = options.serverList
    this.config = options.config
    this.webName = options.webName
    this.notice = options.notice
    this.backupName = `${options.webName}_${sd.format(new Date(), 'YYYYMMDDHHmmss')}`;
  }

  uploading (progressBar, num, total) {
    if (num <= total) {
      progressBar.render({ completed: num, total: total });
    }
  }

  upload () {
    return new Promise(async (resolve, reject) => {
      let count = 0
      try {
        for (let item of this.serverList) {
          //应用发布Start
          item.sftpClient = new Client()
          item.instance = await item.sftpClient.connect({
            host: item.host,
            port: item.port,
            username: item.user,
            password: item.password,
          })
          let fileList = await this.getFileList(this.config.localDir);
          item.progressBar = new ProgressBar('发版进度', fileList.length);
          item.num = 0
          item.total = fileList.length
          console.log(`服务器${item.host}上应用${this.appName}发布中...`);
          let interval = setInterval(() => {
            item.num++
            this.uploading(item.progressBar, item.num, item.total)
          }, 100)
          let result = await item.sftpClient.uploadDir(this.config.localDir, `${this.config.remoteDir}/${this.webName}`);
          await item.sftpClient.chmod(`${this.config.remoteDir}/${this.webName}`, '0o777');
          item.num = item.total
          this.uploading(item.progressBar, item.num, item.total)
          console.log(`\n服务器${item.host}上应用${this.appName}发布完成...`);
          interval && clearInterval(interval)
          await item.sftpClient.end();
          //应用发布End
          count++
          //应用备份Start
          item.conn = new ssh2.Client()
          console.log(`服务器${item.host}上应用${this.appName}开始进行备份...`)
          await item.conn.on('ready', async () => {
            const command = `chmod -R 755 ${this.config.remoteDir}/${this.webName} && cp -r ${this.config.remoteDir}/${this.webName} ${this.config.backupDir}/${this.backupName}`
            await item.conn.exec(command, async (err, stream) => {
              console.log(`服务器${item.host}上应用${this.appName}版本${this.backupName}备份中...`)
              if (err) {
                throw new Error(err);
              };
              await stream.on('close', async (code, signal) => {
                item.conn.end();
              }).on('end', () => {
                console.log(`${this.appName}版本${this.backupName}备份完成!`)
              }).on('data', async (data) => { });
              resolve({
                code: 0,
                msg: `${this.appName}发版完成`,
                data: `${this.backupName}`
              })
            });
          }).on('error', err => {
            console.error('ssh2 error', err);
            throw new Error(err);
          }).connect({
            host: item.host,
            port: item.port,
            username: item.user,
            password: item.password,
            readyTimeout: 5000
          });
          //应用备份End
        }
      } catch (err) {
        // console.log(err);
        this.sendDingMsg(false, "发版", err)
      } finally {
        //todo...
        (count == this.serverList.length) && this.sendDingMsg(true, "发版")
      }
    })
  }

  rollback () {
    const input = readlineSync.question('请输入待会滚的版本号?');
    const version = input.trim();
    if (version == "") {
      this.rollback()
      return
    }
    return new Promise(async (resolve, reject) => {
      let count = 0
      try {
        for (let item of this.serverList) {
          //验证版本是否存在
          item.sftpClient = new Client()
          item.instance = await item.sftpClient.connect({
            host: item.host,
            port: item.port,
            username: item.user,
            password: item.password,
          })
          let exists = await item.sftpClient.exists(`${this.config.backupDir}/${version}`);
          // console.log('exists', exists, `${this.config.backupDir}/${version}`);
          await item.sftpClient.end();
          if (!exists) {
            resolve({
              code: 9999,
              msg: `版本${version}不存在`,
              data: null
            })
            throw new Error("版本不存在");
          } else {
            count++
            //应用回滚Start
            item.conn = new ssh2.Client()
            console.log(`服务器${item.host}上应用${this.appName}开始进行回滚...`)
            await item.conn.on('ready', async () => {
              const command = `rm -rf ${this.config.remoteDir}/${this.webName} && cp -r ${this.config.backupDir}/${version} ${this.config.remoteDir}/${this.webName} && chmod -R 755 ${this.config.remoteDir}/${this.webName}`
              await item.conn.exec(command, async (err, stream) => {
                console.log(`服务器${item.host}上应用${this.appName}版本${this.backupName}回滚中...`)
                if (err) {
                  throw new Error(err);
                };
                await stream.on('close', async (code, signal) => {
                  item.conn.end();
                }).on('end', () => {
                  console.log(`${this.appName}版本${this.backupName}回滚完成!`)
                }).on('data', async (data) => { });
                resolve({
                  code: 0,
                  msg: `${this.appName}回滚完成`,
                  data: null
                })
              });
            }).on('error', err => {
              console.error('ssh2 error', err);
              throw new Error(err);
            }).connect({
              host: item.host,
              port: item.port,
              username: item.user,
              password: item.password,
              readyTimeout: 5000
            });
            //应用回滚End
          }
        }
      } catch (err) {
        this.sendDingMsg(false, `版本${version}回滚`, err)
      } finally {
        (count == this.serverList.length) && this.sendDingMsg(true, `版本${version}回滚`)
      }
    })
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

  sortDirectory (path, files, i, dir) {
    console.log('path, files, i, dir', path, files, i, dir);
    return new Promise(async (resolve, reject) => {
      if (!i) { i = 0; }
      if (!dir) { dir = []; }
      if (i < files.length) {
        await fs.lstat(`${path}/${files[i]}`, async (err, stat) => {
          if (err) {
            resolve(err);
          }
          if (stat.isDirectory()) {
            dir.push(files[i]);
          }
          console.log(files[i]);
          await this.sortDirectory(path, files, i + 1, dir);
        });
      } else {
        resolve(dir);
      }
    })
  }

  listDirectory (path, callback) {
    return new Promise(async (resolve, reject) => {
      await fs.readdir(path, async (err, files) => {
        if (err) {
          resolve(err)
        } else {
          let res = await this.sortDirectory(path, files);
          resolve(res)
        }
      })
    })
  }

  sendDingMsg (success, message, data) {
    if (!this.notice.switch) return
    let webHookConfig = {}
    if (success) {
      webHookConfig = {
        method: 'post',
        url: this.dingUrl,
        headers: {
          'Content-Type': 'application/json'
        },
        data: JSON.stringify({
          "at": {
            "atMobiles": this.notice.dingList,
            "isAtAll": false
          },
          "text": {
            "content": `${this.appName}应用${message}完成，请进行功能验证!`
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
            "atMobiles": this.noticeList,
            "isAtAll": false
          },
          "text": {
            "content": `${this.appName}应用${message}失败，请确认并及时处理! ${data}`
          },
          "msgtype": "text"
        })
      };
    }
    axios(webHookConfig)
  }
}

module.exports = AutoDeployClient