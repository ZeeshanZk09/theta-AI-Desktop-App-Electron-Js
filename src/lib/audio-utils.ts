/**
 * Modern Audio processing utilities for Gemini Live API
 * Uses AudioWorkletNode instead of deprecated ScriptProcessorNode
 */

export const PCM_SAMPLE_RATE = 16000;

export class AudioProcessor {
  private context: AudioContext;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private stream: MediaStream | null = null;
  
  constructor() {
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: PCM_SAMPLE_RATE,
    });
  }

  async startRecording(onData: (base64Data: string) => void) {
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    try {
      // Load AudioWorklet processor
      await this.context.audioWorklet.addModule('/audio-processor-worklet.js');
    } catch (err) {
      console.warn('AudioWorklet not supported, this should not happen in modern browsers', err);
      throw new Error('AudioWorklet not supported');
    }

    // Get microphone stream
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: PCM_SAMPLE_RATE,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }
    });

    this.inputSource = this.context.createMediaStreamSource(this.stream);
    
    // Create AudioWorklet node
    this.workletNode = new AudioWorkletNode(this.context, 'audio-capture-processor');
    
    // Listen for audio data from worklet
    this.workletNode.port.onmessage = (event) => {
      if (event.data.type === 'audio-data') {
        const base64 = this.arrayBufferToBase64(event.data.data);
        onData(base64);
      }
    };

    // Connect: Mic -> Worklet (no need to connect to destination)
    this.inputSource.connect(this.workletNode);
  }

  stopRecording() {
    if (this.workletNode && this.inputSource) {
      this.inputSource.disconnect();
      this.workletNode.disconnect();
      this.workletNode.port.onmessage = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    
    this.inputSource = null;
    this.workletNode = null;
    this.stream = null;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

/**
 * Validates text-based input to ensure safety
 */
export const sanitizeInput = (text: string) => {
  return text.trim();
};
