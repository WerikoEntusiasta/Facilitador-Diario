export function playFartSound(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    
    // Create a funny modulated fart sound using oscillator + noise + lowpass filter
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.15);
    osc.frequency.setValueAtTime(80, now + 0.18);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.45);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.linearRampToValueAtTime(800, now + 0.1);
    filter.frequency.exponentialRampToValueAtTime(150, now + 0.45);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1.0, now + 0.02);
    gain.gain.setValueAtTime(1.0, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);

    // Add a second tiny toot for comedic effect
    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        const now2 = ctx.currentTime;
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(90, now2);
        osc2.frequency.exponentialRampToValueAtTime(45, now2 + 0.2);
        gain2.gain.setValueAtTime(0, now2);
        gain2.gain.linearRampToValueAtTime(0.5, now2 + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.25);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now2);
        osc2.stop(now2 + 0.3);
      } catch (e) {}
    }, 350);

  } catch (err) {
    console.error('Erro ao tocar som de peido:', err);
  }
}
