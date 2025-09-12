
import React, { useState } from 'react';
import { CollaboratorRole, Tournament, User } from './types';
import TournamentList from './components/TournamentList';
import TournamentDashboard from './components/TournamentDashboard';
import { useTheme } from './hooks/useTheme';
import useLocalStorage from './hooks/useLocalStorage';
import { dummyTournaments } from './utils/dummyData';
import { useAuth } from './hooks/useCurrentUser';

const AuthComponent: React.FC<{
  onLogin: (email: string, pass: string) => boolean;
  onRegister: (email: string, pass: string) => boolean;
}> = ({ onLogin, onRegister }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = isLoginView ? onLogin(email, password) : onRegister(email, password);
    if (!success && isLoginView) {
      setError('Invalid email or password.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8">
        <h2 className="text-3xl font-bold text-center text-cyan-600 dark:text-cyan-400 mb-2">{isLoginView ? 'Welcome Back' : 'Create Account'}</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">{isLoginView ? 'Sign in to continue' : 'Get started with your tournament'}</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-slate-200 p-3 rounded border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            className="w-full bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-slate-200 p-3 rounded border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition-colors !mt-8">
            {isLoginView ? 'Login' : 'Register'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          {isLoginView ? "Don't have an account?" : "Already have an account?"}
          <button onClick={() => { setIsLoginView(!isLoginView); setError(''); }} className="font-semibold text-cyan-600 dark:text-cyan-400 hover:underline ml-1">
            {isLoginView ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [tournaments, setTournaments] = useLocalStorage<Tournament[]>('carrom-tournaments', dummyTournaments);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [theme, toggleTheme] = useTheme();
  const { currentUser, users, login, register, logout } = useAuth();

  const handleAddTournament = (name: string) => {
    if(!currentUser) return;
    const newTournament: Tournament = {
      id: crypto.randomUUID(),
      name,
      stage: 'league',
      groups: [],
      teams: [],
      matches: [],
      ownerId: currentUser.id,
      inviteCode: crypto.randomUUID().slice(0, 8).toUpperCase(),
      collaborators: [],
    };
    setTournaments(prev => [...prev, newTournament]);
    setSelectedTournamentId(newTournament.id);
  };

  const handleDeleteTournament = (id: string) => {
    const tournamentToDelete = tournaments.find(t => t.id === id);
    if (tournamentToDelete?.ownerId !== currentUser?.id) {
        alert("You don't have permission to delete this tournament.");
        return;
    }
    setTournaments(prev => prev.filter((t) => t.id !== id));
    if (selectedTournamentId === id) {
        setSelectedTournamentId(null);
    }
  };

  const handleJoinTournament = (inviteCode: string) => {
    if (!currentUser) return;
    const tournamentToJoin = tournaments.find(t => t.inviteCode === inviteCode);
    if (!tournamentToJoin) {
      alert("Invalid invite code.");
      return;
    }
    if (tournamentToJoin.ownerId === currentUser.id || tournamentToJoin.collaborators.some(c => c.userId === currentUser.id)) {
      alert("You are already a member of this tournament.");
      return;
    }
    setTournaments(prev => prev.map(t => 
      t.id === tournamentToJoin.id 
      ? { ...t, collaborators: [...t.collaborators, { userId: currentUser.id, role: 'viewer' }] }
      : t
    ));
    alert(`Successfully joined "${tournamentToJoin.name}" as a viewer!`);
  };

  const handleUpdateCollaboratorRole = (tournamentId: string, userId: string, role: CollaboratorRole) => {
    setTournaments(prev => prev.map(t => {
      if (t.id === tournamentId) {
        return {
          ...t,
          collaborators: t.collaborators.map(c => c.userId === userId ? { ...c, role } : c)
        }
      }
      return t;
    }));
  };
  
  const handleRemoveCollaborator = (tournamentId: string, userId: string) => {
     setTournaments(prev => prev.map(t => {
      if (t.id === tournamentId) {
        return {
          ...t,
          collaborators: t.collaborators.filter(c => c.userId !== userId)
        }
      }
      return t;
    }));
  };


  const handleUpdateTournament = (updatedTournament: Tournament) => {
    setTournaments(prev => prev.map(t => t.id === updatedTournament.id ? updatedTournament : t));
  };
  
  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId);

  const renderContent = () => {
    if (!currentUser) {
      return <AuthComponent onLogin={login} onRegister={register} />;
    }

    if (selectedTournamentId && selectedTournament) {
      return (
        <TournamentDashboard 
          key={selectedTournamentId}
          tournament={selectedTournament}
          onUpdateTournament={handleUpdateTournament}
          onBack={() => setSelectedTournamentId(null)}
          currentUser={currentUser}
          users={users}
          onUpdateCollaboratorRole={handleUpdateCollaboratorRole}
          onRemoveCollaborator={handleRemoveCollaborator}
        />
      );
    }
    return (
      <TournamentList 
        tournaments={tournaments}
        currentUser={currentUser}
        onSelectTournament={setSelectedTournamentId}
        onAddTournament={handleAddTournament}
        onDeleteTournament={handleDeleteTournament}
        onJoinTournament={handleJoinTournament}
        onLogout={logout}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">
      <main className="max-w-7xl mx-auto p-2 sm:p-4">
        {renderContent()}
      </main>
      <button
        onClick={toggleTheme}
        className="fixed bottom-5 right-5 z-40 bg-white dark:bg-slate-700 p-3 rounded-full shadow-lg text-cyan-500 dark:text-amber-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 dark:focus:ring-amber-300 dark:ring-offset-slate-900 transition-all duration-300 transform hover:scale-110"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
        )}
      </button>
    </div>
  );
};

export default App;
