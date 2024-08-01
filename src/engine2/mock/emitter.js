export class EventEmitter {
    constructor() {
      // 存储所有事件及其对应的监听器
      this._events = {};
      // 将 addListener 方法指向 on 方法
      this.addListener = this.on;
    }
  
    // 获取特定事件的所有监听器
    getListeners(event) {
      return this._events[event] ? this._events[event].map((entry) => entry.listener) : [];
    }
  
    // 添加一个事件监听器
    on(event, listener) {
      if (!this._events[event]) {
        this._events[event] = [];
      }
      const listeners = this._events[event];
      if (this._indexOfListener(listeners, listener) === -1) {
        listeners.push({ listener: listener, once: false });
      }
    }
  
    // 添加一个只执行一次的事件监听器
    once(event, listener) {
      if (!this._events[event]) {
        this._events[event] = [];
      }
      const listeners = this._events[event];
      if (this._indexOfListener(listeners, listener) === -1) {
        listeners.push({ listener: listener, once: true });
      }
    }
  
    // 移除一个事件监听器
    off(event, listener) {
      if (!this._events[event]) return;
      const listeners = this._events[event];
      const index = this._indexOfListener(listeners, listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
      if (this._events[event].length === 0) {
        delete this._events[event];
      }
    }
  
    // 移除所有事件监听器
    removeAllListeners(event) {
      if (event) {
        delete this._events[event];
      } else {
        this._events = {};
      }
    }
  
    // 触发一个事件，传递任意数量的参数
    emit(event, ...args) {
      if (!this._events[event]) {
        this._events[event] = [];
      }
      const listeners = this._events[event].map((entry) => entry);
      for (const entry of listeners) {
        if (entry.once) {
          this.off(event, entry.listener);
        }
        entry.listener.apply(this, args);
      }
    }
  
    // 获取监听器在数组中的索引
    _indexOfListener(listeners, listener) {
      for (let i = listeners.length - 1; i >= 0; i--) {
        if (listeners[i].listener === listener) {
          return i;
        }
      }
      return -1;
    }
  }
  
  