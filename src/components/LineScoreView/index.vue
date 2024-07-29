<template>
  <div class="lineTable">
    <canvas ref="lineCanvas" class="lineCanvas"></canvas>
    <img src="../../../image/cy.png" class="cy" />
    <img src="../../../image/curso.png" class="curso" />
  </div>
</template>

<script>
import { genUIReactList, filterUIReactList } from "./utils.js"
import Spectrum from "./spectrum";

export default {
  props: {
    pitchData: {
      type: Array,
      default: [],
    },
    currentTime: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      pitchUIData: [],
    };
  },
  created() { },
  mounted() {
    this.canvasInit(); //初始画布
    this.initLine(); //画上线谱
  },
  computed: {

  },
  watch: {
    pitchData(val) {
      this.pitchUIData = genUIReactList(val)
      const list = filterUIReactList(this.pitchUIData, this.currentTime)
      this.drawUIReactList(list)
    },
    currentTime(time) {
      const list = filterUIReactList(this.pitchUIData, time)
      this.drawUIReactList(list)
    }
  },
  methods: {
    canvasInit() {
      this.lineObj = this.$refs.lineCanvas;
      this.lineObj.height = 60;
      this.lineObj.width = 375;
    },
    //初始化也可清零
    initLine() {
      const ctx = this.lineObj.getContext("2d");
      ctx.clearRect(0, 0, this.lineObj.width, this.lineObj.height);
      ctx.beginPath();
      ctx.strokeStyle = "#ffffff80";
      ctx.lineWidth = 1;
      const interval = this.lineObj.height / 5;
      for (let i = 0;i < 6;i++) {
        let startY = i * interval;
        ctx.moveTo(0, startY);
        ctx.lineTo(this.lineObj.width, startY);
      }
      ctx.stroke();
    },
    drawCursor(cursorY) {

    },
    drawUIReactList(list) {
      // 清空画布
      this.clearReact();
      //1、加载歌词
      const interval = this.lineObj.height / 5;
      const spectrumsArry = list.map((item) => {
        return new Spectrum(item.x, item.y, item.width, 4, interval, "#fb76ab", this.lineObj);
      });
      spectrumsArry.forEach((spectrum) => {
        spectrum.draw();
      });
      // //2、加载着色歌词
      // const colorSpectrumsArry = filterColoringReactInfo.map((item) => {
      //   return new Spectrum(item.x, item.y, item.width, 4, interval, "#FF8AB4", this.lineObj);
      // });
      // colorSpectrumsArry.forEach((spectrum) => {
      //   spectrum.draw();
      // });
      // this.drawCursor(this.cursorVal);
    },
    // 清理React块
    clearReact() {
      const ctx = this.lineObj.getContext("2d");
      ctx.clearRect(0, 0, this.lineObj.width, this.lineObj.height);
      this.initLine();
    },
    //清空线谱
    clear() {
      const ctx = this.lineObj.getContext("2d");
      ctx.clearRect(0, 0, this.lineObj.width, this.lineObj.height);
      this.initLine();
    },

  },
};
</script>


<style lang="scss" scoped>
.lineTable {
  position: relative;
  height: 60px;
  width: 375px;
  background: #ccc;
}

.lineCanvas {
  width: 375px;
  height: 60px;
}


.curso {
  height: 10px;
  position: absolute;
  left: 92px;
  top: 54px;
}

.cy {
  position: absolute;
  top: 0px;
  height: 60px;
  left: 100px;
}
</style>
