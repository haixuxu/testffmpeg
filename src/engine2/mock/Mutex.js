let Og = 0;
/**
 * 锁管理类
 */
export class Mutex {
    /**
     * 构造函数
     * @param {string} [e] - 可选的锁名称
     */
    constructor(e) {
      // 初始化属性
      this.lockingPromise = Promise.resolve();
      this.locks = 0;
      this.name = "";
      this.lockId = undefined;
  
      // 分配唯一的锁 ID
      this.lockId = Og++;
  
      // 如果提供了名称，则设置名称
      if (e) {
        this.name = e;
      }
  
      // 输出调试信息
      console.debug(`[lock-${this.name}-${this.lockId}] is created.`);
    }
  
    /**
     * 获取锁状态
     * @returns {boolean} - 如果锁定数大于 0，则返回 true
     */
    get isLocked() {
      return this.locks > 0;
    }
  
    /**
     * 锁定方法
     * @param {string} [e] - 可选的锁定描述信息
     * @returns {Promise} - 返回一个 Promise，当锁定解除时解析
     */
    lock(e) {
      let unlock;
  
      // 增加锁计数
      this.locks += 1;
  
      // 输出调试信息
      console.debug(
        `[lock-${this.name}-${this.lockId}] is locked, current queue ${this.locks}. ${typeof e === 'string' ? e : ''}`
      );
  
      // 创建一个新的 Promise，用于解锁
      const lockPromise = new Promise((resolve) => {
        unlock = () => {
          // 减少锁计数
          this.locks -= 1;
  
          // 输出调试信息
          console.debug(
            `[lock-${this.name}-${this.lockId}] is not locked, current queue ${this.locks}. ${typeof e === 'string' ? e : ''}`
          );
  
          // 解析 Promise
          resolve();
        };
      });
  
      // 将新创建的解锁 Promise 添加到当前的锁定链中
      const currentLockingPromise = this.lockingPromise.then(() => unlock);
  
      // 更新锁定链
      this.lockingPromise = this.lockingPromise.then(() => lockPromise);
  
      // 返回当前锁定链
      return currentLockingPromise;
    }
  }
  
  