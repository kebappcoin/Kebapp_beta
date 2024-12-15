import React, { useCallback, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState } from '@solana/wallet-adapter-base';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
}

export function WalletModal({ isOpen, onClose, onConnect }: WalletModalProps) {
  const { select, wallets, connecting } = useWallet();

  // Filter and sort wallets based on ready state
  const availableWallets = useMemo(() => {
    const installed = wallets.filter(wallet => 
      wallet.readyState === WalletReadyState.Installed
    );
    const loadable = wallets.filter(wallet => 
      wallet.readyState === WalletReadyState.Loadable
    );
    
    return [...installed, ...loadable];
  }, [wallets]);

  // Handle wallet selection
  const handleWalletClick = useCallback(async (walletName: string) => {
    select(walletName);
    onConnect();
    onClose();
  }, [select, onConnect, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connect Wallet">
      <div className="space-y-4">
        {availableWallets.map((wallet) => (
          <button
            key={wallet.adapter.name}
            onClick={() => handleWalletClick(wallet.adapter.name)}
            disabled={connecting}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-[#12131a] hover:bg-gradient-brand group transition-all duration-300 border border-brand-blue/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white p-2 flex items-center justify-center group-hover:bg-black/10">
                {wallet.adapter.icon && (
                  <img 
                    src={wallet.adapter.icon}
                    alt={wallet.adapter.name}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-lg font-medium text-white group-hover:text-black transition-colors">
                  {wallet.adapter.name}
                </span>
                {wallet.readyState === WalletReadyState.Loadable && (
                  <span className="text-sm text-gray-400">
                    Not installed
                  </span>
                )}
              </div>
            </div>

            {connecting && (
              <div className="px-3 py-1 rounded-md bg-white/10 text-white text-sm font-medium">
                Connecting...
              </div>
            )}
          </button>
        ))}

        {availableWallets.length === 0 && (
          <div className="text-center text-gray-400 py-4">
            No compatible wallets found. Please install a Solana wallet.
          </div>
        )}
      </div>
    </Modal>
  );
}