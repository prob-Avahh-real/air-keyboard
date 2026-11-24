import { SCALES, buildKeys, wrap, midiToLabel } from './notes.js';
import { AudioEngine } from './audio-engine.js';
import { WearableInput } from './wearable-input.js';

const $ = (id) => document.getElementById(id);

const audio = new AudioEngine();
const state = {
  scaleIndex: 0,
  keyIndex: 0,
  octave: 4,
  muted: false,
  lastMidi: null,
  /** pointerId → midi for poly touch */
  held: new Map(),
  caneHeldMidi: null,
};

function currentScale() {
  return SCALES[state.scaleIndex];
}

function currentKeys() {
  return buildKeys(currentScale(), state.octave);
}

function currentKey() {
  const keys = currentKeys();
  return keys[state.keyIndex] || keys[0];
}

function showToast(msg) {
  const el = $('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove('show'), 1200);
}

function haptic(ms = 10) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch {
    /* ignore */
  }
}

function render() {
  const scale = currentScale();
  const keys = currentKeys();
  const key = currentKey();

  $('scale-name').textContent = scale.label;
  $('note-name').textContent = key.name;
  $('note-meta').textContent = `八度 ${state.octave} · ${state.keyIndex + 1} / ${keys.length}`;

  const tabs = $('scale-tabs');
  tabs.innerHTML = SCALES.map(
    (s, i) => `
    <button type="button" class="scale-tab ${i === state.scaleIndex ? 'active' : ''}" data-i="${i}">
      ${s.label}
    </button>`
  ).join('');

  const board = $('keyboard');
  board.innerHTML = keys
    .map(
      (k) => `
      <button type="button"
        class="key ${k.sharp ? 'black' : 'white'} ${k.degreeIndex === state.keyIndex ? 'selected' : ''} ${
          [...state.held.values()].includes(k.midi) || state.caneHeldMidi === k.midi ? 'lit' : ''
        }"
        data-midi="${k.midi}" data-i="${k.degreeIndex}">
        <span>${k.name}</span>
      </button>`
    )
    .join('');

  $('mute-btn').classList.toggle('on', state.muted);
  $('mute-btn').textContent = state.muted ? '已静音' : '静音';
  $('piano').classList.toggle('struck', state.held.size > 0 || state.caneHeldMidi != null);
}

async function noteOnMidi(midi, detail = {}) {
  await audio.ensure();
  state.lastMidi = midi;
  await audio.noteOn(midi, detail);
  haptic(detail.source === 'cane' ? 16 : 10);
  const label = midiToLabel(midi);
  showToast(`♪ ${label}`);
  render();
}

function noteOffMidi(midi) {
  audio.noteOff(midi);
  if (state.lastMidi === midi) state.lastMidi = null;
  render();
}

async function playCurrent(detail = {}) {
  const key = currentKey();
  await noteOnMidi(key.midi, detail);
}

function selectKey(i) {
  state.keyIndex = wrap(i, currentKeys().length);
  render();
  haptic(6);
}

function selectScale(i) {
  state.scaleIndex = wrap(i, SCALES.length);
  state.keyIndex = 0;
  render();
  showToast(`音阶 · ${currentScale().label}`);
}

function shiftOctave(delta) {
  state.octave = Math.min(6, Math.max(2, state.octave + delta));
  render();
  showToast(`八度 · ${state.octave}`);
  haptic(8);
}

function setMuted(muted) {
  state.muted = muted;
  audio.setMuted(muted);
  if (muted) {
    audio.releaseAll();
    state.held.clear();
    state.caneHeldMidi = null;
  }
  render();
  showToast(muted ? '已静音' : '取消静音');
}

function handleGesture(gesture, detail = {}) {
  switch (gesture) {
    case 'prev_key':
      selectKey(state.keyIndex - 1);
      break;
    case 'next_key':
      selectKey(state.keyIndex + 1);
      break;
    case 'octave_up':
      shiftOctave(1);
      break;
    case 'octave_down':
      shiftOctave(-1);
      break;
    case 'note_on':
    case 'play_note': {
      const midi = currentKey().midi;
      if (state.caneHeldMidi != null && state.caneHeldMidi !== midi) {
        noteOffMidi(state.caneHeldMidi);
      }
      state.caneHeldMidi = midi;
      playCurrent({ ...detail, source: detail.source || 'cane' });
      break;
    }
    case 'note_off':
    case 'release':
      if (state.caneHeldMidi != null) {
        noteOffMidi(state.caneHeldMidi);
        state.caneHeldMidi = null;
      } else if (state.lastMidi != null) {
        noteOffMidi(state.lastMidi);
      }
      showToast('止音');
      break;
    case 'next_scale':
      selectScale(state.scaleIndex + 1);
      break;
    case 'prev_scale':
      selectScale(state.scaleIndex - 1);
      break;
    case 'toggle_mute':
      setMuted(!state.muted);
      break;
    default:
      break;
  }
}

function bindUi() {
  $('scale-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.scale-tab');
    if (!btn) return;
    selectScale(Number(btn.dataset.i));
  });

  const board = $('keyboard');
  board.addEventListener('pointerdown', async (e) => {
    const btn = e.target.closest('.key');
    if (!btn) return;
    e.preventDefault();
    btn.setPointerCapture?.(e.pointerId);
    const midi = Number(btn.dataset.midi);
    selectKey(Number(btn.dataset.i));
    state.held.set(e.pointerId, midi);
    await noteOnMidi(midi, { velocity: 0.85, source: 'touch' });
  });
  const releasePtr = (e) => {
    const midi = state.held.get(e.pointerId);
    if (midi == null) return;
    state.held.delete(e.pointerId);
    noteOffMidi(midi);
  };
  board.addEventListener('pointerup', releasePtr);
  board.addEventListener('pointercancel', releasePtr);
  board.addEventListener('pointerleave', (e) => {
    if (e.buttons === 0) releasePtr(e);
  });

  $('play-btn').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    handleGesture('note_on', { velocity: 0.8, source: 'ui' });
  });
  $('play-btn').addEventListener('pointerup', () => handleGesture('note_off'));
  $('play-btn').addEventListener('pointerleave', () => handleGesture('note_off'));

  $('oct-up-btn').addEventListener('click', () => shiftOctave(1));
  $('oct-down-btn').addEventListener('click', () => shiftOctave(-1));
  $('mute-btn').addEventListener('click', () => setMuted(!state.muted));
  $('release-btn').addEventListener('click', () => handleGesture('release'));

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    switch (e.key) {
      case 'ArrowLeft':
        handleGesture('prev_key');
        break;
      case 'ArrowRight':
        handleGesture('next_key');
        break;
      case 'ArrowUp':
        handleGesture('octave_up');
        break;
      case 'ArrowDown':
        handleGesture('octave_down');
        break;
      case ' ':
        e.preventDefault();
        handleGesture('note_on', { velocity: 0.85, source: 'keyboard' });
        break;
      case 'm':
      case 'M':
        handleGesture('toggle_mute');
        break;
      case 'Escape':
        handleGesture('release');
        break;
      case '[':
        handleGesture('prev_scale');
        break;
      case ']':
        handleGesture('next_scale');
        break;
      default:
        break;
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      handleGesture('note_off');
    }
  });
}

function setBadge(kind, text, active) {
  const el = $(`${kind}-badge`);
  if (!el) return;
  el.textContent = text;
  el.classList.toggle('active', active);
}

function init() {
  render();
  bindUi();

  const wear = new WearableInput({
    onGesture: handleGesture,
    onBadge: setBadge,
  });
  wear.setupRing();
  wear.setupCane();

  document.body.addEventListener(
    'pointerdown',
    () => {
      audio.ensure();
    },
    { once: true }
  );
}

init();

export { state, currentKey, handleGesture, midiToLabel };
