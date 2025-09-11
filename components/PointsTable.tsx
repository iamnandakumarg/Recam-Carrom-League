import React, { useMemo } from 'react';
import { Team } from '../types';
import { exportPointsTableToCSV } from '../utils/csvExporter';

interface PointsTableProps {
  teams: Team[];
  tournamentName: string;
}

const PointsTable: React.FC<PointsTableProps> = ({ teams, tournamentName }) => {
  const sortedTable = useMemo(() => {
    return [...teams]
      .map(team => ({
        ...team,
        nsm: team.pointsScored - team.pointsConceded,
      }))
      .sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        }
        return b.nsm - a.nsm;
      });
  }, [teams]);

  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
             <h2 className="text-2xl sm:text-3xl font-bold text-cyan-600 dark:text-cyan-400">Points Table</h2>
             <button
                onClick={() => exportPointsTableToCSV(sortedTable, tournamentName)}
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center w-full sm:w-auto"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export CSV
            </button>
        </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b-2 border-gray-300 dark:border-slate-600">
            <tr>
              <th className="p-2 text-sm font-semibold tracking-wide text-left whitespace-nowrap">Rank</th>
              <th className="p-2 text-sm font-semibold tracking-wide text-left whitespace-nowrap">Team</th>
              <th className="p-2 text-sm font-semibold tracking-wide text-center whitespace-nowrap">MP</th>
              <th className="p-2 text-sm font-semibold tracking-wide text-center whitespace-nowrap">W</th>
              <th className="p-2 text-sm font-semibold tracking-wide text-center whitespace-nowrap">L</th>
              <th className="p-2 text-sm font-semibold tracking-wide text-center whitespace-nowrap">Pts</th>
              <th className="p-2 text-sm font-semibold tracking-wide text-center whitespace-nowrap">NSM</th>
              <th className="p-2 text-sm font-semibold tracking-wide text-center whitespace-nowrap">PS</th>
              <th className="p-2 text-sm font-semibold tracking-wide text-center whitespace-nowrap">PC</th>
              <th className="p-2 text-sm font-semibold tracking-wide text-center whitespace-nowrap">Recent Form</th>
            </tr>
          </thead>
          <tbody>
            {sortedTable.map((team, index) => (
              <tr key={team.id} className={`${index < 4 ? 'bg-green-50 dark:bg-green-900/20' : ''} border-b border-gray-200 dark:border-slate-700`}>
                <td className="p-2 font-bold">{index + 1}</td>
                <td className="p-2">
                    <div className="flex items-center">
                        {team.logo ? (
                            <img src={team.logo} alt={`${team.name} logo`} className="w-6 h-6 rounded-full mr-3 object-cover"/>
                        ) : (
                            <span className="w-4 h-4 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: team.color }}></span>
                        )}
                        <span className="font-semibold whitespace-nowrap">{team.name}</span>
                    </div>
                </td>
                <td className="p-2 text-center">{team.matchesPlayed}</td>
                <td className="p-2 text-center">{team.wins}</td>
                <td className="p-2 text-center">{team.losses}</td>
                <td className="p-2 text-center font-bold">{team.points}</td>
                <td className="p-2 text-center">{team.nsm > 0 ? `+${team.nsm}` : team.nsm}</td>
                <td className="p-2 text-center">{team.pointsScored}</td>
                <td className="p-2 text-center">{team.pointsConceded}</td>
                <td className="p-2">
                  <div className="flex justify-center items-center space-x-1">
                    {team.recentForm.slice(-5).map((result, i) => (
                      <span key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${result === 'W' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {result}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>
            <span className="font-semibold">MP:</span> Matches Played, {' '}
            <span className="font-semibold">W:</span> Wins, {' '}
            <span className="font-semibold">L:</span> Losses, {' '}
            <span className="font-semibold">Pts:</span> Points
        </p>
        <p>
            <span className="font-semibold">NSM:</span> Net Score Margin (PS - PC), {' '}
            <span className="font-semibold">PS:</span> Points Scored, {' '}
            <span className="font-semibold">PC:</span> Points Conceded
        </p>
      </div>
    </div>
  );
};

export default PointsTable;
