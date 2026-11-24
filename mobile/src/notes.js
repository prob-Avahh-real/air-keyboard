/** Note / scale helpers for air keyboard. */

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const SCALES = [
  { id: 'major', label: '大调', degrees: [0, 2, 4, 5, 7, 9, 11] },
  { id: 'pentatonic', label: '五声', degrees: [0, 2, 4, 7, 9] },
  { id: 'blues', label: '蓝调', degrees: [0, 3, 5, 6, 7, 10] },
  { id: 'chromatic', label: '半音', degrees: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
];

const ROOT_PC = 0; // C

/**
 * MIDI note number for A4 = 69 → 440 Hz.
 * @param {number} midi
 * @returns {number}
 */
export function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * @param {number} pitchClass 0–11
 * @param {number} octave
 * @returns {number} MIDI
 */
export function noteToMidi(pitchClass, octave) {
  return (octave + 1) * 12 + pitchClass;
}

/**
 * @param {number} midi
 * @returns {{ name: string, octave: number, pitchClass: number, sharp: boolean }}
 */
export function midiToLabel(midi) {
  const pitchClass = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const name = NOTE_NAMES[pitchClass];
  return { name, octave, pitchClass, sharp: name.includes('#') };
}

/**
 * Build playable keys for a scale at a given octave.
 * @param {{ degrees: number[] }} scale
 * @param {number} octave
 * @returns {{ midi: number, name: string, octave: number, sharp: boolean, degreeIndex: number }[]}
 */
export function buildKeys(scale, octave) {
  return scale.degrees.map((deg, i) => {
    const pitchClass = (ROOT_PC + deg) % 12;
    const midi = noteToMidi(pitchClass, octave);
    const label = midiToLabel(midi);
    return {
      midi,
      name: label.name,
      octave: label.octave,
      sharp: label.sharp,
      degreeIndex: i,
    };
  });
}

/**
 * @param {number} i
 * @param {number} n
 */
export function wrap(i, n) {
  return ((i % n) + n) % n;
}
