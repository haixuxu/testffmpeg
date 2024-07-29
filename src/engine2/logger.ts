import { formatTime, } from "./utils"
import { LogLevel, LoggerConfig, RecordItem } from "./types"


class Logger {
  level: LogLevel = LogLevel.ERROR
  prefix?: string = ""
  preTime?: number = 0
  _recordList: RecordItem[] = []

  constructor(config: LoggerConfig) {
    const { level, prefix } = config
    if (level !== undefined) {
      this.level = level
    }
    if (prefix) {
      this.prefix = prefix
    }
  }

  setLogLevel(level: LogLevel) {
    this.level = level
  }

  debug(...args: any[]) {
    this.level <= LogLevel.DEBUG &&
      this._log(`${this._genPrefix()}[DEBUG]: `, ...args)
  }

  // info(...args: any[]) {
  //   this.level <= LogLevel.INFO &&
  //     this._log(`${this._genPrefix()}[INFO]: `, ...args)
  // }

  warn(...args: any[]) {
    this.level <= LogLevel.WARN &&
      this._log(`${this._genPrefix()}[WARN]: `, ...args)
  }

  error(...args: any[]) {
    this.level <= LogLevel.ERROR &&
      this._err(`${this._genPrefix()}[ERROR]: `, ...args)
  }




  record(...args: any[]) {
    const now = Date.now()
    let ms = 0
    if (this._recordList.length) {
      const last = this._recordList[this._recordList.length - 1]
      ms = now - last.time
    }
    const text = `[time] ${args} +${ms}ms`
    this._recordList.push({ id: this._recordList.length, text, time: now })
    this.debug(text)
  }

  recordEnd() {
    this._recordList = []
  }


  //  ---------------------------- private ----------------------------

  private _log(...args: any[]) {
    const [arg, ...other] = args
    console.log(`%c${arg}`, "color:yellow", ...other)
  }

  private _err(...args: any[]) {
    let res = ""
    for (const item of args) {
      res += typeof item == "string" ? item : JSON.stringify(item)
    }
    console.error(res)
  }

  private _genPrefix() {
    return formatTime() + (this.prefix ? ` [${this.prefix}]` : "")
  }
}

export const logger = new Logger({
  level: LogLevel.ERROR,
  prefix: "agoraEngine",
})

export default Logger
