class Mp3MediaStreamTrackManager {
  constructor(context) {
    this.caches = {};

    this.audioContext = context;
  }

  async createMediaStreamTrackFromMp3(mp3Data, sourceKey) {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
    }
    if (this.caches[sourceKey]) {
      // 停止当前播放并释放资源
      const cache = this.caches[sourceKey];
      cache.release();
      delete this.caches[sourceKey];
    }

    return new Promise((resolve, reject) => {
      const mediaSource = new MediaSource();
      const audioEl = document.createElement("audio");
      const mediaElementSource =
        this.audioContext.createMediaElementSource(audioEl);
      const destination = this.audioContext.createMediaStreamDestination();
      mediaElementSource.connect(destination);

      let status = {
        currentTime:0,
        duration:0,
      }
      // 定期更新播放时间信息
      const updateTime = () => {
        status.currentTime = audioEl.currentTime;
        status.duration = audioEl.duration;
        // console.log(`Current Time: ${audioEl.currentTime}`);
        // console.log(`Duration: ${audioEl.duration}`);
      };
      audioEl.addEventListener("timeupdate", updateTime);

      this.caches[sourceKey] = {
        // mediaSource,
        release,
        // mediaElementSource,
        // destination,
      };

      function release() {
        console.log("release====call");
        audioEl.pause();
        URL.revokeObjectURL(audioEl.src);
        audioEl.removeEventListener("timeupdate",updateTime);
        audioEl.src = ""; // 解除音频文件的引用
        audioEl.load(); // 重新加载空的音频源
        mediaSource.removeEventListener("sourceopen", handleSourceOpen);
      }

      function handleSourceOpen() {
        console.log("open====");
        const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
        sourceBuffer.addEventListener("updateend", () => {
          if (!sourceBuffer.updating && mediaSource.readyState === "open") {
            mediaSource.endOfStream();
          }
        });
        sourceBuffer.appendBuffer(mp3Data);
        resolve({
          mediaTrack:destination.stream.getAudioTracks()[0],
          status,
        });
      }
      mediaSource.addEventListener("sourceopen", handleSourceOpen);

      audioEl.src = URL.createObjectURL(mediaSource);
      audioEl.play();

      mediaSource.addEventListener("error", (e) => {
        reject(e);
      });
    });
  }
}

// 使用示例
export const manager = new Mp3MediaStreamTrackManager();
