import { Tournament, Team, Player, Match, Group, User, Permissions } from '../types';

// This file provides a mock API for the Carrom Tournament Manager.
// It uses localStorage as a persistent data store to simulate a backend database.
// Each function simulates network latency with a short delay.
// To connect to a real backend, replace the functions in this file
// with `fetch` calls to your actual API endpoints.

const LATENCY = 100; // ms

// --- Helper Functions ---
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const getDb = (): Tournament[] => {
    const data = localStorage.getItem('carrom-tournaments');
    if (!data) {
        // Seed with initial data if nothing is there
        const seededData = [
          {
            id: 'cpl2024',
            name: 'Carrom Premier League 2024',
            stage: 'league',
            adminId: 'admin-user-abc-123',
            inviteCode: 'CPL2024',
            users: [{ id: 'admin-user-abc-123', name: 'Admin User', email: 'admin@example.com' }],
            permissions: { 'admin-user-abc-123': { canEditTeams: true, canEditMatches: true, canFinalizeResults: true } },
            groups: [], teams: [], matches: [],
          }
        ] as Tournament[];
        localStorage.setItem('carrom-tournaments', JSON.stringify(seededData));
        return seededData;
    }
    return JSON.parse(data);
};
const saveDb = (db: Tournament[]) => localStorage.setItem('carrom-tournaments', JSON.stringify(db));
const getCurrentUserId = (): string => JSON.parse(localStorage.getItem('carrom-currentUser') || '{}').id || '';

// --- API Functions ---

// GET /api/tournaments
export const getTournaments = async (): Promise<Tournament[]> => {
    await sleep(LATENCY);
    const db = getDb();
    const currentUserId = getCurrentUserId();
    // Return only tournaments the user is a member of
    return db.filter(t => t.users.some(u => u.id === currentUserId) || t.adminId === currentUserId);
};

// GET /api/tournaments/:id
export const getTournament = async (id: string): Promise<Tournament | undefined> => {
    await sleep(LATENCY);
    const db = getDb();
    return db.find(t => t.id === id);
};

// POST /api/tournaments
export const addTournament = async (name: string, adminName: string, adminEmail: string): Promise<Tournament> => {
    await sleep(LATENCY);
    const db = getDb();
    const currentUserId = getCurrentUserId();
    const adminUser: User = { id: currentUserId, name: adminName, email: adminEmail };
    const adminPermissions: Permissions = { canEditTeams: true, canEditMatches: true, canFinalizeResults: true };

    const newTournament: Tournament = {
      id: crypto.randomUUID(),
      name,
      adminId: currentUserId,
      stage: 'league',
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      users: [adminUser],
      permissions: { [currentUserId]: adminPermissions },
      groups: [],
      teams: [],
      matches: [],
    };
    
    db.push(newTournament);
    saveDb(db);
    return newTournament;
};

// DELETE /api/tournaments/:id
export const deleteTournament = async (id: string): Promise<void> => {
    await sleep(LATENCY);
    let db = getDb();
    db = db.filter(t => t.id !== id);
    saveDb(db);
};

// POST /api/tournaments/join
export const joinTournament = async (inviteCode: string, name: string, email: string): Promise<Tournament> => {
    await sleep(LATENCY);
    const db = getDb();
    const currentUserId = getCurrentUserId();
    const tournamentIndex = db.findIndex(t => t.inviteCode.toLowerCase() === inviteCode.toLowerCase());
    
    if (tournamentIndex === -1) throw new Error("Invalid invite code.");

    const tournament = db[tournamentIndex];
    if (tournament.users.some(u => u.id === currentUserId)) throw new Error("You are already a member of this tournament.");
    
    const newUser: User = { id: currentUserId, name, email };
    const defaultPermissions: Permissions = { canEditTeams: false, canEditMatches: false, canFinalizeResults: false };

    tournament.users.push(newUser);
    tournament.permissions[currentUserId] = defaultPermissions;
    
    db[tournamentIndex] = tournament;
    saveDb(db);
    return tournament;
};

// --- Granular Tournament Updates ---
// This pattern avoids sending the whole tournament object back and forth.

const updateTournament = async (id: string, updater: (t: Tournament) => Tournament): Promise<Tournament> => {
    await sleep(LATENCY);
    const db = getDb();
    const index = db.findIndex(t => t.id === id);
    if (index === -1) throw new Error("Tournament not found");
    db[index] = updater(db[index]);
    saveDb(db);
    return db[index];
};


// TEAMS
export const addTeam = async (tournamentId: string, data: { teamName: string, color: string, groupId: string, playerNames: string[], logo: string | null }) => {
    await sleep(LATENCY);
    return updateTournament(tournamentId, t => {
        const newPlayers = data.playerNames.map(name => ({ id: crypto.randomUUID(), name, score: 0, coins: 0, queens: 0, matchesPlayed: 0 }));
        const newTeam: Team = { id: crypto.randomUUID(), name: data.teamName, color: data.color, logo: data.logo || undefined, groupId: data.groupId, players: newPlayers, matchesPlayed: 0, wins: 0, losses: 0, points: 0, pointsScored: 0, pointsConceded: 0, recentForm: [] };
        t.teams.push(newTeam);
        return t;
    });
};

export const deleteTeam = async (tournamentId: string, teamId: string) => {
    await sleep(LATENCY);
    return updateTournament(tournamentId, t => {
        t.teams = t.teams.filter(team => team.id !== teamId);
        t.matches = t.matches.filter(m => m.team1Id !== teamId && m.team2Id !== teamId);
        return t;
    });
};

// MATCHES
export const addMatch = async (tournamentId: string, data: { team1Id: string, team2Id: string, date: string }) => {
    await sleep(LATENCY);
    return updateTournament(tournamentId, t => {
        const newMatch: Match = { id: crypto.randomUUID(), ...data, status: 'upcoming', stage: 'league' };
        t.matches.push(newMatch);
        return t;
    });
};

export const deleteMatch = async (tournamentId: string, matchId: string) => {
    await sleep(LATENCY);
    return updateTournament(tournamentId, t => {
        const match = t.matches.find(m => m.id === matchId);
        if (match && match.status === 'completed') {
            // Revert stats if deleting a completed match
            const team1 = t.teams.find(team => team.id === match.team1Id);
            const team2 = t.teams.find(team => team.id === match.team2Id);
            if(team1 && team2) {
                // ... complex logic to revert stats would go here ...
                console.warn("Reverting stats is a complex operation not fully implemented in mock API.");
            }
        }
        t.matches = t.matches.filter(m => m.id !== matchId);
        return t;
    });
};

export const updateMatchResult = async (tournamentId: string, matchId: string, data: { winnerId: string, team1Score: number, team2Score: number }) => {
    await sleep(LATENCY);
    return updateTournament(tournamentId, t => {
        const match = t.matches.find(m => m.id === matchId);
        if (!match) return t;

        Object.assign(match, { ...data, status: 'completed', endTime: new Date().toISOString() });
        
        // Update team stats
        t.teams.forEach(team => {
            if (team.id === match.team1Id || team.id === match.team2Id) {
                const isWinner = team.id === data.winnerId;
                team.players.forEach(player => {
                    const liveStats = match.liveScores?.[player.id];
                    if (liveStats) {
                        player.matchesPlayed += 1;
                        player.score += (liveStats.coins || 0) + (liveStats.queens || 0) * 3;
                        player.coins += (liveStats.coins || 0);
                        player.queens += (liveStats.queens || 0);
                    }
                });
                if (match.stage === 'league') {
                    team.matchesPlayed += 1;
                    team.wins += isWinner ? 1 : 0;
                    team.losses += isWinner ? 0 : 1;
                    team.points += isWinner ? 2 : 0;
                    team.pointsScored += team.id === match.team1Id ? data.team1Score : data.team2Score;
                    team.pointsConceded += team.id === match.team1Id ? data.team2Score : data.team1Score;
                    team.recentForm.push(isWinner ? 'W' : 'L');
                }
            }
        });

        // Update playoff bracket
        if (match.stage === 'playoff') {
            const loserId = match.winnerId === match.team1Id ? match.team2Id : match.team1Id;
            if (match.playoffType === 'qualifier1') {
                t.matches.find(m => m.playoffType === 'final')!.team1Id = match.winnerId!;
                t.matches.find(m => m.playoffType === 'qualifier2')!.team1Id = loserId;
            } else if (match.playoffType === 'eliminator') {
                t.matches.find(m => m.playoffType === 'qualifier2')!.team2Id = match.winnerId!;
            } else if (match.playoffType === 'qualifier2') {
                t.matches.find(m => m.playoffType === 'final')!.team2Id = match.winnerId!;
            } else if (match.playoffType === 'final') {
                t.stage = 'completed';
            }
        }
        
        return t;
    });
};

export const startMatch = async (tournamentId: string, matchId: string) => {
    await sleep(LATENCY);
    return updateTournament(tournamentId, t => {
        const match = t.matches.find(m => m.id === matchId);
        if (match) {
            match.status = 'inprogress';
            match.liveScores = {};
            match.queenPocketedBy = null;
            match.startTime = new Date().toISOString();
        }
        return t;
    });
};

export const editMatch = async(tournamentId: string, matchId: string, newDate: string) => {
    await sleep(LATENCY);
    return updateTournament(tournamentId, t => {
        const match = t.matches.find(m => m.id === matchId);
        if(match) match.date = newDate;
        return t;
    });
}

export const updateLiveScore = async (tournamentId: string, matchId: string, data: { playerId: string, points: number, isQueen: boolean }) => {
    await sleep(50); // Faster latency for live scoring
    return updateTournament(tournamentId, t => {
        const match = t.matches.find(m => m.id === matchId);
        if (match) {
            const liveScores = match.liveScores || {};
            const playerStats = liveScores[data.playerId] || { coins: 0, queens: 0 };
            
            if (data.isQueen) {
                playerStats.queens += 1;
                match.queenPocketedBy = data.playerId;
            } else {
                playerStats.coins += data.points;
            }
            liveScores[data.playerId] = playerStats;
            match.liveScores = liveScores;
        }
        return t;
    });
};

export const endLeagueStage = async (tournamentId: string) => {
    await sleep(LATENCY);
    return updateTournament(tournamentId, t => {
        if (t.teams.length < 4) throw new Error("At least 4 teams are required for playoffs.");
        const sortedTable = [...t.teams]
            .map(team => ({...team, nsm: team.pointsScored - team.pointsConceded }))
            .sort((a, b) => b.points !== a.points ? b.points - a.points : b.nsm - a.nsm);

        const [r1, r2, r3, r4] = sortedTable;
        const placeholderDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        t.matches.push({ id: crypto.randomUUID(), name: 'Qualifier 1', stage: 'playoff', playoffType: 'qualifier1', team1Id: r1.id, team2Id: r2.id, date: placeholderDate, status: 'upcoming' });
        t.matches.push({ id: crypto.randomUUID(), name: 'Eliminator', stage: 'playoff', playoffType: 'eliminator', team1Id: r3.id, team2Id: r4.id, date: placeholderDate, status: 'upcoming' });
        t.matches.push({ id: crypto.randomUUID(), name: 'Qualifier 2', stage: 'playoff', playoffType: 'qualifier2', team1Id: 'TBD', team2Id: 'TBD', date: placeholderDate, status: 'upcoming' });
        t.matches.push({ id: crypto.randomUUID(), name: 'Final', stage: 'playoff', playoffType: 'final', team1Id: 'TBD', team2Id: 'TBD', date: placeholderDate, status: 'upcoming' });
        
        t.stage = 'playoffs';
        return t;
    });
}


// This is a minimal set of API functions. A full implementation would have
// functions for every CRUD operation on every resource (groups, players, etc.).
// For brevity, some operations are left for the developer to implement.
// The existing `updateTournament` is a powerful shortcut for this mock API.

// FIX: Export all necessary API functions to be used throughout the application.
export const api = {
    getTournaments,
    getTournament,
    addTournament,
    deleteTournament,
    joinTournament,
    updateTournament, // Exposing this for actions not yet broken out
    addTeam,
    deleteTeam,
    addMatch,
    deleteMatch,
    updateMatchResult,
    startMatch,
    editMatch,
    updateLiveScore,
    endLeagueStage,
};
