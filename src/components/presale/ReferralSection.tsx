import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Link, Gift, Check, Wallet } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useNotifications } from '../../context/NotificationContext';

export function ReferralSection() {
  const [copied, setCopied] = useState(false);
  const { referralCode, walletAddress, connectWallet } = useUser();
  const { addNotification } = useNotifications();

  const referralLink = referralCode 
    ? `https://kebappcoin.io/ref/${referralCode}`
    : 'Connect wallet to get your referral code';

  const handleCopy = () => {
    if (!referralCode) {
      addNotification('warning', 'Please connect your wallet first');
      return;
    }
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    addNotification('success', 'Referral code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };
  

  return (
    <Card className="max-w-5xl mx-auto animate-slide-up" style={{ animationDelay: '0.4s' }}>
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-brand bg-clip-text text-transparent">
            Referral Program
          </h2>
          <p className="text-gray-400">Share KebappCoin with your friends and earn rewards</p>
        </div>

        <div className="grid gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <Gift className="w-6 h-6 text-brand-yellow animate-pulse-slow" />
              <h3 className="text-xl font-bold text-white">Referral Rewards</h3>
            </div>
            <div className="p-6 bg-[#12131a] rounded-lg border border-brand-blue/20 hover:border-brand-blue/40 transition-all duration-300 hover:transform hover:scale-[1.02] group">
              <p className="text-gray-300 leading-relaxed">
                Get <span className="text-white font-bold">2% rewards</span> in Kebapp tokens for every successful purchase made using your referral code. The more friends you invite, the more tokens you earn!
              </p>
            </div>
          </div>

         
        </div>

        <div className="bg-gradient-brand p-8 rounded-xl text-black text-center hover:shadow-gradient transition-all duration-300">
          <h3 className="text-2xl font-bold mb-4">Start Earning Today</h3>
          <p className="mb-6 opacity-80">
            Share your referral code and earn 2% Kebapp token rewards and 1% as bonus if referal code is used for every successful purchase
          </p>
          {!walletAddress ? (
            <button 
              onClick={connectWallet}
              className="bg-black/20 text-black font-bold py-3 px-8 rounded-lg transition-all duration-300 hover:bg-black/30 flex items-center gap-2 mx-auto"
            >
              <Wallet className="w-5 h-5" />
              Connect Wallet
            </button>
          ) : (
            <button 
              onClick={handleCopy}
              className="bg-black/20 text-black font-bold py-3 px-8 rounded-lg transition-all duration-300 hover:bg-black/30 flex items-center gap-2 mx-auto"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Copied!</span>
                </>
              ) : (
                'Copy Referral Code'
              )}
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}