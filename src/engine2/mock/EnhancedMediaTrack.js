import { MediaTrack } from "./MediaTrack";
import { Mutex } from "./Mutex";
import { warpEvent } from "./utils";

export class EnhancedMediaTrack extends MediaTrack {
  constructor(mediaStreamTrack, id) {
    super(mediaStreamTrack, id);

    // Initialize additional instance variables
    this._enabled = true;
    this._muted = false;
    this._isExternalTrack = false;
    this._isClosed = false;
    this._enabledMutex = new Mutex(this.getTrackId());
    this.processor = undefined;
    this._processorContext = undefined;

    // Bind the track ended handler
    this._handleTrackEnded = this._handleTrackEnded.bind(this);

    // Add event listener for track ended
    mediaStreamTrack.addEventListener("ended", this._handleTrackEnded);
  }

  // Getter for isExternalTrack
  get isExternalTrack() {
    return this._isExternalTrack;
  }

  // Getter for muted
  get muted() {
    return this._muted;
  }

  // Getter for enabled
  get enabled() {
    return this._enabled;
  }

  // Getter and Setter for processorContext
  get processorContext() {
    return this._processorContext;
  }

  set processorContext(context) {
    this._processorContext = context;
  }

  // Get the label of the track
  getTrackLabel() {
    return this._originMediaStreamTrack?.label || "";
  }

  // Close the track
  close() {
    if (!this._isClosed) {
      this.stop();
      this._originMediaStreamTrack.stop();

      if (this._mediaStreamTrack !== this._originMediaStreamTrack) {
        this._mediaStreamTrack.stop();
        this._mediaStreamTrack = null;
      }

      this._originMediaStreamTrack = null;
      this._enabledMutex = null;

      Logger.debug(`[${this.getTrackId()}] close`);
      this.emit(EventType.NEED_CLOSE);
      super.close();
    }
  }

  // Update the origin media stream track
  async _updateOriginMediaStreamTrack(
    newTrack,
    stopCurrentTrack,
    isExternal = false
  ) {
    this._isExternalTrack = isExternal;

    if (newTrack !== this._originMediaStreamTrack) {
      this._originMediaStreamTrack.removeEventListener(
        "ended",
        this._handleTrackEnded
      );

      if (stopCurrentTrack) {
        this._originMediaStreamTrack.stop();
      }

      newTrack.addEventListener("ended", this._handleTrackEnded);
      this._originMediaStreamTrack = newTrack;

      if (this._muted) {
        this._originMediaStreamTrack.enabled = false;
      }

      this._mediaStreamTrack = this._originMediaStreamTrack;
      this._updatePlayerSource();

      await this._notifyTrackReplaced();

      if (this.processor) {
        this.processor.updateInput({
          track: this._originMediaStreamTrack,
          context: this.processorContext,
        });
      }
    }
  }

  // Default player config
  _getDefaultPlayerConfig() {
    return {};
  }

  // Handle track ended event
  _handleTrackEnded() {
    Logger.debug(`[${this.getTrackId()}] track ended`);
    this.emit(EventType.TRACK_ENDED);
  }

  // Check the state of the track
  stateCheck(property, value) {
    Logger.debug(
      `check track state, [muted: ${this._muted}, enabled: ${this._enabled}] to [${property}: ${value}]`
    );

    validateStateChange(property, value);

    if (
      this._enabled &&
      this._muted &&
      property === "enabled" &&
      value === false
    ) {
      throw Error("cannot set enabled while the track is muted");
    }

    if (
      !this._enabled &&
      !this._muted &&
      property === "muted" &&
      value === true
    ) {
      throw Error("cannot set muted while the track is disabled");
    }
  }

  // Get processor stats
  getProcessorStats() {
    return this.processorContext.gatherStats();
  }

  // Get processor usage
  getProcessorUsage() {
    return this.processorContext.gatherUsage();
  }

  // Private method to notify that the track has been replaced
  async _notifyTrackReplaced() {
    await warpEvent(this, EventType.NEED_REPLACE_TRACK, this);
  }
}

const EventType = {
  NEED_CLOSE: "need_close",
  TRACK_ENDED: "track_ended",
  NEED_REPLACE_TRACK: "need_replace_track",
};

function validateStateChange(property, value) {
  // Mock implementation of state validation
  console.log(`Validating state change: ${property} = ${value}`);
}
