import React, { useMemo } from 'react';
import { Team } from '../types';

interface SuperStrikerPageProps {
  teams: Team[];
}

const SuperStrikerPage: React.FC<SuperStrikerPageProps> = ({ teams }) => {
  const rankedPlayers = useMemo(() => {
    return teams
      .flatMap(team => team.players.map(player => ({ ...player, teamName: team.name, teamColor: team.color, teamLogo: team.logo })))
      .sort((a, b) => b.score - a.score);
  }, [teams]);

  const superStriker = rankedPlayers.length > 0 && rankedPlayers[0].score > 0 ? rankedPlayers[0] : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">Super Striker Leaderboard</h2>
      </div>

      {superStriker ? (
        <>
          <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-800 p-5 rounded-xl shadow-lg flex items-center space-x-4 border-2 border-amber-300 shadow-yellow-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-white drop-shadow-lg flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <div>
              <h3 className="text-xl font-bold tracking-wider uppercase text-white drop-shadow">Super Striker</h3>
              <p className="font-semibold text-lg">{superStriker.name} ({superStriker.teamName})</p>
              <p className="font-bold text-2xl text-white drop-shadow-sm">{superStriker.score} points</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-lg">
             <h3 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mb-4">All Players Ranking</h3>
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="border-b-2 border-gray-300 dark:border-slate-600">
                        <tr>
                        <th className="p-2 text-sm font-semibold tracking-wide text-left whitespace-nowrap">Rank</th>
                        <th className="p-2 text-sm font-semibold tracking-wide text-left whitespace-nowrap">Player</th>
                        <th className="p-2 text-sm font-semibold tracking-wide text-center whitespace-nowrap">Total Points</th>
                        <th className="p-2 text-sm font-semibold tracking-wide text-center whitespace-nowrap">Coins</th>
                        <th className="p-2 text-sm font-semibold tracking-wide text-center whitespace-nowrap">Queens</th>
                        <th className="p-2 text-sm font-semibold tracking-wide text-center whitespace-nowrap">Matches</th>
                        <th className="p-2 text-sm font-semibold tracking-wide text-center whitespace-nowrap">Avg/Match</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rankedPlayers.map((player, index) => (
                            <tr key={player.id} className="border-b border-gray-200 dark:border-slate-700">
                                <td className="p-3 font-bold text-slate-500 dark:text-slate-400">{index + 1}</td>
                                <td className="p-3">
                                    <div className="flex items-center">
                                        {player.teamLogo ? (
                                            <img src={player.teamLogo} alt={`${player.teamName} logo`} className="w-6 h-6 rounded-full mr-3 object-cover"/>
                                        ) : (
                                            <span className="w-4 h-4 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: player.teamColor }}></span>
                                        )}
                                        <div>
                                            <p className="font-semibold whitespace-nowrap">{player.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{player.teamName}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3 text-center font-bold text-lg text-amber-600 dark:text-amber-400">{player.score}</td>
                                <td className="p-3 text-center">{player.coins}</td>
                                <td className="p-3 text-center font-semibold text-purple-600 dark:text-purple-400">{player.queens}</td>
                                <td className="p-3 text-center">{player.matchesPlayed}</td>
                                <td className="p-3 text-center">
                                    {player.matchesPlayed > 0 ? (player.score / player.matchesPlayed).toFixed(1) : '0.0'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
          </div>
        </>
      ) : (
        <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-lg shadow-md">
            <h2 className="text-xl text-gray-500 dark:text-gray-400">No player scores recorded yet.</h2>
            <p className="text-gray-400 dark:text-gray-500 mt-2">Scores will appear here once matches are played.</p>
        </div>
      )}
    </div>
  );
};

export default SuperStrikerPage;