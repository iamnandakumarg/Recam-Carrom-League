import React, { useState, useEffect } from 'react';
import { Tournament } from './types';
import TournamentList from './components/TournamentList';
import TournamentDashboard from './components/TournamentDashboard';
import { useTheme } from './hooks/useTheme';
import useCurrentUser from './hooks/useCurrentUser';
import { api } from './utils/api';

const App: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [theme, toggleTheme] = useTheme();
  const currentUser = useCurrentUser();
  
  const fetchTournaments = async () => {
    try {
      setIsLoading(true);
      const data = await api.getTournaments();
      setTournaments(data);
      setError(null);
    } catch (err) {
      setError('Failed to load tournaments.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, [currentUser.id]);


  const handleAddTournament = async (name: string, adminName: string, adminEmail: string) => {
    try {
      const newTournament = await api.addTournament(name, adminName, adminEmail);
      setTournaments(prev => [...prev, newTournament]);
      setSelectedTournamentId(newTournament.id);
    } catch (err) {
      alert('Failed to create tournament.');
      console.error(err);
    }
  };

  const handleDeleteTournament = async (id: string) => {
    try {
      await api.deleteTournament(id);
      setTournaments(prev => prev.filter((t) => t.id !== id));
    } catch (err) {
       alert('Failed to delete tournament.');
       console.error(err);
    }
  };
  
  const handleJoinTournament = async (inviteCode: string, name: string, email: string): Promise<boolean> => {
    try {
        const joinedTournament = await api.joinTournament(inviteCode, name, email);
        // Add to list if not already present (could happen with multiple browser tabs)
        setTournaments(prev => {
            if (prev.some(t => t.id === joinedTournament.id)) {
                return prev.map(t => t.id === joinedTournament.id ? joinedTournament : t);
            }
            return [...prev, joinedTournament];
        });
        setSelectedTournamentId(joinedTournament.id);
        return true;
    } catch (err: any) {
        alert(err.message || "Failed to join tournament.");
        console.error(err);
        return false;
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center p-10">Loading...</div>;
    }
    if (error) {
      return <div className="text-center p-10 text-red-500">{error}</div>;
    }
    if (selectedTournamentId) {
      return (
        <TournamentDashboard 
          key={selectedTournamentId} // Add key to force re-mount on change
          tournamentId={selectedTournamentId}
          onBack={() => setSelectedTournamentId(null)}
          currentUserId={currentUser.id}
        />
      );
    }
    return (
      <TournamentList 
        tournaments={tournaments}
        onSelectTournament={setSelectedTournamentId}
        onAddTournament={handleAddTournament}
        onDeleteTournament={handleDeleteTournament}
        onJoinTournament={handleJoinTournament}
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
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
        )}
      </button>
    </div>
  );
};

export default App;
