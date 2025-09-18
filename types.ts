
export interface User {
  id: string;
  email: string;
}

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
  team1Id: string | null;
  team2Id: string | null;
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

export type CollaboratorRole = 'editor' | 'viewer';

export interface Tournament {
  id: string;
  name: string;
  stage: 'league' | 'playoffs' | 'completed';
  groups: Group[];
  teams: Team[];
  matches: Match[];
  // New fields for auth and collaboration
  ownerId: string;
  inviteCode: string;
  collaborators: Array<{ userId: string; role: CollaboratorRole }>;
}

export enum View {
  TEAMS = 'TEAMS',
  MATCHES = 'MATCHES',
  TABLE = 'TABLE',
  SUPER_STRIKER = 'SUPER_STRIKER',
  PLAYOFFS = 'PLAYOFFS',
  USERS = 'USERS',
}