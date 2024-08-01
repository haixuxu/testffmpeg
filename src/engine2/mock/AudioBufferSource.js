import { AudioController } from "./AudioContrller";

const AUDIO_SOURCE_STATE_CHANGE = "audio_source_state_change";

export class AudioBufferSource extends AudioController {
    // 构造函数，用于初始化音频缓冲区和相关选项
    constructor(audioBuffer, options = {}) {
      super();
      this.audioBuffer = audioBuffer;
      this.sourceNode = undefined;
      this.startPlayTime = 0;
      this.startPlayOffset = options.startPlayTime || 0;
      this.pausePlayTime = 0;
      this.options = options;
      this.currentLoopCount = 0;
      this._currentState = "stopped";
    }
  
    // 设置当前状态，并在状态变化时发出事件
    set currentState(state) {
      if (state !== this._currentState) {
        this._currentState = state;
        this.emit(AUDIO_SOURCE_STATE_CHANGE, this._currentState);
      }
    }
  
    // 获取当前状态
    get currentState() {
      return this._currentState;
    }
  
    // 创建音频图表（增益节点）
    createWebAudioDiagram() {
      return this.context.createGain();
    }
  
    // 获取音频缓冲区的持续时间
    get duration() {
      return this.audioBuffer.duration;
    }
  
    // 获取当前播放时间
    get currentTime() {
      if (this.currentState === "stopped") {
        return 0;
      } else if (this.currentState === "paused") {
        return this.pausePlayTime;
      } else {
        return (this.context.currentTime - this.startPlayTime + this.startPlayOffset) % this.audioBuffer.duration;
      }
    }
  
    // 更新选项
    updateOptions(options) {
      if (this.currentState === "stopped") {
        this.options = options;
        this.startPlayOffset = this.options.startPlayTime || 0;
      } else {
        console.warn("Cannot set audio source options while playing");
      }
    }
  
    // 开始处理音频缓冲区
    startProcessAudioBuffer() {
      if (this.sourceNode) {
        this.stopProcessAudioBuffer();
      }
      this.sourceNode = this.createSourceNode();
      this.startSourceNode();
      this.currentState = "playing";
    }
  
    // 暂停处理音频缓冲区
    pauseProcessAudioBuffer() {
      if (this.sourceNode && this.currentState === "playing") {
        this.pausePlayTime = this.currentTime;
        this.sourceNode.onended = null;
        this.sourceNode.stop();
        this.sourceNode.buffer = null;
        this.sourceNode = this.createSourceNode();
        this.currentState = "paused";
      }
    }
  
    // 跳转到音频缓冲区的特定时间
    seekAudioBuffer(time) {
      if (this.sourceNode) {
        this.sourceNode.onended = null;
        if (this.currentState === "playing") {
          this.sourceNode.stop();
        }
        this.sourceNode = this.createSourceNode();
        if (this.currentState === "playing") {
          this.startPlayOffset = time;
          this.startSourceNode();
        } else if (this.currentState === "paused") {
          this.pausePlayTime = time;
        }
      }
    }
  
    // 继续处理音频缓冲区
    resumeProcessAudioBuffer() {
      if (this.currentState === "paused" && this.sourceNode) {
        this.startPlayOffset = this.pausePlayTime;
        this.pausePlayTime = 0;
        this.startSourceNode();
        this.currentState = "playing";
      }
    }
  
    // 停止处理音频缓冲区
    stopProcessAudioBuffer() {
      if (this.sourceNode) {
        this.sourceNode.onended = null;
        try {
          this.sourceNode.stop();
        } catch (error) {
          // 处理错误
        }
        this.reset();
      }
    }
  
    // 开始音频源节点
    startSourceNode() {
      if (this.sourceNode && this.sourceNode.buffer) {
        this.sourceNode.start(0, this.startPlayOffset);
        this.startPlayTime = this.context.currentTime;
        this.sourceNode.onended = this.handleSourceNodeEnded.bind(this);
      }
    }
  
    // 创建音频源节点
    createSourceNode() {
      const sourceNode = this.context.createBufferSource();
      sourceNode.buffer = this.audioBuffer;
      sourceNode.loop = !!this.options.loop;
      sourceNode.connect(this.outputNode);
      return sourceNode;
    }
  
    // 处理音频源节点结束
    handleSourceNodeEnded() {
      this.currentLoopCount += 1;
      if (this.options.cycle && this.options.cycle > this.currentLoopCount) {
        this.startPlayOffset = 0;
        this.sourceNode = undefined;
        this.startProcessAudioBuffer();
      } else {
        this.reset();
      }
    }
  
    // 重置状态
    reset() {
      this.startPlayOffset = this.options.startPlayTime || 0;
      this.currentState = "stopped";
      if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode = undefined;
      }
      this.currentLoopCount = 0;
    }
  }
  
  