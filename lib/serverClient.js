'use strict';

const ftp = require('ftp');//连接FTP
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const shell = require('shelljs');
const ServerBase = require('./serverBase');


class ServerClient extends ServerBase {
  constructor(options) {
    super();
    for (let item of options.serverList) {
      item.instance = new ftp()
      item.instance.on('ready', () => {
        console.log(`服务器${item.host}连接成功`);
      });
      item.instance.on('close', () => {
        console.log(`服务器${item.host}连接关闭`);
      });
      item.instance.on('end', () => {
        console.log(`服务器${item.host}连接结束`);
      });
      item.instance.on('error', (err) => {
        console.log(`服务器处理异常 : ${JSON.stringify(err)}`)
      });
      item.instance.connect({
        host: item.host,
        port: item.port,
        user: item.user,
        password: item.password,
        keepalive: 1000
      });
    }
  }

  cwd (client, dirpath) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('cwd====', client, dirpath);
        // let { err: error, dir } = await client.cwd(dirpath)
        client.cwd(dirpath, (err, dir) => {
          resolve({ err: err, dir: dir });
        })
        if (error) {
          resolve({ code: 9999, data: null, msg: error });
        }
        resolve({ code: 0, data: dir, msg: "" })
      } catch (err) {
        reject({
          code: 9999,
          msg: err,
          data: null
        })
      }
    });
  }

  list (client, dirpath) {
    return new Promise(async (resolve, reject) => {
      try {
        let { code, data } = await this.cwd(client, dirpath);
        let { err: error, files } = await client.list(dir)
        if (error) {
          resolve({ code: 9999, data: null, msg: error });
        }
        resolve({ code: 0, data: files, msg: "" })
      } catch (err) {
        reject({
          code: 9999,
          msg: err,
          data: null
        })
      }
    })
  }

  get (client, filePath) {
    return new Promise(async (resolve, reject) => {
      try {
        const dirpath = path.dirname(filePath);
        const fileName = path.basename(filePath);
        let { code, data, msg } = await this.cwd(client, dirpath);
        let { err: error, rs } = client.get(fileName);
        if (error) {
          resolve({ code: 9999, data: null, msg: error });
        }
        let ws = fs.createWriteStream(fileName);
        rs.pipe(ws);
        resolve({ code: 0, data: null, msg: "" })
      } catch (err) {
        reject({
          code: 9999,
          msg: err
        })
      }
    })
  }

  put (client, currentFile, targetFilePath) {
    return new Promise(async (resolve, reject) => {
      try {
        const dirpath = path.dirname(targetFilePath);
        const fileName = path.basename(targetFilePath);
        const rs = fs.createReadStream(currentFile);
        let { err: err, dir } = await this.cwd(client, dirpath);
        if (err) {
          resolve({ code: 9999, data: null, msg: err });
        }
        let { err: error } = client.put(rs, fileName)
        if (error) {
          resolve({ code: 9999, data: null, msg: error });
        }
        resolve({ code: 0, data: null, msg: "" })
      } catch (err) {
        reject({
          code: 9999,
          msg: err
        })
      }
    })
  }
}

module.exports = ServerClient;
