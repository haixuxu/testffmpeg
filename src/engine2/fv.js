function applyDecorator(target, property, decorators, descriptor, context) {
  let modifiedDescriptor = {};

  // 复制属性描述符的属性到新的对象
  Object.keys(descriptor).forEach((key) => {
    modifiedDescriptor[key] = descriptor[key];
  });

  // 设置描述符的可枚举性和可配置性
  modifiedDescriptor.enumerable = !!modifiedDescriptor.enumerable;
  modifiedDescriptor.configurable = !!modifiedDescriptor.configurable;

  // 如果描述符有 value 或 initializer 属性，则设置 writable 为 true
  if ("value" in modifiedDescriptor || modifiedDescriptor.initializer) {
    modifiedDescriptor.writable = true;
  }

  // 应用装饰器函数
  modifiedDescriptor = decorators.reduce((desc, decorator) => {
    return decorator(target, property, desc) || desc;
  }, modifiedDescriptor);

  // 如果有 context 且 initializer 存在，则调用 initializer
  if (context && modifiedDescriptor.initializer !== undefined) {
    modifiedDescriptor.value = modifiedDescriptor.initializer
      ? modifiedDescriptor.initializer.call(context)
      : undefined;
    modifiedDescriptor.initializer = undefined;
  }

  // 如果没有 initializer，定义属性
  if (modifiedDescriptor.initializer === undefined) {
    Object.defineProperty(target, property, modifiedDescriptor);
    modifiedDescriptor = null;
  }

  return modifiedDescriptor;
}

// 定义装饰器函数
const startProcessAudioBufferDecorator = Ig({
  argsMap: (instance, arg) => [instance.getTrackId(), arg, instance.duration],
});
const startProcessAudioBufferLogger = sR();

const pauseProcessAudioBufferDecorator = Ig({
  argsMap: (instance) => [instance.getTrackId()],
});
const pauseProcessAudioBufferLogger = sR();

const seekAudioBufferDecorator = Ig({
  argsMap: (instance) => [instance.getTrackId()],
});
const seekAudioBufferLogger = sR();

const resumeProcessAudioBufferDecorator = Ig({
  argsMap: (instance) => [instance.getTrackId()],
});
const resumeProcessAudioBufferLogger = sR();

const stopProcessAudioBufferDecorator = Ig({
  argsMap: (instance) => [instance.getTrackId()],
});
const stopProcessAudioBufferLogger = sR();

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

// 应用装饰器到 BufferSourceAudioTrack 类的方法
applyDecorator(
  BufferSourceAudioTrack.prototype,
  "startProcessAudioBuffer",
  [startProcessAudioBufferDecorator, startProcessAudioBufferLogger],
  Object.getOwnPropertyDescriptor(
    BufferSourceAudioTrack.prototype,
    "startProcessAudioBuffer"
  ),
  BufferSourceAudioTrack.prototype
);

applyDecorator(
  BufferSourceAudioTrack.prototype,
  "pauseProcessAudioBuffer",
  [pauseProcessAudioBufferDecorator, pauseProcessAudioBufferLogger],
  Object.getOwnPropertyDescriptor(
    BufferSourceAudioTrack.prototype,
    "pauseProcessAudioBuffer"
  ),
  BufferSourceAudioTrack.prototype
);

applyDecorator(
  BufferSourceAudioTrack.prototype,
  "seekAudioBuffer",
  [seekAudioBufferDecorator, seekAudioBufferLogger],
  Object.getOwnPropertyDescriptor(
    BufferSourceAudioTrack.prototype,
    "seekAudioBuffer"
  ),
  BufferSourceAudioTrack.prototype
);

applyDecorator(
  BufferSourceAudioTrack.prototype,
  "resumeProcessAudioBuffer",
  [resumeProcessAudioBufferDecorator, resumeProcessAudioBufferLogger],
  Object.getOwnPropertyDescriptor(
    BufferSourceAudioTrack.prototype,
    "resumeProcessAudioBuffer"
  ),
  BufferSourceAudioTrack.prototype
);

applyDecorator(
  BufferSourceAudioTrack.prototype,
  "stopProcessAudioBuffer",
  [stopProcessAudioBufferDecorator, stopProcessAudioBufferLogger],
  Object.getOwnPropertyDescriptor(
    BufferSourceAudioTrack.prototype,
    "stopProcessAudioBuffer"
  ),
  BufferSourceAudioTrack.prototype
);

// 导出 BufferSourceAudioTrack 类
const fv = BufferSourceAudioTrack;
