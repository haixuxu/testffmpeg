<template>
  <div class="lyric">
    <div class="scroll-wrapper" v-if="lyric.content">
      <div class="scroll-box" id="scroll-box" :style="{ transform: 'translate3d(0,' + translateY + 'px' + ',0)' }">
        <div v-for="(item, i) in lyric.content" :key="i + 's'" class="sentence"
          :class="i === currentLine + 1 ? 'big' : 'normal'">
          <div v-for="(tone, j) in item.content" :key="j + 's'" class="word"
            :class="isLightTone(tone, item) ? 'light' : 'white'">
            {{ tone.content }}
          </div>
        </div>
      </div>
    </div>
    <slot></slot>
  </div>
</template>

<script>
export default {
  components: {},
  props: {
    lyric: {
      type: Object,
      default: () => { },
    },
    currentTime: {
      type: Number,
      default: 0,
    },
    currentLine: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      translateY: 0,
    };
  },
  watch: {
    currentLine(line) {
      this.translateY = -line * 32;
    },
  },
  methods: {
    isLightTone(tone, line) {
      const toneEndTime = line.start + tone.start + tone.duration;
      return this.currentTime >= toneEndTime
    },
  }
};
</script>
<style lang="scss" scoped>
.lyric {
  width: 100%;
  height: 170px;
  position: relative;

  .musicName {
    color: #ffffff;
    line-height: 22px;
    display: inline-block;
    padding: 5px 10px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 12px;
    text-align: center;
    margin: 5px 20px;
  }

  .scroll-wrapper {
    text-align: center;
    height: 130px;
    overflow: hidden;
    color: #fff;
    background: #ccc;

    .scroll-box {
      transition: all 0.3s;
      will-change: transform;
    }

    .sentence {
      height: 22px;
      line-height: 22px;
      margin: 10px 0;

      .word {
        display: inline-block;
      }
    }
  }
}

.white {
  color: #ffffff;
}

.light {
  color: #fce25f;
}

.big {
  font-size: 20px;
}

.normal {
  font-size: 16px;
}
</style>
