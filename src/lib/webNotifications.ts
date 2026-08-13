// Native Web Notifications & Reminders Manager
// Handles browser permissions, local note/task reminders, and daily productivity digest.

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }
  return false;
}

export function sendLocalNotification(title: string, options?: NotificationOptions): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'keepboard_notif',
        ...options,
      });
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (e) {
      console.warn('Erro ao disparar notificação:', e);
    }
  }
}

export function startNotificationScheduler(
  getNotes: () => any[],
  getCards: () => any[]
): () => void {
  const checkReminders = () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const now = new Date();
    const nowMs = now.getTime();

    // 1. Check Note Reminders
    const notes = getNotes() || [];
    notes.forEach((note) => {
      if (note.reminder_date) {
        const remMs = new Date(note.reminder_date).getTime();
        // Trigger if within 1 minute window
        if (Math.abs(remMs - nowMs) <= 60000) {
          const notifiedKey = `notified_note_${note.id}_${remMs}`;
          if (!localStorage.getItem(notifiedKey)) {
            localStorage.setItem(notifiedKey, '1');
            sendLocalNotification(`🔔 Lembrete: ${note.title || 'Nota Sem Título'}`, {
              body: note.content ? note.content.substring(0, 100) : 'Sua nota agendada está pronta.',
            });
          }
        }
      }
    });

    // 2. Check Card Due Dates
    const cards = getCards() || [];
    cards.forEach((card) => {
      if (card.due_date) {
        const dueMs = new Date(card.due_date).getTime();
        if (Math.abs(dueMs - nowMs) <= 60000) {
          const notifiedKey = `notified_card_${card.id}_${dueMs}`;
          if (!localStorage.getItem(notifiedKey)) {
            localStorage.setItem(notifiedKey, '1');
            sendLocalNotification(`⏱️ Prazo do Cartão: ${card.title}`, {
              body: card.description ? card.description.substring(0, 100) : 'O prazo da sua tarefa chegou.',
            });
          }
        }
      }
    });

    // 3. Daily Morning Productivity Digest at 8:00 AM
    if (now.getHours() === 8 && now.getMinutes() === 0) {
      const todayStr = now.toISOString().split('T')[0];
      const digestKey = `daily_digest_${todayStr}`;
      if (!localStorage.getItem(digestKey)) {
        localStorage.setItem(digestKey, '1');
        const totalNotes = notes.filter((n) => !n.is_trashed).length;
        const totalCards = cards.length;
        sendLocalNotification('☀️ Bom dia! Resumo do KeepBoard', {
          body: `Você possui ${totalCards} tarefa(s) pendente(s) e ${totalNotes} nota(s) salvas para hoje. Tenha um excelente dia!`,
        });
      }
    }
  };

  const timer = setInterval(checkReminders, 30000); // Check every 30 seconds
  return () => clearInterval(timer);
}
