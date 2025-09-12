
import React, { useState, useRef, useEffect } from 'react';
import { Team, Group, Player } from '../types';
import Modal from './Modal';

// Declare XLSX library provided by CDN
declare var XLSX: any;

interface TeamsManagerProps {
  teams: Team[];
  groups: Group[];
  onAddTeam: (teamName: string, color: string, groupId: string, playerNames: string[], logo: string | null) => void;
  onDeleteTeam: (teamId: string) => void;
  onAddPlayer: (teamId: string, playerName: string) => void;
  onDeletePlayer: (teamId: string, playerId: string) => void;
  onAddGroup: (groupName: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onEditTeam: (teamId: string, updates: { name: string; color: string; logo: string | null | undefined; groupId: string; players: Player[]; }) => void;
  onEditGroup: (groupId: string, newName: string) => void;
  onAddTeamsBatch: (teamsData: Array<{ groupName: string, teamName: string, playerNames: string[] }>) => void;
  readOnly: boolean;
}

const teamColors = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899'
];

const TeamCard: React.FC<{
    team: Team;
    onDeleteTeam: (teamId: string) => void;
    onDeletePlayer: (teamId: string, playerId: string) => void;
    onOpenPlayerModal: (teamId: string) => void;
    onOpenEditModal: (team: Team) => void;
    readOnly: boolean;
}> = ({ team, onDeleteTeam, onDeletePlayer, onOpenPlayerModal, onOpenEditModal, readOnly }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg flex flex-col">
      <div className="flex justify-between items-start mb-3">
          <div className="flex items-center">
            {team.logo ? (
                <img src={team.logo} alt={`${team.name} logo`} className="w-8 h-8 rounded-full mr-3 object-cover"/>
            ) : (
                <span className="w-5 h-5 rounded-full mr-3 flex-shrink-0" style={{backgroundColor: team.color}}></span>
            )}
            <h3 className="text-xl font-bold">{team.name}</h3>
          </div>
        {!readOnly && (
            <div className="flex items-center space-x-2">
                <button onClick={() => onOpenEditModal(team)} className="text-gray-400 hover:text-cyan-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                </button>
                <button onClick={() => onDeleteTeam(team.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
        )}
      </div>
      <div className="space-y-2 flex-grow">
        {team.players.map((player) => (
          <div key={player.id} className="flex justify-between items-center bg-gray-100 dark:bg-slate-700 p-2 rounded">
            <span>{player.name}</span>
            {!readOnly && (
                <button onClick={() => onDeletePlayer(team.id, player.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            )}
          </div>
        ))}
        {team.players.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No players yet.</p>}
      </div>
      {!readOnly && (
        <button 
            onClick={() => onOpenPlayerModal(team.id)}
            className="mt-4 w-full bg-cyan-50 text-cyan-600 hover:bg-cyan-100 dark:bg-slate-700 dark:text-cyan-400 dark:hover:bg-slate-600 font-semibold py-2 px-3 rounded text-sm transition-colors"
            >
            Add Player
            </button>
      )}
    </div>
);


const TeamsManager: React.FC<TeamsManagerProps> = ({ teams, groups, onAddTeam, onDeleteTeam, onAddPlayer, onDeletePlayer, onAddGroup, onDeleteGroup, onEditTeam, onEditGroup, onAddTeamsBatch, readOnly }) => {
  // Add Team Modal State
  const [isTeamModalOpen, setTeamModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [newTeamLogo, setNewTeamLogo] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(teamColors[0]);
  const [selectedGroupIdForNewTeam, setSelectedGroupIdForNewTeam] = useState('');

  // Add Player Modal State
  const [isPlayerModalOpen, setPlayerModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');

  // Add Group Modal State
  const [isGroupModalOpen, setGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  // Edit Group Modal State
  const [editGroupData, setEditGroupData] = useState<{id: string, name: string} | null>(null);
  
  // Edit Team Modal State
  const [editTeamData, setEditTeamData] = useState<Team | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedColor, setEditedColor] = useState('');
  const [editedLogo, setEditedLogo] = useState<string | null | undefined>(undefined);
  const [editedGroupId, setEditedGroupId] = useState('');
  const [editedPlayers, setEditedPlayers] = useState<Player[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editTeamData) {
        setEditedName(editTeamData.name);
        setEditedColor(editTeamData.color);
        setEditedLogo(editTeamData.logo);
        setEditedGroupId(editTeamData.groupId || '');
        setEditedPlayers(JSON.parse(JSON.stringify(editTeamData.players))); // Deep copy
    }
  }, [editTeamData]);

  const handleAddTeam = () => {
    if (newTeamName.trim() && selectedGroupIdForNewTeam) {
      const playerNames = [player1Name.trim(), player2Name.trim()].filter(name => name !== '');
      onAddTeam(newTeamName.trim(), selectedColor, selectedGroupIdForNewTeam, playerNames, newTeamLogo);
      setNewTeamName('');
      setPlayer1Name('');
      setPlayer2Name('');
      setNewTeamLogo(null);
      setSelectedColor(teamColors[0]);
      setSelectedGroupIdForNewTeam('');
      setTeamModalOpen(false);
    } else {
        alert("Please provide a team name and select a group.");
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewTeamLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleEditLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPlayer = () => {
    if (newPlayerName.trim() && selectedTeamId) {
      onAddPlayer(selectedTeamId, newPlayerName.trim());
      setNewPlayerName('');
      setPlayerModalOpen(false);
    }
  };

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      onAddGroup(newGroupName.trim());
      setNewGroupName('');
      setGroupModalOpen(false);
    }
  };

  const handleSaveTeamChanges = () => {
    if (editTeamData && editedName.trim()) {
        const finalPlayers = editedPlayers.filter(p => p.name.trim() !== '');
        onEditTeam(editTeamData.id, {
            name: editedName.trim(),
            color: editedColor,
            logo: editedLogo,
            groupId: editedGroupId,
            players: finalPlayers
        });
        setEditTeamData(null);
    }
  };

  const handleEditedPlayerNameChange = (playerId: string, newName: string) => {
    setEditedPlayers(prev => prev.map(p => p.id === playerId ? { ...p, name: newName } : p));
  };
  
  const handleDeleteEditedPlayer = (playerId: string) => {
      setEditedPlayers(prev => prev.filter(p => p.id !== playerId));
  };
  
  const handleAddEditedPlayer = () => {
      const newPlayer: Player = { id: crypto.randomUUID(), name: '', score: 0, coins: 0, queens: 0, matchesPlayed: 0 };
      setEditedPlayers(prev => [...prev, newPlayer]);
  };

  const handleSaveGroupChanges = () => {
    if (editGroupData && editGroupData.name.trim()) {
        onEditGroup(editGroupData.id, editGroupData.name.trim());
        setEditGroupData(null);
    }
  };

  const handleDownloadTemplate = () => {
    const wsData = [
      ["Group Name", "Team Name", "Player 1 Name (Optional)", "Player 2 Name (Optional)"],
      ["Group A", "The Champions", "John Doe", "Jane Smith"], // Example row
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Teams");
    XLSX.writeFile(wb, "teams_template.xlsx");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json: any[] = XLSX.utils.sheet_to_json(worksheet);

            const newTeamsData: Array<{ groupName: string, teamName: string, playerNames: string[] }> = [];
            const errors: string[] = [];

            json.forEach((row, index) => {
                const groupName = row["Group Name"];
                const teamName = row["Team Name"];

                if (!groupName || !teamName) {
                    if (Object.keys(row).length > 0) errors.push(`Row ${index + 2}: Missing Group Name or Team Name.`);
                    return;
                }

                const player1 = row["Player 1 Name (Optional)"] || '';
                const player2 = row["Player 2 Name (Optional)"] || '';
                const playerNames = [String(player1).trim(), String(player2).trim()].filter(name => name);

                newTeamsData.push({
                    groupName: String(groupName).trim(),
                    teamName: String(teamName).trim(),
                    playerNames,
                });
            });
            
            if (newTeamsData.length > 0) {
                onAddTeamsBatch(newTeamsData);
            }

            if (errors.length > 0) {
                alert(`Import complete with issues:\n- ${newTeamsData.length} teams processed.\n- ${errors.length} rows had errors:\n\n${errors.join('\n')}`);
            } else if (newTeamsData.length > 0) {
                alert(`${newTeamsData.length} teams imported successfully.`);
            } else {
                alert('No valid teams found to import. Please check the file and try again.');
            }
        } catch (error) {
            console.error("Error parsing file:", error);
            alert("There was an error processing the file. Please ensure it's a valid Excel file and matches the template format.");
        } finally {
            if (event.target) event.target.value = '';
        }
    };
    reader.readAsBinaryString(file);
  };

  const unassignedTeams = teams.filter(t => !t.groupId || !groups.some(g => g.id === t.groupId));

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md">
          <h2 className="text-2xl sm:text-3xl font-bold text-cyan-600 dark:text-cyan-400 self-start sm:self-center">Teams</h2>
          {!readOnly && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button onClick={handleDownloadTemplate} className="bg-slate-500 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Template
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Upload
                </button>
                <button 
                    onClick={() => setGroupModalOpen(true)}
                    className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Add Group
                </button>
                <button 
                    onClick={() => { 
                        if (groups.length > 0) {
                            setSelectedGroupIdForNewTeam(groups[0].id);
                            setTeamModalOpen(true);
                        } else {
                            alert("Please create a group first before adding a team.");
                        }
                    }} 
                    className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                Add Team
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".xlsx, .xls" />
            </div>
          )}
        </div>

      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.id}>
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300">{group.name}</h3>
                {!readOnly && (
                    <div className="flex items-center space-x-2">
                        <button onClick={() => setEditGroupData(group)} className="text-gray-400 hover:text-cyan-500 transition-colors" aria-label={`Edit ${group.name}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                        </button>
                        <button onClick={() => onDeleteGroup(group.id)} className="text-gray-400 hover:text-red-500 transition-colors" aria-label={`Delete ${group.name}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                )}
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {teams.filter(t => t.groupId === group.id).map((team) => (
                      <TeamCard 
                          key={team.id}
                          team={team} 
                          onDeleteTeam={onDeleteTeam} 
                          onDeletePlayer={onDeletePlayer}
                          onOpenPlayerModal={(teamId) => { setSelectedTeamId(teamId); setPlayerModalOpen(true); }}
                          onOpenEditModal={setEditTeamData}
                          readOnly={readOnly}
                      />
                  ))}
               </div>
          </section>
        ))}

        {unassignedTeams.length > 0 && (
           <section>
              <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-4">Unassigned Teams</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {unassignedTeams.map((team) => (
                      <TeamCard 
                          key={team.id}
                          team={team} 
                          onDeleteTeam={onDeleteTeam} 
                          onDeletePlayer={onDeletePlayer}
                          onOpenPlayerModal={(teamId) => { setSelectedTeamId(teamId); setPlayerModalOpen(true); }}
                          onOpenEditModal={setEditTeamData}
                          readOnly={readOnly}
                      />
                  ))}
               </div>
          </section>
        )}
      </div>
      
      <Modal isOpen={isTeamModalOpen} onClose={() => setTeamModalOpen(false)} title="Add New Team">
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Group</label>
                <select value={selectedGroupIdForNewTeam} onChange={e => setSelectedGroupIdForNewTeam(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-slate-200">
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
            </div>
            <input type="text" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="Team Name" className="w-full bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-slate-200 p-2 rounded border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
            
            <hr className="dark:border-slate-600"/>
            
            <input type="text" value={player1Name} onChange={e => setPlayer1Name(e.target.value)} placeholder="Player 1 Name (Optional)" className="w-full bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-slate-200 p-2 rounded border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
            <input type="text" value={player2Name} onChange={e => setPlayer2Name(e.target.value)} placeholder="Player 2 Name (Optional)" className="w-full bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-slate-200 p-2 rounded border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
            
            <hr className="dark:border-slate-600"/>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Team Logo (Optional)</label>
                <div className="mt-1 flex items-center space-x-4">
                    {newTeamLogo ? (
                        <img src={newTeamLogo} alt="Team logo preview" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                        <span className="flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </span>
                    )}
                    <label htmlFor="logo-upload" className="cursor-pointer bg-white dark:bg-slate-600 py-2 px-3 border border-gray-300 dark:border-slate-500 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-500">
                        Upload
                    </label>
                    <input id="logo-upload" name="logo-upload" type="file" className="sr-only" accept="image/*" onChange={handleLogoUpload} />
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {teamColors.map(color => (
                    <button key={color} onClick={() => setSelectedColor(color)} className={`w-8 h-8 rounded-full transition-transform transform hover:scale-110 ${selectedColor === color ? 'ring-2 ring-offset-2 ring-cyan-500 dark:ring-offset-slate-800' : ''}`} style={{backgroundColor: color}}></button>
                ))}
            </div>
            <button onClick={handleAddTeam} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                Create Team
            </button>
        </div>
      </Modal>

      <Modal isOpen={isGroupModalOpen} onClose={() => setGroupModalOpen(false)} title="Add New Group">
        <div className="space-y-4">
            <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Group Name (e.g., Group A)" className="w-full bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-slate-200 p-2 rounded border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
            <button onClick={handleAddGroup} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                Create Group
            </button>
        </div>
      </Modal>

      <Modal isOpen={isPlayerModalOpen} onClose={() => setPlayerModalOpen(false)} title={`Add Player to ${teams.find(t => t.id === selectedTeamId)?.name || ''}`}>
        <div className="space-y-4">
            <input type="text" value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} placeholder="Player Name" className="w-full bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-slate-200 p-2 rounded border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
            <button onClick={handleAddPlayer} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                Add Player
            </button>
        </div>
      </Modal>

      <Modal isOpen={!!editTeamData} onClose={() => setEditTeamData(null)} title="Edit Team">
        {editTeamData && (
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Group</label>
                    <select value={editedGroupId} onChange={e => setEditedGroupId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-slate-200">
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </div>

                <input type="text" value={editedName} onChange={e => setEditedName(e.target.value)} placeholder="Team Name" className="w-full bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-slate-200 p-2 rounded border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Team Logo</label>
                    <div className="mt-1 flex items-center space-x-4">
                        {editedLogo ? (
                            <img src={editedLogo} alt="Team logo preview" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                            <span className="flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </span>
                        )}
                        <label htmlFor="edit-logo-upload" className="cursor-pointer bg-white dark:bg-slate-600 py-2 px-3 border border-gray-300 dark:border-slate-500 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-500">
                            Change
                        </label>
                        <input id="edit-logo-upload" name="edit-logo-upload" type="file" className="sr-only" accept="image/*" onChange={handleEditLogoUpload} />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {teamColors.map(color => (
                        <button key={color} onClick={() => setEditedColor(color)} className={`w-8 h-8 rounded-full transition-transform transform hover:scale-110 ${editedColor === color ? 'ring-2 ring-offset-2 ring-cyan-500 dark:ring-offset-slate-800' : ''}`} style={{backgroundColor: color}}></button>
                    ))}
                </div>

                <hr className="dark:border-slate-600"/>

                <div>
                    <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Players</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {editedPlayers.map((player, index) => (
                            <div key={player.id} className="flex items-center gap-2">
                                <input 
                                    type="text" 
                                    value={player.name}
                                    onChange={e => handleEditedPlayerNameChange(player.id, e.target.value)}
                                    placeholder={`Player ${index + 1} Name`}
                                    className="w-full bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-slate-200 p-2 rounded border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                                <button onClick={() => handleDeleteEditedPlayer(player.id)} className="text-gray-400 hover:text-red-500 p-1 rounded-full transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleAddEditedPlayer} className="mt-3 text-sm text-cyan-600 dark:text-cyan-400 hover:underline font-semibold">
                        + Add Player
                    </button>
                </div>
                
                <button onClick={handleSaveTeamChanges} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors !mt-6">
                    Save Changes
                </button>
            </div>
        )}
      </Modal>

      <Modal isOpen={!!editGroupData} onClose={() => setEditGroupData(null)} title="Edit Group">
        <div className="space-y-4">
            <input type="text" value={editGroupData?.name || ''} onChange={e => setEditGroupData(prev => prev ? {...prev, name: e.target.value} : null)} placeholder="Group Name" className="w-full bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-slate-200 p-2 rounded border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
            <button onClick={handleSaveGroupChanges} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                Save Changes
            </button>
        </div>
      </Modal>
    </div>
  );
};

export default TeamsManager;
