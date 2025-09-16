
import React, { useState, useEffect, useCallback } from 'react';
import { CollaboratorRole, Tournament, User, Team, Player, Match, Group } from './types';
import TournamentList from './components/TournamentList';
import TournamentDashboard from './components/TournamentDashboard';
import { useTheme } from './hooks/useTheme';
import { supabase } from './utils/api';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

const AuthComponent: React.FC<{
  onLogin: (email: string, pass: string) => Promise<boolean>;
  onRegister: (email: string, pass: string) => Promise<boolean>;
}> = ({ onLogin, onRegister }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const success = isLoginView ? await onLogin(email, password) : await onRegister(email, password);
    if (!success) {
      setError(isLoginView ? 'Invalid email or password.' : 'Could not register user. The email might already be in use.');
    }
    setLoading(false);
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
          <button type="submit" disabled={loading} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition-colors !mt-8 disabled:opacity-50">
            {loading ? 'Processing...' : isLoginView ? 'Login' : 'Register'}
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
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [appLoading, setAppLoading] = useState(true);

  const [theme, toggleTheme] = useTheme();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            setCurrentUser(profile);
          } else if (session.user.email) {
            // Fallback to user data from session if profile is missing
            setCurrentUser({
              id: session.user.id,
              email: session.user.email,
            });
          } else {
            console.error("Authenticated user has no email and no profile.");
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
        setAppLoading(false);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const fetchUserTournaments = useCallback(async () => {
    if (!currentUser) return;
    
    // Using Supabase RPC to fetch all tournaments for the current user is the most efficient way.
    // As a fallback, let's fetch IDs first then the data.
    const { data: owned, error: ownedError } = await supabase.from('tournaments').select('id').eq('owner_id', currentUser.id);
    const { data: collab, error: collabError } = await supabase.from('tournament_collaborators').select('tournament_id').eq('user_id', currentUser.id);

    if (ownedError || collabError) {
      console.error("Error fetching tournament IDs", ownedError || collabError);
      return;
    }

    const tournamentIds = [...new Set([...(owned || []).map(t => t.id), ...(collab || []).map(c => c.tournament_id)])];
    
    if (tournamentIds.length === 0) {
      setTournaments([]);
      return;
    }

    const { data, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        groups(*),
        teams(*, players(*)),
        matches(*),
        collaborators:tournament_collaborators(*)
      `)
      .in('id', tournamentIds);

    if (error) {
      console.error("Error fetching full tournament data:", error);
    } else {
      const remappedData = data.map(t => ({
        ...t,
        ownerId: t.owner_id,
        inviteCode: t.invite_code,
        collaborators: t.collaborators.map((c: any) => ({ userId: c.user_id, role: c.role }))
      }))
      setTournaments(remappedData as any);
    }
  }, [currentUser]);

  const fetchAllUsers = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('id, email');
    if (error) console.error("Error fetching users:", error);
    else setUsers(data || []);
  }, []);

  useEffect(() => {
    if (session) {
      fetchUserTournaments();
      fetchAllUsers();
    } else {
      setTournaments([]);
      setUsers([]);
    }
  }, [session, fetchUserTournaments, fetchAllUsers]);

  // --- Auth Handlers ---
  const handleLogin = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    return !error;
  };

  const handleRegister = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password: pass,
    });
    return !error;
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSelectedTournamentId(null);
  }

  // --- Data Handlers ---
  const handleAddTournament = async (name: string) => {
    if (!currentUser) return;
    const inviteCode = crypto.randomUUID().slice(0, 8).toUpperCase();
    const { data, error } = await supabase
      .from('tournaments')
      .insert({
        name,
        owner_id: currentUser.id,
        invite_code: inviteCode,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding tournament:", error);
      alert('Could not create tournament.');
    } else {
      const newTournament: Tournament = {
          ...data,
          ownerId: data.owner_id,
          inviteCode: data.invite_code,
          groups: [], teams: [], matches: [], collaborators: []
      };
      setTournaments(prev => [...prev, newTournament]);
      setSelectedTournamentId(newTournament.id);
    }
  };

  const handleDeleteTournament = async (id: string) => {
    const tournamentToDelete = tournaments.find(t => t.id === id);
    if (tournamentToDelete?.ownerId !== currentUser?.id) {
        alert("You don't have permission to delete this tournament.");
        return;
    }
    const { error } = await supabase.from('tournaments').delete().match({ id });
    if (error) {
      alert("Error deleting tournament.");
    } else {
      setTournaments(prev => prev.filter((t) => t.id !== id));
      if (selectedTournamentId === id) {
          setSelectedTournamentId(null);
      }
    }
  };

  const handleJoinTournament = async (inviteCode: string) => {
    if (!currentUser) return;
    const { data: tournamentToJoin, error } = await supabase
      .from('tournaments')
      .select('id, owner_id, name, collaborators:tournament_collaborators(user_id)')
      .eq('invite_code', inviteCode)
      .single();
    
    if (error || !tournamentToJoin) {
      alert("Invalid invite code.");
      return;
    }
    if (tournamentToJoin.owner_id === currentUser.id || tournamentToJoin.collaborators.some((c: any) => c.user_id === currentUser.id)) {
      alert("You are already a member of this tournament.");
      return;
    }
    
    const { error: insertError } = await supabase.from('tournament_collaborators').insert({
        tournament_id: tournamentToJoin.id,
        user_id: currentUser.id,
        role: 'viewer'
    });
    
    if(insertError) {
      alert("Could not join tournament.");
    } else {
      alert(`Successfully joined "${tournamentToJoin.name}" as a viewer!`);
      fetchUserTournaments();
    }
  };
  
  const handleUpdateCollaboratorRole = async (tournamentId: string, userId: string, role: CollaboratorRole) => {
    const { error } = await supabase
      .from('tournament_collaborators')
      .update({ role })
      .match({ tournament_id: tournamentId, user_id: userId });
      
    if (error) alert("Could not update role.");
    else fetchUserTournaments(); // Refresh
  };
  
  const handleRemoveCollaborator = async (tournamentId: string, userId: string) => {
    const { error } = await supabase
      .from('tournament_collaborators')
      .delete()
      .match({ tournament_id: tournamentId, user_id: userId });
      
    if (error) alert("Could not remove user.");
    else fetchUserTournaments(); // Refresh
  };
  
  const handleUpdateTournament = (updatedTournament: Tournament) => {
    // This function will now be used for local optimistic updates,
    // after a successful DB operation.
    setTournaments(prev => prev.map(t => t.id === updatedTournament.id ? updatedTournament : t));
  };

  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId);

  const renderContent = () => {
    if (appLoading) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }
    
    if (!currentUser) {
      return <AuthComponent onLogin={handleLogin} onRegister={handleRegister} />;
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
        onLogout={handleLogout}
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
