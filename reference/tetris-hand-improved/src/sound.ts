/** Optional sound effects: short tones, silent until the player turns them on. */
export class Sound {
  enabled = false;
  private context: AudioContext | null = null;

  beep(frequency: number, seconds = 0.06): void {
    if (!this.enabled) return;
    try {
      this.context ??= new AudioContext();
      void this.context.resume();
      const { currentTime: now, destination } = this.context;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
      oscillator.connect(gain).connect(destination);
      oscillator.start(now);
      oscillator.stop(now + seconds);
    } catch {
      /* Sound is optional; play on silently if audio is unavailable. */
    }
  }
}
