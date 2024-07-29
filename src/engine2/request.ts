let cache = {
  token: "",
  yinsuda_uid: "",
};
export const resolveToken = (uid: string) => {
  if (cache.token) {
    return cache;
  }
  return fetch(
    `https://yapi-test.tuwan.com/yinsuda/getUserData?uid=${uid}`
  ).then(res=>res.json()).then((res) => {
    Object.assign(cache, res.data);
    console.log(cache);
    return cache;
  });
};
