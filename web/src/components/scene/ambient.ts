// A soft generative pad + wind, so "Enter with sound" needs no audio files.
export class Ambient {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  start() {
    if (this.ctx) {
      this.fade(0.07);
      return;
    }
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    filter.connect(master);

    // Slow filter sweep keeps the pad breathing.
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.05;
    lfoGain.gain.value = 400;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();

    // D major add9 voicing, gently detuned.
    for (const [freq, detune] of [
      [146.83, -6],
      [220.0, 5],
      [293.66, -3],
      [329.63, 7],
    ]) {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq;
      osc.detune.value = detune;
      const g = ctx.createGain();
      g.gain.value = 0.18;
      osc.connect(g).connect(filter);
      osc.start();
    }

    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    noise.loop = true;
    const wind = ctx.createBiquadFilter();
    wind.type = "bandpass";
    wind.frequency.value = 500;
    wind.Q.value = 0.6;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.05;
    noise.connect(wind).connect(windGain).connect(master);
    noise.start();

    this.ctx = ctx;
    this.master = master;
    this.fade(0.07);
  }

  stop() {
    this.fade(0);
  }

  private fade(to: number) {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(to, now + 1.5);
  }
}

/**
 * Placeholder voice until the Bolna web call is wired in: speaks Ruko's greeting
 * with the browser's speech engine and reports a simulated loudness envelope.
 */
export function speakGreeting(onLevel: (level: number) => void, onEnd: () => void) {
  const synth = window.speechSynthesis;
  if (!synth) {
    onEnd();
    return () => {};
  }
  const text =
    "Namaste, main Ruko hoon. Kisi ne phone karke paise maange? Ghabraiye mat. Police kabhi phone pe arrest nahi karti. Mujhe bataiye, kya hua?";
  const utter = new SpeechSynthesisUtterance(text);
  const voices = synth.getVoices();
  utter.voice = voices.find((v) => v.lang === "hi-IN") ?? voices.find((v) => v.lang.startsWith("en-IN")) ?? null;
  utter.lang = utter.voice?.lang ?? "hi-IN";
  utter.rate = 0.95;

  let raf = 0;
  let speaking = false;
  const pulse = () => {
    const t = performance.now() / 1000;
    const syllables = Math.abs(Math.sin(t * 9.5)) * 0.6 + Math.abs(Math.sin(t * 3.1)) * 0.4;
    onLevel(speaking ? 0.25 + syllables * 0.6 : 0);
    raf = requestAnimationFrame(pulse);
  };
  utter.onstart = () => {
    speaking = true;
  };
  utter.onboundary = () => {
    speaking = true;
  };
  utter.onend = utter.onerror = () => {
    speaking = false;
    cancelAnimationFrame(raf);
    onLevel(0);
    onEnd();
  };
  synth.cancel();
  synth.speak(utter);
  raf = requestAnimationFrame(pulse);
  return () => {
    synth.cancel();
  };
}
