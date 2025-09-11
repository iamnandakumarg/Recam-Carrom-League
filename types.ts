
export interface Player {
  id: string;
  name: string;
  score: number; // This is Total Points
  coins: number;
  queens: number;
  matchesPlayed: number;
}

export interface Group {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  logo?: string;
  players: Player[];
  groupId: string | null;
  // Points table stats
  matchesPlayed: number;
  wins: number;
  losses: number;
  points: number;
  pointsScored: number;
  pointsConceded: number;
  recentForm: ('W' | 'L')[];
}

export type MatchStatus = 'upcoming' | 'inprogress' | 'completed';

export interface Match {
  id: string;
  name?: string; // e.g., "Qualifier 1"
  stage: 'league' | 'playoff';
  playoffType?: 'qualifier1' | 'eliminator' | 'qualifier2' | 'final';
  team1Id: string;
  team2Id: string;
  date: string;
  status: MatchStatus;
  winnerId?: string;
  team1Score?: number;
  team2Score?: number;
  liveScores?: { [playerId: string]: { coins: number, queens: number } };
  queenPocketedBy?: string | null;
  startTime?: string;
  endTime?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Permissions {
  canEditTeams: boolean;
  canEditMatches: boolean;
  canFinalizeResults: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  stage: 'league' | 'playoffs' | 'completed';
  adminId: string;
  inviteCode: string;
  users: User[];
  permissions: Record<string, Permissions>;
  groups: Group[];
  teams: Team[];
  matches: Match[];
}

export enum View {
  TEAMS = 'TEAMS',
  MATCHES = 'MATCHES',
  TABLE = 'TABLE',
  SUPER_STRIKER = 'SUPER_STRIKER',
  PLAYOFFS = 'PLAYOFFS',
  USERS = 'USERS',
}
