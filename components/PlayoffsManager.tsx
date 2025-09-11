

import React, { useState, useMemo } from 'react';
import { Tournament, Match, Team, Permissions } from '../types';
import Modal from './Modal';

interface PlayoffsManagerProps {
  tournament: Tournament;
  onUpdateMatchResult: (matchId: string, winnerId: string, team1Score: number, team2Score: number) => void;
  onEditMatch: (matchId: string, newDate: string) => void;
  onStartMatch: (matchId: string) => void;
  onUpdateLiveScore: (matchId: string, playerId: string, points: number, isQueen: boolean) => void;
  permissions: Permissions;
}

const CrownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"></path>
    </svg>
);

const TeamDisplay: React.FC<{ team: Team | undefined | 'TBD'; placeholder: string, winner?: boolean }> = ({ team, placeholder, winner }) => {
    if (!team) {
        return <div className="font-bold text-lg text-gray-400 dark:text-gray-500">{placeholder}</div>;
    }
    if (team === 'TBD') {
        return <div className="font-bold text-lg text-gray-400 dark:text-gray-500">{placeholder}</div>;
    }

    return (
        <div className={`font-bold text-lg flex items-center ${winner ? 'text-green-600 dark:text-green-400' : ''}`}>
            {winner && <CrownIcon />}
            {team.logo ? <img src={team.logo} alt={team.name} className="w-6 h-6 rounded-full mr-2 object-cover"/> : <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: team.color}}></span>}
            {team.name}
        </div>
    );
};

const PlayoffsManager: React.FC<PlayoffsManagerProps> = ({ tournament, onUpdateMatchResult, onEditMatch, onStartMatch, onUpdateLiveScore, permissions }) => {
    const { teams, matches } = tournament;
    const [isResultModalOpen, setResultModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [winnerId, setWinnerId] = useState('');
    const [winnerScore, setWinnerScore] = useState('');
    const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
    const [newMatchDate, setNewMatchDate] = useState('');
    const [newMatchTime, setNewMatchTime] = useState('');

    const getTeam = (id: string | undefined): Team | 'TBD' | undefined => {
        if (!id) return undefined;
        if (id === 'TBD') return 'TBD';
        return teams.find(t => t.id === id);
    };

    const playoffMatches = useMemo(() => {
        const pMatches = matches.filter(m => m.stage === 'playoff');
        return {
            q1: pMatches.find(m => m.playoffType === 'qualifier1'),
            e: pMatches.find(m => m.playoffType === 'eliminator'),
            q2: pMatches.find(m => m.playoffType === 'qualifier2'),
            final: pMatches.find(m => m.playoffType === 'final'),
        };
    }, [matches]);

    const tournamentWinner = useMemo(() => {
        if (tournament.stage === 'completed' && playoffMatches.final?.winnerId) {
            return getTeam(playoffMatches.final.winnerId);
        }
        return null;
    }, [tournament.stage, playoffMatches.final, getTeam]);

    const handleOpenResultModal = (match: Match) => {
        setSelectedMatch(match);
        setWinnerId(match.winnerId || '');
        const score = match.winnerId === match.team1Id ? match.team1Score : match.team2Score;
        setWinnerScore(String(score || ''));
        setResultModalOpen(true);
    };

    const handleOpenEditModal = (match: Match) => {
        setEditingMatchId(match.id);
        const date = new Date(match.date);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        setNewMatchDate(`${year}-${month}-${day}`);
        setNewMatchTime(`${hours}:${minutes}`);
        setEditModalOpen(true);
    };

    const handleSubmitResult = () => {
        if (!selectedMatch || !winnerId) return alert('Please select a winner.');
        const score = parseInt(winnerScore, 10);
        if (isNaN(score) || score < 0) return alert('Please enter a valid, non-negative score.');
        
        const isTeam1Winner = winnerId === selectedMatch.team1Id;
        onUpdateMatchResult(selectedMatch.id, winnerId, isTeam1Winner ? score : 0, !isTeam1Winner ? score : 0);
        setResultModalOpen(false);
    };

    const handleEditMatch = () => {
        if (editingMatchId && newMatchDate && newMatchTime) {
            const combinedDateTime = new Date(`${newMatchDate}T${newMatchTime}`).toISOString();
            onEditMatch(editingMatchId, combinedDateTime);
            setEditModalOpen(false);
        }
    };

    const MatchCard: React.FC<{ match: Match | undefined, placeholderTeam1?: string, placeholderTeam2?: string }> = ({ match, placeholderTeam1 = "TBD", placeholderTeam2 = "TBD" }) => {
        if (!match) return <div className="bg-gray-100 dark:bg-slate-800 p-4 rounded-lg shadow-md min-h-[160px] flex items-center justify-center text-gray-400">Match not scheduled</div>;

        const team1 = getTeam(match.team1Id);
        const team2 = getTeam(match.team2Id);
        const canStart = team1 !== 'TBD' && team2 !== 'TBD';

        return (
            <div className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md space-y-3 border-l-4 ${match.status === 'completed' ? 'border-green-500' : 'border-cyan-500'}`}>
                <h4 className="font-bold text-xl text-cyan-600 dark:text-cyan-400">{match.name}</h4>
                <TeamDisplay team={team1} placeholder={placeholderTeam1} winner={match.winnerId === match.team1Id} />
                <div className="pl-4 text-gray-500 dark:text-gray-400">vs</div>
                <TeamDisplay team={team2} placeholder={placeholderTeam2} winner={match.winnerId === match.team2Id} />

                <div className="text-gray-500 dark:text-gray-400 text-sm pt-2 border-t border-gray-200 dark:border-slate-700">
                    {new Date(match.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </div>

                <div className="flex items-center space-x-2 pt-2">
                    {match.status === 'upcoming' && (
                        <button onClick={() => onStartMatch(match.id)} disabled={!canStart || !permissions.canEditMatches} className="bg-cyan-600 hover:bg-cyan-700 text-white py-1 px-3 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Start</button>
                    )}
                    {match.status === 'inprogress' && (
                        <button onClick={() => handleOpenResultModal(match)} disabled={!permissions.canFinalizeResults} className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Finalize</button>
                    )}
                     {match.status !== 'completed' && (
                        <button onClick={() => handleOpenEditModal(match)} disabled={!permissions.canEditMatches} className="text-gray-500 hover:text-cyan-500 p-1 disabled:opacity-50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                        </button>
                    )}
                </div>

                {match.status === 'inprogress' && team1 && team2 && typeof team1 !== 'string' && typeof team2 !== 'string' && (
                    <div className="grid grid-cols-1 gap-4 bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg mt-4">
                        {[team1, team2].map(team => (
                            <div key={team.id}>
                                <h4 className="font-bold text-md mb-2" style={{ color: team.color }}>{team.name}</h4>
                                <div className="space-y-2">
                                {team.players.map(player => {
                                    const liveStats = match.liveScores?.[player.id];
                                    const liveScore = liveStats ? liveStats.coins + liveStats.queens * 3 : 0;
                                    return (
                                        <div key={player.id} className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-800 p-2 rounded-md border border-gray-200 dark:border-slate-700 text-sm">
                                        <span>{player.name} - <span className="font-bold">{liveScore} pts</span></span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => onUpdateLiveScore(match.id, player.id, 1, false)}
                                                disabled={!permissions.canFinalizeResults}
                                                className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-1 px-2 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Coin
                                            </button>
                                            <button
                                                onClick={() => onUpdateLiveScore(match.id, player.id, 3, true)}
                                                disabled={!!match.queenPocketedBy || !permissions.canFinalizeResults}
                                                className="bg-amber-400 hover:bg-amber-500 text-white font-bold py-1 px-2 rounded text-xs transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                                            >
                                                Queen
                                            </button>
                                            <button
                                                onClick={() => onUpdateLiveScore(match.id, player.id, -1, false)}
                                                disabled={!permissions.canFinalizeResults}
                                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Foul
                                            </button>
                                        </div>
                                        </div>
                                    );
                                })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">Playoffs Bracket</h2>
            
            {tournamentWinner && typeof tournamentWinner !== 'string' && (
                <div className="bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-800 p-6 rounded-xl shadow-lg flex flex-col items-center text-center space-y-2 border-2 border-amber-300">
                    <h3 className="text-2xl font-bold tracking-wider uppercase text-white drop-shadow">Tournament Champions!</h3>
                    <div className="font-bold text-3xl flex items-center text-white drop-shadow-sm">
                        <CrownIcon />
                        {tournamentWinner.name}
                    </div>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-between">
                {/* Round 1 */}
                <div className="w-full lg:w-1/3 space-y-6">
                    <MatchCard match={playoffMatches.q1} />
                    <MatchCard match={playoffMatches.e} />
                </div>

                {/* Connecting Lines & Round 2 */}
                <div className="w-full lg:w-1/3 flex flex-col items-center justify-center mt-0 lg:mt-24">
                     <MatchCard match={playoffMatches.q2} placeholderTeam1="Loser of Q1" placeholderTeam2="Winner of Eliminator" />
                </div>

                {/* Connecting Lines & Final */}
                <div className="w-full lg:w-1/3 flex flex-col items-center justify-center mt-0 lg:mt-48">
                     <MatchCard match={playoffMatches.final} placeholderTeam1="Winner of Q1" placeholderTeam2="Winner of Q2" />
                </div>
            </div>

            <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Reschedule Match">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Date</label>
                            <input type="date" value={newMatchDate} onChange={e => setNewMatchDate(e.target.value)} className="mt-1 w-full bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-slate-200 p-2 rounded border border-gray-300 dark:border-slate-600 [color-scheme:dark]"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Time</label>
                            <input type="time" value={newMatchTime} onChange={e => setNewMatchTime(e.target.value)} className="mt-1 w-full bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-slate-200 p-2 rounded border border-gray-300 dark:border-slate-600 [color-scheme:dark]"/>
                        </div>
                    </div>
                    <button onClick={handleEditMatch} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors !mt-6">Reschedule</button>
                </div>
            </Modal>

            {selectedMatch && (() => {
                const team1 = getTeam(selectedMatch.team1Id);
                const team2 = getTeam(selectedMatch.team2Id);
                return (
                    <Modal isOpen={isResultModalOpen} onClose={() => setResultModalOpen(false)} title={`Result for ${selectedMatch.name}`}>
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Winning Team</label>
                            <div className="mt-2 space-y-2">
                               <label className="flex items-center">
                                   <input type="radio" name="winner" value={selectedMatch.team1Id} checked={winnerId === selectedMatch.team1Id} onChange={e => setWinnerId(e.target.value)} className="form-radio h-4 w-4 text-cyan-600"/>
                                   {/* FIX: Check if team is an object before accessing .name */}
                                   <span className="ml-2">{team1 && typeof team1 !== 'string' ? team1.name : ''}</span>
                               </label>
                               <label className="flex items-center">
                                   <input type="radio" name="winner" value={selectedMatch.team2Id} checked={winnerId === selectedMatch.team2Id} onChange={e => setWinnerId(e.target.value)} className="form-radio h-4 w-4 text-cyan-600"/>
                                   {/* FIX: Check if team is an object before accessing .name */}
                                   <span className="ml-2">{team2 && typeof team2 !== 'string' ? team2.name : ''}</span>
                               </label>
                            </div>
                            {winnerId && (
                               <div>
                                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Winner's Score (for record)</label>
                                   <input type="number" value={winnerScore} onChange={e => setWinnerScore(e.target.value)} className="mt-1 w-full bg-gray-50 dark:bg-slate-700 p-2 rounded border border-gray-300 dark:border-slate-600"/>
                               </div>
                            )}
                            <button onClick={handleSubmitResult} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors" disabled={!winnerId || winnerScore === ''}>Submit Result</button>
                        </div>
                    </Modal>
                );
            })()}
        </div>
    );
};

export default PlayoffsManager;