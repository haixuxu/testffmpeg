import { resolveToken } from "./request"
import { logger } from "./logger"
import { LogLevel, EngineConfig, LyricModel, EngineEvents, BgmStatus, BgmType } from "./types"
import mitt, { Emitter, Handler } from "mitt";
import { parseKrcString } from "./utils"
import "./yisudaSdk/index.umd.js"
import { downloadSongById } from "./mockapi";
import { BufferSourceAudioTrack } from "./mock/BufferSourceAudioTrack";

import { AudioBufferSource } from "./mock/AudioBufferSource";
import { manager } from "./mock/Mp3MediaStreamTrackManager";

window.AudioBufferSourceCustom = AudioBufferSource;

export * from "./types"


async function createMediaStreamTrackFromMp3(mp3Data) {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const mediaSource = new MediaSource();

    mediaSource.addEventListener('sourceopen', () => {
      const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
      sourceBuffer.addEventListener('updateend', () => {
        if (!sourceBuffer.updating && mediaSource.readyState === 'open') {
          mediaSource.endOfStream();
        }
      });

      sourceBuffer.appendBuffer(mp3Data);

      const audioTrack = audioContext.createMediaElementSource(audioElement);
      const destination = audioContext.createMediaStreamDestination();

      audioTrack.connect(destination);
      resolve(destination.stream.getAudioTracks()[0]);
    });

    const audioElement = document.createElement('audio');
    audioElement.src = URL.createObjectURL(mediaSource);
    audioElement.play();

    mediaSource.addEventListener('error', (e) => {
      reject(e);
    });
  });
}

declare global {
  interface Window {
    yinsudaClient: any;
  }
}


const PID =  import.meta.env.VITE_APP_ID
const APP_KEY = import.meta.env.VITE_APP_KEY
const SCORE_HARD_LEVEL = 5
const PROGRESS_INTERVAL_TIME = 20;
// @ts-ignore
const AgoraRTC = window.AgoraRTC

export class Engine {
  pid: string = PID
  pKey: string = APP_KEY
  userId: string = ""   // yinsuda uid
  token: string = ""
  currentTime: number = 0; // 当前时间戳  ms
  currentLine: number = 0; // 当前行数
  lyric: LyricModel = {} as LyricModel; // 歌词数据
  config: EngineConfig
  audioTrack?: any // 音频轨道
//   audioContext: AudioContext = new AudioContext() // 音频上下文
  audioContext?:any// 音频上下文
  originalBgmTrack?: any // 原唱轨道
  accompanyBgmTrack?: any // 伴奏轨道
  mediaStreamAudioSourceNode?: MediaStreamAudioSourceNode
  bgmStatus = BgmStatus.IDLE
  bgmType = BgmType.ORIGINAL
  // ----------- private ------------
  private _emitter: Emitter<EngineEvents> = mitt()
  private _intervalIds: any[] = []
  private _bgmTimerStart = false


  get isIdle() {
    return this.bgmStatus === BgmStatus.IDLE
  }

  get isOriginalBgmStart() {
    return this?.originalBgmTrack?.getCurrentTime() > 0
  }

  get isAccompanyBgmStart() {
    return this?.accompanyBgmTrack?.getCurrentTime() > 0
  }

  get totalLine() {
    return this.lyric?.content?.length || 0
  }

  get bgmDuration() {
    return this.originalBgmTrack?.duration * 1000 || 0
  }


  constructor(config: EngineConfig) {
    this.config = config
  }

  get rtcClient() {
    return this.config.rtcClient
  }

  get yinsudaClient() {
    if (!window.yinsudaClient) {
      throw new Error("yinsudaClient is not defined")
    }
    return window.yinsudaClient;
  }

  setLogLevel(level: LogLevel) {
    logger.setLogLevel(level)
  }

  async setUser(uid: string) {
    // debugger;
    const tokenInfo = await resolveToken(uid)
    const { yinsuda_uid, token } = tokenInfo;
    this.userId = yinsuda_uid
    this.token = token
    await this.yinsudaClient.setUser({
      userid: this.userId,
      token: this.token,
      clientPid: this.pid,
      appkey: this.pKey,
      isVip: 0
    });
    logger.debug("setUser success")
  }

  async getLyric(songId: string, isAccompany?: boolean) {
    try {
      const config: any = {
        song_id: songId
      }
      if (isAccompany) {
        config.isAccompany = 1
      }
      const { data, status } = await this.yinsudaClient.getLyric({ song_id: songId });
      if (status !== 0) {
        const errMsg = "getLyric error"
        logger.error(errMsg)
        throw new Error(errMsg)
      }
      if (data.lyric) {
        this.lyric = parseKrcString(data.lyric)
      }
      logger.debug("getLyric success", this.lyric)
      return this.lyric
    } catch (err) {
      logger.error("getLyric error", err)
      throw err
    }
  }

  async getPitchData(songId: string) {
    try {
      const { status, data } = await this.yinsudaClient.getPitchData({ song_id: songId });
      if (status !== 0) {
        logger.error("getPitchData error", status)
        throw new Error("getPitchData error")
      }
      logger.debug("getPitchData success", data?.pitch)
      return data?.pitch
    } catch (err) {
      logger.error("getPitchData error", err)
      throw err
    }
  }

  prepare() {
    this.yinsudaClient.setAudioParams({ sampleRate: 48000, channels: 1 });
    this.yinsudaClient.setScoreHardLevel({ level: SCORE_HARD_LEVEL });
    logger.debug("prepare success")
  }

  async getRealTimePitch() {
    try {
      const { status, data } = await this.yinsudaClient.getRealTimePitch();
      if (status !== 0) {
        logger.error("getRealTimePitch error", status)
        throw new Error("getRealTimePitch error")
      }
      logger.debug("getRealTimePitch success", data)
      return data
    } catch (err) {
      logger.error("getRealTimePitch error", err)
      throw err
    }
  }

  async getScore(pts: number = 0) {
    try {
      const { status, data } = await this.yinsudaClient.getScore({ pts });
      if (status !== 0) {
        logger.error("getScore error", status)
        throw new Error("getScore error")
      }
      logger.debug("getScore success", data)
      return data
    } catch (err) {
      logger.error("getScore error", err)
      throw err
    }
  }

  async getAverageScore(pts: number = 0) {
    try {
      const { status, data } = await this.yinsudaClient.getAverageScore({ pts });
      if (status !== 0) {
        logger.error("getAverageScore error", status)
        throw new Error("getAverageScore error")
      }
      logger.debug("getAverageScore success", data)
      return data
    } catch (err) {
      logger.error("getAverageScore error", err)
      throw err
    }
  }

  async getTotalScore(pts: number = 0) {
    try {
      const { status, data } = await this.yinsudaClient.getTotalScore({ pts });
      if (status !== 0) {
        logger.error("getTotalScore error", status)
        throw new Error("getTotalScore error")
      }
      logger.debug("getTotalScore success", data)
      return data
    } catch (err) {
      logger.error("getTotalScore error", err)
      throw err
    }
  }

  async reset() {
    // this.accompanyBgmTrack?.stopProcessAudioBuffer()
    this.accompanyBgmTrack?.close()
    this.accompanyBgmTrack = undefined
    // this.originalBgmTrack?.stopProcessAudioBuffer()
    this.originalBgmTrack?.close()
    this.originalBgmTrack = undefined
    this.bgmStatus = BgmStatus.IDLE
    this.lyric = {} as LyricModel
    this.currentTime = 0
    this.currentLine = 0
    this._bgmTimerStart = false
    this._intervalIds.forEach(id => clearInterval(id))
    this._intervalIds = []
    this.stopProcessAudio()
    this.mediaStreamAudioSourceNode = undefined
    logger.debug("reset success")
  }

  destory() {
    this.reset()
    this.audioContext?.close()
    this._emitter.all.clear()
    this.audioTrack?.close()
    this.audioTrack = undefined
    logger.debug("destory success")
  }

  // ----------------- rtc -----------------
  setAudioTrack(audioTrack: any) {
    this.audioTrack = audioTrack
    logger.debug("setAudioTrack success")
  }

  async startProcessAudio() {
    if(!this.audioContext){
        this.audioContext = new AudioContext();
    }
    if (!this.audioTrack) {
      throw new Error("audioTrack is not defined")
    }
    await this.audioContext.audioWorklet.addModule("pcm-processor.js")
    const audioWorkletNode = new AudioWorkletNode(this.audioContext, "pcm-processor")
    console.log('123213213');
    audioWorkletNode.port.onmessage=function(event){
      console.log('Received message from PCMProcessor:', event.data);
    }
    const audioMediaStreamTrack = this.audioTrack.getMediaStreamTrack()
    this.mediaStreamAudioSourceNode = this.audioContext.createMediaStreamSource(new MediaStream([audioMediaStreamTrack]))
    this.mediaStreamAudioSourceNode.connect(audioWorkletNode)

    audioWorkletNode.port.onmessage = (event) => {
      const pcm = event.data?.pcm
      if (pcm) {
        this._dealAudioPcm(pcm)
      }
    }

    logger.debug("startProcessAudio success")
  }

  stopProcessAudio() {
    if (!this.audioTrack) {
      return;
      // throw new Error("audioTrack is not defined")
    }
    this.mediaStreamAudioSourceNode?.disconnect()
    logger.debug("stopProcessAudio success")
  }

  // ----------------- bgm -----------------
  async genBgmTracks(songId: string, isAccompany?: boolean) {
    logger.record("genBgmTracks start")
    await this.yinsudaClient.initCodec('.');
    logger.record("genBgmTracks initCodec success")
    const config: any = {
      song_id: songId
    }
    if (isAccompany) {
      config.isAccompany = 1
    }

    // 使用mock的api
  //  const res = await downloadSongById(config);
    const res = await this.yinsudaClient.downloadSongById(config);
    
    logger.record("genBgmTracks download song success")
    const mp3Data = res.data.mp3Data
    let accompanyFile
    let originalFile
    let tracks=[];
    if (mp3Data[0]) {
      // 伴奏
      // let accompanyBlob = new Blob([mp3Data[0]], { type: 'audio/mpeg' });
      // accompanyFile = new File([accompanyBlob], 'accompany.mp3', { type: accompanyBlob.type });
      let track1 = await manager.createMediaStreamTrackFromMp3(mp3Data[0],"accompany");
      // let bufferSource = new AudioBufferSource(mp3Data[0]);
      // let audioTrack = new BufferSourceAudioTrack("",bufferSource,{});
      let audioTrack = await AgoraRTC.createCustomAudioTrack({mediaStreamTrack:track1});
      tracks.push(audioTrack);
      // let rtrack1 = await AgoraRTC.createCustomAudioTrack({mediaStreamTrack:track1});
      // tracks.push(rtrack1);
    }
    if (mp3Data[1]) {
      // 原唱
      // let originalBlob = new Blob([mp3Data[1]], { type: 'audio/mpeg' });
      // originalFile = new File([originalBlob], 'original.mp3', { type: originalBlob.type });
      let track2 = await manager.createMediaStreamTrackFromMp3(mp3Data[1],"original");
      let rtrack2 = await AgoraRTC.createCustomAudioTrack({mediaStreamTrack:track2});
      tracks.push(rtrack2);
      // let bufferSource = new AudioBufferSource(mp3Data[1]);
      // let audioTrack = new BufferSourceAudioTrack("",bufferSource,{});
      // tracks.push(audioTrack);
    }
    logger.record("genBgmTracks generate mp3 file success")
    // let tasks = []
    // if (accompanyFile) {

    //   tasks.push(AgoraRTC.createBufferSourceAudioTrack({
    //     source: accompanyFile,
    //   }))
    // }
    // if (originalFile) {
    //   tasks.push(AgoraRTC.createBufferSourceAudioTrack({
    //     source: originalFile,
    //   }))
    // }
    // const tracks = await Promise.all(tasks)
    logger.record("genBgmTracks create buffer source audio track success")
    this.accompanyBgmTrack = tracks[0]
    this.originalBgmTrack = tracks[1]
    this.accompanyBgmTrack?.on("source-state-change", this._handleSourceStateChange.bind(this))
    this.originalBgmTrack?.on("source-state-change", this._handleSourceStateChange.bind(this))
    logger.debug("genBgmTracks success", this.accompanyBgmTrack, this.originalBgmTrack)
    logger.recordEnd()
  }

  playBgm(bgmType: BgmType) {
    // this.originalBgmTrack?.startProcessAudioBuffer();
    this.originalBgmTrack?.play()
    this.accompanyBgmTrack?.play()
    this.bgmStatus = BgmStatus.PLAYING
    this.bgmType = bgmType
    this.emit("statusChanged", { status: this.bgmStatus, type: this.bgmType })
    this._startBgmTimer()
    logger.debug("playBgm success")
  }

  toggleBgmTrack() {
    if (this.bgmType == BgmType.ORIGINAL) {
      // this.originalBgmTrack?.pauseProcessAudioBuffer();
      // switch to accompany
      this.originalBgmTrack?.setEnabled(false);
      this.accompanyBgmTrack?.setEnabled(true);
      this.bgmType = BgmType.ACCOMPANY
    } else if (this.bgmType == BgmType.ACCOMPANY) {
      // this.accompanyBgmTrack?.pauseProcessAudioBuffer();
      // switch to original
      this.originalBgmTrack?.setEnabled(false);
        this.accompanyBgmTrack?.setEnabled(true);
      this.bgmType = BgmType.ORIGINAL
    }
    this.emit("statusChanged", { status: this.bgmStatus, type: this.bgmType })
    logger.debug("toggleBgmTrack success")
  }

  toggleBgmStatus() {
    if (this.bgmStatus === BgmStatus.PLAYING) {
      this._pauseBgm()
      this.bgmStatus = BgmStatus.PAUSE
    } else if (this.bgmStatus == BgmStatus.PAUSE) {
      this._resumeBgm()
      this.bgmStatus = BgmStatus.PLAYING
    }
    this.emit("statusChanged", { status: this.bgmStatus, type: this.bgmType })
    logger.debug("toggleBgmStatus success")
  }

  setBgmVolume(volume: number) {
    if (volume < 0 || volume > 100) {
      return
    }
    if (this.isIdle) {
      return
    }
    this.accompanyBgmTrack?.setVolume(volume);
    this.originalBgmTrack?.setVolume(volume);
  }

  seekBgmProgress(time: number) {
    if (time < 0) {
      return
    }
    if (this.isIdle) {
      return
    }
    this.currentTime = time 
    this.accompanyBgmTrack?.seekAudioBuffer(time / 1000);
    this.originalBgmTrack?.seekAudioBuffer(time / 1000);
    logger.debug("seekBgmProgress success", this.currentTime)
  }

  getBgmProgress() {
    let time = 0
    if (this.isIdle) {
      return time
    }
    if (this.bgmType === BgmType.ORIGINAL) {
      time = this?.originalBgmTrack?.getCurrentTime() || 0
    } else if (this.bgmType == BgmType.ACCOMPANY) {
      time = this?.accompanyBgmTrack?.getCurrentTime() || 0
    }
    return time * 1000
  }

  // ----------------- event -----------------
  on<Key extends keyof EngineEvents>(name: Key, fn: Handler<EngineEvents[Key]>) {
    this._emitter.on<typeof name>(name, fn);
  }

  off<Key extends keyof EngineEvents>(name: Key, fn?: Handler<EngineEvents[Key]>) {
    this._emitter.off<typeof name>(name, fn);
  }

  emit<Key extends keyof EngineEvents>(name: Key, data: EngineEvents[Key]) {
    if (name !== "progressChanged" && name !== "pitchChanged") {
      logger.debug("event emit: ", name, data)
    }
    this._emitter.emit<typeof name>(name, data);
  }

  // ----------------- private -----------------
  private async _dealLine() {
    if (!this.lyric?.content) {
      return
    }
    let len = this.lyric.content.length;
    for (let i = 0; i < len; i++) {
      const lineData = this.lyric.content[i];
      const { lastToneEndTime } = lineData;
      if (this.currentTime >= lastToneEndTime) {
        if (i > this.currentLine) {
          // line change 
          this.currentLine = i
          const [lineScoreInfo, totalScoreInfo] = await Promise.all([
            this.yinsudaClient.getScore({ pts: this.currentTime }),
            this.yinsudaClient.getTotalScore({ pts: this.currentTime })
          ])
          const { index = 0, score = 0 } = lineScoreInfo?.data || {}
          const { totalScore = 0 } = totalScoreInfo?.data || {}
          let lineScore = 0
          if (this.currentLine == index) {
            lineScore = score >= 0 ? score : 0
          }
          this.emit("lineChanged", { lineNumber: this.currentLine, lineScore, totalScore })
          break
        }
      }
    }
  }

  private async _dealAudioPcm(pcm: Float32Array) {
    if (this.bgmStatus !== BgmStatus.PLAYING) {
      return
    }
    //调用process后会计算音高评分
    this.yinsudaClient.processScore({ buffer: pcm, pts: this.currentTime });
    var levelInfo = await this.yinsudaClient.getRealTimePitch();
    const realPitch = levelInfo?.data?.pitch || 0
    this.emit("pitchChanged", { realPitch: realPitch, time: this.currentTime })
  }

  private _startBgmTimer() {
    // if (this._bgmTimerStart) {
    //   return
    // }
    // this._bgmTimerStart = true

    // const id = setInterval(() => {
    //   this.currentTime = this.getBgmProgress()
    //   this.emit("progressChanged", { time: this.currentTime })
    //   this._dealLine()
    // }, PROGRESS_INTERVAL_TIME)

    // this._intervalIds.push(id)
  }

  private _pauseBgm() {
    this.originalBgmTrack?.setEnabled(false);
    this.accompanyBgmTrack?.setEnabled(false);
  }


  private _resumeBgm() {
    if(this.bgmType===BgmType.ORIGINAL){
      this.originalBgmTrack?.setEnabled(true);
    }else{
      this.accompanyBgmTrack?.setEnabled(true);
    }
  }


  private _handleSourceStateChange(currentState: any) {
    logger.debug("bgm source state change", currentState)
    if (currentState == "stopped") {
      this.reset()
      this.emit("statusChanged", {
        status: this.bgmStatus,
        type: this.bgmType
      })
    }
  }

}