/**
 * Audio Player for Gemini Live API
 * Handles seamless 24kHz PCM audio playback with timestamp-based scheduling
 * to avoid gaps and clicks between chunks
 */

export class AudioPlayer {
  private context: AudioContext;
  private nextStartTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];

  constructor() {
    // Create AudioContext for playback (will handle 24kHz upsampling to system rate)
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 48000, // System default, will upsample 24kHz internally
    });
  }

  /**
   * Convert Base64 PCM data to Int16Array
   */
  private base64ToInt16(base64: string): Int16Array {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create Int16Array from bytes (Little-Endian)
    const int16Array = new Int16Array(bytes.buffer);
    return int16Array;
  }

  /**
   * Convert Int16 PCM to Float32 for Web Audio API
   */
  private int16ToFloat32(int16Data: Int16Array): Float32Array {
    const float32 = new Float32Array(int16Data.length);
    
    for (let i = 0; i < int16Data.length; i++) {
      // Normalize to [-1.0, 1.0]
      float32[i] = int16Data[i] / 32768.0;
    }
    
    return float32;
  }

  /**
   * Schedule an audio chunk for playback
   * Uses precise timing to ensure seamless playback
   */
  scheduleChunk(base64Audio: string): void {
    try {
      // Resume context if suspended
      if (this.context.state === 'suspended') {
        this.context.resume();
      }

      // Decode Base64 → Int16 → Float32
      const pcm16 = this.base64ToInt16(base64Audio);
      const float32Data = this.int16ToFloat32(pcm16);

      if (float32Data.length === 0) return;

      // Create AudioBuffer with 24kHz sample rate (Gemini output rate)
      const buffer = this.context.createBuffer(1, float32Data.length, 24000);
      buffer.getChannelData(0).set(float32Data);

      // Create source node
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.context.destination);

      // Calculate start time
      const now = this.context.currentTime;
      
      // If we're behind (buffer underrun), reset with small safety margin
      if (this.nextStartTime < now) {
        this.nextStartTime = now + 0.05; // 50ms buffer
      }

      // Schedule playback
      source.start(this.nextStartTime);
      
      // Track active source
      this.activeSources.push(source);
      
      // Cleanup when finished
      source.onended = () => {
        const index = this.activeSources.indexOf(source);
        if (index > -1) {
          this.activeSources.splice(index, 1);
        }
      };

      // Update next start time
      this.nextStartTime += buffer.duration;

    } catch (error) {
      console.error('Error scheduling audio chunk:', error);
    }
  }

  /**
   * Clear playback queue (for interruptions/barge-in)
   */
  clear(): void {
    // Stop all active sources
    this.activeSources.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Source might already be stopped
      }
    });
    
    this.activeSources = [];
    this.nextStartTime = 0;
    
    console.log('AudioPlayer: Playback queue cleared');
  }

  /**
   * Get play state
   */
  isPlaying(): boolean {
    return this.activeSources.length > 0;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.clear();
    this.context.close();
  }
}
