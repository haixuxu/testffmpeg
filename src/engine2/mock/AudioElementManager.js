/**
 * 音频元素管理类
 */
class AudioElementManager {
    constructor() {
      // 初始化属性
      this.onAutoplayFailed = undefined;
      this.elementMap = new Map();
      this.elementStateMap = new Map();
      this.elementsNeedToResume = [];
      this.sinkIdMap = new Map();
  
      // 自动恢复音频元素播放的函数
      this.autoResumeAfterInterruption = () => {
        Array.from(this.elementMap.entries()).forEach(([id, element]) => {
          const state = this.elementStateMap.get(id);
          const audioTrack = element.srcObject.getAudioTracks()[0];
          if (Qh()) {
            if (audioTrack && audioTrack.readyState === "live" && kg.curState === "running") {
              console.debug("auto resume after interruption for iOS 15");
              element.pause();
              element.play();
            }
          } else if (state === "paused" && audioTrack && audioTrack.readyState === "live" && kg.curState === "running") {
            console.debug("auto resume after interruption for iOS");
            element.play();
          }
        });
      };
  
      this.autoResumeAfterInterruptionOnIOS15 = () => {
        Array.from(this.elementMap.entries()).forEach(([id, element]) => {
          const audioTrack = element.srcObject.getAudioTracks()[0];
          if (audioTrack && audioTrack.readyState === "live") {
            console.debug("auto resume after interruption inside autoResumeAfterInterruptionOnIOS15");
            element.pause();
            element.play();
          }
        });
      };
  
      // 自动恢复音频元素
      this.autoResumeAudioElement();
  
      // 事件监听器
      kg.on(Ag.IOS_INTERRUPTION_END, this.autoResumeAfterInterruption);
      kg.on(Ag.IOS_15_INTERRUPTION_END, this.autoResumeAfterInterruptionOnIOS15);
      kg.on(Ag.STATE_CHANGE, () => {
        if (Kh() && kg.prevState === "suspended" && kg.curState === "running") {
          this.autoResumeAfterInterruption();
        }
      });
    }
  
    /**
     * 设置音频输出设备 ID
     * @param {string} elementId - 元素 ID
     * @param {string} sinkId - 输出设备 ID
     * @throws {SE} - 如果无法设置 sink ID，则抛出错误
     */
    async setSinkID(elementId, sinkId) {
      const element = this.elementMap.get(elementId);
      this.sinkIdMap.set(elementId, sinkId);
      if (element) {
        try {
          await element.setSinkId(sinkId);
        } catch (error) {
          throw new SE(fE.PERMISSION_DENIED, "can not set sink id: " + error.toString());
        }
      }
    }
  
    /**
     * 播放音频
     * @param {MediaStreamTrack} track - 音频轨道
     * @param {string} elementId - 元素 ID
     * @param {number} volume - 音量（0-100）
     * @param {function} onError - 错误回调函数
     */
    play(track, elementId, volume, onError) {
      if (this.elementMap.has(elementId)) return;
  
      const audioElement = document.createElement("audio");
      audioElement.autoplay = true;
      audioElement.srcObject = new MediaStream([track]);
  
      this.bindAudioElementEvents(elementId, audioElement);
      this.elementMap.set(elementId, audioElement);
      this.elementStateMap.set(elementId, sf.INIT);
      this.setVolume(elementId, volume);
  
      const sinkId = this.sinkIdMap.get(elementId);
      if (sinkId) {
        try {
          audioElement.setSinkId(sinkId).catch((error) => {
            OE.warning(`[${elementId}] set sink id failed`, error.toString());
          });
        } catch (error) {
          OE.warning(`[${elementId}] set sink id failed`, error.toString());
        }
      }
  
      const playPromise = audioElement.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch((error) => {
          if (onError) {
            Cg.autoplayFailed(onError, "audio", error.message, elementId);
          }
          OE.warning("audio element play warning", error.toString());
          if (this.elementMap.has(elementId) && error.name === "NotAllowedError") {
            OE.warning("detected audio element autoplay failed");
            this.elementsNeedToResume.push(audioElement);
            eI(() => {
              if (this.onAutoplayFailed) this.onAutoplayFailed();
              fg();
            });
          }
        });
      }
    }
  
    /**
     * 更新音频轨道
     * @param {string} elementId - 元素 ID
     * @param {MediaStreamTrack} newTrack - 新的音频轨道
     */
    updateTrack(elementId, newTrack) {
      const element = this.elementMap.get(elementId);
      if (element) {
        element.srcObject = new MediaStream([newTrack]);
      }
    }
  
    /**
     * 是否正在播放
     * @param {string} elementId - 元素 ID
     * @returns {boolean} - 返回是否正在播放
     */
    isPlaying(elementId) {
      return this.elementMap.has(elementId);
    }
  
    /**
     * 设置音量
     * @param {string} elementId - 元素 ID
     * @param {number} volume - 音量（0-100）
     */
    setVolume(elementId, volume) {
      const element = this.elementMap.get(elementId);
      if (element) {
        volume = Math.max(0, Math.min(100, volume));
        element.volume = volume / 100;
      }
    }
  
    /**
     * 停止播放
     * @param {string} elementId - 元素 ID
     */
    stop(elementId) {
      const element = this.elementMap.get(elementId);
      if (element) {
        this.sinkIdMap.delete(elementId);
        const index = this.elementsNeedToResume.indexOf(element);
        if (index !== -1) {
          this.elementsNeedToResume.splice(index, 1);
        }
        element.srcObject = null;
        element.remove();
        this.elementMap.delete(elementId);
        this.elementStateMap.delete(elementId);
      }
    }
  
    /**
     * 绑定音频元素事件
     * @param {string} elementId - 元素 ID
     * @param {HTMLAudioElement} element - 音频元素
     */
    bindAudioElementEvents(elementId, element) {
      rR.forEach((eventType) => {
        element.addEventListener(eventType, (event) => {
          const prevState = this.elementStateMap.get(elementId);
          const newState = event.type === "pause" ? "paused" : event.type;
          console.debug(`[${elementId}] audio-element-status change ${prevState} => ${newState}`);
          if (event.type === "error" && element.error) {
            OE.error(`[${elementId}] media error, code: ${element.error.code}, message: ${element.error.message}`);
          }
          this.elementStateMap.set(elementId, newState);
        });
      });
    }
  
    /**
     * 获取播放状态
     * @param {string} elementId - 元素 ID
     * @returns {string} - 返回播放状态
     */
    getPlayerState(elementId) {
      return this.elementStateMap.get(elementId) || "uninit";
    }
  
    /**
     * 自动恢复音频元素
     */
    autoResumeAudioElement() {
      const resumeAudioElements = () => {
        this.elementsNeedToResume.forEach((element) => {
          element.play()
            .then(() => {
              console.debug("Auto resume audio element success");
            })
            .catch((error) => {
              OE.warning("Auto resume audio element failed!", error);
            });
        });
        this.elementsNeedToResume = [];
      };
  
      return new Promise((resolve) => {
        if (document.body) {
          resolve();
        } else {
          window.addEventListener("load", () => resolve());
        }
      }).then(() => {
        if (sp()) {
          document.body.addEventListener("click", resumeAudioElements, true);
        } else {
          document.body.addEventListener("touchstart", resumeAudioElements, true);
          document.body.addEventListener("mousedown", resumeAudioElements, true);
        }
      });
    }
  }
  
  // 导出音频元素管理实例
  export const audioElManager = new AudioElementManager();
  
  