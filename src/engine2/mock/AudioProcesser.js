import { resolveContext } from "./context";

const isIOSSafari = /ios/i.test(navigator.userAgent)&&/safari/i.test(navigator.userAgent);


export class AudioProcessor {
    constructor(opts) {
      this.context = opts.context;
      this.analyserNode = this.context.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.4;
      this.sourceNode = null;
    }
    /**
     * Updates the source node and reconnects it to the analyser node.
     * @param {AudioNode} newSourceNode - The new source node to connect.
     */
    updateSource(newSourceNode) {
      if (newSourceNode !== this.sourceNode) {
        if (this.sourceNode) {
          try {
            this.sourceNode.disconnect(this.analyserNode);
          } catch (error) {
            console.warn('Disconnect failed:', error);
          }
        }
        this.sourceNode = newSourceNode;
        if (newSourceNode) {
          newSourceNode.connect(this.analyserNode);
        }
      }
    }
  
    /**
     * Calculates and returns the current volume level.
     * @returns {number} - The volume level.
     */
    getVolumeLevel() {
      if (!this.sourceNode) {
        return 0;
      }
  
      // Ensure the audio context is running
      if (!this.context || isIOSSafari || this.context.state !== 'running') {
        this.context.resume();
      }
  
      // Ensure the analyser node is present
      if (!this.analyserNode) {
        return 0;
      }
  
      const dataArray = new Float32Array(this.analyserNode.fftSize);
  
      if (this.analyserNode.getFloatTimeDomainData) {
        this.analyserNode.getFloatTimeDomainData(dataArray);
      } else {
        const byteArray = new Uint8Array(this.analyserNode.fftSize);
        this.analyserNode.getByteTimeDomainData(byteArray);
        for (let i = 0; i < dataArray.length; ++i) {
          dataArray[i] = byteArray[i] / 128 - 1;
        }
      }
  
      // Calculate RMS (root mean square) value
      const rms = dataArray.reduce((sum, value) => sum + value * value, 0) / dataArray.length;
  
      // Convert to dB and normalize
      return Math.max(10 * Math.log10(rms) + 100, 0) / 100;
    }
  
    /**
     * Returns the analyser node.
     * @returns {AnalyserNode} - The analyser node.
     */
    getAnalyserNode() {
      return this.analyserNode;
    }
  
    /**
     * Rebuilds the analyser node.
     */
    rebuildAnalyser() {
      try {
        if (this.sourceNode) {
          this.sourceNode.disconnect(this.analyserNode);
        }
  
        this.analyserNode = this.context.createAnalyser();
        this.analyserNode.fftSize = 2048;
        this.analyserNode.smoothingTimeConstant = 0.4;
  
        if (this.sourceNode) {
          this.sourceNode.connect(this.analyserNode);
        }
      } catch (error) {
        console.warn('Rebuild analyser node failed:', error);
      }
    }
  
    /**
     * Destroys the audio processor by disconnecting the source node.
     */
    destroy() {
      this.updateSource(null);
    }
  }
  
  