import * as Tone from 'tone';

export const soundManager = {
    isInitialized: false, sounds: {},
    initialize: async () => {
        if (soundManager.isInitialized || (Tone.context && Tone.context.state === 'running')) return;
        await Tone.start();
        soundManager.sounds = {
            click: new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.1 } }).toDestination(),
            start: new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.1 } }).toDestination(),
            correct: new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.005, decay: 0.2, sustain: 0, release: 0.2 } }).toDestination(),
            tick: new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.1 } }).toDestination(),
            win: new Tone.PolySynth(Tone.Synth, { oscillator: { type: "pwm" }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.4 } }).toDestination(),
            error: new Tone.Synth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.1 } }).toDestination(),
            award: new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.4, sustain: 0.2, release: 0.4 } }).toDestination(),
        };
        soundManager.isInitialized = true;
    },
    playSound: (soundName, note, duration = '8n') => {
        if (!soundManager.isInitialized || !soundManager.sounds[soundName]) return;
        try {
            if (soundName === 'win') { const now = Tone.now(); soundManager.sounds.win.triggerAttackRelease(["C4", "E4", "G4"], "8n", now); soundManager.sounds.win.triggerAttackRelease(["G4", "C5"], "8n", now + 0.2); }
            else if (soundName === 'tick') { soundManager.sounds[soundName].triggerAttackRelease('C7', '32n'); }
            else if (soundName === 'award') { const now = Tone.now(); soundManager.sounds.award.triggerAttackRelease("C5", "4n", now); }
            else { soundManager.sounds[soundName].triggerAttackRelease(note, duration); }
        } catch (e) { console.error(`Could not play sound: ${soundName}`, e); }
    }
};