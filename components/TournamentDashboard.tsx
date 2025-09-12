
import React, { useState, useMemo } from 'react';
import { Tournament, Team, Player, Match, View, Group, User, CollaboratorRole } from '../types';
import TeamsManager from './TeamsManager';
import MatchesManager from './MatchesManager';
import PointsTable from './PointsTable';
import SuperStrikerPage from './SuperStrikerPage';
import PlayoffsManager from './PlayoffsManager';
import ConfirmationModal from './ConfirmationModal';
import UsersManager from './UsersManager';

interface TournamentDashboardProps {
  tournament: Tournament;
  onUpdateTournament: (tournament: Tournament) => void;
  onBack: () => void;
  currentUser: User;
  users: User[];
  onUpdateCollaboratorRole: (tournamentId: string, userId: string, role: CollaboratorRole) => void;
  onRemoveCollaborator: (tournamentId: string, userId: string) => void;
}

const TournamentDashboard: React.FC<TournamentDashboardProps> = ({ tournament, onUpdateTournament, onBack, currentUser, users, onUpdateCollaboratorRole, onRemoveCollaborator }) => {
  const [activeView, setActiveView] = useState<View>(View.TABLE);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  
  const userRole = useMemo(() => {
    if (tournament.ownerId === currentUser.id) return 'owner';
    const collaborator = tournament.collaborators.find(c => c.userId === currentUser.id);
    return collaborator?.role || 'none'; // 'none' if not owner or collaborator
  }, [tournament, currentUser]);
  
  const readOnly = userRole === 'viewer';

  // Clone, mutate, and update pattern for all handlers
  const withUpdate = (mutator: (t: Tournament) => void) => {
    const updatedTournament = JSON.parse(JSON.stringify(tournament));
    mutator(updatedTournament);
    onUpdateTournament(updatedTournament);
  };
  
  // --- Handlers ---
  const handleAddTeam = (teamName: string, color: string, groupId: string, playerNames: string[], logo: string | null) => {
    withUpdate(t => {
      const newTeam: Team = {
        id: crypto.randomUUID(),
        name: teamName,
        color,
        logo: logo || undefined,
        groupId,
        players: playerNames.map(name => ({ id: crypto.randomUUID(), name, score: 0, coins: 0, queens: 0, matchesPlayed: 0 })),
        matchesPlayed: 0, wins: 0, losses: 0, points: 0, pointsScored: 0, pointsConceded: 0, recentForm: [],
      };
      t.teams.push(newTeam);
    });
  };
  
  const handleAddTeamsBatch = (teamsData: Array<{ groupName: string, teamName: string, playerNames: string[] }>) => {
    withUpdate(t => {
        teamsData.forEach((teamData, index) => {
            let group = t.groups.find((g: Group) => g.name.toLowerCase() === teamData.groupName.toLowerCase());
            if (!group) {
                group = { id: crypto.randomUUID(), name: teamData.groupName };
                t.groups.push(group);
            }
            const color = teamColors[ (t.teams.length + index) % teamColors.length];
            const newTeam: Team = {
                 id: crypto.randomUUID(),
                 name: teamData.teamName,
                 color,
                 groupId: group.id,
                 players: teamData.playerNames.map(name => ({ id: crypto.randomUUID(), name, score: 0, coins: 0, queens: 0, matchesPlayed: 0 })),
                 matchesPlayed: 0, wins: 0, losses: 0, points: 0, pointsScored: 0, pointsConceded: 0, recentForm: [],
            };
            t.teams.push(newTeam);
        });
    });
  };

  const handleDeleteTeam = (teamId: string) => {
    setConfirmState({
      isOpen: true, title: 'Delete Team',
      message: 'Are you sure you want to delete this team? All associated matches will also be removed.',
      onConfirm: () => withUpdate(t => {
        t.teams = t.teams.filter((team: Team) => team.id !== teamId);
        t.matches = t.matches.filter((m: Match) => m.team1Id !== teamId && m.team2Id !== teamId);
      })
    });
  };
  
  const handleEditTeam = (teamId: string, updates: { name: string; color: string; logo: string | null | undefined; groupId: string; players: Player[]; }) => {
    withUpdate(t => {
        const teamIndex = t.teams.findIndex((team: Team) => team.id === teamId);
        if (teamIndex > -1) {
            const originalTeam = t.teams[teamIndex];
            t.teams[teamIndex] = { ...originalTeam, ...updates, logo: updates.logo || undefined };
        }
    });
  };
  
  const handleAddPlayer = (teamId: string, playerName: string) => {
      withUpdate(t => {
          const team = t.teams.find((team: Team) => team.id === teamId);
          if (team) {
              team.players.push({ id: crypto.randomUUID(), name: playerName, score: 0, coins: 0, queens: 0, matchesPlayed: 0 });
          }
      });
  };
  
  const handleDeletePlayer = (teamId: string, playerId: string) => {
      withUpdate(t => {
          const team = t.teams.find((team: Team) => team.id === teamId);
          if (team) {
              team.players = team.players.filter((p: Player) => p.id !== playerId);
          }
      });
  };
  
  const handleAddGroup = (groupName: string) => {
    withUpdate(t => t.groups.push({ id: crypto.randomUUID(), name: groupName }));
  };
  
  const handleDeleteGroup = (groupId: string) => {
    setConfirmState({
        isOpen: true, title: 'Delete Group',
        message: 'Are you sure you want to delete this group? Teams in this group will become unassigned.',
        onConfirm: () => withUpdate(t => {
            t.groups = t.groups.filter((g: Group) => g.id !== groupId);
            t.teams.forEach((team: Team) => {
                if (team.groupId === groupId) team.groupId = null;
            });
        })
    });
  };
  
  const handleEditGroup = (groupId: string, newName: string) => {
    withUpdate(t => {
        const group = t.groups.find((g: Group) => g.id === groupId);
        if (group) group.name = newName;
    });
  };
  
  const handleAddMatch = (team1Id: string, team2Id: string, date: string) => {
    withUpdate(t => t.matches.push({
      id: crypto.randomUUID(),
      stage: 'league',
      team1Id, team2Id, date,
      status: 'upcoming'
    }));
  };
  
  const handleAddMatchesBatch = (matchesData: Array<{ team1Id: string, team2Id: string, date: string }>) => {
    withUpdate(t => {
      matchesData.forEach(match => {
        t.matches.push({
          id: crypto.randomUUID(),
          stage: 'league',
          ...match,
          status: 'upcoming',
        });
      });
    });
  };
  
  const handleDeleteMatch = (matchId: string) => {
    setConfirmState({
        isOpen: true, title: 'Delete Match',
        message: 'Are you sure you want to delete this match? If it was completed, team stats will be reverted.',
        onConfirm: () => withUpdate(t => {
            const matchIndex = t.matches.findIndex((m: Match) => m.id === matchId);
            if (matchIndex === -1) return;
            const match = t.matches[matchIndex];
            
            // If match was completed, revert stats
            if (match.status === 'completed' && match.winnerId) {
                // This is a simplified revert. A more robust implementation would store stat changes for each match.
                // For now, we just decrement/adjust based on the single result.
                const team1 = t.teams.find((team: Team) => team.id === match.team1Id);
                const team2 = t.teams.find((team: Team) => team.id === match.team2Id);
                if (team1 && team2) {
                    team1.matchesPlayed--;
                    team2.matchesPlayed--;
                    team1.pointsScored -= match.team1Score || 0;
                    team1.pointsConceded -= match.team2Score || 0;
                    team2.pointsScored -= match.team2Score || 0;
                    team2.pointsConceded -= match.team1Score || 0;
                    
                    if (match.winnerId === team1.id) {
                        team1.wins--; team1.points -= 2; team2.losses--;
                    } else {
                        team2.wins--; team2.points -= 2; team1.losses--;
                    }
                }
            }
            t.matches.splice(matchIndex, 1);
        })
    });
  };
  
  const handleStartMatch = (matchId: string) => {
    withUpdate(t => {
        const match = t.matches.find((m: Match) => m.id === matchId);
        if (match) {
            match.status = 'inprogress';
            match.startTime = new Date().toISOString();
        }
    });
  };
  
  const handleUpdateLiveScore = (matchId: string, playerId: string, points: number, isQueen: boolean) => {
    withUpdate(t => {
        const match = t.matches.find((m: Match) => m.id === matchId);
        if (!match || match.status !== 'inprogress') return;
        
        if (!match.liveScores) match.liveScores = {};
        if (!match.liveScores[playerId]) match.liveScores[playerId] = { coins: 0, queens: 0 };
        
        if (isQueen) {
            if (match.queenPocketedBy) return; // Queen already taken
            match.liveScores[playerId].queens = 1;
            match.queenPocketedBy = playerId;
        } else {
            match.liveScores[playerId].coins += points;
            if (match.liveScores[playerId].coins < 0) match.liveScores[playerId].coins = 0;
        }
    });
  };
  
  const handleEditMatch = (matchId: string, newDate: string) => {
    withUpdate(t => {
        const match = t.matches.find((m: Match) => m.id === matchId);
        if (match) match.date = newDate;
    });
  };
  
  const handleUpdateMatchResult = (matchId: string, winnerId: string, team1Score: number, team2Score: number) => {
    withUpdate(t => {
      const match = t.matches.find((m: Match) => m.id === matchId);
      if (!match) return;

      match.status = 'completed';
      match.winnerId = winnerId;
      match.team1Score = team1Score;
      match.team2Score = team2Score;
      match.endTime = new Date().toISOString();
      
      const team1 = t.teams.find((team: Team) => team.id === match.team1Id);
      const team2 = t.teams.find((team: Team) => team.id === match.team2Id);
      
      if (team1 && team2) {
        team1.matchesPlayed++;
        team2.matchesPlayed++;
        team1.pointsScored += team1Score;
        team1.pointsConceded += team2Score;
        team2.pointsScored += team2Score;
        team2.pointsConceded += team1Score;
        
        if (winnerId === team1.id) {
          team1.wins++;
          team1.points += 2;
          team2.losses++;
          team1.recentForm.push('W');
          team2.recentForm.push('L');
        } else {
          team2.wins++;
          team2.points += 2;
          team1.losses++;
          team2.recentForm.push('W');
          team1.recentForm.push('L');
        }

        // Update player stats from live scores if they exist
        if (match.liveScores) {
            Object.entries(match.liveScores).forEach(([playerId, scores]) => {
                const allPlayers = [...team1.players, ...team2.players];
                const player = allPlayers.find(p => p.id === playerId);
                if (player) {
                    const points = scores.coins + scores.queens * 3;
                    player.score += points;
                    player.coins += scores.coins;
                    player.queens += scores.queens;
                    player.matchesPlayed++;
                }
            });
        }
      }
      
      // Post-match logic for playoffs
      if (match.stage === 'playoff') {
          const loserId = winnerId === team1?.id ? team2?.id : team1?.id;
          if (match.playoffType === 'qualifier1' && loserId) {
              const q2 = t.matches.find((m: Match) => m.playoffType === 'qualifier2');
              if (q2) q2.team1Id = loserId;
          }
          if (match.playoffType === 'eliminator') {
              const q2 = t.matches.find((m: Match) => m.playoffType === 'qualifier2');
              if (q2) q2.team2Id = winnerId;
          }
          if (match.playoffType === 'qualifier1') {
              const final = t.matches.find((m: Match) => m.playoffType === 'final');
              if (final) final.team1Id = winnerId;
          }
           if (match.playoffType === 'qualifier2') {
              const final = t.matches.find((m: Match) => m.playoffType === 'final');
              if (final) final.team2Id = winnerId;
          }
          if (match.playoffType === 'final') {
              t.stage = 'completed';
          }
      }
    });
  };
  
  const handleEndLeagueStage = () => {
    setConfirmState({
        isOpen: true, title: 'End League Stage',
        message: 'Are you sure you want to end the league stage and proceed to the playoffs? This cannot be undone.',
        onConfirm: () => withUpdate(t => {
          if (t.stage !== 'league') return;
          
          const sortedTeams = [...t.teams]
            .map(team => ({...team, nsm: team.pointsScored - team.pointsConceded}))
            .sort((a,b) => b.points - a.points || b.nsm - a.nsm);
            
          const [rank1, rank2, rank3, rank4] = sortedTeams;

          if (!rank1 || !rank2 || !rank3 || !rank4) {
            alert("At least 4 teams are required to start playoffs.");
            return;
          }
          
          const now = Date.now();
          
          const q1: Match = { id: crypto.randomUUID(), name: 'Qualifier 1', stage: 'playoff', playoffType: 'qualifier1', team1Id: rank1.id, team2Id: rank2.id, date: new Date(now + 86400000).toISOString(), status: 'upcoming'};
          const e: Match = { id: crypto.randomUUID(), name: 'Eliminator', stage: 'playoff', playoffType: 'eliminator', team1Id: rank3.id, team2Id: rank4.id, date: new Date(now + 86400000 * 2).toISOString(), status: 'upcoming'};
          const q2: Match = { id: crypto.randomUUID(), name: 'Qualifier 2', stage: 'playoff', playoffType: 'qualifier2', team1Id: 'TBD', team2Id: 'TBD', date: new Date(now + 86400000 * 3).toISOString(), status: 'upcoming'};
          const final: Match = { id: crypto.randomUUID(), name: 'Final', stage: 'playoff', playoffType: 'final', team1Id: 'TBD', team2Id: 'TBD', date: new Date(now + 86400000 * 4).toISOString(), status: 'upcoming'};

          t.matches.push(q1, e, q2, final);
          t.stage = 'playoffs';
          setActiveView(View.PLAYOFFS);
        })
    });
  };
  
  // --- Render Logic ---

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
            readOnly={readOnly}
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
            readOnly={readOnly}
        />;
      case View.SUPER_STRIKER:
        return <SuperStrikerPage teams={tournament.teams} />;
      case View.PLAYOFFS:
          return <PlayoffsManager 
              tournament={tournament}
              onUpdateMatchResult={handleUpdateMatchResult}
              onEditMatch={handleEditMatch}
              onStartMatch={handleStartMatch}
              onUpdateLiveScore={handleUpdateLiveScore}
              readOnly={readOnly}
          />;
      case View.USERS:
          return <UsersManager
              tournament={tournament}
              currentUser={currentUser}
              users={users}
              isOwner={userRole === 'owner'}
              onUpdateRole={(userId, role) => onUpdateCollaboratorRole(tournament.id, userId, role)}
              onRemoveUser={(userId) => onRemoveCollaborator(tournament.id, userId)}
          />;
      case View.TABLE:
      default:
        return <PointsTable teams={tournament.teams} tournamentName={tournament.name} />;
    }
  };
  
  const navItemClasses = "py-2 px-4 rounded-lg cursor-pointer transition-colors";
  const activeNavItemClasses = "bg-cyan-500 text-white font-bold";
  const inactiveNavItemClasses = "bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200";

  const teamColors = [ '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899' ];

  return (
    <>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="bg-white dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 p-2 rounded-full transition-colors shadow">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
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
            <button onClick={() => setActiveView(View.USERS)} className={`${navItemClasses} ${activeView === View.USERS ? activeNavItemClasses : inactiveNavItemClasses}`}>Users & Share</button>
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
