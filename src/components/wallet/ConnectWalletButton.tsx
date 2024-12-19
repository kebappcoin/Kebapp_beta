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
    connecting,
    disconnecting,
    select,
  } = useWallet();
  const { connection } = useConnection();
  const { addNotification } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [notified, setNotified] = useState(false); // State to prevent recursive notifications
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentAddress = publicKey?.toString() || null;

  const redirectToPhantom = () => {
    const dappUrl = encodeURIComponent(window.location.origin);
    const deepLink = `phantom://app?link=${dappUrl}`;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      let fallbackTimeout: any;

      const openDeepLink = () => {
        window.location.href = deepLink;

        fallbackTimeout = setTimeout(() => {
          if (/Android/i.test(navigator.userAgent)) {
            window.location.href =
              'https://play.google.com/store/apps/details?id=app.phantom';
          } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            window.location.href =
              'https://apps.apple.com/app/phantom-solana-wallet/id1598432977';
          }
        }, 1500);
      };

      window.addEventListener('blur', () => clearTimeout(fallbackTimeout), {
        once: true,
      });

      openDeepLink();
    }
  };

  useEffect(() => {
    if (connected && !notified) {
      addNotification('success', 'Wallet successfully connected!');
      setNotified(true);
    }

    if (!connected && notified) {
      setNotified(false);
    }
  }, [connected, addNotification, notified]);

  useEffect(() => {
    const handleAccountChange = () => {
      disconnect().then(() => {
        if (select) select(wallet.adapter.name);
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
  }, [disconnect, select]);

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
      setShowConsentModal(true);
    } else {
      setShowWalletModal(true);
    }
  };

  const handleConsentAndRedirect = () => {
    setShowConsentModal(false);
    redirectToPhantom();
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

        {showConsentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
              <h2 className="text-xl font-bold mb-4">Open Phantom Wallet</h2>
              <p className="text-sm text-gray-600 mb-6">
                Do you want to open the Phantom Wallet app to connect your wallet?
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowConsentModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConsentAndRedirect}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                >
                  Open Wallet
                </button>
              </div>
            </div>
          </div>
        )}
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