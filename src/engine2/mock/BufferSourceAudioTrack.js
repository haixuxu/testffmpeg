import { LocalAudioTrack } from "./LocalAudioTrack";

// 定义 BufferSourceAudioTrack 类
export class BufferSourceAudioTrack extends LocalAudioTrack {
  get __className__() {
    return "BufferSourceAudioTrack";
  }

  constructor(source, bufferSource, encodeConfig, id) {
    super(bufferSource.createOutputTrack(), encodeConfig, id);
    // this.source = source;
    this._bufferSource = bufferSource;

    this._bufferSource.on("audio_source_state_change", (event) => {
      this.emit("source-state-change", event);
    });

    try {
      this._mediaStreamTrack = this._source.createOutputTrack();
    } catch (error) {
      // 处理错误
    }
  }

  get currentState() {
    return this._bufferSource.currentState;
  }

  get duration() {
    return this._bufferSource.duration;
  }

  getCurrentTime() {
    return this._bufferSource.currentTime;
  }

  startProcessAudioBuffer(options) {
    if (options) {
      this._bufferSource.updateOptions(options);
    }
    this._bufferSource.startProcessAudioBuffer();
  }

  pauseProcessAudioBuffer() {
    this._bufferSource.pauseProcessAudioBuffer();
  }

  seekAudioBuffer(time) {
    this._bufferSource.seekAudioBuffer(time);
  }

  resumeProcessAudioBuffer() {
    this._bufferSource.resumeProcessAudioBuffer();
  }

  stopProcessAudioBuffer() {
    this._bufferSource.stopProcessAudioBuffer();
  }
}
