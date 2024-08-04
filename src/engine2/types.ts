export enum LogLevel {
  DEBUG = 0,
  WARN = 1,
  ERROR = 2,
}

declare global {
  interface Window {
      yinsudaClient: any;
  }
}


export interface LoggerConfig {
  level?: LogLevel
  prefix?: string
}


export interface EngineConfig {
  rtcClient?: any // agora 
}

// 歌词一个字数据
export interface LyricWord {
  start: number,
  duration: number,
  content: string
}

// 一行歌词数据
export interface LyricItem {
  start: number,
  duration: number,
  lastToneEndTime: number, // 最后一个字的结束时间
  content: LyricWord[]
}

// 歌曲数据
export interface LyricModel {
  al: string // 专辑
  ar: string // 作者
  ti: string // 歌曲名
  by: string // 作词
  offset: number // 偏移量
  ext: any // 扩展信息
  content: LyricItem[]
}

export enum BgmStatus {
  IDLE = 0,
  PLAYING = 3,
  PAUSE = 4
}

export enum BgmType {
  ORIGINAL = 1,
  ACCOMPANY = 2
}

export type EngineEvents = {
  // 歌词行改变
  lineChanged: {
    lineNumber: number // 当前歌词行号
    lineScore: number; // 当前歌词行得分
    totalScore: number; // 总得分 
  },
  // 歌曲播放进度改变
  progressChanged: {
    time: number // 当前歌曲播放时间 ms
  },
  // 歌曲状态改变
  statusChanged: {
    status: BgmStatus, // bgm 播放状态
    type: BgmType // bgm 类型
  }
  // 音高改变
  pitchChanged: {
    realPitch: number // 当前音高
    time: number // 当前时间
  }
}


export interface RecordItem {
  id: number
  text: string
  time: number
}
