export class Sound {
  enabled = true;
  private context?: AudioContext;

  // Browsers require a user gesture before starting audio.
  unlock(): void {
    if (!this.enabled || typeof AudioContext === "undefined") return;
    this.context ??= new AudioContext();
    if (this.context.state === "suspended") void this.context.resume().catch(() => {});
  }

  play(from: number, to: number, duration = .075): void {
    const ctx = this.context;
    if (!this.enabled || !ctx || ctx.state !== "running") return;
    const oscillator = ctx.createOscillator();
    const volume = ctx.createGain();
    const now = ctx.currentTime;
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(from, now);
    oscillator.frequency.exponentialRampToValueAtTime(to, now + duration);
    volume.gain.setValueAtTime(.0001, now);
    volume.gain.exponentialRampToValueAtTime(.085, now + .006);
    volume.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(volume).connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }
}
