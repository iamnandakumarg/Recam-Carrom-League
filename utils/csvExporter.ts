
import { Team } from '../types';

interface PointsTableRow extends Team {
  nsm: number;
}

export const exportPointsTableToCSV = (pointsTableData: PointsTableRow[], tournamentName: string) => {
  const headers = ['Rank', 'Team', 'MP', 'W', 'L', 'Pts', 'NSM', 'PS', 'PC', 'Recent Form'];
  const csvRows = [headers.join(',')];

  pointsTableData.forEach((row, index) => {
    const values = [
      index + 1,
      `"${row.name}"`,
      row.matchesPlayed,
      row.wins,
      row.losses,
      row.points,
      row.nsm,
      row.pointsScored,
      row.pointsConceded,
      `"${row.recentForm.join(', ')}"`,
    ];
    csvRows.push(values.join(','));
  });

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  const safeFileName = tournamentName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  link.setAttribute('download', `${safeFileName}_points_table.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
