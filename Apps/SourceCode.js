import fs from "node:fs/promises"
import File from "../Model/file.js"
import path from "path"
import puppeteer from "../../../lib/puppeteer/puppeteer.js"

const htmlDir = `${process.cwd()}/plugins/TRSS-Plugin/Resources/SourceCode/`
const tplFile = `${htmlDir}SourceCode.html`

export class SourceCode extends plugin {
  constructor() {
    super({
      name: "SourceCode",
      dsc: "SourceCode",
      event: "message",
      priority: -Infinity,
      rule: [
        {
          reg: "^sc.+",
          fnc: "SourceCode"
        }
      ]
    })
  }

  async SourceCode() {
    if(!this.e.isMaster)return false
    const msg = this.e.msg.replace("sc", "").trim()
    logger.mark(`[SourceCode] 查看：${logger.blue(msg)}`)

    let scFile = msg
    if (/^https?:\/\//.test(msg)) {
      scFile =`${process.cwd()}/data/cache.sc`
      const ret = await Bot.download(msg, scFile)
      if (!ret) {
        await this.reply("文件下载错误", true)
        return false
      }
    }

    scFile = await new File(this).choose(scFile)
    if (!scFile) {
      await this.reply("文件不存在", true)
      return false
    }

    const SourceCode = (await fs.readFile(scFile, "utf-8"))
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/ /g, "&nbsp;")
    const fileSuffix = path.extname(scFile).slice(1)
    const img = await puppeteer.screenshot("SourceCode", { tplFile, htmlDir, SourceCode, fileSuffix })

    await this.reply(img, true)
  }
}