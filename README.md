原地址： [https://github.com/AgoraIO-Usecase/agora-ktv-web-example/tree/feat/new](https://github.com/AgoraIO-Usecase/agora-ktv-web-example/tree/feat/new)

# 音速达demo

# 启动方式
- npm i
- sudo npm run dev
- 本地访问地址： https://y-dev.tuwan.com/（配置host）

# agora-engine

setUser(设置用户)  (只需要设置一次，过期的时候需要重新调用)

每次点歌的流程:

* getLyric(拿到歌词数据)
* getPitchData(拿到歌曲标准pitch数据)
* genBgmTracks(生成原唱/伴唱音轨)
* prepare (setAudioParams设置音频参数 和 setScoreHardLevel设置打分难度)
* play bgm...

 **getLyric 和 getPitchData 内部会触发 yinsudu sdk init 流程，所以不可并行**

如果想提高速度可考虑别的步骤并行

------------------------------------

麦克风音频数据处理流程:

* createAudioTrack(创建麦克风音频track)
* setAudioTrack (设置音轨) (只需要设置一次)
* startProcessAudio (开始处理音频数据 获取real pitch)
* stopProcessAudio (停止处理音频数据)


## TIPS

* 传入 engine 的 time 均为 ms 
* 从 engine 事件获取的时间均为 ms
