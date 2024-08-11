import { resolveToken } from "./request";
import { logger } from "./logger";
import { LogLevel, EngineConfig, LyricModel, EngineEvents, BgmStatus, BgmType } from "./types";
import mitt, { Emitter, Handler } from "mitt";
import { parseKrcString } from "./utils";
import "./yisudaSdk/index.umd.js";
import pcmCode from "./pcm-processer?raw";

import { manager } from "./mock/Mp3MediaStreamTrackManager";

export * from "./types";

const PID = import.meta.env.VITE_APP_ID;
const APP_KEY = import.meta.env.VITE_APP_KEY;
const SCORE_HARD_LEVEL = 5;
const PROGRESS_INTERVAL_TIME = 20;
let lasttime: number = 0;
// @ts-ignore
const AgoraRTC = window.AgoraRTC;
export class Engine {
    pid: string = PID;
    pKey: string = APP_KEY;
    userId: string = ""; // yinsuda uid
    token: string = "";
    currentTime: number = 0; // 当前时间戳  ms
    currentLine: number = 0; // 当前行数
    lyric: LyricModel = {} as LyricModel; // 歌词数据
    config: EngineConfig;
    audioTrack?: any; // 音频轨道
    //   audioContext: AudioContext = new AudioContext() // 音频上下文
    audioContext?: any; // 音频上下文
    orgTrackBox?: any; // 原唱轨道
    accTrackBox?: any; // 伴奏轨道
    mediaStreamAudioSourceNode?: MediaStreamAudioSourceNode;
    bgmStatus = BgmStatus.IDLE;
    bgmType = BgmType.ORIGINAL;
    // ----------- private ------------
    private _emitter: Emitter<EngineEvents> = mitt();
    intervalId: any;

    get isIdle() {
        return this.bgmStatus === BgmStatus.IDLE;
    }

    get totalLine() {
        return this.lyric?.content?.length || 0;
    }

    get bgmDuration() {
        return this.orgTrackBox?.duration * 1000 || 0;
    }

    constructor(config: EngineConfig) {
        this.config = config;
        this.startBgmTimer();
    }

    get rtcClient() {
        return this.config.rtcClient;
    }

    get yinsudaClient() {
        if (!window.yinsudaClient) {
            throw new Error("yinsudaClient is not defined");
        }
        return window.yinsudaClient;
    }

    setLogLevel(level: LogLevel) {
        logger.setLogLevel(level);
    }

    async setUser(uid: string) {
        // debugger;
        const tokenInfo = await resolveToken(uid);
        const { yinsuda_uid, token } = tokenInfo;
        this.userId = yinsuda_uid;
        this.token = token;
        await this.yinsudaClient.setUser({
            userid: this.userId,
            token: this.token,
            clientPid: this.pid,
            appkey: this.pKey,
            isVip: 0,
        });
        logger.debug("setUser success");
    }

    async getLyric(songId: string, isAccompany?: boolean) {
        try {
            const config: any = {
                song_id: songId,
            };
            if (isAccompany) {
                config.isAccompany = 1;
            }
            const { data, status } = await this.yinsudaClient.getLyric({
                song_id: songId,
            });
            if (status !== 0) {
                const errMsg = "getLyric error";
                logger.error(errMsg);
                throw new Error(errMsg);
            }
            if (data.lyric) {
                this.lyric = parseKrcString(data.lyric);
            }
            logger.debug("getLyric success", this.lyric);
            return this.lyric;
        } catch (err) {
            logger.error("getLyric error", err);
            throw err;
        }
    }

    async getPitchData(songId: string) {
        try {
            const { status, data } = await this.yinsudaClient.getPitchData({
                song_id: songId,
            });
            if (status !== 0) {
                logger.error("getPitchData error", status);
                throw new Error("getPitchData error");
            }
            logger.debug("getPitchData success", data?.pitch);
            return data?.pitch;
        } catch (err) {
            logger.error("getPitchData error", err);
            throw err;
        }
    }

    prepare() {
        this.yinsudaClient.setAudioParams({ sampleRate: 48000, channels: 1 });
        this.yinsudaClient.setScoreHardLevel({ level: SCORE_HARD_LEVEL });
        logger.debug("prepare success");
    }

    async getRealTimePitch() {
        try {
            const { status, data } = await this.yinsudaClient.getRealTimePitch();
            if (status !== 0) {
                logger.error("getRealTimePitch error", status);
                throw new Error("getRealTimePitch error");
            }
            logger.debug("getRealTimePitch success", data);
            return data;
        } catch (err) {
            logger.error("getRealTimePitch error", err);
            throw err;
        }
    }

    async getScore(pts: number = 0) {
        try {
            const { status, data } = await this.yinsudaClient.getScore({ pts });
            if (status !== 0) {
                logger.error("getScore error", status);
                throw new Error("getScore error");
            }
            logger.debug("getScore success", data);
            return data;
        } catch (err) {
            logger.error("getScore error", err);
            throw err;
        }
    }

    async getAverageScore(pts: number = 0) {
        try {
            const { status, data } = await this.yinsudaClient.getAverageScore({
                pts,
            });
            if (status !== 0) {
                logger.error("getAverageScore error", status);
                throw new Error("getAverageScore error");
            }
            logger.debug("getAverageScore success", data);
            return data;
        } catch (err) {
            logger.error("getAverageScore error", err);
            throw err;
        }
    }

    async getTotalScore(pts: number = 0) {
        try {
            const { status, data } = await this.yinsudaClient.getTotalScore({ pts });
            if (status !== 0) {
                logger.error("getTotalScore error", status);
                throw new Error("getTotalScore error");
            }
            logger.debug("getTotalScore success", data);
            return data;
        } catch (err) {
            logger.error("getTotalScore error", err);
            throw err;
        }
    }

    async reset() {
        // this.accTrackBox?.stopProcessAudioBuffer()
        this.accTrackBox?.localAudioTrack.close();
        this.accTrackBox?.removeAllListeners();
        this.accTrackBox = undefined;
        // this.orgTrackBox?.stopProcessAudioBuffer()
        this.orgTrackBox?.localAudioTrack.close();
        this.orgTrackBox?.removeAllListeners();
        this.orgTrackBox = undefined;
        this.bgmStatus = BgmStatus.IDLE;
        this.lyric = {} as LyricModel;
        this.currentTime = 0;
        this.currentLine = 0;
        this.stopProcessAudio();
        this.mediaStreamAudioSourceNode = undefined;
        logger.debug("reset success");
    }

    destory() {
        this.reset();
        this.audioContext?.close();
        this._emitter.all.clear();
        this.audioTrack?.close();
        this.audioTrack = undefined;
        logger.debug("destory success");
    }

    // ----------------- rtc -----------------
    setAudioTrack(audioTrack: any) {
        this.audioTrack = audioTrack;
        logger.debug("setAudioTrack success");
    }

    async startProcessAudio() {
        console.log("startProcessAudio====");
        if (!this.audioContext) {
            this.audioContext = new AudioContext();
        }
        if (!this.audioTrack) {
            throw new Error("audioTrack is not defined");
        }
        console.log("addModule pcm....");
        // 创建 Blob URL
        const blob = new Blob([pcmCode], { type: "application/javascript" });
        const url = URL.createObjectURL(blob);

        await this.audioContext.audioWorklet.addModule(url);
        console.log("addModule pcm ok");
        const audioWorkletNode = new AudioWorkletNode(this.audioContext, "pcm-processor");
        const audioMediaStreamTrack = this.audioTrack.getMediaStreamTrack();
        this.mediaStreamAudioSourceNode = this.audioContext.createMediaStreamSource(new MediaStream([audioMediaStreamTrack]));
        // Create GainNode
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 1.5;
        // Connect the nodes
        this.mediaStreamAudioSourceNode.connect(gainNode);
        gainNode.connect(audioWorkletNode);
        // this.mediaStreamAudioSourceNode.connect(audioWorkletNode);
        console.log("audioWorkletNode====onmessage=====");
        audioWorkletNode.port.onmessage = (event) => {
            // console.log("1111  Received message from PCMProcessor:", event.data);
            const pcm = event.data?.pcm;
            if (pcm) {
                this._dealAudioPcm(pcm);
            }
        };

        logger.debug("startProcessAudio success");
    }

    stopProcessAudio() {
        if (!this.audioTrack) {
            return;
            // throw new Error("audioTrack is not defined")
        }
        this.mediaStreamAudioSourceNode?.disconnect();
        logger.debug("stopProcessAudio success");
    }

    // ----------------- bgm -----------------
    async genBgmTracks(songId: string, isAccompany?: boolean) {
        logger.record("genBgmTracks start");
        await this.yinsudaClient.initCodec(".");
        logger.record("genBgmTracks initCodec success");
        const config: any = {
            song_id: songId,
        };
        if (isAccompany) {
            config.isAccompany = 1;
        }

        // 使用mock的api
        //  const res = await downloadSongById(config);
        const res = await this.yinsudaClient.downloadSongById(config);

        logger.record("genBgmTracks download song success");
        const mp3Data = res.data.mp3Data;
        if (mp3Data[0]) {
            // 伴奏
            this.accTrackBox = await manager.createTrackBoxFromMp3(mp3Data[0], "accompany");
            let localAudioTrack1 = await AgoraRTC.createCustomAudioTrack({ mediaStreamTrack: this.accTrackBox.mediaTrack });
            this.accTrackBox.localAudioTrack = localAudioTrack1;
            this.accTrackBox.on("source-state-change", this._handleSourceStateChange.bind(this));
        }
        if (mp3Data[1]) {
            // 原唱
            let trackbox = await manager.createTrackBoxFromMp3(mp3Data[1], "original");
            let localAudioTrack2 = await AgoraRTC.createCustomAudioTrack({ mediaStreamTrack: trackbox.mediaTrack });
            trackbox.localAudioTrack = localAudioTrack2;
            this.orgTrackBox = trackbox;
            trackbox.on("source-state-change", this._handleSourceStateChange.bind(this));
            // tracks.push(audioTrack);
        }
        logger.debug("genBgmTracks success", this.accTrackBox, this.orgTrackBox);
        logger.recordEnd();
    }

    playBgm(bgmType: BgmType) {
        this.orgTrackBox?.localAudioTrack.play();
        this.accTrackBox?.localAudioTrack.play();
        this.bgmStatus = BgmStatus.PLAYING;
        this.bgmType = bgmType;

        this.emit("statusChanged", { status: this.bgmStatus, type: this.bgmType });
        logger.debug("playBgm success");
    }

    startBgmTimer() {
        this.intervalId = setInterval(() => {
            if (this.bgmStatus !== BgmStatus.PLAYING) return;
            const trackbox = this.bgmType === BgmType.ORIGINAL ? this.orgTrackBox : this.accTrackBox;
            this.currentTime = trackbox.currentTime * 1000;
            this.emit("progressChanged", { time: this.currentTime });
            this._dealLine();
        }, PROGRESS_INTERVAL_TIME);
    }

    toggleBgmTrack() {
        if (this.bgmType == BgmType.ORIGINAL) {
            this.orgTrackBox?.setMuted(true);
            this.accTrackBox?.setMuted(false);
            this.bgmType = BgmType.ACCOMPANY;
        } else if (this.bgmType == BgmType.ACCOMPANY) {
            this.orgTrackBox?.setMuted(false);
            this.accTrackBox?.setMuted(true);
            this.bgmType = BgmType.ORIGINAL;
        }
        this.emit("statusChanged", { status: this.bgmStatus, type: this.bgmType });
        logger.debug("toggleBgmTrack success");
    }

    toggleBgmStatus() {
        if (this.bgmStatus === BgmStatus.PLAYING) {
            this._pauseBgm();
            this.bgmStatus = BgmStatus.PAUSE;
        } else if (this.bgmStatus == BgmStatus.PAUSE) {
            this._resumeBgm();
            this.bgmStatus = BgmStatus.PLAYING;
        }

        this.emit("statusChanged", { status: this.bgmStatus, type: this.bgmType });
        logger.debug("toggleBgmStatus success");
    }

    setBgmVolume(volume: number) {
        if (volume < 0 || volume > 100) {
            return;
        }
        if (this.isIdle) {
            return;
        }
        console.log("set volume---", volume);
        this.accTrackBox?.setVolume(volume);
        this.orgTrackBox?.setVolume(volume);
    }

    seekBgmProgress(time: number) {
        if (time < 0) {
            return;
        }
        if (this.isIdle) {
            return;
        }
        const time2 = Math.floor(time / 1000);
        this.accTrackBox?.seekTime(time2);
        this.orgTrackBox?.seekTime(time2);
        console.log("seekBgmProgress===", time, "  ");
    }

    // ----------------- event -----------------
    on<Key extends keyof EngineEvents>(name: Key, fn: Handler<EngineEvents[Key]>) {
        this._emitter.on<typeof name>(name, fn);
    }

    off<Key extends keyof EngineEvents>(name: Key, fn?: Handler<EngineEvents[Key]>) {
        this._emitter.off<typeof name>(name, fn);
    }

    emit<Key extends keyof EngineEvents>(name: Key, data: EngineEvents[Key]) {
        if (name !== "progressChanged" && name !== "pitchChanged") {
            logger.debug("event emit: ", name, data);
        }
        this._emitter.emit<typeof name>(name, data);
    }

    // ----------------- private -----------------
    private async _dealLine() {
        if (!this.lyric?.content) {
            return;
        }
        let len = this.lyric.content.length;

        for (let i = 0; i < len; i++) {
            const lineData = this.lyric.content[i];
            const { lastToneEndTime } = lineData;
            if (this.currentTime >= lastToneEndTime) {
                if (i > this.currentLine) {
                    // line change
                    this.currentLine = i;
                    // console.time("getscoe");
                    const [lineScoreInfo, totalScoreInfo] = await Promise.all([this.yinsudaClient.getScore({ pts: this.currentTime }), this.yinsudaClient.getTotalScore({ pts: this.currentTime })]);
                    // console.timeEnd("getscoe");
                    const { index = 0, score = 0 } = lineScoreInfo?.data || {};
                    const { totalScore = 0 } = totalScoreInfo?.data || {};
                    let lineScore = 0;
                    if (this.currentLine == index) {
                        lineScore = score >= 0 ? score : 0;
                    }
                    this.emit("lineChanged", {
                        lineNumber: this.currentLine,
                        lineScore,
                        totalScore,
                    });
                    break;
                }
            }
        }
    }

    private async _dealAudioPcm(pcm: Float32Array) {
        // if (this.bgmStatus !== BgmStatus.PLAYING) {
        //     return;
        // }
        //调用process后会计算音高评分
        const currentTime = Math.round(this.currentTime);
        // console.log("handle deal audio pcm===", this.currentTime);
        this.yinsudaClient.processScore({ buffer: pcm, pts: currentTime });
        var levelInfo = await this.yinsudaClient.getRealTimePitch();
        const realPitch = levelInfo?.data?.pitch || 0;
        if (realPitch > 0) {
            console.log("realPitch....", realPitch);
        }
        // console.log("realPitch====", realPitch);
        this.emit("pitchChanged", { realPitch: realPitch, time: this.currentTime });
    }

    private _pauseBgm() {
        this.orgTrackBox?.pause();
        this.accTrackBox?.pause();
    }

    private _resumeBgm() {
        this.orgTrackBox?.resume();
        this.accTrackBox?.resume();
    }

    private _handleSourceStateChange(currentState: any) {
        logger.debug("bgm source state change", currentState);
        if (currentState == "stopped") {
            this.reset();
            this.emit("statusChanged", {
                status: this.bgmStatus,
                type: this.bgmType,
            });
        }
    }
}
