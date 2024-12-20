import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';

interface TransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  signature: string;
  amount: number;
  kebabCoins: number;
}

export default function TransactionDialog({ isOpen, onClose, signature, amount, kebabCoins }: TransactionDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <Card className="relative w-full max-w-md mx-4 bg-white p-6 rounded-lg shadow-xl">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Transaction Successful</h2>
          
          <div>
            <p className="mb-2 text-sm text-gray-600">Signature</p>
            <a
              href={`https://explorer.solana.com/tx/${signature}?cluster=mainnet-beta`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline text-sm font-mono break-all"
            >
              {signature}
            </a>
          </div>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div>
              <p className="text-sm text-gray-600 mb-1">Amount Invested</p>
              <p className="font-semibold text-gray-900">${amount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Kebab Coins Staked</p>
              <p className="font-semibold text-gray-900">{kebabCoins} Coins</p>
            </div>
          </div>

          <Button 
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors"
          >
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}