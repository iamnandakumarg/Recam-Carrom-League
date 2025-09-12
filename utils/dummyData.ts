
import { Tournament } from '../types';

export const dummyOwnerId = 'dummy-owner-user-id';

const initialTournament: Tournament = {
  id: 'carr-champ-2024',
  name: 'Carrom Champions 2024',
  stage: 'league',
  ownerId: dummyOwnerId,
  inviteCode: 'carr2024',
  collaborators: [],
  groups: [
    { id: 'group-a', name: 'Group A' },
    { id: 'group-b', name: 'Group B' },
  ],
  teams: [
    {
      id: 'team-1',
      name: 'Pocket Protectors',
      color: '#ef4444',
      logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=64',
      groupId: 'group-a',
      players: [
        { id: 'p1', name: 'Alice', score: 0, coins: 0, queens: 0, matchesPlayed: 0 },
        { id: 'p2', name: 'Bob', score: 0, coins: 0, queens: 0, matchesPlayed: 0 },
      ],
      matchesPlayed: 0, wins: 0, losses: 0, points: 0, pointsScored: 0, pointsConceded: 0, recentForm: [],
    },
    {
      id: 'team-2',
      name: 'Striker Kings',
      color: '#3b82f6',
      logo: 'https://images.unsplash.com/photo-1549492423-400259a5e5a4?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=64',
      groupId: 'group-a',
      players: [
        { id: 'p3', name: 'Charlie', score: 0, coins: 0, queens: 0, matchesPlayed: 0 },
        { id: 'p4', name: 'Diana', score: 0, coins: 0, queens: 0, matchesPlayed: 0 },
      ],
      matchesPlayed: 0, wins: 0, losses: 0, points: 0, pointsScored: 0, pointsConceded: 0, recentForm: [],
    },
    {
      id: 'team-3',
      name: 'Queen Slayers',
      color: '#22c55e',
       logo: 'https://images.unsplash.com/photo-1517042583259-7d8b3b63a2c0?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=64',
      groupId: 'group-b',
      players: [
        { id: 'p5', name: 'Eve', score: 0, coins: 0, queens: 0, matchesPlayed: 0 },
        { id: 'p6', name: 'Frank', score: 0, coins: 0, queens: 0, matchesPlayed: 0 },
      ],
      matchesPlayed: 0, wins: 0, losses: 0, points: 0, pointsScored: 0, pointsConceded: 0, recentForm: [],
    },
    {
      id: 'team-4',
      name: 'Coin Collectors',
      color: '#f97316',
      logo: 'https://images.unsplash.com/photo-1514315384768-4b79c3a3d82c?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=64',
      groupId: 'group-b',
      players: [
        { id: 'p7', name: 'Grace', score: 0, coins: 0, queens: 0, matchesPlayed: 0 },
        { id: 'p8', name: 'Heidi', score: 0, coins: 0, queens: 0, matchesPlayed: 0 },
      ],
      matchesPlayed: 0, wins: 0, losses: 0, points: 0, pointsScored: 0, pointsConceded: 0, recentForm: [],
    },
  ],
  matches: [
     {
      id: 'match-1',
      stage: 'league',
      team1Id: 'team-1',
      team2Id: 'team-2',
      date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      status: 'upcoming',
    },
     {
      id: 'match-2',
      stage: 'league',
      team1Id: 'team-3',
      team2Id: 'team-4',
      date: new Date(Date.now() + (86400000 * 2)).toISOString(), // Day after tomorrow
      status: 'upcoming',
    }
  ],
};

export const dummyTournaments: Tournament[] = [initialTournament];
