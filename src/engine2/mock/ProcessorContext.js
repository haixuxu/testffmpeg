import { EventEmitter } from "./emitter";
import { event2Promise, warpEvent } from "./utils";

// SR 类继承自 EE 类
export class ProcessorContext extends EventEmitter {
  // 构造函数，接受两个参数 e 和 t
  constructor(e, t) {
    super(); // 调用父类 EE 的构造函数

    // 初始化私有属性
    this.constraintsMap = new Map();
    this.statsRegistry = [];
    this.usageRegistry = [];
    this.trackId = e; // 轨道 ID
    this.direction = t; // 方向
    this._chained = false; // 私有属性，用于链式调用
  }

  // 链式调用的 setter 方法
  set chained(e) {
    this._chained = e;
  }

  // 链式调用的 getter 方法
  get chained() {
    return this._chained;
  }

  // 异步方法，获取约束条件
  async getConstraints() {
    return await event2Promise(this, "request_constraints");
  }

  // 异步方法，请求应用约束条件
  async requestApplyConstraints(e, t) {
    // 日志记录请求应用约束的操作
    console.info(
      `processor ${t.name} requestApplyConstraints for ${this.trackId}`
    );

    // 如果约束条件存在，则将其添加到 constraintsMap 中
    if (e) {
      this.constraintsMap.set(t, e);
    }

    // 更新约束条件并返回结果
    return warpEvent(
      this,
      "request_update_constraints",
      Array.from(this.constraintsMap.entries())
    );
  }
}
