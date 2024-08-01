import Logger from "../logger";
import { AudioProcessorDestination } from "./AudioProcessorDestination";
import { CustomError } from "./CustomError";
import { EnhancedMediaTrack } from "./EnhancedMediaTrack";
import { ProcessorContext } from "./ProcessorContext";
import { warpEvent } from "./utils";

export class LocalAudioTrack extends EnhancedMediaTrack {
  constructor(
    mediaStreamTrack,
    encoderConfig,
    id,
    getOriginVolumeLevel,
    enableWebAudio
  ) {
    super(mediaStreamTrack, id);

    // Initialize instance variables
    this.trackMediaType = "audio";
    this._encoderConfig = encoderConfig;
    this._trackSource = undefined;
    this._enabled = true;
    this._volume = 100;
    this._useAudioElement = false;
    this._bypassWebAudio = false;
    this.processor = undefined;
    this._processorContext = undefined;
    this._processorDestination = undefined;
    this._getOriginVolumeLevel = !!getOriginVolumeLevel;
    this._mediaStreamTrack = mediaStreamTrack;

    // Initialize track source and processor context
    this._initializeTrackSource(enableWebAudio);

    // Conditionally initialize WebAudio
    if (!disableWebAudio() && enableWebAudio) {
      this._initializeWebAudio(mediaStreamTrack);
    }
  }

  // Getters and Setters
  get _source() {
    return this._trackSource;
  }

  set _source(source) {
    this._trackSource = source;
  }

  get processorContext() {
    return this._processorContext;
  }

  set processorContext(context) {
    this._processorContext = context;
  }

  get processorDestination() {
    return this._processorDestination;
  }

  set processorDestination(destination) {
    this._processorDestination = destination;
  }

  get isPlaying() {
    return this._useAudioElement
      ? AudioElementManager.isPlaying(this.getTrackId())
      : this._source.isPlayed;
  }

  get __className__() {
    return "LocalAudioTrack";
  }

  // Initialize track source and processor context
  _initializeTrackSource(enableWebAudio) {
    debugger;
    const setupProcessorContext = () => {
      this.processorContext = new ProcessorContext(
        this._source.context,
        this.getTrackId(),
        "local"
      );
      this.processorDestination = new AudioProcessorDestination(
        this.processorContext
      );
      this._bindProcessorDestinationEvents();
      this._source.on(Event.UPDATE_SOURCE, () => {
        if (this.processor) {
          this.processor.updateInput({
            node: this._source.processSourceNode,
            context: this.processorContext,
          });
        }
      });
    };

    const useAudioElement = enableWebAudio && !someOtherCondition();

    const mediaStreamTrack = this._mediaStreamTrack;
    if (disableWebAudio()) {
      this._source = new AudioElementSource();
      this._useAudioElement = true;
      this._bypassWebAudio = true;
    } else if (useAudioElement) {
      this._source = new AudioElementSource();
    } else {
      this._source = new WebAudioSource(
        mediaStreamTrack,
        false,
        this._getOriginVolumeLevel ? mediaStreamTrack : undefined
      );
      if (!disableWebAudio()) {
        this._useAudioElement = true;
      }
    }

    setupProcessorContext();
  }

  // Initialize WebAudio
  _initializeWebAudio(mediaStreamTrack) {
    if (!disableWebAudio()) {
      if (!globalWebAudioManager) {
        globalWebAudioManager = new WebAudioManager();
      }
      globalWebAudioManager.enqueue("INIT_WEBAUDIO", () => {
        this._source = new WebAudioSource(
          mediaStreamTrack,
          false,
          this._getOriginVolumeLevel ? mediaStreamTrack : undefined
        );
        if (!disableWebAudio()) {
          this._useAudioElement = true;
        }
        this._initializeTrackSource(true);
        this.emit(Event.UPDATE_TRACK_SOURCE);
      });
    }
  }

  // Set volume
  setVolume(volume) {
    // validateVolume(volume, "volume", 0, 1000);
    this._volume = volume;
    this._source.setVolume(volume / 100);
    if (this._useAudioElement) {
      AudioElementManager.setVolume(this.getTrackId(), volume);
    }

    try {
      if (this._bypassWebAudio) {
        Logger.debug(
          `[${this.getTrackId()}] setVolume returned because no pass through WebAudio.`
        );
        return;
      }
      const outputTrack = this._source.createOutputTrack();
      if (this._mediaStreamTrack !== outputTrack) {
        this._mediaStreamTrack = outputTrack;
        warpEvent(this, Event.NEED_REPLACE_TRACK, this)
          .then(() => {
            Logger.debug(
              `[${this.getTrackId()}] replace web audio track success`
            );
          })
          .catch((error) => {
            Logger.warning(
              `[${this.getTrackId()}] replace web audio track failed`,
              error
            );
          });
      }
    } catch (error) {
      // Handle error
    }
  }

  // Get volume level
  getVolumeLevel() {
    if (this._muted && this.enabled && this._getOriginVolumeLevel) {
      return this._source.getOriginVolumeLevel();
    }
    return this._source.getAccurateVolumeLevel();
  }

  // Set playback device
  async setPlaybackDevice(deviceId) {
    if (!this._useAudioElement) {
      throw new CustomError(
        ErrorType.NOT_SUPPORTED,
        "your browser does not support setting the audio output device"
      );
    }
    await AudioElementManager.setSinkID(this.getTrackId(), deviceId);
  }

  // Set enabled state
  async setEnabled(enabled, silent = false, force = false) {
    return this._setEnabled(enabled, silent, force);
  }

  // Private method to set enabled state
  async _setEnabled(enabled, silent = false, force = false) {
    if (!force) {
      if (enabled === this._enabled) return;
      this.stateCheck("enabled", enabled);
    }

    Logger.info(`[${this.getTrackId()}] start setEnabled`, enabled);

    if (enabled) {
      this._originMediaStreamTrack.enabled = true;
      try {
        if (!force) {
          this._enabled = true;
        }
        await warpEvent(this, Event.NEED_ENABLE_TRACK, this);
        Logger.info(`[${this.getTrackId()}] setEnabled to ${enabled} success`);
      } catch (error) {
        if (!force) {
          this._enabled = false;
        }
        Logger.error(
          `[${this.getTrackId()}] setEnabled to true error`,
          error.toString()
        );
        throw error;
      }
    } else {
      this._originMediaStreamTrack.enabled = false;
      if (!force) {
        this._enabled = false;
      }
      try {
        await warpEvent(this, Event.NEED_DISABLE_TRACK, this);
      } catch (error) {
        if (!force) {
          this._enabled = true;
        }
        Logger.error(
          `[${this.getTrackId()}] setEnabled to false error`,
          error.toString()
        );
        throw error;
      }
    }
  }

  // Set muted state
  async setMuted(muted) {
    if (muted !== this._muted) {
      this.stateCheck("muted", muted);
      this._muted = muted;
      this._originMediaStreamTrack.enabled = !muted;
      Logger.debug(`[${this.getTrackId()}] start set muted: ${muted}`);
      if (muted) {
        await warpEvent(this, Event.NEED_MUTE_TRACK, this);
      } else {
        await warpEvent(this, Event.NEED_UNMUTE_TRACK, this);
      }
    }
  }

  // Get statistics
  getStats() {
    deprecatedWarning(
      "[deprecated] LocalAudioTrack.getStats will be removed in the future, use AgoraRTCClient.getLocalAudioStats instead",
      "localAudioTrackGetStatsWarning"
    );
    const stats = warpEvent(this, Event.GET_STATS);
    return stats || {};
  }

  // Set audio frame callback
  setAudioFrameCallback(callback, bufferSize = 4096) {
    if (!callback) {
      this._source.removeAllListeners(Event.ON_AUDIO_BUFFER);
      this._source.stopGetAudioBuffer();
      return;
    }
    this._source.startGetAudioBuffer(bufferSize);
    this._source.removeAllListeners(Event.ON_AUDIO_BUFFER);
    this._source.on(Event.ON_AUDIO_BUFFER, (buffer) => callback(buffer));
  }

  // Play audio
  play() {
    Logger.debug(`[${this.getTrackId()}] start audio playback`);
    if (this._useAudioElement) {
      Logger.debug(`[${this.getTrackId()}] start audio playback in element`);
      AudioElementManager.play(
        this._mediaStreamTrack,
        this.getTrackId(),
        this._volume
      );
    } else {
      this._source.play();
    }
  }

  // Stop audio
  stop() {
    Logger.debug(`[${this.getTrackId()}] stop audio playback`);
    if (this._useAudioElement) {
      AudioElementManager.stop(this.getTrackId());
    } else {
      this._source.stop();
    }
  }

  // Close the track
  close() {
    super.close();
    this._unbindProcessorDestinationEvents();
    this._unbindProcessorContextEvents();
    this.unpipe();
    if (this.processorDestination._source) {
      this.processorDestination._source.unpipe();
    }
    this._source.destroy();
  }

  // Update player source
  _updatePlayerSource(updateTrack = true) {
    Logger.debug(`[${this.getTrackId()}] update player source track`);
    if (updateTrack) {
      this._source.updateTrack(this._mediaStreamTrack);
    }
    if (this._useAudioElement) {
      AudioElementManager.updateTrack(
        this.getTrackId(),
        this._mediaStreamTrack
      );
    }
  }

  // Update origin media stream track
  async _updateOriginMediaStreamTrack(newTrack, stopCurrentTrack) {
    if (this._originMediaStreamTrack !== newTrack) {
      this._originMediaStreamTrack.removeEventListener(
        "ended",
        this._handleTrackEnded
      );
      newTrack.addEventListener("ended", this._handleTrackEnded);
      if (stopCurrentTrack) {
        this._originMediaStreamTrack.stop();
      }
      this._originMediaStreamTrack = newTrack;
      if (this._muted) {
        this._originMediaStreamTrack.enabled = false;
      }
      if (this.processor) {
        this.processor.updateInput({
          track: newTrack,
          context: this.processorContext,
        });
      }
      if (this._mediaStreamTrack !== this._source.outputTrack) {
        this._mediaStreamTrack = this._originMediaStreamTrack;
        this._updatePlayerSource();
        await warpEvent(this, Event.NEED_REPLACE_TRACK, this);
      } else {
        this._source.updateTrack(this._originMediaStreamTrack);
      }
      if (this._getOriginVolumeLevel) {
        this._source.updateOriginTrack(newTrack);
      }
    }
  }

  // Renew media stream track
  renewMediaStreamTrack(newTrack) {
    return Promise.resolve();
  }

  // Pipe processor
  pipe(processor) {
    if (this._bypassWebAudio) {
      throw new CustomError(
        ErrorType.INVALID_OPERATION,
        "Cannot process AudioTrack when bypassWebAudio set to true."
      );
    }
    if (this.processor === processor) {
      return processor;
    }
    if (processor._source) {
      throw new CustomError(
        ErrorType.INVALID_OPERATION,
        `Processor ${processor.name} already piped, please call unpipe beforehand.`
      );
    }
    this.unpipe();
    this.processor = processor;
    this.processor._source = this;
    processor.updateInput({
      track: this._originMediaStreamTrack,
      node: this._source.processSourceNode,
      context: this.processorContext,
    });
    return processor;
  }

  // Unpipe processor
  unpipe() {
    if (!this.processor) return;
    const processor = this.processor;
    if (this._source.processSourceNode) {
      this._source.processSourceNode.disconnect();
    }
    this.processor._source = false;
    this.processor = undefined;
    processor.reset();
  }

  // Bind processor destination events
  _bindProcessorDestinationEvents() {
    this.processorDestination.on(Event.ON_TRACK, async (track) => {
      if (track) {
        if (track !== this._mediaStreamTrack) {
          this._mediaStreamTrack = track;
          this._updatePlayerSource(false);
          this._source.processedNode =
            this._source.createMediaStreamSourceNode(track);
          await warpEvent(this, Event.NEED_REPLACE_TRACK, this);
        }
      } else {
        if (this._mediaStreamTrack !== this._originMediaStreamTrack) {
          this._mediaStreamTrack = this._originMediaStreamTrack;
          this._updatePlayerSource();
          await warpEvent(this, Event.NEED_REPLACE_TRACK, this);
        }
      }
    });

    this.processorDestination.on(Event.ON_NODE, (node) => {
      this._source.processedNode = node;
    });
  }

  // Unbind processor destination events
  _unbindProcessorDestinationEvents() {
    this.processorDestination.removeAllListeners(Event.ON_TRACK);
    this.processorDestination.removeAllListeners(Event.ON_NODE);
  }

  // Unbind processor context events
  _unbindProcessorContextEvents() {
    this.processorContext.removeAllListeners(Event.REQUEST_UPDATE_CONSTRAINTS);
    this.processorContext.removeAllListeners(Event.REQUEST_CONSTRAINTS);
  }
}

// Helper functions and constants
function disableWebAudio() {
  // return Boolean(GE("DISABLE_WEBAUDIO"));
  return false;
}

function someOtherCondition() {
  // return Wh() && !xg();
  return false;
}

function validateVolume(volume, name, min, max) {
  qm(volume, name, min, max);
}

// Mock implementations for the purpose of this example
const Event = {
  UPDATE_SOURCE: "UPDATE_SOURCE",
  ON_AUDIO_BUFFER: "ON_AUDIO_BUFFER",
  NEED_REPLACE_TRACK: "NEED_REPLACE_TRACK",
  NEED_ENABLE_TRACK: "NEED_ENABLE_TRACK",
  NEED_DISABLE_TRACK: "NEED_DISABLE_TRACK",
  NEED_MUTE_TRACK: "NEED_MUTE_TRACK",
  NEED_UNMUTE_TRACK: "NEED_UNMUTE_TRACK",
  GET_STATS: "GET_STATS",
  ON_TRACK: "ON_TRACK",
  ON_NODE: "ON_NODE",
  REQUEST_UPDATE_CONSTRAINTS: "REQUEST_UPDATE_CONSTRAINTS",
  REQUEST_CONSTRAINTS: "REQUEST_CONSTRAINTS",
  UPDATE_TRACK_SOURCE: "UPDATE_TRACK_SOURCE",
};

const AudioElementManager = {
  isPlaying: (trackId) => false, // Mock implementation
  setVolume: (trackId, volume) => {}, // Mock implementation
  play: (mediaStreamTrack, trackId, volume) => {}, // Mock implementation
  stop: (trackId) => {}, // Mock implementation
  setSinkID: (trackId, deviceId) => Promise.resolve(), // Mock implementation
  updateTrack: (trackId, mediaStreamTrack) => {}, // Mock implementation
};

const WebAudioManager = class {
  enqueue(event, callback) {
    callback();
  }
};
const globalWebAudioManager = null;
const WebAudioSource = class {}; // Mock implementation
const AudioElementSource = class {}; // Mock implementation

const ErrorType = {
  INVALID_OPERATION: "INVALID_OPERATION",
  NOT_SUPPORTED: "NOT_SUPPORTED",
};
