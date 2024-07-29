import { krc } from 'smart-lyric'
import { LyricModel } from "./types"

function _pad(num: number) {
  return num.toString().padStart(2, "0")
}

export const formatTime = (date?: Date) => {
  if (!date) {
    date = new Date()
  }
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()
  const milliseconds = date.getMilliseconds()

  return `${_pad(hours)}:${_pad(minutes)}:${_pad(seconds)}:${_pad(milliseconds)}`
}


export const parseKrcString = (KrcString: string): LyricModel => {
  const lyricModel = krc.parse(KrcString) as unknown as LyricModel
  for (const item of lyricModel.content) {
    const lastTone = item.content[item.content.length - 1]
    const lastToneEndTime = item.start + lastTone.start + lastTone.duration
    item.lastToneEndTime = lastToneEndTime
  }
  return lyricModel
}
