import { LocalAudioTrack } from "./LocalAudioTrack";

// 定义 BufferSourceAudioTrack 类
export class BufferSourceAudioTrack {
  constructor(localAudioTrack) {
    this._localTrack = localAudioTrack;

  }

  get currentState() {
    return this._localTrack.currentState;
  }

  get duration() {
    return this._localTrack.duration;
  }

  getCurrentTime() {
    return this._localTrack.currentTime;
  }

  startProcessAudioBuffer(options) {
    if (options) {
      this._bufferSource.updateOptions(options);
    }
    this._localTrack.startProcessAudioBuffer();
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
