import React, { useState, useEffect } from 'react';
import { ViewTab, Note, Label, KanbanBoard, KanbanCard, User, FastingSession } from './types';
import {
  apiGetLabels,
  apiCreateLabel,
  apiDeleteLabel,
  apiGetNotes,
  apiCreateNote,
  apiUpdateNote,
  apiTogglePinNote,
  apiToggleArchiveNote,
  apiToggleTrashNote,
  apiGetBoards,
  apiGetBoardDetails,
  apiCreateBoard,
  apiDeleteBoard,
  apiCreateColumn,
  apiDeleteColumn,
  apiSaveCard,
  apiUpdateCard,
  apiMoveCard,
  apiDeleteCard,
  apiGetTrashItems,
  apiGetDocuments,
  apiGetMe,
  getServerUrl,
  isNativeApp,
} from './lib/api';
import { playFartSound } from './lib/fartSound';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { KeepNotes } from './components/KeepNotes';
import { NoteEditorModal } from './components/NoteEditorModal';
import { KanbanView } from './components/KanbanView';
import { KanbanCardModal } from './components/KanbanCardModal';
import { CalendarView } from './components/CalendarView';
import { PdfCenter } from './components/PdfCenter';
import { ArchiveTrashView } from './components/ArchiveTrashView';
import { LabelManagerModal } from './components/LabelManagerModal';
import { AuthModal } from './components/AuthModal';
import { AndroidAppView } from './components/AndroidAppView';
import { WorkoutView } from './components/WorkoutView';
import { VaultView } from './components/VaultView';
import { FastingView } from './components/FastingView';
import { FloatingFastingWidget } from './components/FloatingFastingWidget';
import { ServerSettingsModal } from './components/ServerSettingsModal';
import { AdminDashboard } from './components/AdminDashboard';
import { TasksView } from './components/TasksView';
import { WidgetsHubView } from './components/WidgetsHubView';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import {
  getStoredActiveSession,
  setStoredActiveSession,
  getStoredFastingHistory,
  setStoredFastingHistory,
  getStoredFloatingWidgetState,
  setStoredFloatingWidgetState,
} from './lib/fastingStore';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('notes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabelId, setSelectedLabelId] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('kb_dark_mode') === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // User Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('kb_auth_user');
      const token = localStorage.getItem('kb_auth_token');
      return saved && token ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(() => {
    const token = localStorage.getItem('kb_auth_token');
    const params = new URLSearchParams(window.location.search);
    if (params.get('shared_workout')) return false;
    // Only open auth modal if server url is already set (otherwise server modal is the first screen)
    return !token && Boolean(getServerUrl());
  });

  // Data states
  const [labels, setLabels] = useState<Label[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [activeBoard, setActiveBoard] = useState<KanbanBoard | null>(null);

  // Counts
  const [archiveCount, setArchiveCount] = useState(0);
  const [trashCount, setTrashCount] = useState(0);
  const [pdfCount, setPdfCount] = useState(0);

  // Modal states
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  const [editingCard, setEditingCard] = useState<Partial<KanbanCard> | null>(null);
  const [activeColumnIdForCard, setActiveColumnIdForCard] = useState<number | undefined>(undefined);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState(() => isNativeApp() && !getServerUrl());
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Fasting state
  const [activeFastingSession, setActiveFastingSession] = useState<FastingSession | null>(getStoredActiveSession);
  const [fastingHistory, setFastingHistory] = useState<FastingSession[]>(getStoredFastingHistory);
  const [showFloatingWidget, setShowFloatingWidget] = useState<boolean>(getStoredFloatingWidgetState);

  const [sharedWorkoutId] = useState<number | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sw = params.get('shared_workout');
      return sw ? Number(sw) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (sharedWorkoutId) {
      setCurrentTab('workouts');
    }
  }, [sharedWorkoutId]);

  // Polling for remote fart triggers from admin
  useEffect(() => {
    const interval = setInterval(async () => {
      const token = localStorage.getItem('kb_auth_token');
      if (!token) return;

      try {
        const serverUrl = getServerUrl();
        const serverKey = (window as any).__KB_SERVER_KEY__ || localStorage.getItem('kb_server_key') || '';
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        headers['Authorization'] = `Bearer ${token}`;
        if (serverKey) headers['x-server-key'] = serverKey;

        const res = await fetch(`${serverUrl}/api/fart/check`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.triggered) {
            playFartSound();
          }
        }
      } catch (err) {
        // Ignore network errors during polling
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleStartFasting = (targetHours: number, protocolName?: string, notes?: string) => {
    const newSession: FastingSession = {
      id: String(Date.now()),
      target_hours: targetHours,
      start_time: new Date().toISOString(),
      status: 'active',
      protocol_name: protocolName,
      water_ml: 0,
      notes,
    };
    setActiveFastingSession(newSession);
    setStoredActiveSession(newSession);
  };

  const handleEndFasting = () => {
    if (!activeFastingSession) return;
    const completedSession: FastingSession = {
      ...activeFastingSession,
      end_time: new Date().toISOString(),
      status: 'completed',
    };
    const updatedHistory = [completedSession, ...fastingHistory];
    setFastingHistory(updatedHistory);
    setStoredFastingHistory(updatedHistory);
    setActiveFastingSession(null);
    setStoredActiveSession(null);
  };

  const handleCancelFasting = () => {
    setActiveFastingSession(null);
    setStoredActiveSession(null);
  };

  const handleAddFastingWater = (ml: number) => {
    if (!activeFastingSession) return;
    const history = activeFastingSession.water_history || [];
    const currentTotal = activeFastingSession.water_ml || 0;
    const updated: FastingSession = {
      ...activeFastingSession,
      water_ml: currentTotal + ml,
      water_history: [...history, ml],
    };
    setActiveFastingSession(updated);
    setStoredActiveSession(updated);
  };

  const handleUndoFastingWater = () => {
    if (!activeFastingSession) return;
    const history = activeFastingSession.water_history || [];
    if (history.length === 0) return;
    const lastMl = history[history.length - 1];
    const newHistory = history.slice(0, history.length - 1);
    const currentTotal = activeFastingSession.water_ml || 0;
    const updated: FastingSession = {
      ...activeFastingSession,
      water_ml: Math.max(0, currentTotal - lastMl),
      water_history: newHistory,
    };
    setActiveFastingSession(updated);
    setStoredActiveSession(updated);
  };

  const handleUpdateWaterGoal = (goal: number) => {
    if (!activeFastingSession) return;
    const updated: FastingSession = {
      ...activeFastingSession,
      water_goal: goal,
    };
    setActiveFastingSession(updated);
    setStoredActiveSession(updated);
  };

  const handleDeleteFastingSession = (id: string) => {
    const updated = fastingHistory.filter((s) => s.id !== id);
    setFastingHistory(updated);
    setStoredFastingHistory(updated);
  };

  const handleToggleFloatingWidget = (show: boolean) => {
    setShowFloatingWidget(show);
    setStoredFloatingWidgetState(show);
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('kb_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('kb_dark_mode', 'false');
    }
  }, [darkMode]);

  useEffect(() => {
    checkCurrentUser();
    loadInitialData();
  }, [currentUser?.id]);

  const checkCurrentUser = async () => {
    const token = localStorage.getItem('kb_auth_token');
    const params = new URLSearchParams(window.location.search);
    const hasSharedWorkout = !!params.get('shared_workout');
    if (!token) {
      setCurrentUser(null);
      if (!hasSharedWorkout) {
        setIsAuthModalOpen(true);
      }
      return;
    }
    try {
      const user = await apiGetMe();
      setCurrentUser(user);
      localStorage.setItem('kb_auth_user', JSON.stringify(user));
    } catch (e) {
      setCurrentUser(null);
      localStorage.removeItem('kb_auth_token');
      localStorage.removeItem('kb_auth_user');
      if (!hasSharedWorkout) {
        setIsAuthModalOpen(true);
      }
    }
  };

  const loadInitialData = async () => {
    const token = localStorage.getItem('kb_auth_token');
    if (!token) {
      setLabels([]);
      setNotes([]);
      setBoards([]);
      setActiveBoard(null);
      return;
    }

    try {
      const [lbls, nts, bds, trashed, docs] = await Promise.all([
        apiGetLabels(),
        apiGetNotes(false, false),
        apiGetBoards(),
        apiGetTrashItems(),
        apiGetDocuments(),
      ]);

      setLabels(lbls);
      setNotes(nts);
      setBoards(bds);
      setTrashCount((trashed.notes ? trashed.notes.length : 0) + (trashed.cards ? trashed.cards.length : 0));
      setPdfCount(docs ? docs.length : 0);

      // Load archived count
      const archivedNotes = await apiGetNotes(true, false);
      setArchiveCount(archivedNotes.length);

      if (bds.length > 0) {
        const firstBoardDetails = await apiGetBoardDetails(bds[0].id);
        setActiveBoard(firstBoardDetails);
      } else {
        setActiveBoard(null);
      }
    } catch (err) {
      console.error('Erro ao carregar dados iniciais:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('kb_auth_token');
    localStorage.removeItem('kb_auth_user');
    setCurrentUser(null);
    setLabels([]);
    setNotes([]);
    setBoards([]);
    setActiveBoard(null);
    setIsAuthModalOpen(true);
  };

  const refreshNotes = async () => {
    try {
      const nts = await apiGetNotes(false, false, selectedLabelId || undefined);
      setNotes(nts);
      const archived = await apiGetNotes(true, false);
      setArchiveCount(archived.length);
    } catch (err) {
      console.error('Erro ao recarregar notas:', err);
    }
  };

  const refreshBoardDetails = async (boardId: number) => {
    try {
      const details = await apiGetBoardDetails(boardId);
      setActiveBoard(details);
    } catch (err) {
      console.error('Erro ao recarregar detalhes do quadro:', err);
    }
  };

  /* ================= LABELS ================= */
  const handleCreateLabel = async (name: string, color: string) => {
    const newLbl = await apiCreateLabel(name, color);
    setLabels([...labels, newLbl]);
  };

  const handleDeleteLabel = async (id: number) => {
    await apiDeleteLabel(id);
    setLabels(labels.filter((l) => l.id !== id));
    if (selectedLabelId === id) setSelectedLabelId(null);
    refreshNotes();
  };

  /* ================= NOTES ================= */
  const handleCreateNote = async (noteData: Partial<Note> & { labelIds?: number[] }) => {
    await apiCreateNote(noteData);
    refreshNotes();
  };

  const handleUpdateNote = async (id: number, updated: Partial<Note> & { labelIds?: number[] }) => {
    await apiUpdateNote(id, updated);
    refreshNotes();
  };

  const handleTogglePin = async (id: number) => {
    await apiTogglePinNote(id);
    refreshNotes();
  };

  const handleToggleArchive = async (id: number) => {
    await apiToggleArchiveNote(id);
    refreshNotes();
  };

  const handleToggleTrash = async (id: number) => {
    await apiToggleTrashNote(id);
    refreshNotes();
    const trashed = await apiGetTrashItems();
    setTrashCount((trashed.notes ? trashed.notes.length : 0) + (trashed.cards ? trashed.cards.length : 0));
  };

  /* ================= KANBAN BOARDS ================= */
  const handleSelectBoard = async (boardId: number) => {
    await refreshBoardDetails(boardId);
  };

  const handleCreateBoard = async (boardData: { title: string; description?: string; color?: string }) => {
    const newBoard = await apiCreateBoard(boardData);
    const updatedBoards = await apiGetBoards();
    setBoards(updatedBoards);
    await refreshBoardDetails(newBoard.id);
  };

  const handleDeleteBoard = async (id: number) => {
    await apiDeleteBoard(id);
    const updatedBoards = await apiGetBoards();
    setBoards(updatedBoards);
    if (updatedBoards.length > 0) {
      await refreshBoardDetails(updatedBoards[0].id);
    } else {
      setActiveBoard(null);
    }
  };

  const handleCreateColumn = async (boardId: number, title: string) => {
    await apiCreateColumn(boardId, title);
    await refreshBoardDetails(boardId);
  };

  const handleDeleteColumn = async (id: number) => {
    await apiDeleteColumn(id);
    if (activeBoard) await refreshBoardDetails(activeBoard.id);
  };

  const handleSaveCard = async (cardData: Partial<KanbanCard> & { labelIds?: number[] }) => {
    if (cardData.id) {
      await apiUpdateCard(cardData.id, cardData);
    } else {
      await apiSaveCard(cardData);
    }
    if (activeBoard) await refreshBoardDetails(activeBoard.id);
  };

  const handleMoveCard = async (cardId: number, targetColumnId: number, newPosition: number) => {
    await apiMoveCard(cardId, targetColumnId, newPosition);
    if (activeBoard) await refreshBoardDetails(activeBoard.id);
  };

  const handleDeleteCard = async (id: number) => {
    await apiDeleteCard(id);
    if (activeBoard) await refreshBoardDetails(activeBoard.id);
  };

  const handleOpenNoteModal = (note: Note | null) => {
    setEditingNote(note);
    setIsNoteModalOpen(true);
  };

  const handleOpenCardModal = (card: Partial<KanbanCard> | null, columnId?: number) => {
    setEditingCard(card);
    setActiveColumnIdForCard(columnId);
    setIsCardModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        isMobileOpen={isMobileOpen}
        onToggleMobileMenu={() => setIsMobileOpen(!isMobileOpen)}
        onOpenLabelManager={() => setIsLabelModalOpen(true)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenServerSettings={() => setIsServerModalOpen(true)}
        onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          labels={labels}
          selectedLabelId={selectedLabelId}
          onSelectLabel={(id) => {
            setSelectedLabelId(id);
            if (currentTab !== 'notes') setCurrentTab('notes');
          }}
          onOpenLabelManager={() => setIsLabelModalOpen(true)}
          isMobileOpen={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
          notesCount={notes.length}
          archiveCount={archiveCount}
          trashCount={trashCount}
          pdfCount={pdfCount}
          currentUser={currentUser}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {currentTab === 'admin' && <AdminDashboard currentUser={currentUser} />}

          {currentTab === 'notes' && (
            <KeepNotes
              notes={notes}
              labels={labels}
              searchQuery={searchQuery}
              selectedLabelId={selectedLabelId}
              onSelectLabel={setSelectedLabelId}
              onCreateNote={handleCreateNote}
              onUpdateNote={handleUpdateNote}
              onTogglePin={handleTogglePin}
              onToggleArchive={handleToggleArchive}
              onToggleTrash={handleToggleTrash}
              onOpenEditModal={(note) => handleOpenNoteModal(note)}
            />
          )}

          {currentTab === 'kanban' && (
            <KanbanView
              boards={boards}
              activeBoard={activeBoard}
              onSelectBoard={handleSelectBoard}
              onCreateBoard={handleCreateBoard}
              onDeleteBoard={handleDeleteBoard}
              onCreateColumn={handleCreateColumn}
              onDeleteColumn={handleDeleteColumn}
              onSaveCard={handleSaveCard}
              onMoveCard={handleMoveCard}
              onDeleteCard={handleDeleteCard}
              onOpenCardModal={handleOpenCardModal}
              allLabels={labels}
              searchQuery={searchQuery}
            />
          )}

          {currentTab === 'calendar' && <CalendarView />}

          {currentTab === 'tasks' && <TasksView />}

          {currentTab === 'widgets' && (
            <WidgetsHubView
              activeSession={activeFastingSession}
              onStartFasting={handleStartFasting}
              onEndFasting={handleEndFasting}
              onAddWater={handleAddFastingWater}
              onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
            />
          )}

          {currentTab === 'workouts' && <WorkoutView sharedWorkoutId={sharedWorkoutId} />}

          {currentTab === 'fasting' && (
            <FastingView
              sessions={fastingHistory}
              activeSession={activeFastingSession}
              onStartFasting={handleStartFasting}
              onEndFasting={handleEndFasting}
              onCancelFasting={handleCancelFasting}
              onAddWater={handleAddFastingWater}
              onUndoWater={handleUndoFastingWater}
              onUpdateWaterGoal={handleUpdateWaterGoal}
              onDeleteSession={handleDeleteFastingSession}
              showFloatingWidget={showFloatingWidget}
              onToggleFloatingWidget={handleToggleFloatingWidget}
            />
          )}

          {currentTab === 'vault' && <VaultView />}

          {currentTab === 'pdfs' && <PdfCenter />}

          {currentTab === 'android_app' && (
            <AndroidAppView
              currentUser={currentUser}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onOpenServerSettings={() => setIsServerModalOpen(true)}
            />
          )}

          {(currentTab === 'archive' || currentTab === 'trash') && (
            <ArchiveTrashView
              mode={currentTab}
              allLabels={labels}
              onOpenNoteEdit={handleOpenNoteModal}
              onRefreshCounts={loadInitialData}
            />
          )}
        </main>
      </div>

      {/* MODALS */}
      <AuthModal
        isOpen={isAuthModalOpen || !currentUser}
        onClose={() => {
          if (currentUser) setIsAuthModalOpen(false);
        }}
        currentUser={currentUser}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
          loadInitialData();
        }}
        onUpdateSuccess={(user) => {
          setCurrentUser(user);
        }}
        onLogout={handleLogout}
      />

      <NoteEditorModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        note={editingNote}
        onSave={async (noteData) => {
          if (noteData.id) {
            await handleUpdateNote(noteData.id, noteData);
          } else {
            await handleCreateNote(noteData);
          }
        }}
        allLabels={labels}
      />

      <KanbanCardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        card={editingCard}
        columnId={activeColumnIdForCard}
        boardId={activeBoard?.id}
        onSave={handleSaveCard}
        onDelete={handleDeleteCard}
        allLabels={labels}
      />

      <LabelManagerModal
        isOpen={isLabelModalOpen}
        onClose={() => setIsLabelModalOpen(false)}
        labels={labels}
        onCreateLabel={handleCreateLabel}
        onDeleteLabel={handleDeleteLabel}
      />

      <ServerSettingsModal
        isOpen={isServerModalOpen}
        onClose={() => {
          setIsServerModalOpen(false);
          const token = localStorage.getItem('kb_auth_token');
          if (!token) {
            setIsAuthModalOpen(true);
          }
        }}
        onConnected={() => {
          loadInitialData();
          setIsServerModalOpen(false);
          const token = localStorage.getItem('kb_auth_token');
          if (!token) {
            setIsAuthModalOpen(true);
          }
        }}
      />

      <NotificationSettingsModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />

      {showFloatingWidget && activeFastingSession && (
        <FloatingFastingWidget
          activeSession={activeFastingSession}
          onClose={() => handleToggleFloatingWidget(false)}
          onEndFasting={handleEndFasting}
          onAddWater={handleAddFastingWater}
        />
      )}
    </div>
  );
}
