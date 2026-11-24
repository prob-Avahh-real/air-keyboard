/** Domain-specific continuous control. Shared thresholds/API: active/air-shared/wearable-input.js — do not replace wholesale. */
/**
 * Wearable input — ring selects key/octave; cane plays / releases.
 */
export class WearableInput {
  /**
   * @param {{
   *   onGesture: (gesture: string, detail?: object) => void,
   *   onBadge?: (kind: string, text: string, active: boolean) => void
   * }} opts
   */
  constructor(opts) {
    this.onGesture = opts.onGesture;
    this.onBadge = opts.onBadge ?? (() => {});
    this.ringActive = false;
    this.caneActive = false;
    this.ringFrame = 0;
    this.caneFrame = 0;
    this.ringPrevBeta = null;
    this.ringPrevGamma = null;
    this.caneLastAccel = { x: 0, y: 0, z: 0 };
    this.canePrevGamma = null;
    this.lastPlayAt = 0;
    this.holding = false;
  }

  setupRing() {
    if (typeof DeviceOrientationEvent === 'undefined') return;
    this.onBadge('ring', '戒指 · 点击启用', false);

    const enable = async () => {
      try {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
          const perm = await DeviceOrientationEvent.requestPermission();
          if (perm !== 'granted') return;
        }
        this.ringActive = true;
        this.onBadge('ring', '戒指 · 已连接', true);
        window.addEventListener('deviceorientation', (e) => this.handleRing(e));
      } catch {
        this.onBadge('ring', '戒指 · 不支持', false);
      }
    };

    document.getElementById('ring-badge')?.addEventListener('click', enable, { once: true });
    if (typeof DeviceOrientationEvent.requestPermission !== 'function') enable();
  }

  setupCane() {
    if (typeof DeviceMotionEvent === 'undefined') return;
    this.onBadge('cane', '手杖 · 点击启用', false);

    const enable = async () => {
      try {
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
          const perm = await DeviceMotionEvent.requestPermission();
          if (perm !== 'granted') return;
        }
        this.caneActive = true;
        this.onBadge('cane', '手杖 · 已连接', true);
        window.addEventListener('devicemotion', (e) => this.handleCane(e));
      } catch {
        this.onBadge('cane', '手杖 · 不支持', false);
      }
    };

    document.getElementById('cane-badge')?.addEventListener('click', enable, { once: true });
    if (typeof DeviceMotionEvent.requestPermission !== 'function') enable();
  }

  handleRing(e) {
    if (!this.ringActive) return;
    this.ringFrame++;
    if (this.ringFrame % 8 !== 0) return;

    const beta = e.beta || 0;
    const gamma = e.gamma || 0;
    if (this.ringPrevBeta === null) {
      this.ringPrevBeta = beta;
      this.ringPrevGamma = gamma;
      return;
    }

    const dBeta = beta - this.ringPrevBeta;
    const dGamma = gamma - this.ringPrevGamma;
    const shake = Math.abs(dBeta) > 20 || Math.abs(dGamma) > 20;
    this.ringPrevBeta = beta;
    this.ringPrevGamma = gamma;

    if (shake) {
      // Shake = brief noteOn/Off for confirm
      this.onGesture('note_on', { velocity: 0.9, source: 'ring' });
      setTimeout(() => this.onGesture('note_off'), 280);
      return;
    }
    if (Math.abs(dGamma) > 5) {
      this.onGesture(dGamma > 0 ? 'next_key' : 'prev_key');
      return;
    }
    if (Math.abs(dBeta) > 5) {
      this.onGesture(dBeta > 0 ? 'octave_down' : 'octave_up');
    }
  }

  handleCane(e) {
    if (!this.caneActive) return;
    this.caneFrame++;
    if (this.caneFrame % 4 !== 0) return;

    const a = e.accelerationIncludingGravity || e.acceleration || { x: 0, y: 0, z: 0 };
    const dax = Math.abs((a.x || 0) - this.caneLastAccel.x);
    const day = Math.abs((a.y || 0) - this.caneLastAccel.y);
    const daz = Math.abs((a.z || 0) - this.caneLastAccel.z);
    this.caneLastAccel = { x: a.x || 0, y: a.y || 0, z: a.z || 0 };

    // Tap = key up (noteOff)
    if (dax > 8 || day > 8 || daz > 8) {
      this.holding = false;
      this.onGesture('note_off');
      return;
    }

    const rot = e.rotationRate || { gamma: 0, beta: 0 };
    const rate = Math.max(Math.abs(rot.gamma || 0), Math.abs(rot.beta || 0));
    // Continuous press while swinging; release when idle
    if (rate > 2.5) {
      const velocity = Math.min(1.2, 0.45 + rate / 16);
      if (!this.holding) {
        this.holding = true;
        this.onGesture('note_on', { velocity, source: 'cane' });
      }
      this.lastPlayAt = Date.now();
    } else if (this.holding && Date.now() - this.lastPlayAt > 200) {
      this.holding = false;
      this.onGesture('note_off');
    }
    this.canePrevGamma = rot.gamma || 0;
  }
}
