//  class Ev extends EnhancedMediaTrack {
//     get _source() {
//       return this._trackSource;
//     }
//     set _source(e) {
//       this._trackSource = e;
//     }
//     get processorContext() {
//       return this._processorContext;
//     }
//     set processorContext(e) {
//       this._processorContext = e;
//     }
//     get processorDestination() {
//       return this._processorDestination;
//     }
//     set processorDestination(e) {
//       this._processorDestination = e;
//     }
//     get isPlaying() {
//       return this._useAudioElement
//         ? oR.isPlaying(this.getTrackId())
//         : this._source.isPlayed;
//     }
//     get __className__() {
//       return "LocalAudioTrack";
//     }
//     constructor(e, t, i, n, r) {
//       super(e, i),
//         _p(this, "trackMediaType", "audio"),
//         _p(this, "_encoderConfig", void 0),
//         _p(this, "_trackSource", void 0),
//         _p(this, "_enabled", !0),
//         _p(this, "_volume", 100),
//         _p(this, "_useAudioElement", !1),
//         _p(this, "_bypassWebAudio", !1),
//         _p(this, "processor", void 0),
//         _p(this, "_processorContext", void 0),
//         _p(this, "_processorDestination", void 0),
//         _p(this, "_getOriginVolumeLevel", void 0),
//         (this._encoderConfig = t),
//         (this._getOriginVolumeLevel = !!n);
//       const o = () => {
//           (this.processorContext = new gR(
//             this._source.context,
//             this.getTrackId(),
//             "local"
//           )),
//             (this.processorDestination = new TR(this.processorContext)),
//             this.bindProcessorDestinationEvents(),
//             this._source.on(Lf.UPDATE_SOURCE, () => {
//               this.processor &&
//                 this.processor.updateInput({
//                   node: this._source.processSourceNode,
//                   context: this.processorContext,
//                 });
//             });
//         },
//         s = r && Wh() && !xg();
//       if (
//         (GE("DISABLE_WEBAUDIO")
//           ? ((this._source = new RR()),
//             (this._useAudioElement = !0),
//             (this._bypassWebAudio = !0))
//           : s
//           ? (this._source = new RR())
//           : ((this._source = new Wg(
//               e,
//               !1,
//               this._getOriginVolumeLevel ? e : void 0
//             )),
//             GE("LOCAL_AUDIO_TRACK_USES_WEB_AUDIO") ||
//               (this._useAudioElement = !0)),
//         o(),
//         !GE("DISABLE_WEBAUDIO") && s)
//       ) {
//         (CR || (CR = new yR()), CR).enqueue("INIT_WEBAUDIO", () => {
//           (this._source = new Wg(
//             e,
//             !1,
//             this._getOriginVolumeLevel ? e : void 0
//           )),
//             GE("LOCAL_AUDIO_TRACK_USES_WEB_AUDIO") ||
//               (this._useAudioElement = !0),
//             o(),
//             this.emit(IR.UPDATE_TRACK_SOURCE);
//         });
//       }
//     }
//     setVolume(e) {
//       qm(e, "volume", 0, 1e3),
//         (this._volume = e),
//         this._source.setVolume(e / 100),
//         this._useAudioElement && oR.setVolume(this.getTrackId(), e);
//       try {
//         if (this._bypassWebAudio)
//           return void OE.debug(
//             "[".concat(
//               this.getTrackId(),
//               "] setVolume returned because no pass through WebAudio."
//             )
//           );
//         const e = this._source.createOutputTrack();
//         this._mediaStreamTrack !== e &&
//           ((this._mediaStreamTrack = e),
//           Xv(this, uS.NEED_REPLACE_TRACK, this)
//             .then(() => {
//               OE.debug(
//                 "[".concat(
//                   this.getTrackId(),
//                   "] replace web audio track success"
//                 )
//               );
//             })
//             .catch((e) => {
//               OE.warning(
//                 "[".concat(
//                   this.getTrackId(),
//                   "] replace web audio track failed"
//                 ),
//                 e
//               );
//             }));
//       } catch (e) {}
//     }
//     getVolumeLevel() {
//       return this._muted && this.enabled && this._getOriginVolumeLevel
//         ? this._source.getOriginVolumeLevel()
//         : this._source.getAccurateVolumeLevel();
//     }
//     async setPlaybackDevice(e) {
//       if (!this._useAudioElement)
//         throw new SE(
//           fE.NOT_SUPPORTED,
//           "your browser does not support setting the audio output device"
//         );
//       await oR.setSinkID(this.getTrackId(), e);
//     }
//     async setEnabled(e, t, i) {
//       return this._setEnabled(e, t, i);
//     }
//     async _setEnabled(e, t, i) {
//       if (!i) {
//         if (e === this._enabled) return;
//         this.stateCheck("enabled", e);
//       }
//       if (
//         (OE.info("[".concat(this.getTrackId(), "] start setEnabled"), e),
//         e)
//       ) {
//         this._originMediaStreamTrack.enabled = !0;
//         try {
//           i || (this._enabled = !0),
//             await Xv(this, uS.NEED_ENABLE_TRACK, this),
//             OE.info(
//               "["
//                 .concat(this.getTrackId(), "] setEnabled to ")
//                 .concat(e, " success")
//             );
//         } catch (e) {
//           throw (
//             (i || (this._enabled = !1),
//             OE.error(
//               "[".concat(this.getTrackId(), "] setEnabled to true error"),
//               e.toString()
//             ),
//             e)
//           );
//         }
//       } else {
//         (this._originMediaStreamTrack.enabled = !1),
//           i || (this._enabled = !1);
//         try {
//           await Xv(this, uS.NEED_DISABLE_TRACK, this);
//         } catch (e) {
//           throw (
//             (i || (this._enabled = !0),
//             OE.error(
//               "[".concat(
//                 this.getTrackId(),
//                 "] setEnabled to false error"
//               ),
//               e.toString()
//             ),
//             e)
//           );
//         }
//       }
//     }
//     async setMuted(e) {
//       e !== this._muted &&
//         (this.stateCheck("muted", e),
//         (this._muted = e),
//         (this._originMediaStreamTrack.enabled = !e),
//         OE.debug(
//           "[".concat(this.getTrackId(), "] start set muted: ").concat(e)
//         ),
//         e
//           ? await Xv(this, uS.NEED_MUTE_TRACK, this)
//           : await Xv(this, uS.NEED_UNMUTE_TRACK, this));
//     }
//     getStats() {
//       nI(() => {
//         OE.warning(
//           "[deprecated] LocalAudioTrack.getStats will be removed in the future, use AgoraRTCClient.getLocalAudioStats instead"
//         );
//       }, "localAudioTrackGetStatsWarning");
//       const e = zv(this, uS.GET_STATS);
//       return e || _v({}, jf);
//     }
//     setAudioFrameCallback(e) {
//       let t =
//         arguments.length > 1 && void 0 !== arguments[1]
//           ? arguments[1]
//           : 4096;
//       if (!e)
//         return (
//           this._source.removeAllListeners(Lf.ON_AUDIO_BUFFER),
//           void this._source.stopGetAudioBuffer()
//         );
//       this._source.startGetAudioBuffer(t),
//         this._source.removeAllListeners(Lf.ON_AUDIO_BUFFER),
//         this._source.on(Lf.ON_AUDIO_BUFFER, (t) => e(t));
//     }
//     play() {
//       OE.debug("[".concat(this.getTrackId(), "] start audio playback")),
//         this._useAudioElement
//           ? (OE.debug(
//               "[".concat(
//                 this.getTrackId(),
//                 "] start audio playback in element"
//               )
//             ),
//             oR.play(
//               this._mediaStreamTrack,
//               this.getTrackId(),
//               this._volume
//             ))
//           : this._source.play();
//     }
//     stop() {
//       OE.debug("[".concat(this.getTrackId(), "] stop audio playback")),
//         this._useAudioElement
//           ? oR.stop(this.getTrackId())
//           : this._source.stop();
//     }
//     close() {
//       super.close(),
//         this.unbindProcessorDestinationEvents(),
//         this.unbindProcessorContextEvents(),
//         this.unpipe(),
//         this.processorDestination._source &&
//           this.processorDestination._source.unpipe(),
//         this._source.destroy();
//     }
//     _updatePlayerSource() {
//       let e =
//         !(arguments.length > 0 && void 0 !== arguments[0]) ||
//         arguments[0];
//       OE.debug(
//         "[".concat(this.getTrackId(), "] update player source track")
//       ),
//         e && this._source.updateTrack(this._mediaStreamTrack),
//         this._useAudioElement &&
//           oR.updateTrack(this.getTrackId(), this._mediaStreamTrack);
//     }
//     async _updateOriginMediaStreamTrack(e, t) {
//       this._originMediaStreamTrack !== e &&
//         (this._originMediaStreamTrack.removeEventListener(
//           "ended",
//           this._handleTrackEnded
//         ),
//         e.addEventListener("ended", this._handleTrackEnded),
//         t && this._originMediaStreamTrack.stop(),
//         (this._originMediaStreamTrack = e),
//         this._muted && (this._originMediaStreamTrack.enabled = !1),
//         this.processor &&
//           this.processor.updateInput({
//             track: e,
//             context: this.processorContext,
//           }),
//         this._mediaStreamTrack !== this._source.outputTrack
//           ? ((this._mediaStreamTrack = this._originMediaStreamTrack),
//             this._updatePlayerSource(),
//             await Xv(this, uS.NEED_REPLACE_TRACK, this))
//           : this._source.updateTrack(this._originMediaStreamTrack),
//         this._getOriginVolumeLevel && this._source.updateOriginTrack(e));
//     }
//     renewMediaStreamTrack(e) {
//       return Sl.resolve(void 0);
//     }
//     pipe(e) {
//       if (this._bypassWebAudio)
//         throw new SE(
//           fE.INVALID_OPERATION,
//           "Can not process AudioTrack when bypassWebAudio set to true."
//         );
//       if (this.processor === e) return e;
//       if (e._source)
//         throw new SE(
//           fE.INVALID_OPERATION,
//           "Processor ".concat(
//             e.name,
//             " already piped, please call unpipe beforehand."
//           )
//         );
//       return (
//         this.unpipe(),
//         (this.processor = e),
//         (this.processor._source = this),
//         e.updateInput({
//           track: this._originMediaStreamTrack,
//           node: this._source.processSourceNode,
//           context: this.processorContext,
//         }),
//         e
//       );
//     }
//     unpipe() {
//       var e;
//       if (!this.processor) return;
//       const t = this.processor;
//       null === (e = this._source.processSourceNode) ||
//         void 0 === e ||
//         e.disconnect(),
//         (this.processor._source = !1),
//         (this.processor = void 0),
//         t.reset();
//     }
//     bindProcessorDestinationEvents() {
//       this.processorDestination.on(DS.ON_TRACK, async (e) => {
//         e
//           ? e !== this._mediaStreamTrack &&
//             ((this._mediaStreamTrack = e),
//             this._updatePlayerSource(!1),
//             (this._source.processedNode =
//               this._source.createMediaStreamSourceNode(e)),
//             await Xv(this, uS.NEED_REPLACE_TRACK, this))
//           : this._mediaStreamTrack !== this._originMediaStreamTrack &&
//             ((this._mediaStreamTrack = this._originMediaStreamTrack),
//             this._updatePlayerSource(),
//             await Xv(this, uS.NEED_REPLACE_TRACK, this));
//       }),
//         this.processorDestination.on(DS.ON_NODE, (e) => {
//           this._source.processedNode = e;
//         });
//     }
//     unbindProcessorDestinationEvents() {
//       this.processorDestination.removeAllListeners(DS.ON_TRACK),
//         this.processorDestination.removeAllListeners(DS.ON_NODE);
//     }
//     unbindProcessorContextEvents() {
//       this.processorContext.removeAllListeners(
//         PS.REQUEST_UPDATE_CONSTRAINTS
//       ),
//         this.processorContext.removeAllListeners(PS.REQUEST_CONSTRAINTS);
//     }
//   }