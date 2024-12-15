import { useState, useRef, useEffect, useCallback } from 'react';
import { Wallet, Copy, User, LogOut, ChevronDown } from 'lucide-react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useNotifications } from '../../context/NotificationContext';
import { WalletModal } from './WalletModal';

interface ConnectWalletButtonProps {
  className?: string;
  variant?: 'header' | 'default';
}

export function ConnectWalletButton({ className = '', variant = 'default' }: ConnectWalletButtonProps) {
  const { 
    publicKey, 
    disconnect, 
    connected, 
    wallet,
    connecting,
    disconnecting,
    select 
  } = useWallet();
  const { connection } = useConnection();
  const { addNotification } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update current address when publicKey changes
  useEffect(() => {
    if (publicKey) {
      setCurrentAddress(publicKey.toString());
    } else {
      setCurrentAddress(null);
    }
  }, [publicKey]);

  // Listen for wallet changes from extension
  useEffect(() => {
    if (!connection || !wallet) return;

    const handleAccountChange = () => {
      // Force refresh wallet state
      disconnect().then(() => {
        if (wallet) {
          select(wallet.adapter.name);
        }
      });
    };

    // Setup listeners for Phantom wallet
    if ((window as any).solana) {
      (window as any).solana.on('accountChanged', handleAccountChange);
    }

    return () => {
      if ((window as any).solana) {
        (window as any).solana.removeListener('accountChanged', handleAccountChange);
      }
    };
  }, [connection, wallet, select, disconnect]);

  // Monitor wallet connection state changes
  useEffect(() => {
    if (connecting) {
      setShowWalletModal(false);
    }
  }, [connecting]);

  const truncateAddress = useCallback((address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  const copyAddress = async () => {
    if (currentAddress) {
      await navigator.clipboard.writeText(currentAddress);
      addNotification('success', 'Address copied to clipboard!');
      setIsDropdownOpen(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setIsDropdownOpen(false);
      setCurrentAddress(null);
      addNotification('info', 'Wallet disconnected');
    } catch (error) {
      console.error('Disconnect error:', error);
      addNotification('error', 'Failed to disconnect wallet');
    }
  };

  const handleConnectWallet = () => {
    setShowWalletModal(true);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!connected || !currentAddress) {
    return (
      <>
        <button 
          onClick={handleConnectWallet}
          disabled={connecting || disconnecting}
          className={`flex items-center gap-2 bg-gradient-brand text-black px-6 py-2.5 rounded-lg hover:shadow-gradient transition-all duration-300 font-semibold disabled:opacity-50 ${className}`}
        >
          <Wallet className="w-5 h-5" />
          {connecting ? 'Connecting...' : 'Connect Wallet'}
        </button>

        <WalletModal 
          isOpen={showWalletModal} 
          onClose={() => setShowWalletModal(false)}
          onConnect={() => {
            setShowWalletModal(false);
          }}
        />
      </>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`flex items-center gap-2 bg-gradient-brand text-black px-6 py-2.5 rounded-lg hover:shadow-gradient transition-all duration-300 font-semibold ${className}`}
      >
        <Wallet className="w-5 h-5" />
        <span>{truncateAddress(currentAddress)}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#1a1b1e] border border-brand-blue/10 rounded-lg shadow-lg overflow-hidden z-50">
          <div className="py-1">
            <button
              onClick={copyAddress}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-white hover:bg-brand-blue/10 transition-colors duration-200"
            >
              <Copy className="w-4 h-4" />
              Copy Address
            </button>
            
            <button
              onClick={() => {
                setIsDropdownOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-white hover:bg-brand-blue/10 transition-colors duration-200"
            >
              <User className="w-4 h-4" />
              Profile
            </button>
            
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-500 hover:bg-brand-blue/10 transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}