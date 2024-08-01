export const Logger = {
    debug: (message) => console.log(message),
    info: (message) => console.log(message),
    warning: (message, error) => console.warn(message, error),
    error: (message, error) => console.error(message, error),
  };