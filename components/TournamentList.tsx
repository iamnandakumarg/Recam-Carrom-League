
import React, { useState } from 'react';
import { Tournament, User } from '../types';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';

interface TournamentListProps {
  tournaments: Tournament[];
  currentUser: User;
  onSelectTournament: (id: string) => void;
  onAddTournament: (name: string) => void;
  onDeleteTournament: (id: string) => void;
  onJoinTournament: (inviteCode: string) => void;
  onLogout: () => void;
}

const TournamentList: React.FC<TournamentListProps> = ({ tournaments, currentUser, onSelectTournament, onAddTournament, onDeleteTournament, onJoinTournament, onLogout }) => {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setJoinModalOpen] = useState(false);
  const [newTournamentName, setNewTournamentName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    tournamentIdToDelete: string | null;
  }>({ isOpen: false, tournamentIdToDelete: null });

  const handleAddTournament = () => {
    if (newTournamentName.trim()) {
      onAddTournament(newTournamentName.trim());
      setNewTournamentName('');
      setCreateModalOpen(false);
    } else {
      alert('Please enter a tournament name.');
    }
  };

  const handleJoinTournament = () => {
    if(inviteCode.trim()) {
      onJoinTournament(inviteCode.trim());
      setInviteCode('');
      setJoinModalOpen(false);
    } else {
      alert('Please enter an invite code.');
    }
  }

  const openDeleteConfirm = (tournamentId: string) => {
    setConfirmState({ isOpen: true, tournamentIdToDelete: tournamentId });
  };

  const confirmDelete = () => {
    if (confirmState.tournamentIdToDelete) {
      onDeleteTournament(confirmState.tournamentIdToDelete);
      setConfirmState({ isOpen: false, tournamentIdToDelete: null });
    }
  };

  const userTournaments = tournaments.filter(t => 
    t.ownerId === currentUser.id || t.collaborators.some(c => c.userId === currentUser.id)
  );

  return (
    <>
      <div className="p-4 md:p-8">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 pb-6 border-b border-gray-200 dark:border-slate-700">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">Carrom Tournaments</h1>
            <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600 dark:text-slate-300 hidden sm:block">{currentUser.email}</span>
                <button onClick={onLogout} className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 font-semibold py-2 px-4 rounded-lg transition-colors text-sm">
                    Logout
                </button>
            </div>
        </header>
        
        <div className="flex flex-col sm:flex-row justify-end items-center mb-6 gap-2">
            <button
            onClick={() => setJoinModalOpen(true)}
            className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center shadow-lg w-full sm:w-auto"
            >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                Join Tournament
            </button>
            <button
            onClick={() => setCreateModalOpen(true)}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center shadow-lg w-full sm:w-auto"
            >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
            New Tournament
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userTournaments.map((t) => (
            <div key={t.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden group transition-shadow hover:shadow-xl flex flex-col">
              <div className="p-5 flex-grow cursor-pointer" onClick={() => onSelectTournament(t.id)}>
                  <h2 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 group-hover:text-cyan-500 transition-colors">{t.name}</h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">{t.teams.length} teams, {t.matches.length} matches</p>
                  {t.ownerId === currentUser.id && <span className="text-xs font-bold bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200 py-1 px-2 rounded-full mt-3 inline-block">Owner</span>}
              </div>
              {t.ownerId === currentUser.id && (
                <div className="bg-gray-50 dark:bg-slate-800/50 p-3 flex justify-end border-t border-gray-100 dark:border-slate-700">
                    <button
                        onClick={(e) => { e.stopPropagation(); openDeleteConfirm(t.id); }}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {userTournaments.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                <h2 className="text-2xl text-gray-500 dark:text-gray-400">No tournaments yet.</h2>
                <p className="text-gray-400 dark:text-gray-500 mt-2">Click "New Tournament" to create one, or "Join Tournament" to join with an invite code.</p>
            </div>
        )}

        <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Tournament">
          <div className="space-y-4">
            <div>
              <label htmlFor="tournament-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tournament Name <span className="text-red-500">*</span>
              </label>
              <input id="tournament-name" type="text" value={newTournamentName} onChange={(e) => setNewTournamentName(e.target.value)} placeholder="Tournament Name" className="w-full bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-slate-200 p-3 rounded border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
            <button onClick={handleAddTournament} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition-colors !mt-6">
              Create
            </button>
          </div>
        </Modal>

        <Modal isOpen={isJoinModalOpen} onClose={() => setJoinModalOpen(false)} title="Join a Tournament">
          <div className="space-y-4">
            <div>
              <label htmlFor="invite-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Invite Code <span className="text-red-500">*</span>
              </label>
              <input id="invite-code" type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="Enter code" className="w-full bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-slate-200 p-3 rounded border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
            <button onClick={handleJoinTournament} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-4 rounded-lg transition-colors !mt-6">
              Join
            </button>
          </div>
        </Modal>

      </div>
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, tournamentIdToDelete: null })}
        onConfirm={confirmDelete}
        title="Delete Tournament"
        message="Are you sure you want to delete this entire tournament? This action is permanent and cannot be undone."
      />
    </>
  );
};

export default TournamentList;
