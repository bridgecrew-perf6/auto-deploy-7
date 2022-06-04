const fs = require('fs');
const path = require('path');
const util = require('util');
const rd = require('rd');

class OssUploadDir {
  constructor(ossClient) {
    this.ossClient = ossClient;
    this.files = [];
  }

  upload (dir) {
    const files = rd.readFileSync(dir).map(pathStr => {
      const absoluteDirPath = path.resolve(dir);
      return {
        path: pathStr,
        dir: absoluteDirPath,
        ossTarget: path.relative(absoluteDirPath, pathStr).replace(/\\/g, '/')
      }
    });
    this.files = [...this.files, ...files];
    return this;
  }

  filter (indicator) {
    this.files = this.files.filter(indicator);
    return this;
  }

  sort (indicator) {
    this.files.sort(indicator);
    return this;
  }

  async to (target, options = {}) {
    const results = [];
    for (const file of this.files) {
      const result = await this.ossClient.putStream(
        path.posix.join(target, file.ossTarget),
        fs.createReadStream(file.path),
        Object.assign({
          timeout: 20 * 1000
        }, options));
      results.push(result);
    }
    return results;
  }
}


const ossMutiUploadClient = (ossClient) => {
  return new OssUploadDir(ossClient);
}

module.exports = ossMutiUploadClient;
