
// 定义 BufferSourceAudioTrack 类
class BufferSourceAudioTrack extends Ev {
  get __className__() {
    return "BufferSourceAudioTrack";
  }

  constructor(source, bufferSource, outputTrack, options) {
    super(outputTrack.createOutputTrack(), bufferSource, options);
    this.source = source;
    this._bufferSource = bufferSource;

    this._bufferSource.on(Lf.AUDIO_SOURCE_STATE_CHANGE, (event) => {
      this.emit(_S.SOURCE_STATE_CHANGE, event);
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

