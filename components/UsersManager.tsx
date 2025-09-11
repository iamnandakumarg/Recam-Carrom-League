
import React, { useState } from 'react';
import { Tournament, User, Permissions } from '../types';

interface UsersManagerProps {
  tournament: Tournament;
  onUpdateTournament: (tournamentId: string, updater: (current: Tournament) => Tournament) => void;
  currentUser: User;
}

const UsersManager: React.FC<UsersManagerProps> = ({ tournament, onUpdateTournament, currentUser }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(tournament.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePermissionChange = (userId: string, permission: keyof Permissions, value: boolean) => {
    onUpdateTournament(tournament.id, currentTournament => {
      const updatedPermissions = {
        ...currentTournament.permissions,
        [userId]: {
          ...currentTournament.permissions[userId],
          [permission]: value,
        },
      };
      return { ...currentTournament, permissions: updatedPermissions };
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl sm:text-3xl font-bold text-cyan-600 dark:text-cyan-400 mb-4">Manage Users</h2>
        
        <div className="mb-6 bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Invite Others</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Share this code with others to let them join this tournament with view-only access. You can grant them editing rights below.</p>
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    readOnly
                    value={tournament.inviteCode}
                    className="w-full sm:w-auto flex-grow bg-gray-200 dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-mono p-2 rounded border border-gray-300 dark:border-slate-600 focus:outline-none"
                />
                <button
                    onClick={handleCopyInviteCode}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b-2 border-gray-300 dark:border-slate-600">
              <tr>
                <th className="p-2 text-sm font-semibold tracking-wide text-left">User</th>
                <th className="p-2 text-sm font-semibold tracking-wide text-center">Edit Teams</th>
                <th className="p-2 text-sm font-semibold tracking-wide text-center">Edit Matches</th>
                <th className="p-2 text-sm font-semibold tracking-wide text-center">Finalize Results</th>
              </tr>
            </thead>
            <tbody>
              {tournament.users.map((user) => {
                const userPermissions = tournament.permissions[user.id] || {};
                const isCurrentUserAdmin = tournament.adminId === user.id;

                return (
                  <tr key={user.id} className="border-b border-gray-200 dark:border-slate-700">
                    <td className="p-3">
                      <p className="font-semibold">{user.name} {user.id === currentUser.id && '(You)'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email} {isCurrentUserAdmin && <span className="font-bold text-cyan-500">(Admin)</span>}</p>
                    </td>
                    {(Object.keys(userPermissions) as Array<keyof Permissions>).map((permKey) => (
                      <td key={permKey} className="p-3 text-center">
                        <input
                          type="checkbox"
                          className="h-5 w-5 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500 dark:bg-slate-600 dark:border-slate-500"
                          checked={userPermissions[permKey]}
                          disabled={isCurrentUserAdmin}
                          onChange={(e) => handlePermissionChange(user.id, permKey, e.target.checked)}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersManager;
