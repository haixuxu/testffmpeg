import { EventEmitter } from "./emitter";

const TrackRegistry = [];

export class MediaTrack extends EventEmitter {
  constructor(mediaStreamTrack, id) {
    super();

    // Initialize instance variables
    this.trackMediaType = undefined;
    this._ID = id || generateID(8, "track-");
    this._hints = [];
    this._isClosed = false;
    this._originMediaStreamTrack = mediaStreamTrack;
    this._mediaStreamTrack = mediaStreamTrack;
    this._external = {};

    // Register the new track
    this._registerTrack(this);
  }

  // Convert the instance to a string representation (track ID)
  toString() {
    return this._ID;
  }

  // Get the track ID
  getTrackId() {
    return this._ID;
  }

  // Get the MediaStreamTrack
  getMediaStreamTrack(report = false) {
    return this._mediaStreamTrack;
  }

  // Get MediaStreamTrack settings
  getMediaStreamTrackSettings() {
    return this.getMediaStreamTrack(true).getSettings();
  }

  // Close the track
  close() {
    this._isClosed = true;

    // Unregister the track
    this._unregisterTrack(this);

    // Emit the CLOSED event
    this.emit(EventType.CLOSED);
  }

  // Private method to register the track
  _registerTrack(track) {
    if (!TrackRegistry.includes(track)) {
      TrackRegistry.push(track);
    }
  }

  // Private method to unregister the track
  _unregisterTrack(track) {
    const index = TrackRegistry.indexOf(track);
    if (index !== -1) {
      TrackRegistry.splice(index, 1);
    }
  }
}

// Helper functions and constants
function generateID(length, prefix) {
  // Generate a random ID with the specified length and prefix
  return prefix + Math.random().toString(36).substr(2, length);
}
