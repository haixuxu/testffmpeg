import { CustomError } from "./CustomError";
import { EventEmitter } from "./emitter";

/**
 * AudioProcessorDestination 类，继承自 EventEmitter (EE)
 */
export class AudioProcessorDestination extends EventEmitter {
    /**
     * 构造函数
     * @param {Object} e - 音频处理器上下文
     */
    constructor(e) {
      super();
  
      // 初始化属性
      this.name = "AudioProcessorDestination";
      this.ID = "0";
      this.inputTrack = undefined;
      this.inputNode = undefined;
      this.audioProcessorContext = e;
      this._source = undefined;
    }
  
    /**
     * 获取类型
     * @returns {string} - 返回 "audio"
     */
    get kind() {
      return "audio";
    }
  
    /**
     * 获取启用状态
     * @returns {boolean} - 返回 true
     */
    get enabled() {
      return true;
    }
  
    /**
     * 抛出错误，因为该类不支持管道功能
     * @throws {SE} - 抛出 "NOT_SUPPORTED" 错误
     */
    pipe() {
      throw new CustomError(
        "NOT_SUPPORTED",
        "AudioProcessorDestination cannot pipe to any other Processor"
      );
    }
  
    /**
     * 抛出错误，因为该类不支持解除管道功能
     * @throws {SE} - 抛出 "NOT_SUPPORTED" 错误
     */
    unpipe() {
      throw new SE(
        "NOT_SUPPORTED",
        "AudioProcessor cannot unpipe to any other Processor"
      );
    }
  
    /**
     * 启用功能（当前未实现）
     */
    enable() {
      // 未实现
    }
  
    /**
     * 禁用功能（当前未实现）
     */
    disable() {
      // 未实现
    }
  
    /**
     * 重置输入轨道和节点
     */
    reset() {
      this.inputTrack = undefined;
      this.inputNode = undefined;
      this.audioProcessorContext.chained = false;
      this.emit(DS.ON_TRACK, undefined);
      this.emit(DS.ON_NODE, undefined);
    }
  
    /**
     * 更新输入轨道和节点
     * @param {Object} e - 包含 context、track 和 node 的对象
     * @throws {Error} - 当传入的 context 与当前 audioProcessorContext 不匹配时抛出错误
     */
    updateInput(e) {
      if (e.context !== this.audioProcessorContext) {
        throw new Error(
          `ProcessorContext passed to AudioTrack.processorDestination doesn't match its belonging AudioTrack's context.
          Probably you are making pipeline like this: audioTrack1.pipe(processor).pipe(audioTrack2.processorDestination).`
        );
      }
  
      if (e.track && this.inputTrack !== e.track) {
        this.audioProcessorContext.chained = true;
        this.inputTrack = e.track;
        this.emit("on_track", this.inputTrack);
      }
  
      if (e.node && this.inputNode !== e.node) {
        this.audioProcessorContext.chained = true;
        this.inputNode = e.node;
        this.emit("on_node", this.inputNode);
      }
    }
  }
  
  