
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
        <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl sm:text-3xl font-bold text-cyan-600 dark:text-cyan-400 mb-4">Invite Others</h2>
                <div className="bg-gray-100 dark:bg-slate-700 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Tournament Invite Code</label>
                        <p className="text-2xl font-mono font-bold tracking-widest text-slate-800 dark:text-slate-200 mt-1">{tournament.inviteCode}</p>
                    </div>
                    <button 
                        onClick={handleCopyCode}
                        className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center w-full sm:w-auto"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" /></svg>
                        Copy Code
                    </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">Share this code with others to let them join this tournament as a viewer. You can change their role below.</p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl sm:text-3xl font-bold text-cyan-600 dark:text-cyan-400 mb-4">Manage Users</h2>
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
        </div>
    );
};

export default UsersManager;
