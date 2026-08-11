import { NotificationSettings, NotificationSound } from '../types';

export const SOUND_OPTIONS: { id: NotificationSound; label: string; desc: string }[] = [
  { id: 'classic_beep', label: '1. Alarme Clássico (Beep)', desc: 'Tom limpo e direto' },
  { id: 'tibetan_bowl', label: '2. Sino Zen (Tibetano)', desc: 'Harmônica relaxante e profunda' },
  { id: 'digital_harp', label: '3. Harpa Digital', desc: 'Arpejo cintilante de notas suaves' },
  { id: 'crystal_chime', label: '4. Caminho de Cristal', desc: 'Frequência aguda e cristalina' },
  { id: 'soft_gong', label: '5. Gongo Suave', desc: 'Ondas graves e reverberantes' },
  { id: 'radar_alert', label: '6. Alerta Radar', desc: 'Bip repetitivo de alta atenção' },
  { id: 'futuristic_ping', label: '7. Mensagem Futurista', desc: 'Som eletrônico Sci-Fi' },
  { id: 'bubble_pop', label: '8. Som de Bolha', desc: 'Pop divertido e leve' },
  { id: 'aircraft_beep', label: '9. Aviso de Aeronave', desc: 'Alerta pulsante duplo' },
  { id: 'astral_melody', label: '10. Melodia Astral', desc: 'Acorde espacial harmonioso' },
];

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  notifyFasting: true,
  fastingPriority: 'alta',
  notifyWorkout: true,
  workoutPriority: 'media',
  notifyTasks: true,
  tasksPriority: 'alta',
  notifyCalendar: true,
  calendarPriority: 'urgente',
  soundEnabled: true,
  selectedSound: 'tibetan_bowl',
  bypassDND: true,
  alertVolume: 80,
};

export const getStoredNotificationSettings = (): NotificationSettings => {
  try {
    const saved = localStorage.getItem('kb_notification_settings');
    if (saved) {
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {}
  return DEFAULT_NOTIFICATION_SETTINGS;
};

export const setStoredNotificationSettings = (settings: NotificationSettings) => {
  try {
    localStorage.setItem('kb_notification_settings', JSON.stringify(settings));
  } catch (e) {}
};

export const playNotificationAlertSound = (sound: NotificationSound = 'tibetan_bowl', volume: number = 80, bypassDND: boolean = false) => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const vol = (Math.min(Math.max(volume, 0), 100) / 100) * (bypassDND ? 1.0 : 0.7);

    const now = ctx.currentTime;

    switch (sound) {
      case 'classic_beep': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(vol * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }
      case 'tibetan_bowl': {
        [220, 440, 660].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime((vol * 0.4) / (idx + 1), now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 1.2);
        });
        break;
      }
      case 'digital_harp': {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(vol * 0.3, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.4);
        });
        break;
      }
      case 'crystal_chime': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1760, now);
        osc.frequency.exponentialRampToValueAtTime(3520, now + 0.4);
        gain.gain.setValueAtTime(vol * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
        break;
      }
      case 'soft_gong': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 1.5);
        gain.gain.setValueAtTime(vol * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.5);
        break;
      }
      case 'radar_alert': {
        [0, 0.2, 0.4].forEach((timeOffset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(1200, now + timeOffset);
          gain.gain.setValueAtTime(vol * 0.3, now + timeOffset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + timeOffset);
          osc.stop(now + timeOffset + 0.15);
        });
        break;
      }
      case 'futuristic_ping': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1500, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.3);
        gain.gain.setValueAtTime(vol * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }
      case 'bubble_pop': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.15);
        gain.gain.setValueAtTime(vol * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
      case 'aircraft_beep': {
        [0, 0.25].forEach((timeOffset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(950, now + timeOffset);
          gain.gain.setValueAtTime(vol * 0.35, now + timeOffset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + timeOffset);
          osc.stop(now + timeOffset + 0.18);
        });
        break;
      }
      case 'astral_melody': {
        [440, 554.37, 659.25, 880].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          gain.gain.setValueAtTime(vol * 0.35, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.5);
        });
        break;
      }
    }
  } catch (e) {}
};
