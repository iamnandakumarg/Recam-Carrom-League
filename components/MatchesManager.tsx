
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Match, Team, Permissions, Tournament } from '../types';
import Modal from './Modal';

// Declare XLSX library provided by CDN
declare var XLSX: any;

interface MatchesManagerProps {
  matches: Match[];
  teams: Team[];
  tournament: Tournament;
  onAddMatch: (team1Id: string, team2Id: string, date: string) => void;
  onDeleteMatch: (matchId: string) => void;
  onUpdateMatchResult: (matchId: string, winnerId: string, team1Score: number, team2Score: number) => void;
  onEditMatch: (matchId: string, newDate: string) => void;
  onStartMatch: (matchId:string) => void;
  onUpdateLiveScore: (matchId: string, playerId: string, points: number, isQueen: boolean) => void;
  onAddMatchesBatch: (matches: Array<{ team1Id: string, team2Id: string, date: string }>) => void;
  onEndLeagueStage: () => void;
  permissions: Permissions;
}

const CrownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"></path>
    </svg>
);

const formatDuration = (start?: string, end?: string): string => {
    if (!start || !end) return '';
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    if (isNaN(diffMs) || diffMs < 0) return '';
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    let durationString = 'Duration: ';
    if (hours > 0) {
        durationString += `${hours}h `;
    }
    durationString += `${minutes}m`;
    return durationString;
};

const MatchesManager: React.FC<MatchesManagerProps> = ({ matches, teams, tournament, onAddMatch, onDeleteMatch, onUpdateMatchResult, onEditMatch, onStartMatch, onUpdateLiveScore, onAddMatchesBatch, onEndLeagueStage, permissions }) => {
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isResultModalOpen, setResultModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  
  const [team1Id, setTeam1Id] = useState('');
  const [team2Id, setTeam2Id] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('');
  
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [winnerId, setWinnerId] = useState('');
  const [winnerScore, setWinnerScore] = useState('');
  const [calculatedScores, setCalculatedScores] = useState<{ team1: number; team2: number } | null>(null);


  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [newMatchDate, setNewMatchDate] = useState('');
  const [newMatchTime, setNewMatchTime] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const leagueMatches = useMemo(() => matches.filter(m => m.stage === 'league'), [matches]);
  const allLeagueMatchesCompleted = useMemo(() => leagueMatches.length > 0 && leagueMatches.every(m => m.status === 'completed'), [leagueMatches]);


  const getTeam = (id: string) => teams.find(t => t.id === id);

  const matchNumbers = useMemo(() => {
    const sortedByDate = [...leagueMatches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const numbers = new Map<string, number>();
    sortedByDate.forEach((match, index) => {
      numbers.set(match.id, index + 1);
    });
    return numbers;
  }, [leagueMatches]);

  useEffect(() => {
    if (!selectedMatch || !calculatedScores) {
        if(!winnerId) setWinnerScore('');
        return;
    }

    if (winnerId === selectedMatch.team1Id) {
        setWinnerScore(String(calculatedScores.team1));
    } else if (winnerId === selectedMatch.team2Id) {
        setWinnerScore(String(calculatedScores.team2));
    } else {
        setWinnerScore('');
    }
  }, [winnerId, selectedMatch, calculatedScores]);

  const handleAddMatch = () => {
    if (team1Id && team2Id && team1Id !== team2Id && matchDate && matchTime) {
      const combinedDateTime = new Date(`${matchDate}T${matchTime}`).toISOString();
      onAddMatch(team1Id, team2Id, combinedDateTime);
      setTeam1Id('');
      setTeam2Id('');
      setMatchDate('');
      setMatchTime('');
      setAddModalOpen(false);
    }
  };

  const handleOpenResultModal = (match: Match) => {
    setSelectedMatch(match);
    setWinnerId(match.winnerId || '');
    setCalculatedScores(null);

    if (match.status === 'inprogress') {
        const team1 = teams.find(t => t.id === match.team1Id);
        const team2 = teams.find(t => t.id === match.team2Id);
        const t1Score = team1?.players.reduce((acc, p) => {
            const liveStats = match.liveScores?.[p.id];
            const liveScore = liveStats ? liveStats.coins + liveStats.queens * 3 : 0;
            return acc + liveScore;
        }, 0) || 0;
        const t2Score = team2?.players.reduce((acc, p) => {
            const liveStats = match.liveScores?.[p.id];
            const liveScore = liveStats ? liveStats.coins + liveStats.queens * 3 : 0;
            return acc + liveScore;
        }, 0) || 0;
        setCalculatedScores({ team1: t1Score, team2: t2Score });
    } else if (match.status === 'completed') {
        const score = match.winnerId === match.team1Id ? match.team1Score : match.team2Score;
        setWinnerScore(String(score || ''));
    } else {
        setWinnerScore('');
    }

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
  }

  const handleSubmitResult = () => {
    if (!selectedMatch || !winnerId) {
        alert('Please select a winning team.');
        return;
    }
    const score = parseInt(winnerScore, 10);
    if (isNaN(score) || score < 0) {
        alert('Please enter a valid, non-negative score for the winning team.');
        return;
    }

    const finalTeam1Score = selectedMatch.team1Id === winnerId ? score : 0;
    const finalTeam2Score = selectedMatch.team2Id === winnerId ? score : 0;

    onUpdateMatchResult(selectedMatch.id, winnerId, finalTeam1Score, finalTeam2Score);
    setResultModalOpen(false);
    setSelectedMatch(null);
    setWinnerId('');
    setWinnerScore('');
    setCalculatedScores(null);
  };

  const handleEditMatch = () => {
    if (editingMatchId && newMatchDate && newMatchTime) {
      const combinedDateTime = new Date(`${newMatchDate}T${newMatchTime}`).toISOString();
      onEditMatch(editingMatchId, combinedDateTime);
      setEditModalOpen(false);
      setEditingMatchId(null);
    }
  };

  const handleDownloadTemplate = () => {
    const wsData = [
      ["Team 1 Name", "Team 2 Name", "Date (YYYY-MM-DD)", "Time (HH:MM)"],
      ["", "", "2024-10-25", "19:00"], // Example row
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Schedule");
    XLSX.writeFile(wb, "match_schedule_template.xlsx");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const newMatches: Array<{ team1Id: string, team2Id: string, date: string }> = [];
        const errors: string[] = [];
        
        const teamsMap = new Map(teams.map(team => [team.name.toLowerCase(), team.id]));

        json.forEach((row, index) => {
          const team1Name = row["Team 1 Name"];
          const team2Name = row["Team 2 Name"];
          const dateVal = row["Date (YYYY-MM-DD)"];
          const timeVal = row["Time (HH:MM)"];

          if (!team1Name || !team2Name || !dateVal || !timeVal) {
            if (Object.keys(row).length > 0) errors.push(`Row ${index + 2}: Missing required data.`);
            return;
          }
          
          const team1Id = teamsMap.get(String(team1Name).toLowerCase().trim());
          const team2Id = teamsMap.get(String(team2Name).toLowerCase().trim());

          if (!team1Id) errors.push(`Row ${index + 2}: Team "${team1Name}" not found.`);
          if (!team2Id) errors.push(`Row ${index + 2}: Team "${team2Name}" not found.`);
          if (team1Id && team2Id && team1Id === team2Id) errors.push(`Row ${index + 2}: A team cannot play against itself.`);
          
          let validDateStr: string | null = null;
          if (team1Id && team2Id && team1Id !== team2Id) {
            let dateString, timeString;
             if (dateVal instanceof Date) {
                const year = dateVal.getFullYear();
                const month = (dateVal.getMonth() + 1).toString().padStart(2, '0');
                const day = dateVal.getDate().toString().padStart(2, '0');
                dateString = `${year}-${month}-${day}`;
            } else {
                dateString = String(dateVal);
            }
             if (timeVal instanceof Date) {
                const hours = timeVal.getUTCHours().toString().padStart(2, '0');
                const minutes = timeVal.getUTCMinutes().toString().padStart(2, '0');
                timeString = `${hours}:${minutes}`;
            } else if (typeof timeVal === 'number') {
                const totalSeconds = Math.round(timeVal * 86400);
                const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
                const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
                timeString = `${hours}:${minutes}`;
            } else {
                timeString = String(timeVal);
            }
             const combined = new Date(`${dateString}T${timeString}`);
             if (!isNaN(combined.getTime())) {
                validDateStr = combined.toISOString();
                newMatches.push({ team1Id, team2Id, date: validDateStr });
            } else {
                errors.push(`Row ${index + 2}: Invalid date/time format. Found: "${dateVal}", "${timeVal}". Use YYYY-MM-DD and HH:MM.`);
            }
          }
        });

        if (newMatches.length > 0) onAddMatchesBatch(newMatches);

        if (errors.length > 0) {
          alert(`Import complete with issues:\n- ${newMatches.length} matches imported successfully.\n- ${errors.length} rows had errors:\n\n${errors.join('\n')}`);
        } else if (newMatches.length > 0) {
          alert(`${newMatches.length} matches imported successfully.`);
        } else {
          alert('No valid matches found to import. Please check the file and try again.');
        }

      } catch (error) {
        console.error("Error parsing file:", error);
        alert("There was an error processing the file. Please ensure it's a valid Excel file and matches the template format.");
      } finally {
        if(event.target) event.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };


  const upcomingMatches = leagueMatches.filter(m => m.status === 'upcoming').sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const inProgressMatches = leagueMatches.filter(m => m.status === 'inprogress').sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const completedMatches = leagueMatches.filter(m => m.status === 'completed').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const canEditMatches = permissions.canEditMatches;
  const canFinalize = permissions.canFinalizeResults;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md gap-4">
        <h2 className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 self-start sm:self-center">League Matches</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
             <button onClick={handleDownloadTemplate} className="bg-slate-500 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                Download Template
            </button>
            <button onClick={() => fileInputRef.current?.click()} disabled={!canEditMatches} className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Upload Schedule
            </button>
            <button onClick={() => setAddModalOpen(true)} disabled={!canEditMatches} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Schedule Match
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".xlsx, .xls" />
        </div>
      </div>
      
      {tournament.stage === 'league' && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md text-center">
            <button
                onClick={onEndLeagueStage}
                disabled={!allLeagueMatchesCompleted}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors w-full sm:w-auto disabled:opacity-50 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                End League Stage & Start Playoffs
            </button>
            {!allLeagueMatchesCompleted && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">All league matches must be completed to proceed.</p>
            )}
        </div>
      )}

      {inProgressMatches.length > 0 && (
        <div>
          <h3 className="text-2xl font-semibold mb-4 text-cyan-600 dark:text-cyan-400">In Progress</h3>
          <div className="space-y-4">
            {inProgressMatches.map(match => {
              const team1 = getTeam(match.team1Id);
              const team2 = getTeam(match.team2Id);
              if (!team1 || !team2) return null;

              return (
                <div key={match.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg border-l-8 border-cyan-400 shadow-lg">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="font-bold text-sm text-gray-500 dark:text-gray-400 mb-1">Match {matchNumbers.get(match.id)}</p>
                      <div className="flex items-center space-x-4">
                          <span className="font-bold text-lg flex items-center">
                            {team1.logo ? <img src={team1.logo} alt={team1.name} className="w-6 h-6 rounded-full mr-2 object-cover"/> : <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: team1.color}}></span>}
                            {team1.name}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 font-semibold">vs</span>
                          <span className="font-bold text-lg flex items-center">
                            {team2.logo ? <img src={team2.logo} alt={team2.name} className="w-6 h-6 rounded-full mr-2 object-cover"/> : <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: team2.color}}></span>}
                            {team2.name}
                          </span>
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 text-sm mt-1 flex flex-col sm:flex-row sm:gap-2">
                        <span>{new Date(match.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        <span>{new Date(match.date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <button 
                        onClick={() => handleOpenResultModal(match)}
                        disabled={!canFinalize}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Finalize Result
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg">
                    {[team1, team2].map(team => (
                      <div key={team.id}>
                        <h4 className="font-bold text-lg mb-2" style={{color: team.color}}>{team.name}</h4>
                        <div className="space-y-2">
                          {team.players.map(player => {
                            const liveStats = match.liveScores?.[player.id];
                            const liveScore = liveStats ? liveStats.coins + liveStats.queens * 3 : 0;
                            return (
                                <div key={player.id} className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-800 p-3 rounded-md border border-gray-200 dark:border-slate-700">
                                  <span>{player.name} - <span className="font-bold">{liveScore} pts</span></span>
                                   <div className="flex items-center gap-2">
                                      <button 
                                          onClick={() => onUpdateLiveScore(match.id, player.id, 1, false)}
                                          disabled={!canFinalize}
                                          className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-1 px-3 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                          Coin
                                      </button>
                                      <button
                                          onClick={() => onUpdateLiveScore(match.id, player.id, 3, true)}
                                          disabled={!!match.queenPocketedBy || !canFinalize}
                                          className="bg-amber-400 hover:bg-amber-500 text-white font-bold py-1 px-3 rounded text-sm transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                                      >
                                          Queen
                                      </button>
                                       <button 
                                          onClick={() => onUpdateLiveScore(match.id, player.id, -1, false)}
                                          disabled={!canFinalize}
                                          className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xl font-semibold mb-3">Upcoming Matches</h3>
        <div className="space-y-4">
          {upcomingMatches.map(match => {
            const team1 = getTeam(match.team1Id);
            const team2 = getTeam(match.team2Id);
            if (!team1 || !team2) return null;
            
            return (
            <div key={match.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shadow-md">
              <div>
                <p className="font-bold text-sm text-gray-500 dark:text-gray-400 mb-1">Match {matchNumbers.get(match.id)}</p>
                <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
                    <span className="font-bold text-lg flex items-center">
                        {team1.logo ? <img src={team1.logo} alt={team1.name} className="w-6 h-6 rounded-full mr-2 object-cover"/> : <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: team1.color}}></span>}
                        {team1.name}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">vs</span>
                    <span className="font-bold text-lg flex items-center">
                        {team2.logo ? <img src={team2.logo} alt={team2.name} className="w-6 h-6 rounded-full mr-2 object-cover"/> : <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: team2.color}}></span>}
                        {team2.name}
                    </span>
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-sm mt-1 flex flex-col sm:flex-row sm:gap-2">
                    <span>{new Date(match.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    <span>{new Date(match.date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <button onClick={() => onStartMatch(match.id)} disabled={!canEditMatches} className="bg-cyan-600 hover:bg-cyan-700 text-white py-1 px-3 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Start Match</button>
                <button onClick={() => handleOpenEditModal(match)} disabled={!canEditMatches} className="text-gray-500 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                </button>
                <button onClick={() => onDeleteMatch(match.id)} disabled={!canEditMatches} className="text-gray-500 hover:text-red-500 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          )})}
        </div>
      </div>

      {completedMatches.length > 0 && (
          <div>
              <h3 className="text-xl font-semibold mb-3">Completed Matches</h3>
              <div className="space-y-4">
                  {completedMatches.map(match => {
                    const team1 = getTeam(match.team1Id);
                    const team2 = getTeam(match.team2Id);
                    if (!team1 || !team2) return null;
                    const winner = match.winnerId ? getTeam(match.winnerId) : null;

                    return (
                      <div key={match.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shadow-md opacity-80">
                          <div>
                              <p className="font-bold text-sm text-gray-500 dark:text-gray-400 mb-2">Match {matchNumbers.get(match.id)}</p>
                              <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
                                  <span className="font-bold text-lg flex items-center">
                                      {team1.logo ? <img src={team1.logo} alt={team1.name} className="w-6 h-6 rounded-full mr-2 object-cover"/> : <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: team1.color}}></span>}
                                      {team1.name}
                                  </span>
                                  <span className="text-gray-500 dark:text-gray-400 font-semibold">vs</span>
                                  <span className="font-bold text-lg flex items-center">
                                      {team2.logo ? <img src={team2.logo} alt={team2.name} className="w-6 h-6 rounded-full mr-2 object-cover"/> : <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: team2.color}}></span>}
                                      {team2.name}
                                  </span>
                              </div>
                              {winner && (
                                <div className="mt-2 flex items-center text-md">
                                  <span className="text-gray-600 dark:text-gray-300 font-semibold mr-2">Winner:</span>
                                  <span className="font-bold flex items-center text-green-600 dark:text-green-400">
                                    <CrownIcon />
                                    {winner.name}
                                  </span>
                                </div>
                              )}
                               <div className="text-gray-500 dark:text-gray-400 text-sm mt-2 flex flex-col sm:flex-row sm:gap-2">
                                    <span>{new Date(match.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                    <span>{new Date(match.date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
                                    {match.startTime && match.endTime && (
                                        <span className="font-semibold">{formatDuration(match.startTime, match.endTime)}</span>
                                    )}
                                </div>
                          </div>
                          <div className="flex items-center space-x-2 self-end sm:self-auto">
                                <button onClick={() => onDeleteMatch(match.id)} disabled={!canFinalize} className="text-gray-500 hover:text-red-500 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                          </div>
                      </div>
                  )})}
              </div>
          </div>
      )}

      <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Schedule New Match">
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Team 1</label>
                <select value={team1Id} onChange={e => setTeam1Id(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-slate-200">
                    <option value="" disabled>Select Team</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Team 2</label>
                <select value={team2Id} onChange={e => setTeam2Id(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-slate-200">
                    <option value="" disabled>Select Team</option>
                    {teams.filter(t => t.id !== team1Id).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                    <input type="date" value={matchDate} onChange={e => setMatchDate(e.target.value)} className="mt-1 w-full bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-slate-200 p-2 rounded border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 [color-scheme:dark]"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time</label>
                    <input type="time" value={matchTime} onChange={e => setMatchTime(e.target.value)} className="mt-1 w-full bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-slate-200 p-2 rounded border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 [color-scheme:dark]"/>
                </div>
            </div>
            <button onClick={handleAddMatch} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors !mt-6">
                Schedule
            </button>
        </div>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Reschedule Match">
        <div className="space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Date</label>
                    <input type="date" value={newMatchDate} onChange={e => setNewMatchDate(e.target.value)} className="mt-1 w-full bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-slate-200 p-2 rounded border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 [color-scheme:dark]"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Time</label>
                    <input type="time" value={newMatchTime} onChange={e => setNewMatchTime(e.target.value)} className="mt-1 w-full bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-slate-200 p-2 rounded border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 [color-scheme:dark]"/>
                </div>
            </div>
            <button onClick={handleEditMatch} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors !mt-6">
                Reschedule
            </button>
        </div>
      </Modal>

      {selectedMatch && (
         <Modal isOpen={isResultModalOpen} onClose={() => setResultModalOpen(false)} title="Finalize Match Result">
             <div className="space-y-4">
                 <p className="font-semibold">{getTeam(selectedMatch.team1Id)?.name || ''} vs {getTeam(selectedMatch.team2Id)?.name || ''}</p>
                 
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Winning Team</label>
                    <div className="mt-2 space-y-2">
                        <label className="flex items-center">
                            <input type="radio" name="winner" value={selectedMatch.team1Id} checked={winnerId === selectedMatch.team1Id} onChange={e => setWinnerId(e.target.value)} className="form-radio h-4 w-4 text-cyan-600 dark:bg-slate-600 border-gray-300 dark:border-slate-500"/>
                            <span className="ml-2">{getTeam(selectedMatch.team1Id)?.name || ''}</span>
                        </label>
                         <label className="flex items-center">
                            <input type="radio" name="winner" value={selectedMatch.team2Id} checked={winnerId === selectedMatch.team2Id} onChange={e => setWinnerId(e.target.value)} className="form-radio h-4 w-4 text-cyan-600 dark:bg-slate-600 border-gray-300 dark:border-slate-500"/>
                            <span className="ml-2">{getTeam(selectedMatch.team2Id)?.name || ''}</span>
                        </label>
                    </div>
                 </div>

                 {winnerId && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getTeam(winnerId)?.name || ''} Score</label>
                        <input 
                            type="number"
                            value={winnerScore}
                            onChange={e => setWinnerScore(e.target.value)}
                            className="mt-1 w-full bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-slate-200 p-2 rounded border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="Enter winning score"
                            />
                    </div>
                 )}

                <button 
                  onClick={handleSubmitResult}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 dark:disabled:bg-slate-600"
                  disabled={!winnerId || winnerScore === ''}
                >
                    Submit Result
                </button>
             </div>
         </Modal>
      )}
    </div>
  );
};

export default MatchesManager;
