import { AudioController } from "./AudioController";

const AUDIO_SOURCE_STATE_CHANGE = "audio_source_state_change";

export class AudioBufferSource extends AudioController {
  constructor(mp3Data, options = {}) {
    super(options);
    this.sourceNode = null;
    this.nextSourceNode = null;
    this.audioBuffer = null;
    this.startPlayTime = 0;
    this.startPlayOffset = options.startPlayTime || 0;
    this.pausePlayTime = 0;
    this.options = options;
    this.currentLoopCount = 0;
    this._currentState = "stopped";
    this.chunkQueue = []; // 用于存储解码后的音频块
    this.isDecoding = false;
    this.isPreparingNextChunk = false;
    this.mp3Data = mp3Data; // 存储 MP3 数据
  }

  async decodeMP3DataInChunks() {
    const chunkSize = 1024 * 64; // 每次解码64KB的数据块
    for (let offset = 0; offset < this.mp3Data.length; offset += chunkSize) {
      const chunk = this.mp3Data.slice(offset, offset + chunkSize);
      console.log('decode ====',chunk.buffer.byteLength);
      const decodedData = await this.context.decodeAudioData(chunk.buffer);
      this.chunkQueue.push(decodedData);
      if (this.currentState === "playing" && !this.nextSourceNode) {
        this.prepareNextChunk();
      }
    }
  }

  prepareNextChunk() {
    if (this.chunkQueue.length > 0 && !this.isPreparingNextChunk) {
      this.isPreparingNextChunk = true;
      const nextBuffer = this.chunkQueue.shift();
      this.nextSourceNode = this.createSourceNode(nextBuffer);
      this.nextSourceNode.onended = () => {
        this.isPreparingNextChunk = false;
        this.cleanUpBuffer(nextBuffer); // 清理已播放的缓冲区
        this.playNextChunk();
      };
    }
  }

  playNextChunk() {
    if (this.nextSourceNode) {
      if (this.sourceNode) {
        this.sourceNode.disconnect();
      }
      this.sourceNode = this.nextSourceNode;
      this.startSourceNode();
      this.nextSourceNode = null;
      this.prepareNextChunk();
    }
  }

  cleanUpBuffer(buffer) {
    if (buffer) {
      buffer = null;
    }
  }

  set currentState(state) {
    if (state !== this._currentState) {
      this._currentState = state;
      this.emit(AUDIO_SOURCE_STATE_CHANGE, this._currentState);
    }
  }

  get currentState() {
    return this._currentState;
  }

  createGainNode() {
    return this.context.createGain();
  }

  get duration() {
    return this.audioBuffer ? this.audioBuffer.duration : 0;
  }

  get currentTime() {
    if (this.currentState === "stopped") {
      return 0;
    } else if (this.currentState === "paused") {
      return this.pausePlayTime;
    } else {
      return (this.context.currentTime - this.startPlayTime + this.startPlayOffset);
    }
  }

  updateOptions(options) {
    if (this.currentState === "stopped") {
      this.options = options;
      this.startPlayOffset = this.options.startPlayTime || 0;
    } else {
      console.warn("Cannot set audio source options while playing");
    }
  }

  startProcessAudioBuffer() {
    if (this.sourceNode) {
      this.stopProcessAudioBuffer();
    }
    this.currentState = "playing";
    this.decodeMP3DataInChunks();
    this.prepareNextChunk(); // 提前准备第一个 chunk
    this.playNextChunk(); // 开始播放第一个 chunk
  }

  pauseProcessAudioBuffer() {
    if (this.sourceNode && this.currentState === "playing") {
      this.pausePlayTime = this.currentTime;
      this.sourceNode.onended = null;
      this.sourceNode.stop();
      this.sourceNode.buffer = null;
      this.currentState = "paused";
    }
  }

  seekAudioBuffer(time) {
    if (this.sourceNode) {
      this.sourceNode.onended = null;
      if (this.currentState === "playing") {
        this.sourceNode.stop();
      }
      this.startPlayOffset = time;
      this.chunkQueue = []; // 清空当前队列
      this.isDecoding = false;
      this.isPreparingNextChunk = false;
      this.startProcessAudioBuffer(); // 重新解码
    }
  }

  resumeProcessAudioBuffer() {
    if (this.currentState === "paused" && this.sourceNode) {
      this.startPlayOffset = this.pausePlayTime;
      this.pausePlayTime = 0;
      this.currentState = "playing";
      this.playNextChunk();
    }
  }

  stopProcessAudioBuffer() {
    if (this.sourceNode) {
      this.sourceNode.onended = null;
      try {
        this.sourceNode.stop();
      } catch (error) {
        // Handle error
      }
      this.reset();
    }
  }

  startSourceNode() {
    if (this.sourceNode) {
      this.sourceNode.start(0, this.startPlayOffset);
      this.startPlayTime = this.context.currentTime;
    }
  }

  createSourceNode(buffer) {
    const sourceNode = this.context.createBufferSource();
    sourceNode.buffer = buffer;
    sourceNode.loop = !!this.options.loop;
    sourceNode.connect(this.outputNode);
    return sourceNode;
  }

  handleSourceNodeEnded() {
    this.currentLoopCount += 1;
    if (this.options.cycle && this.options.cycle > this.currentLoopCount) {
      this.startPlayOffset = 0;
      this.sourceNode = null;
      this.startProcessAudioBuffer();
    } else {
      this.reset();
    }
  }

  reset() {
    this.startPlayOffset = this.options.startPlayTime || 0;
    this.currentState = "stopped";
    this.chunkQueue = [];
    this.isDecoding = false;
    this.isPreparingNextChunk = false;
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.nextSourceNode) {
      this.nextSourceNode.disconnect();
      this.nextSourceNode = null;
    }
    this.currentLoopCount = 0;
  }

  close() {
    this.reset();
    this.audioBuffer = null;
  }
}

