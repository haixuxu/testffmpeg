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

      cache.audioEl.pause();
      URL.revokeObjectURL(cache.audioEl.src);
      cache.release();
      cache.mediaSource = null;
      cache.audioEl = null;
      cache.audioEl = null;
      cache.mediaElementSource = null;
      cache.destination = null;
      cache.release = null;
      delete this.caches[sourceKey];
    }

    return new Promise((resolve, reject) => {
      const mediaSource = new MediaSource();
      const audioEl = document.createElement("audio");
      const mediaElementSource =
        this.audioContext.createMediaElementSource(audioEl);
      const destination = this.audioContext.createMediaStreamDestination();
      mediaElementSource.connect(destination);

      this.caches[sourceKey] = {
        // mediaSource,
        audioEl,
        release,
        // mediaElementSource,
        // destination,
      };

      function release() {
        mediaSource.removeEventListener("sourceopen",handleSourceOpen);
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
        resolve(destination.stream.getAudioTracks()[0]);
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
