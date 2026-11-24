const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const SCALES = [
  { id: 'major', label: '大调', degrees: [0, 2, 4, 5, 7, 9, 11] },
  { id: 'pentatonic', label: '五声', degrees: [0, 2, 4, 7, 9] },
  { id: 'blues', label: '蓝调', degrees: [0, 3, 5, 6, 7, 10] },
  { id: 'chromatic', label: '半音', degrees: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
];

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function noteToMidi(pitchClass, octave) {
  return (octave + 1) * 12 + pitchClass;
}

function wrap(i, n) {
  return ((i % n) + n) % n;
}

function buildKeys(scale, octave) {
  return scale.degrees.map((deg, i) => {
    const pitchClass = deg % 12;
    const midi = noteToMidi(pitchClass, octave);
    return {
      midi,
      name: NOTE_NAMES[pitchClass],
      octave,
      sharp: NOTE_NAMES[pitchClass].includes('#'),
      degreeIndex: i,
    };
  });
}

describe('air-keyboard notes', () => {
  it('major scale has 7 degrees', () => {
    assert.equal(SCALES[0].degrees.length, 7);
  });

  it('pentatonic has 5 keys', () => {
    assert.equal(buildKeys(SCALES[1], 4).length, 5);
  });

  it('C4 is MIDI 60', () => {
    assert.equal(noteToMidi(0, 4), 60);
  });

  it('A4 is 440 Hz', () => {
    assert.ok(Math.abs(midiToFreq(69) - 440) < 0.001);
  });

  it('wrap cycles key index', () => {
    assert.equal(wrap(-1, 7), 6);
    assert.equal(wrap(7, 7), 0);
  });
});

describe('project scaffold', () => {
  it('protocol file exists', () => {
    const p = path.join(__dirname, '..', '..', 'protocol', 'air-keyboard.json');
    assert.ok(fs.existsSync(p));
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    assert.equal(data.instrument, 'piano');
    assert.ok(data.gestures.ring);
    assert.ok(data.gestures.cane);
    assert.equal(data.scales.length, 4);
  });
});
