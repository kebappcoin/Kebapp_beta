import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Wallet, Copy, User, LogOut, ChevronDown } from 'lucide-react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useNotifications } from '../../context/NotificationContext';
import { WalletModal } from './WalletModal';

interface ConnectWalletButtonProps {
  className?: string;
  variant?: 'header' | 'default';
}

export function ConnectWalletButton({
  className = '',
  variant = 'default',
}: ConnectWalletButtonProps) {
  const {
    publicKey,
    disconnect,
    connected,
    wallet,
    connecting,
    disconnecting,
    select,
  } = useWallet();
  const { connection } = useConnection();
  const { addNotification } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentAddress = publicKey?.toString() || null;

  const redirectToPhantom = () => {
    const dappUrl = encodeURIComponent(window.location.origin); // Dynamically get your app's URL
    const deepLink = `phantom://app?link=${dappUrl}`;
  
    // Check if the device is mobile
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  
    if (isMobile) {
      if (/Android/i.test(navigator.userAgent)) {
        // Redirect to Phantom Wallet on Google Play if not installed
        window.location.href =
          'https://play.google.com/store/apps/details?id=app.phantom';
      } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        // Redirect to Phantom Wallet on the App Store if not installed
        window.location.href =
          'https://apps.apple.com/app/phantom-solana-wallet/id1598432977';
      } else {
        // Attempt to open Phantom Wallet via deep link
        window.location.href = deepLink;
      }
    } else {
      alert(
        'Phantom Wallet deep linking is only supported on mobile devices. Please use a mobile browser or the Phantom Wallet app.'
      );
    }
  };

  // Wallet account change listener
  useEffect(() => {
    const handleAccountChange = () => {
      disconnect().then(() => {
        if (wallet) select(wallet.adapter.name);
      });
    };

    if (window?.solana) {
      window.solana.on('accountChanged', handleAccountChange);
    }

    return () => {
      if (window?.solana) {
        window.solana.removeListener('accountChanged', handleAccountChange);
      }
    };
  }, [wallet, disconnect, select]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const truncateAddress = useCallback(
    (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`,
    []
  );

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
      addNotification('info', 'Wallet disconnected');
    } catch (error) {
      console.error('Disconnect error:', error);
      addNotification('error', 'Failed to disconnect wallet');
    } finally {
      setIsDropdownOpen(false);
    }
  };

  const handleConnectWallet = () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  
    if (isMobile) {
      // On mobile, use deep linking
      redirectToPhantom();
    } else {
      // On desktop, show the wallet modal
      setShowWalletModal(true);
    }
  };

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
          onConnect={() => setShowWalletModal(false)}
        />
      </>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        className={`flex items-center gap-2 bg-gradient-brand text-black px-6 py-2.5 rounded-lg hover:shadow-gradient transition-all duration-300 font-semibold ${className}`}
      >
        <Wallet className="w-5 h-5" />
        <span>{truncateAddress(currentAddress)}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isDropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#1a1b1e] border border-brand-blue/10 rounded-lg shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={copyAddress}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-white hover:bg-brand-blue/10 transition-colors duration-200"
            >
              <Copy className="w-4 h-4" />
              Copy Address
            </button>
            <button
              onClick={() => setIsDropdownOpen(false)}
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