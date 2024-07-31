function sR() {
  return function (target, methodName, descriptor) {
    const originalMethod = descriptor.value;

    // 只有当原始方法是函数时才进行重写
    if (typeof originalMethod === "function") {
      descriptor.value = function (...args) {
        // 检查当前实例是否已关闭，如果已关闭，打印警告信息
        if (this._isClosed) {
        //   new SE(
        //     fE.INVALID_OPERATION,
        //     `[${this.getTrackId()}] cannot operate a closed track`
        //   ).print("warning");
        }

        // 调用原始方法并传递参数
        const result = originalMethod.apply(this, args);

        // 如果方法返回的是一个 Sl 实例，包装成新的 Sl 实例
        if (result instanceof Sl) {
          return new Sl((resolve, reject) => {
            result.then(resolve).catch(reject);
          });
        }

        // 否则直接返回结果
        return result;
      };
    }

    return descriptor;
  };
}
