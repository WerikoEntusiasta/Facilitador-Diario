import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Database,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  Activity,
  Lock,
  UserCheck,
  UserX,
  Shield,
  Search,
  Wind,
} from 'lucide-react';
import { User } from '../types';
import { getServerUrl, getServerKey } from '../lib/api';

interface AdminDashboardProps {
  currentUser: User | null;
}

interface AdminStats {
  totalUsers: number;
  totalNotes: number;
  totalWorkouts: number;
  totalVault: number;
  totalPdfs: number;
  serverTime: string;
  uptime: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const serverUrl = getServerUrl();
      const serverKey = getServerKey();
      const token = localStorage.getItem('kb_auth_token') || localStorage.getItem('kb_token');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      if (serverKey) {
        headers['x-server-key'] = serverKey;
      }

      const [statsRes, usersRes] = await Promise.all([
        fetch(`${serverUrl}/api/admin/stats`, { headers }),
        fetch(`${serverUrl}/api/admin/users`, { headers }),
      ]);

      if (!statsRes.ok || !usersRes.ok) {
        const errJson = await statsRes.json().catch(() => ({ error: 'Falha ao carregar painel admin' }));
        throw new Error(errJson.error || 'Acesso negado ou erro no servidor');
      }

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();

      setStats(statsData);
      setUsers(usersData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados administrativos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.is_admin === 1) {
      fetchAdminData();
    }
  }, [currentUser]);

  const handleToggleAdmin = async (targetId: number, currentAdminVal?: number) => {
    const newVal = currentAdminVal === 1 ? 0 : 1;
    if (!confirm(`Deseja realmente ${newVal === 1 ? 'promover a Administrador' : 'remover privilégios de Admin'} deste usuário?`)) {
      return;
    }

    try {
      const serverUrl = getServerUrl();
      const serverKey = getServerKey();
      const token = localStorage.getItem('kb_auth_token') || localStorage.getItem('kb_token');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (serverKey) headers['x-server-key'] = serverKey;

      const res = await fetch(`${serverUrl}/api/admin/users/${targetId}/admin`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ is_admin: newVal }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao atualizar privilégios');
      }

      const updatedUser = await res.json();
      setUsers(users.map((u) => (u.id === targetId ? updatedUser : u)));
      setSuccessMsg('Privilégios atualizados com sucesso!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (targetId: number, name: string) => {
    if (!confirm(`ATENÇÃO: Deseja excluir permanentemente a conta de "${name}" e todos os seus dados? Esta ação é irreversível.`)) {
      return;
    }

    try {
      const serverUrl = getServerUrl();
      const serverKey = getServerKey();
      const token = localStorage.getItem('kb_auth_token') || localStorage.getItem('kb_token');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (serverKey) headers['x-server-key'] = serverKey;

      const res = await fetch(`${serverUrl}/api/admin/users/${targetId}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao excluir usuário');
      }

      setUsers(users.filter((u) => u.id !== targetId));
      setSuccessMsg('Usuário excluído com sucesso.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleTriggerFart = async (targetId: number, name: string) => {
    try {
      const serverUrl = getServerUrl();
      const serverKey = getServerKey();
      const token = localStorage.getItem('kb_auth_token') || localStorage.getItem('kb_token');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (serverKey) headers['x-server-key'] = serverKey;

      const res = await fetch(`${serverUrl}/api/admin/users/${targetId}/fart`, {
        method: 'POST',
        headers,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao disparar peido');
      }

      setSuccessMsg(`💨 Peido disparado com sucesso para ${name}! O celular do usuário tocará em instantes.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (currentUser?.is_admin !== 1) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-red-200 dark:border-red-900/50 max-w-md text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/60 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400 mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Acesso Restrito</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Esta seção é exclusiva para administradores da plataforma KeepFlow. Sua conta atual não possui permissões de Administrador Master.
          </p>
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px] font-mono text-slate-500">
            Conta padrão de teste Admin: <strong className="text-blue-600 dark:text-blue-400">admin@keepflow.com</strong> (Senha: <span className="text-amber-600">admin123456</span>)
          </div>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Painel de Administração Master
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                Admin
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Gerencie usuários, visualize estatísticas do servidor e controle a segurança da plataforma.
            </p>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-500/20 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Dados
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-2xl text-xs flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Usuários', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500 bg-blue-500/10' },
          { label: 'Notas', value: stats?.totalNotes || 0, icon: Database, color: 'text-indigo-500 bg-indigo-500/10' },
          { label: 'Treinos', value: stats?.totalWorkouts || 0, icon: Activity, color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Cofre', value: stats?.totalVault || 0, icon: Lock, color: 'text-purple-500 bg-purple-500/10' },
          { label: 'PDFs', value: stats?.totalPdfs || 0, icon: Server, color: 'text-amber-500 bg-amber-500/10' },
          { label: 'Uptime', value: `${Math.floor((stats?.uptime || 0) / 60)} min`, icon: RefreshCw, color: 'text-cyan-500 bg-cyan-500/10' },
        ].map((item, idx) => {
          const IconComp = item.icon;
          return (
            <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{item.label}</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.color}`}>
                  <IconComp className="w-4 h-4" />
                </div>
              </div>
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                {item.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Users Management Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Gerenciamento de Usuários ({users.length})</h2>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-4">E-mail</th>
                <th className="py-3 px-4">Função / Status</th>
                <th className="py-3 px-4">Cadastro</th>
                <th className="py-3 px-4 text-right">Ações Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredUsers.map((u) => {
                const isAdmin = u.is_admin === 1;
                const isMe = u.id === currentUser?.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 flex items-center gap-3">
                      <img
                        src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={u.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{u.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {u.id} {isMe && '(Você)'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {u.email}
                    </td>

                    <td className="py-3.5 px-4">
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          <Shield className="w-3 h-3" /> Administrador Master
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          <UserCheck className="w-3 h-3" /> Usuário Comum
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleTriggerFart(u.id, u.name)}
                        className="px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl text-xs font-semibold hover:bg-amber-500/20 transition inline-flex items-center gap-1"
                        title="Disparar som de peido no celular do usuário"
                      >
                        <Wind className="w-3.5 h-3.5" /> Disparar Peido
                      </button>

                      <button
                        onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition inline-flex items-center gap-1 ${
                          isAdmin
                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                            : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                        }`}
                      >
                        {isAdmin ? 'Remover Admin' : 'Tornar Admin'}
                      </button>

                      {!isMe && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="px-3 py-1.5 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-xl text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/50 transition inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Excluir
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
