export const api_getUserData = (uid:string) =>{
  return fetch(`https://yapi-test.tuwan.com/yinsuda/getUserData?uid=${uid}`).then(res => res.json())
}
