class Ng extends yg {
    get isExternalTrack() {
      return this._isExternalTrack;
    }
    get muted() {
      return this._muted;
    }
    get enabled() {
      return this._enabled;
    }
    get processorContext() {
      return this._processorContext;
    }
    set processorContext(e) {
      this._processorContext = e;
    }
    constructor(e, t) {
      super(e, t),
        _p(this, "_enabled", !0),
        _p(this, "_muted", !1),
        _p(this, "_isExternalTrack", !1),
        _p(this, "_isClosed", !1),
        _p(this, "_enabledMutex", void 0),
        _p(this, "processor", void 0),
        _p(this, "_processorContext", void 0),
        _p(this, "_handleTrackEnded", () => {
          this.onTrackEnded();
        }),
        (this._enabledMutex = new bg("".concat(this.getTrackId()))),
        e.addEventListener("ended", this._handleTrackEnded);
    }
    getTrackLabel() {
      var e, t;
      return null !==
        (e =
          null === (t = this._originMediaStreamTrack) || void 0 === t
            ? void 0
            : t.label) && void 0 !== e
        ? e
        : "";
    }
    close() {
      this._isClosed ||
        (this.stop(),
        this._originMediaStreamTrack.stop(),
        this._mediaStreamTrack !== this._originMediaStreamTrack &&
          (this._mediaStreamTrack.stop(), (this._mediaStreamTrack = null)),
        (this._originMediaStreamTrack = null),
        (this._enabledMutex = null),
        OE.debug("[".concat(this.getTrackId(), "] close")),
        this.emit(uS.NEED_CLOSE),
        super.close());
    }
    async _updateOriginMediaStreamTrack(e, t) {
      let i = arguments.length > 2 && void 0 !== arguments[2] && arguments[2];
      (this._isExternalTrack = i),
        e !== this._originMediaStreamTrack &&
          (this._originMediaStreamTrack.removeEventListener(
            "ended",
            this._handleTrackEnded
          ),
          t && this._originMediaStreamTrack.stop(),
          e.addEventListener("ended", this._handleTrackEnded),
          (this._originMediaStreamTrack = e),
          this._muted && (this._originMediaStreamTrack.enabled = !1),
          (this._mediaStreamTrack = this._originMediaStreamTrack),
          this._updatePlayerSource(),
          await Xv(this, uS.NEED_REPLACE_TRACK, this),
          this.processor &&
            this.processor.updateInput({
              track: this._originMediaStreamTrack,
              context: this.processorContext,
            }));
    }
    _getDefaultPlayerConfig() {
      return {};
    }
    onTrackEnded() {
      OE.debug("[".concat(this.getTrackId(), "] track ended")),
        this.emit(_S.TRACK_ENDED);
    }
    stateCheck(e, t) {
      if (
        (OE.debug(
          "check track state, [muted: "
            .concat(this._muted, ", enabled: ")
            .concat(this._enabled, "] to [")
            .concat(e, ": ")
            .concat(t, "]")
        ),
        Km(t, e),
        this._enabled && this._muted && "enabled" === e && !1 === t)
      )
        throw new SE(
          fE.TRACK_STATE_UNREACHABLE,
          "cannot set enabled while the track is muted"
        ).print();
      if (!this._enabled && !this._muted && "muted" === e && !0 === t)
        throw new SE(
          fE.TRACK_STATE_UNREACHABLE,
          "cannot set muted while the track is disabled"
        ).print();
    }
    getProcessorStats() {
      return this.processorContext.gatherStats();
    }
    getProcessorUsage() {
      return this.processorContext.gatherUsage();
    }
  }