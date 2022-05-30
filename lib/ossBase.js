'use strict';

class OssBase {
  constructor() { }

  backupFile (params) {
    this.backupFile(params)
  }

  listBackups (params) {
    this.listBackups(params)
  }

  publishDir (params) {
    this.publishDir(params)
  }

  publishFile (params) {
    this.publishFile(params)
  }

  backup (params) {
    this.backup(params)
  }

  rollback (params) {
    this.rollback(params)
  }

  listBuckets () {
    this.listBuckets()
  }

  listFiles (params) {
    this.listFiles(params)
  }

  downloadFile (params) {
    this.downloadFile(params)
  }

  downloadDir (params) {
    this.downloadDir(params)
  }

  switchBucket (bucket) {
    this.changeBucket(bucket)
  }

  deleteFile (params) {
    this.deleteFile(params)
  }

  deleteDir (params) {
    this.deleteDir(params)
  }
}

module.exports = OssBase;
