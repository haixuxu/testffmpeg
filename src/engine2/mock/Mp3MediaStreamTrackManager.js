import { EventEmitter } from "./emitter";

class MeidaTrackBox extends EventEmitter {
    constructor(audioEl, context) {
        super();
        this.context = context;
        this.mediaTrack = null;
        this.currentTime = 0;

        this.duration = 0;
        this.audioEl = audioEl;
        this.status = "playing";
        // 定期更新播放时间信息
        const updateTime = () => {
            this.currentTime = audioEl.currentTime; // update currentTime
            this.duration = audioEl.duration;
            // console.log(`Duration: ${audioEl.duration}`);
        };
        this.updateTime = updateTime;
        audioEl.addEventListener("timeupdate", updateTime);
        audioEl.addEventListener("ended", () => {
            this.emit("source-state-change", "stopped");
        });
    }

    destory() {
        console.log("release====call");
        const audioEl = this.audioEl;
        audioEl.pause();
        URL.revokeObjectURL(audioEl.src);
        audioEl.removeEventListener("timeupdate", this.updateTime);
        audioEl.src = ""; // 解除音频文件的引用
        audioEl.load(); // 重新加载空的音频源
        this.audioEl = null;
        this.context = null;
        this.mediaSource = null;
    }
    play(){
        this.audioEl.play(); 
        this.status = "playing";
    }
    pause() {
        this.audioEl.pause();
        this.status = "paused";
    }
    resume() {
        this.audioEl.play();
        this.status = "playing";
    }

    seekTime(time) {
        this.audioEl.currentTime = time;
    }
    setVolume(volume) {
        this.audioEl.volume = volume / 100;
    }
    setMuted(flag) {
        this.audioEl.muted = !!flag;
    }
}

class Mp3MediaStreamTrackManager {
    constructor(context) {
        this.caches = {};
        this.audioContext = context;
    }

    async createTrackBoxFromMp3(mp3Data, sourceKey) {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.caches[sourceKey]) {
            // 停止当前播放并释放资源
            const cache = this.caches[sourceKey];
            cache.destory();
            delete this.caches[sourceKey];
        }

        return new Promise((resolve, reject) => {
            const mediaSource = new MediaSource();
            const audioEl = document.createElement("audio");
            const mediaElementSource = this.audioContext.createMediaElementSource(audioEl);
            const destination = this.audioContext.createMediaStreamDestination();
            mediaElementSource.connect(destination);
            let trackbox = new MeidaTrackBox(audioEl, this.audioContext);
            this.caches[sourceKey] = trackbox;
            trackbox.mediaSource = mediaSource;

            function handleSourceOpen() {
                console.log("open====");
                const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
                sourceBuffer.addEventListener("updateend", () => {
                    if (!sourceBuffer.updating && mediaSource.readyState === "open") {
                        mediaSource.endOfStream();
                    }
                });
                sourceBuffer.appendBuffer(mp3Data);
                trackbox.mediaTrack = destination.stream.getAudioTracks()[0];
                resolve(trackbox);
            }
            mediaSource.addEventListener("sourceopen", handleSourceOpen);

            audioEl.src = URL.createObjectURL(mediaSource);
            // audioEl.play();

            mediaSource.addEventListener("error", (e) => {
                reject(e);
            });
        });
    }
}

// 使用示例
export const manager = new Mp3MediaStreamTrackManager();
