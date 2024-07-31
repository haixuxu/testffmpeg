class Gg extends EventEmitter {
    // 获取 sourceNode
    get processSourceNode() {
      return this.sourceNode;
    }
  
    // 设置 processedNode，并在节点变化时重新连接
    set processedNode(node) {
      if (!this.isDestroyed && this._processedNode !== node) {
        try {
          if (this.sourceNode) {
            this.sourceNode.disconnect(this.outputNode);
          }
        } catch (error) {
          // 忽略错误
        }
  
        if (this._processedNode) {
          this._processedNode.disconnect();
        }
  
        this._processedNode = node;
        this.connect();
      }
    }
  
    get processedNode() {
      return this._processedNode;
    }
  
    // 构造函数，用于初始化各种音频节点和状态
    constructor() {
      super();
      this.outputNode = undefined;
      this.outputTrack = undefined;
      this.isPlayed = false;
      this.sourceNode = undefined;
      this.context = undefined;
      this.audioBufferNode = undefined;
      this.destNode = undefined;
      this.audioOutputLevel = 0;
      this.volumeLevelAnalyser = undefined;
      this._processedNode = undefined;
      this.playNode = undefined;
      this.isDestroyed = false;
      this.onNoAudioInput = undefined;
      this.isNoAudioInput = false;
      this._noAudioInputCount = 0;
  
      this.context = Ug();
      this.playNode = this.context.destination;
      this.outputNode = this.context.createGain();
  
      Vg(this.outputNode);
      this.volumeLevelAnalyser = new Bg();
    }
  
    // 开始获取音频缓冲区
    startGetAudioBuffer(bufferSize) {
      if (!this.audioBufferNode) {
        this.audioBufferNode = this.context.createScriptProcessor(bufferSize);
        this.outputNode.connect(this.audioBufferNode);
        this.audioBufferNode.connect(this.context.destination);
        this.audioBufferNode.onaudioprocess = (event) => {
          this.emit(Lf.ON_AUDIO_BUFFER, (bufferEvent) => {
            for (let i = 0; i < bufferEvent.outputBuffer.numberOfChannels; i += 1) {
              const channelData = bufferEvent.outputBuffer.getChannelData(i);
              for (let j = 0; j < channelData.length; j += 1) {
                channelData[j] = 0;
              }
            }
            return bufferEvent.inputBuffer;
          })(event);
        };
      }
    }
  
    // 停止获取音频缓冲区
    stopGetAudioBuffer() {
      if (this.audioBufferNode) {
        this.audioBufferNode.onaudioprocess = null;
        this.outputNode.disconnect(this.audioBufferNode);
        this.audioBufferNode = undefined;
      }
    }
  
    // 创建输出轨道
    createOutputTrack() {
      if (!FS().webAudioMediaStreamDest) {
        throw new SE(fE.NOT_SUPPORTED, "Your browser does not support audio processor");
      }
  
      if (!this.destNode || !this.outputTrack) {
        this.destNode = this.context.createMediaStreamDestination();
        this.outputNode.connect(this.destNode);
        this.outputTrack = this.destNode.stream.getAudioTracks()[0];
      }
  
      return this.outputTrack;
    }
  
    // 播放音频
    play(destination) {
      if (this.context.state !== "running") {
        eI(() => {
          kg.emit("autoplay-failed");
        });
      }
  
      this.isPlayed = true;
      this.playNode = destination || this.context.destination;
      this.outputNode.connect(this.playNode);
    }
  
    // 停止音频播放
    stop() {
      if (this.isPlayed) {
        try {
          this.outputNode.disconnect(this.playNode);
        } catch (error) {
          // 忽略错误
        }
      }
  
      this.isPlayed = false;
    }
  
    // 获取准确的音量级别
    getAccurateVolumeLevel() {
      return this.volumeLevelAnalyser.getVolumeLevel();
    }
  
    // 检查是否有音频输入
    async checkHasAudioInput(retryCount = 0) {
      if (retryCount > 5) {
        this.isNoAudioInput = true;
        if (this.onNoAudioInput) {
          this.onNoAudioInput();
        }
        return false;
      }
  
      if (Kh() || tp()) {
        if (this.context.state === "suspended") {
          this.context.resume();
        }
      } else if (this.context.state !== "running") {
        this.context.resume();
      }
  
      const analyserNode = this.volumeLevelAnalyser.getAnalyserNode();
      let dataArray;
  
      if (analyserNode.getFloatTimeDomainData) {
        dataArray = new Float32Array(analyserNode.fftSize);
        analyserNode.getFloatTimeDomainData(dataArray);
      } else {
        dataArray = new Uint8Array(analyserNode.fftSize);
        analyserNode.getByteTimeDomainData(dataArray);
      }
  
      let hasAudioInput = false;
      for (let i = 0; i < dataArray.length; i++) {
        if (dataArray[i] !== 0) {
          hasAudioInput = true;
          break;
        }
      }
  
      if (hasAudioInput) {
        this.isNoAudioInput = false;
        return true;
      } else {
        await Bv(200);
        return await this.checkHasAudioInput(retryCount + 1);
      }
    }
  
    // 获取音频音量
    getAudioVolume() {
      return this.outputNode.gain.value;
    }
  
    // 设置音量
    setVolume(volume) {
      this.outputNode.gain.setValueAtTime(volume, this.context.currentTime);
    }
  
    // 销毁对象
    destroy() {
      this.disconnect();
      this.stop();
      this.isDestroyed = true;
      this.onNoAudioInput = undefined;
    }
  
    // 断开连接
    disconnect() {
      if (this.processedNode) {
        this.processedNode.disconnect();
      }
      if (this.sourceNode) {
        this.sourceNode.disconnect();
      }
      if (this.outputNode) {
        this.outputNode.disconnect();
      }
    }
  
    // 连接节点
    connect() {
      if (this.processedNode) {
        this.processedNode.connect(this.outputNode);
      } else if (this.sourceNode) {
        this.sourceNode.connect(this.outputNode);
      }
      this.volumeLevelAnalyser.updateSource(this.outputNode);
    }
  }
  
  