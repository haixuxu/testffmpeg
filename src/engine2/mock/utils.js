/**
 * 异步事件发射器函数，返回一个 Promise
 * @param {Object} e - 事件发射器对象
 * @param {string} t - 事件类型
 * @param {...any} args - 事件参数
 * @returns {Promise} - 返回一个 Promise 对象
 */

// Jv function
export function event2Promise(e, t, ...args) {
  // 检查是否有监听器，如果没有，则返回一个被拒绝的 Promise
  if (e.getListeners(t).length === 0) {
    return Promise.reject(
      new Error("UNEXPECTED_ERROR" + "can not emit promise")
    );
  }

  // 如果有监听器，则返回一个新的 Promise，并在事件发射时解析或拒绝 Promise
  return new Promise((resolve, reject) => {
    e.emit(t, ...args, resolve, reject);
  });
}

/**
 * 异步事件发射器函数，如果没有监听器则直接返回一个已解决的 Promise
 * @param {Object} e - 事件发射器对象
 * @param {string} t - 事件类型
 * @param {...any} args - 事件参数
 * @returns {Promise} - 返回一个 Promise 对象
 */
// Xv function
export function warpEvent(e, t, ...args) {
  // 检查是否有监听器，如果没有，则返回一个已解决的 Promise
  if (e.getListeners(t).length === 0) {
    return Promise.resolve();
  }

  // 如果有监听器，则调用 Jv 函数
  return event2Promise(e, t, ...args);
}
