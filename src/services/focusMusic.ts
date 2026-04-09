/**
 * Eclipse Valhalla — Focus Ambient Music
 * Generates procedural ambient sounds using Web Audio API
 */

let _ctx: AudioContext | null = null;
let _nodes: AudioNode[] = [];
let _playing = false;

export function isPlaying(): boolean { return _playing; }

export function startAmbient(): void {
  if (_playing) return;
  try {
    _ctx = new AudioContext();

    // Deep drone
    const drone = _ctx.createOscillator();
    const droneGain = _ctx.createGain();
    drone.type = 'sine';
    drone.frequency.value = 60;
    droneGain.gain.value = 0.06;
    drone.connect(droneGain);
    droneGain.connect(_ctx.destination);
    drone.start();
    _nodes.push(drone, droneGain);

    // Soft pad
    const pad = _ctx.createOscillator();
    const padGain = _ctx.createGain();
    pad.type = 'triangle';
    pad.frequency.value = 220;
    padGain.gain.value = 0.02;
    pad.connect(padGain);
    padGain.connect(_ctx.destination);
    pad.start();
    _nodes.push(pad, padGain);

    // Noise texture (rain-like)
    const bufferSize = _ctx.sampleRate * 2;
    const noiseBuffer = _ctx.createBuffer(1, bufferSize, _ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;

    const noise = _ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const noiseFilter = _ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 400;

    const noiseGain = _ctx.createGain();
    noiseGain.gain.value = 0.015;

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(_ctx.destination);
    noise.start();
    _nodes.push(noise, noiseFilter, noiseGain);

    _playing = true;
  } catch {}
}

export function stopAmbient(): void {
  _playing = false;
  _nodes.forEach(n => { try { (n as any).stop?.(); (n as any).disconnect?.(); } catch {} });
  _nodes = [];
  _ctx?.close().catch(() => {});
  _ctx = null;
}

export function toggleAmbient(): boolean {
  if (_playing) { stopAmbient(); return false; }
  startAmbient(); return true;
}
