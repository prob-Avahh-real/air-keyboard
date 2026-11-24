/**
 * Web Audio piano — noteOn/noteOff with sustain while held (polyphonic).
 */
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.active = new Map();
  }

  async ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.02);
    }
  }

  /**
   * @param {number} midi
   * @param {{ velocity?: number }} opts
   */
  async noteOn(midi, opts = {}) {
    await this.ensure();
    if (this.muted) return;

    const velocity = Math.min(1.2, Math.max(0.25, opts.velocity ?? 0.75));
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const now = this.ctx.currentTime;

    this.noteOff(midi, 0.03);

    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2200 + velocity * 2800;
    filter.Q.value = 0.85;

    const peak = 0.28 * velocity;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(peak * 0.55, now + 0.18);
    // Sustain plateau until noteOff
    gain.gain.setTargetAtTime(peak * 0.48, now + 0.35, 0.2);

    const partials = [
      { type: 'triangle', mul: 1, amp: 1 },
      { type: 'sine', mul: 2, amp: 0.28 },
      { type: 'sine', mul: 3, amp: 0.12 },
      { type: 'sine', mul: 4.01, amp: 0.06 },
    ];

    const oscs = [];
    for (const p of partials) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = p.type;
      osc.frequency.value = freq * p.mul;
      g.gain.value = p.amp * velocity;
      osc.connect(g);
      g.connect(filter);
      osc.start(now);
      oscs.push(osc);
    }

    filter.connect(gain);
    gain.connect(this.master);

    this.active.set(midi, { gain, oscs, midi });
  }

  /** @deprecated use noteOn */
  async play(midi, opts = {}) {
    return this.noteOn(midi, opts);
  }

  /**
   * @param {number} midi
   * @param {number} [tau]
   */
  noteOff(midi, tau = 0.12) {
    if (!this.ctx) return;
    const node = this.active.get(midi);
    if (!node) return;
    const now = this.ctx.currentTime;
    try {
      node.gain.gain.cancelScheduledValues(now);
      node.gain.gain.setTargetAtTime(0.0001, now, tau);
      for (const osc of node.oscs) {
        try {
          osc.stop(now + tau * 5);
        } catch {
          /* already stopped */
        }
      }
    } catch {
      /* ignore */
    }
    this.active.delete(midi);
  }

  release(midi, tau = 0.12) {
    this.noteOff(midi, tau);
  }

  releaseAll() {
    for (const midi of [...this.active.keys()]) {
      this.noteOff(midi, 0.06);
    }
  }
}
