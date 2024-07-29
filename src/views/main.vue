<template>
  <div>
    <section>
      <button @click="triggerStart">切歌</button>

      <button @click="setUser" v-if="!hasUserSet">setUser (need first)</button>
    </section>
    <div v-if="hasUserSet">
      <section>
        <button @click="getLyric" v-if="!lyric.content">getLyric</button>
        <button @click="getPitchData" v-if="!pitchData">getPitchData</button>
        <button @click="prepare" v-if="lyric.content && pitchData">prepare</button>
      </section>
      <section>
        <button @click="genBgmTracks" v-if="!hasGenBgmTracks">生成 原唱/伴唱 tracks</button>
        <section v-if="hasGenBgmTracks">
          <div>
            <div>当前音轨： {{ bgmType === 1 ? "原唱" : "伴奏" }}</div>
            <button @click="playBgm">播放</button>
            <button @click="toggleBgmTrack">切换音轨</button>
            <button @click="toggleBgmStatus">切换播放状态 {{ bgmStatus == 3 ? "playing" : "pause" }}</button>
            <button @click="seekBgmProgress">seek bgm progress 切换进度</button>
          </div>
        </section>
      </section>
      <section>
        <button @click="createAudioTrack" v-if="!localAudioTrack">createAudioTrack (麦克风)</button>
        <button @click="stopProcessAudio" v-if="localAudioTrack">stopProcessAudio (停止获取麦克风pcm数据)</button>
      </section>
      <section v-if="lyric.content">
        <div>{{ lyric.ti }} --- {{ lyric.ar }}</div>
        <LyricsView :lyric="lyric" :currentTime="currentTime" :currentLine="currentLine"></LyricsView>
      </section>
      <section class="lineScoreWrapper">
        <LineScoreView :pitchData="pitchData" :currentTime="currentTime" ref="lineScoreViewRef">
        </LineScoreView>
      </section>
      <section>
        <div>currentTime:{{ currentTime }}</div>
        <div>currentLine: {{ currentLine }}</div>
        <div>realPitch: {{ realPitch }}</div>
        <div>currentLineScore: {{ currentLineScore }}</div>
        <div>totalScore: {{ totalScore }}</div>
        <div>bgmStatus: {{ bgmStatus }}</div>
        <div>bgmType: {{ bgmType }}</div>
      </section>
    </div>

  </div>
</template>

<script>
import LyricsView from "../components/LyricsView/index.vue";
import LineScoreView from "../components/LineScoreView/index.vue";
import { Engine, BgmStatus, BgmType } from "../engine2/index";




const AgoraRTC = window.AgoraRTC
let engine = new Engine();
window.engine = engine;
engine.setLogLevel(0)
let MOCK_SONG_ID = "";

let index= 0;
let songList = ["32062130","40289835","630965613","28193209","226872391"]

export default {
  components: {
    LyricsView,
    LineScoreView
  },
  data() {
    return {
      hasUserSet: false, // 是否设置用户
      hasGenBgmTracks: false, // 是否生成音轨
      localAudioTrack: null, // 本地音频
      currentTime: 0, // 当前时间 ms
      currentLine: 0, // 当前行
      lineScore: 0, // 当前行分数
      totalScore: 0, // 总分
      currentLineScore: 0, // 当前行分数
      lyric: {}, // 歌词数据
      pitchData: null, // 音高数据
      realPitch: 0, // 实时音高
      bgmStatus: engine.bgmStatus,
      bgmType: engine.bgmType
    };
  },
  async created() {

  },
  mounted() {
    this.listenEngineEvents();
    // this.startFn();
    // this.triggerStart();
  },
  async beforeDestroy() {
    engine.destory();
  },
  watch: {

  },
  computed: {

  },
  methods: {
    async startFn () {
      await this.setUser();
      // 这里模拟连续的快速切换歌曲 在谷歌32位浏览器上可以复现崩溃 或者看浏览器的任务管理器，可以看到内存一直在增加，可以涨到好几G
      for (let i = 0; i < 30; i++) {
        setTimeout(async () => {
          engine.destory();
          // engine = null;
          // engine = new Engine()
          await this.getLyric();
          await this.getPitchData();
          await this.genBgmTracks();
          this.playBgm();
        }, i * 5 * 1000);
      }
    },
    // 切歌
    async triggerStart () {
      engine.reset();
      index ++;
      MOCK_SONG_ID =songList[index%5];
      console.log('triggerStart====----')
      await this.setUser();
      await this.getLyric();
      await this.getPitchData();
      await this.genBgmTracks();
      this.playBgm();
    },
    async setUser() {
      // 点点uid 声网uid
      // const MOCK_UID = Math.floor(Math.random() * 1000000000) + "";
      const MOCK_UID = 16089384 + "";
      await engine.setUser(MOCK_UID);
      this.hasUserSet = true;
    },
    async getLyric() {
      this.lyric = await engine.getLyric(MOCK_SONG_ID, true);
    },
    async getPitchData() {
      this.pitchData = await engine.getPitchData(MOCK_SONG_ID);
    },
    prepare() {
      engine.prepare()
    },
    async genBgmTracks(fn) {
      await engine.genBgmTracks(MOCK_SONG_ID, true, fn);
      this.hasGenBgmTracks = true;
    },
    async createAudioTrack() {
      
      // 创建 mic 音轨
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        AEC: true
      });
      console.log(this.localAudioTrack);
      // 设置音轨
      engine.setAudioTrack(this.localAudioTrack);
      // 开启音频处理 （实时pitch）
      engine.startProcessAudio()
    },
    stopProcessAudio() {
      engine.stopProcessAudio()
    },
    playBgm() {
      engine.playBgm(this.bgmType)
    },
    toggleBgmTrack() {
      engine.toggleBgmTrack()
    },
    toggleBgmStatus() {
      engine.toggleBgmStatus()
    },
    seekBgmProgress() {
      const MOCK_TIME = 175070 // ms
      engine.seekBgmProgress(MOCK_TIME)
    },
    setBgmVolume(volume) {
      engine.setBgmVolume(volume)
    },
    listenEngineEvents() {
      engine.on("lineChanged", (data) => {
        const { lineNumber, lineScore, totalScore } = data
        this.currentLine = lineNumber
        this.currentLineScore = lineScore
        this.totalScore = totalScore
      })
      engine.on("progressChanged", (data) => {
        const { time } = data
        this.currentTime = time
      })
      engine.on("statusChanged", (data) => {
        const { status, type } = data
        this.bgmStatus = status
        this.bgmType = type
        if (status == BgmStatus.IDLE) {
          // 播放结束
          this.currentTime = 0
          this.currentLine = 0
          this.currentLineScore = 0
          this.totalScore = 0
          this.realPitch = 0
        }
      })
      engine.on("pitchChanged", data => {
        const { realPitch, time } = data
        this.realPitch = realPitch
        // TODO: time 为 realPitch 对应的时间点 
      })
    },
  }
}
</script>

<style lang="scss" scoped>
section {
  margin: 5px;
}

button {
  margin: 2px;
}


.lineScoreWrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
../engine2/indexxxx