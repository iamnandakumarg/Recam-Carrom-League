import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Tournament, Team, Player, Match, View, Group, Permissions, User } from '../types';
import TeamsManager from './TeamsManager';
import MatchesManager from './MatchesManager';
import PointsTable from './PointsTable';
import SuperStrikerPage from './SuperStrikerPage';
import UsersManager from './UsersManager';
import PlayoffsManager from './PlayoffsManager';
import ConfirmationModal from './ConfirmationModal';
import { api } from '../utils/api';

interface TournamentDashboardProps {
  tournamentId: string;
  onBack: () => void;
  currentUserId: string;
}

const teamColors = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899'
];

const TournamentDashboard: React.FC<TournamentDashboardProps> = ({ tournamentId, onBack, currentUserId }) => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>(View.TABLE);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  
  const refreshTournamentData = useCallback(async () => {
    try {
        setIsLoading(true);
        const data = await api.getTournament(tournamentId);
        if (data) {
            setTournament(data);
            if (data.stage === 'playoffs' && activeView !== View.PLAYOFFS) {
                setActiveView(View.PLAYOFFS);
            }
        } else {
            setError('Tournament not found.');
        }
    } catch (err) {
        setError('Failed to load tournament data.');
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [tournamentId, activeView]);

  useEffect(() => {
      refreshTournamentData();
  }, [refreshTournamentData]);


  const isCurrentUserAdmin = tournament?.adminId === currentUserId;

  const userPermissions: Permissions = useMemo(() => {
    if (!tournament) return { canEditTeams: false, canEditMatches: false, canFinalizeResults: false };
    return tournament.permissions[currentUserId] || {
      canEditTeams: false,
      canEditMatches: false,
      canFinalizeResults: false,
    };
  }, [tournament, currentUserId]);

  const currentUser: User | undefined = useMemo(() => {
      return tournament?.users.find(u => u.id === currentUserId);
  }, [tournament?.users, currentUserId]);
  
  const handleApiCall = async (apiCall: Promise<Tournament | void>, successMessage?: string, errorMessage?: string) => {
      try {
          const result = await apiCall;
          // If the api call returns the updated tournament, set it directly.
          // This is more performant and prevents the page from jumping to the top.
          if (result) {
              setTournament(result);
          } else {
              // Otherwise, do a full refresh. This is a fallback for operations
              // that might not return the updated state.
              await refreshTournamentData();
          }
          
          if (successMessage) console.log(successMessage);
      } catch (err) {
          console.error(err);
          alert(errorMessage || 'An error occurred.');
      }
  };

  const onUpdateTournament = (id: string, updater: (current: Tournament) => Tournament) => {
      handleApiCall(api.updateTournament(id, updater));
  }
  
  // --- Handlers ---
  const handleAddTeam = (teamName: string, color: string, groupId: string, playerNames: string[], logo: string | null) => {
    if (!userPermissions.canEditTeams) return;
    handleApiCall(api.updateTournament(tournamentId, t => {
        const newPlayers = playerNames.map(name => ({ id: crypto.randomUUID(), name, score: 0, coins: 0, queens: 0, matchesPlayed: 0 }));
        const newTeam: Team = { id: crypto.randomUUID(), name: teamName, color, logo: logo || undefined, groupId, players: newPlayers, matchesPlayed: 0, wins: 0, losses: 0, points: 0, pointsScored: 0, pointsConceded: 0, recentForm: [] };
        t.teams.push(newTeam);
        return t;
    }));
  };
  
   const handleAddTeamsBatch = (teamsData: Array<{ groupName: string, teamName: string, playerNames: string[] }>) => {
    if (!userPermissions.canEditTeams) return;
    handleApiCall(api.updateTournament(tournamentId, t => {
      const existingGroupNames = new Map(t.groups.map(g => [g.name.toLowerCase(), g.id]));
      teamsData.forEach(({ groupName, teamName, playerNames }) => {
          let groupId = existingGroupNames.get(groupName.toLowerCase());
          if (!groupId) {
              const newGroup = { id: crypto.randomUUID(), name: groupName };
              t.groups.push(newGroup);
              groupId = newGroup.id;
              existingGroupNames.set(groupName.toLowerCase(), groupId);
          }
          const newPlayers = playerNames.map(name => ({ id: crypto.randomUUID(), name, score: 0, coins: 0, queens: 0, matchesPlayed: 0 }));
          const color = teamColors[t.teams.length % teamColors.length];
          const newTeam: Team = { id: crypto.randomUUID(), name: teamName, color, groupId, players: newPlayers, matchesPlayed: 0, wins: 0, losses: 0, points: 0, pointsScored: 0, pointsConceded: 0, recentForm: [] };
          t.teams.push(newTeam);
      });
      return t;
    }));
  };

  const handleDeleteTeam = (teamId: string) => {
    if (!userPermissions.canEditTeams) return;
    setConfirmState({
      isOpen: true, title: 'Delete Team',
      message: 'Are you sure you want to delete this team? All associated matches will also be removed.',
      onConfirm: () => handleApiCall(api.deleteTeam(tournamentId, teamId))
    });
  };
  
    const handleEditTeam = (teamId: string, updates: { name: string; color: string; logo: string | null | undefined; groupId: string; players: Player[]; }) => {
    if (!userPermissions.canEditTeams) return;
    handleApiCall(api.updateTournament(tournamentId, t => {
        const teamIndex = t.teams.findIndex(team => team.id === teamId);
        if(teamIndex > -1) {
            t.teams[teamIndex] = { ...t.teams[teamIndex], ...updates, logo: updates.logo || undefined };
        }
        return t;
    }));
  };
  
   const handleAddPlayer = (teamId: string, playerName: string) => {
    if (!userPermissions.canEditTeams) return;
    handleApiCall(api.updateTournament(tournamentId, t => {
        const team = t.teams.find(team => team.id === teamId);
        if (team) team.players.push({ id: crypto.randomUUID(), name: playerName, score: 0, coins: 0, queens: 0, matchesPlayed: 0 });
        return t;
    }));
  };
  
    const handleDeletePlayer = (teamId: string, playerId: string) => {
    if (!userPermissions.canEditTeams) return;
    setConfirmState({
      isOpen: true, title: 'Delete Player',
      message: 'Are you sure you want to remove this player?',
      onConfirm: () => handleApiCall(api.updateTournament(tournamentId, t => {
          const team = t.teams.find(team => team.id === teamId);
          if (team) team.players = team.players.filter(p => p.id !== playerId);
          return t;
      }))
    });
  };

  const handleAddGroup = (groupName: string) => {
    if (!userPermissions.canEditTeams) return;
    handleApiCall(api.updateTournament(tournamentId, t => {
        t.groups.push({ id: crypto.randomUUID(), name: groupName });
        return t;
    }));
  };
  
   const handleDeleteGroup = (groupId: string) => {
    if (!userPermissions.canEditTeams) return;
    setConfirmState({
        isOpen: true, title: 'Delete Group',
        message: 'Are you sure you want to delete this group? Teams in this group will become unassigned.',
        onConfirm: () => handleApiCall(api.updateTournament(tournamentId, t => {
            t.groups = t.groups.filter(g => g.id !== groupId);
            t.teams.forEach(team => { if (team.groupId === groupId) team.groupId = null; });
            return t;
        }))
    });
  };
  
    const handleEditGroup = (groupId: string, newName: string) => {
    if (!userPermissions.canEditTeams) return;
    handleApiCall(api.updateTournament(tournamentId, t => {
        const group = t.groups.find(g => g.id === groupId);
        if (group) group.name = newName;
        return t;
    }));
  };
  
   const handleAddMatch = (team1Id: string, team2Id: string, date: string) => {
      if (!userPermissions.canEditMatches) return;
      handleApiCall(api.addMatch(tournamentId, { team1Id, team2Id, date }));
  };
  
    const handleAddMatchesBatch = (matchesData: Array<{ team1Id: string, team2Id: string, date: string }>) => {
    if (!userPermissions.canEditMatches) return;
    handleApiCall(api.updateTournament(tournamentId, t => {
// FIX: Explicitly type the new match object to conform to the Match interface, preventing a type mismatch error for the 'status' property.
        const newMatches: Match[] = matchesData.map(data => ({
            id: crypto.randomUUID(),
            team1Id: data.team1Id,
            team2Id: data.team2Id,
            date: data.date,
            status: 'upcoming',
            stage: 'league',
        }));
        t.matches.push(...newMatches);
        return t;
    }));
  };
  
   const handleDeleteMatch = (matchId: string) => {
    const match = tournament?.matches.find(m => m.id === matchId);
    if (!match) return;
    if ((match.status === 'upcoming' && !userPermissions.canEditMatches) || (match.status !== 'upcoming' && !userPermissions.canFinalizeResults)) return;
    setConfirmState({
        isOpen: true, title: 'Delete Match',
        message: 'Are you sure you want to delete this match? If it was completed, team stats will be reverted.',
        onConfirm: () => handleApiCall(api.deleteMatch(tournamentId, matchId))
    });
  };
  
  const handleStartMatch = (matchId: string) => {
    if (!userPermissions.canEditMatches) return;
    handleApiCall(api.startMatch(tournamentId, matchId));
  };
  
   const handleUpdateLiveScore = (matchId: string, playerId: string, points: number, isQueen: boolean) => {
      if (!userPermissions.canFinalizeResults) return;
      handleApiCall(api.updateLiveScore(tournamentId, matchId, { playerId, points, isQueen }));
  };
  
  const handleEditMatch = (matchId: string, newDate: string) => {
    if (!userPermissions.canEditMatches) return;
    handleApiCall(api.editMatch(tournamentId, matchId, newDate));
  };
  
  const handleUpdateMatchResult = (matchId: string, winnerId: string, team1Score: number, team2Score: number) => {
    if (!userPermissions.canFinalizeResults) return;
    handleApiCall(api.updateMatchResult(tournamentId, matchId, { winnerId, team1Score, team2Score }));
  };
  
  const handleEndLeagueStage = () => {
    setConfirmState({
        isOpen: true, title: 'End League Stage',
        message: 'Are you sure you want to end the league stage and proceed to the playoffs? This cannot be undone.',
        onConfirm: () => handleApiCall(api.endLeagueStage(tournamentId), "Playoffs created!", "Failed to start playoffs.")
    });
  };
  
  // --- Render Logic ---

  if (isLoading) return <div className="text-center p-10">Loading Tournament...</div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
  if (!tournament || !currentUser) return <div className="text-center p-10">Tournament data could not be loaded.</div>;

  const renderView = () => {
    switch(activeView) {
      case View.TEAMS:
        return <TeamsManager 
            teams={tournament.teams} 
            groups={tournament.groups}
            onAddTeam={handleAddTeam}
            onAddTeamsBatch={handleAddTeamsBatch}
            onDeleteTeam={handleDeleteTeam}
            onAddPlayer={handleAddPlayer}
            onDeletePlayer={handleDeletePlayer}
            onAddGroup={handleAddGroup}
            onDeleteGroup={handleDeleteGroup}
            onEditTeam={handleEditTeam}
            onEditGroup={handleEditGroup}
            permissions={userPermissions}
        />;
      case View.MATCHES:
        return <MatchesManager 
            matches={tournament.matches} 
            teams={tournament.teams}
            tournament={tournament}
            onAddMatch={handleAddMatch}
            onDeleteMatch={handleDeleteMatch}
            onUpdateMatchResult={handleUpdateMatchResult}
            onEditMatch={handleEditMatch}
            onStartMatch={handleStartMatch}
            onUpdateLiveScore={handleUpdateLiveScore}
            onAddMatchesBatch={handleAddMatchesBatch}
            onEndLeagueStage={handleEndLeagueStage}
            permissions={userPermissions}
        />;
      case View.SUPER_STRIKER:
        return <SuperStrikerPage teams={tournament.teams} />;
      case View.USERS:
        return <UsersManager tournament={tournament} onUpdateTournament={onUpdateTournament} currentUser={currentUser} />;
      case View.PLAYOFFS:
          return <PlayoffsManager 
              tournament={tournament}
              onUpdateMatchResult={handleUpdateMatchResult}
              onEditMatch={handleEditMatch}
              onStartMatch={handleStartMatch}
              onUpdateLiveScore={handleUpdateLiveScore}
              permissions={userPermissions}
          />
      case View.TABLE:
      default:
        return <PointsTable teams={tournament.teams} tournamentName={tournament.name} />;
    }
  };
  
  const navItemClasses = "py-2 px-4 rounded-lg cursor-pointer transition-colors";
  const activeNavItemClasses = "bg-cyan-500 text-white font-bold";
  const inactiveNavItemClasses = "bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200";

  return (
    <>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="bg-white dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 p-2 rounded-full transition-colors shadow">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">{tournament.name}</h1>
        </div>
        
        <nav className="bg-white dark:bg-slate-800 p-3 rounded-lg flex gap-2 shadow-md flex-wrap">
            <button onClick={() => setActiveView(View.TABLE)} className={`${navItemClasses} ${activeView === View.TABLE ? activeNavItemClasses : inactiveNavItemClasses}`}>Points Table</button>
            <button onClick={() => setActiveView(View.MATCHES)} className={`${navItemClasses} ${activeView === View.MATCHES ? activeNavItemClasses : inactiveNavItemClasses}`}>Matches</button>
            {tournament.stage !== 'league' && (
              <button onClick={() => setActiveView(View.PLAYOFFS)} className={`${navItemClasses} ${activeView === View.PLAYOFFS ? activeNavItemClasses : inactiveNavItemClasses}`}>Playoffs</button>
            )}
            <button onClick={() => setActiveView(View.TEAMS)} className={`${navItemClasses} ${activeView === View.TEAMS ? activeNavItemClasses : inactiveNavItemClasses}`}>Teams</button>
            <button onClick={() => setActiveView(View.SUPER_STRIKER)} className={`${navItemClasses} ${activeView === View.SUPER_STRIKER ? activeNavItemClasses : inactiveNavItemClasses}`}>Super Striker</button>
            {isCurrentUserAdmin && (
              <button onClick={() => setActiveView(View.USERS)} className={`${navItemClasses} ${activeView === View.USERS ? activeNavItemClasses : inactiveNavItemClasses}`}>Users</button>
            )}
        </nav>

        <div>{renderView()}</div>
      </div>
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
      />
    </>
  );
};

export default TournamentDashboard;