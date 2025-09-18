

import React, { useMemo } from 'react';
import { Tournament, User, CollaboratorRole } from '../types';

interface UsersManagerProps {
    tournament: Tournament;
    currentUser: User;
    users: User[];
    isOwner: boolean;
    onUpdateRole: (userId: string, role: CollaboratorRole) => void;
    onRemoveUser: (userId: string) => void;
}

const UsersManager: React.FC<UsersManagerProps> = ({ tournament, currentUser, users, isOwner, onUpdateRole, onRemoveUser }) => {

    const allMembers = useMemo(() => {
        const owner = users.find(u => u.id === tournament.ownerId);
        const collaborators = tournament.collaborators.map(c => {
            const user = users.find(u => u.id === c.userId);
            return {
                ...c,
                email: user?.email || 'Unknown User'
            }
        });
        const ownerEntry = owner ? [{ userId: owner.id, email: owner.email, role: 'Owner' as const }] : [];

        return [...ownerEntry, ...collaborators];
    }, [tournament, users]);
    
    const handleCopyCode = () => {
        navigator.clipboard.writeText(tournament.inviteCode)
            .then(() => alert('Invite code copied to clipboard!'))
            .catch(err => console.error('Failed to copy invite code: ', err));
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl sm:text-3xl font-bold text-cyan-600 dark:text-cyan-400 mb-6">Manage Users & Share</h2>

            <div className="mb-8 bg-cyan-50 dark:bg-slate-700/50 p-4 rounded-lg border border-cyan-200 dark:border-slate-600">
                <h3 className="text-lg font-semibold text-cyan-800 dark:text-cyan-300">Invite Others</h3>
                <p className="text-sm text-cyan-700 dark:text-slate-300 mt-1 mb-3">Share this code with others to let them join your tournament as a viewer. You can change their role later.</p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input 
                        type="text" 
                        readOnly 
                        value={tournament.inviteCode} 
                        className="w-full sm:w-auto flex-grow bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 p-2 rounded border border-gray-300 dark:border-slate-500 font-mono text-center tracking-widest"
                        aria-label="Invite Code"
                    />
                    <button 
                        onClick={handleCopyCode} 
                        className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center shadow"
                        aria-label="Copy invite code"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Code
                    </button>
                </div>
            </div>

             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="border-b-2 border-gray-300 dark:border-slate-600">
                        <tr>
                            <th className="p-2 text-sm font-semibold tracking-wide text-left">User</th>
                            <th className="p-2 text-sm font-semibold tracking-wide text-left">Role</th>
                            {isOwner && <th className="p-2 text-sm font-semibold tracking-wide text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {allMembers.map(member => (
                            <tr key={member.userId} className="border-b border-gray-200 dark:border-slate-700">
                                <td className="p-3">
                                    <p className="font-semibold">{member.email}</p>
                                    {member.userId === currentUser.id && <span className="text-xs text-cyan-500">(You)</span>}
                                </td>
                                <td className="p-3">
                                    {isOwner && member.role !== 'Owner' ? (
                                        <select 
                                            value={member.role} 
                                            onChange={(e) => onUpdateRole(member.userId, e.target.value as CollaboratorRole)}
                                            className="bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-slate-200 p-2 rounded border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                        >
                                            <option value="editor">Editor</option>
                                            <option value="viewer">Viewer</option>
                                        </select>
                                    ) : (
                                        <span className={`font-semibold py-1 px-3 rounded-full text-xs ${
                                            member.role === 'Owner' ? 'bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-200' :
                                            member.role === 'editor' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-800 dark:text-cyan-200' :
                                            'bg-gray-200 text-gray-800 dark:bg-slate-600 dark:text-slate-200'
                                        }`}>
                                            {member.role}
                                        </span>
                                    )}
                                </td>
                                {isOwner && (
                                    <td className="p-3 text-right">
                                        {member.role !== 'Owner' && (
                                            <button
                                                onClick={() => onRemoveUser(member.userId)}
                                                className="text-gray-400 hover:text-red-500 font-semibold transition-colors text-xs uppercase"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </div>
    );
};

export default UsersManager;