// SE 类继承自 Error 类，用于自定义错误处理
export class CustomError extends Error {
    /**
     * 构造函数
     * @param {string} e - 错误代码
     * @param {string} [t=""] - 错误消息
     * @param {any} [i] - 额外的数据
     */
    constructor(e, t = "", i) {
      super(t); // 调用父类 Error 的构造函数并传递错误消息
  
      // 初始化属性
      this.code = e; // 错误代码
      this.message = `AgoraRTCError ${this.code}: ${t}`; // 格式化错误消息
      this.data = i; // 额外的数据
      this.name = "AgoraRTCException"; // 错误名称
    }
  
    /**
     * 将错误对象转换为字符串
     * @returns {string} 错误的字符串表示
     */
    toString() {
      return this.data
        ? `data: ${JSON.stringify(this.data)}\n${this.stack}`
        : `${this.stack}`;
    }
  
    /**
     * 打印错误信息
     * @param {string} [level="error"] - 日志级别，可选值为 "error" 或 "warning"
     * @returns {SE} 返回错误对象本身
     */
    print(level = "error") {
      if (level === "error") {
        OE.error(this.toString());
      } else if (level === "warning") {
        OE.warning(this.toString());
      }
      return this;
    }
  
    /**
     * 抛出错误
     * @throws {SE} 抛出错误对象本身
     */
    throw() {
      this.print(); // 打印错误信息
      throw this; // 抛出错误对象本身
    }
  }
  
  