/** Short synthesized cues, generated locally with no audio files or requests. */
export class Sound {
  enabled = false;
  private context: AudioContext | null = null;
  toggle(): boolean {
    this.enabled = !this.enabled;
    if (this.enabled) this.play('start');
    return this.enabled;
  }
  play(cue: 'move' | 'rotate' | 'drop' | 'hold' | 'clear' | 'over' | 'start'): void {
    if (!this.enabled) return;
    try {
      this.context ??= new AudioContext();
      const ctx = this.context;
      if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
      const notes: Record<typeof cue, number[]> = {
        move: [150], rotate: [310], drop: [110, 80], hold: [330, 440],
        clear: [523, 659, 784], over: [330, 262, 196], start: [392, 523],
      };
      notes[cue].forEach((frequency, i) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + i * .075;
        oscillator.type = cue === 'drop' ? 'triangle' : 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(.045, start + .006);
        gain.gain.exponentialRampToValueAtTime(.001, start + .12);
        oscillator.connect(gain).connect(ctx.destination);
        oscillator.start(start);
        oscillator.stop(start + .13);
      });
    } catch { /* Sound is optional; blocked audio never interrupts the game. */ }
  }
}
