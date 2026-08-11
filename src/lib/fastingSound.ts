// Sound synthesizer using Web Audio API for fasting timer alert
export function playFastingCompletionSound(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    
    // Play a sequence of 4 warm, celebratory chime tones
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const duration = 0.35;

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.25);

      gain.gain.setValueAtTime(0, ctx.currentTime + index * 0.25);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + index * 0.25 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.25 + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + index * 0.25);
      osc.stop(ctx.currentTime + index * 0.25 + duration + 0.1);
    });

    // Repeat pattern once after 1.2s for clarity
    setTimeout(() => {
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.25);

        gain.gain.setValueAtTime(0, ctx.currentTime + index * 0.25);
        gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + index * 0.25 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.25 + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + index * 0.25);
        osc.stop(ctx.currentTime + index * 0.25 + duration + 0.1);
      });
    }, 1200);

  } catch (err) {
    console.error('Erro ao tocar alarme de áudio:', err);
  }
}

export async function requestFastingNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export function sendFastingCompletionNotification(hours: number): void {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('🎉 Jejum Concluído!', {
        body: `Parabéns! Você alcançou a sua meta de ${hours} horas de jejum. Pode abrir sua janela de alimentação.`,
        icon: '/favicon.ico',
        tag: 'fasting-complete',
      });
    } catch (e) {
      console.warn('Erro ao disparar notificação:', e);
    }
  }
}
