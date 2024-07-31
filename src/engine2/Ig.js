function Ig(options = {}) {
    return function (target, methodName, descriptor) {
        const originalMethod = descriptor.value;

        if (typeof originalMethod === 'function') {
            const className = options.className ||
                target.__className__ ||
                (target.constructor.name === "AgoraRTCClient" ? "Client" : target.constructor.name);

            descriptor.value = function (...args) {
                let mappedArgs = args;

                // 如果有 argsMap 函数，尝试映射参数
                if (options.argsMap) {
                    try {
                        mappedArgs = options.argsMap(this, ...args);
                    } catch (error) {
                        OE.warning(error);
                        mappedArgs = [];
                    }
                }

                // 尝试序列化参数
                try {
                    JSON.stringify(mappedArgs);
                } catch (error) {
                    OE.warning(
                        `arguments for method ${className}.${methodName} not serializable for apiInvoke.`
                    );
                    mappedArgs = [];
                }

                // 报告 API 调用
                const report = (options.report || Cg).reportApiInvoke(
                    this._sessionId || null,
                    {
                        name: `${className}.${methodName}`,
                        options: mappedArgs,
                        tag: Ef.TRACER,
                        reportResult: options.reportResult,
                    },
                    options.throttleTime
                );

                try {
                    const result = originalMethod.apply(this, args);

                    // 如果返回值是一个 Promise
                    if (result instanceof Sl) {
                        return result
                            .then((res) => {
                                report.onSuccess(options.reportResult && res);
                                return res;
                            })
                            .catch((error) => {
                                report.onError(error);
                                throw error;
                            });
                    } else {
                        report.onSuccess(options.reportResult && result);
                        return result;
                    }
                } catch (error) {
                    report.onError(error);
                    throw error;
                }
            };
        }

        return descriptor;
    };
}

