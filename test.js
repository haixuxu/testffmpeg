const timeoutPromise = (time) =>
  new Promise((resolve) => setTimeout(() => resolve(time), 0));

(async function () {
  while (true) {
    const ret = await timeoutPromise(0.5);
    // console.log(ret);
  }
})();
