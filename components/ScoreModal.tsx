
import React, { useState, useEffect } from 'react';
import Modal from './Modal';

interface ScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (coins: number, queen: boolean) => void;
  playerName?: string;
}

const ScoreModal: React.FC<ScoreModalProps> = ({ isOpen, onClose, onSubmit, playerName }) => {
  const [coins, setCoins] = useState(0);
  const [hasQueen, setHasQueen] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCoins(0);
      setHasQueen(false);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    onSubmit(coins, hasQueen);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Update Score for ${playerName || 'Player'}`}>
      <div className="space-y-4">
        <div>
          <label htmlFor="coins-input" className="block text-sm font-medium text-gray-700">Coins Pocketed</label>
          <input
            id="coins-input"
            type="number"
            min="0"
            value={coins}
            onChange={(e) => setCoins(parseInt(e.target.value, 10) || 0)}
            className="mt-1 w-full bg-gray-50 text-slate-900 p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-label="Coins pocketed"
          />
        </div>
        <div className="flex items-center">
          <input
            id="queen-checkbox"
            type="checkbox"
            checked={hasQueen}
            onChange={(e) => setHasQueen(e.target.checked)}
            className="h-4 w-4 text-cyan-600 bg-gray-100 border-gray-300 rounded focus:ring-cyan-500"
          />
          <label htmlFor="queen-checkbox" className="ml-2 block text-sm text-gray-700">Queen Pocketed (+3 points)</label>
        </div>
        <button onClick={handleSubmit} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
          Update Score
        </button>
      </div>
    </Modal>
  );
};

export default ScoreModal;