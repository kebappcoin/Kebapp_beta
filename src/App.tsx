import { Header } from './components/layout/Header';
import { TokenSaleDetails } from './components/presale/TokenSaleDetails';
import { ReferralSection } from './components/presale/ReferralSection';
import { NotificationProvider } from './context/NotificationContext';
import { UserProvider } from './context/UserContext';
import { PresaleProvider } from './context/PresaleContext';
import { NotificationList } from './components/ui/Notification';
import { KebabBackground } from './components/background/KebabBackground';
import { WalletModal } from './components/wallet/WalletModal';
import { useUser } from './context/UserContext';
import { usePresale } from './context/PresaleContext';
import { Rocket, Gift, Timer } from 'lucide-react';
import { WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter, SolflareWalletAdapter, AlphaWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import React from 'react';

const PRESALE_START = new Date('2024-12-20T18:00:00Z'); // 19:00 CET
const PRESALE_END = new Date('2024-12-22T17:59:00Z');   // 18:59 CET

const tiers = [
  {
    range: 'First $1M',
    bonus: 10,
    icon: Gift,
  },
  {
    range: '$1M - $2M',
    bonus: 5,
    status: 'upcoming',
    icon: Timer,
  },
  {
    range: '$2M - $2.25M',
    bonus: 0,
    status: 'upcoming',
    icon: Timer,
  },
];

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = React.useState(null);
  const [isPresaleStarted, setIsPresaleStarted] = React.useState(false);

  const calculateTimeLeft = () => {
    const now = new Date();
    const targetDate = now < PRESALE_START ? PRESALE_START : PRESALE_END;
    const difference = targetDate - now;

    if (difference <= 0) {
      if (!isPresaleStarted && now >= PRESALE_START) {
        setIsPresaleStarted(true);
      }
      return null;
    }

    return {
      days: String(Math.floor(difference / (1000 * 60 * 60 * 24))).padStart(2, '0'),
      hours: String(Math.floor((difference / (1000 * 60 * 60)) % 24)).padStart(2, '0'),
      minutes: String(Math.floor((difference / 1000 / 60) % 60)).padStart(2, '0'),
      seconds: String(Math.floor((difference / 1000) % 60)).padStart(2, '0'),
    };
  };

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [isPresaleStarted]);

  if (!timeLeft) return null;

  return (
    <div className="w-full max-w-2xl mx-auto text-center">
      <h2 className="text-3xl sm:text-4xl font-bold mb-8" style={{
        background: 'linear-gradient(267deg, #F4F914 1.61%, #19C5E2 98.09%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        {isPresaleStarted ? "Presale Ends In" : "Presale Begins In"}
      </h2>
      <div className="grid grid-cols-4 gap-4">
        {[
          { value: timeLeft.days, label: 'DAYS' },
          { value: timeLeft.hours, label: 'HOURS' },
          { value: timeLeft.minutes, label: 'MINUTES' },
          { value: timeLeft.seconds, label: 'SECONDS' }
        ].map(({ value, label }) => (
          <div key={label} className="relative">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg border border-[#19C5E2]/20">
              <div className="text-5xl sm:text-6xl font-bold mb-2" style={{
                background: 'linear-gradient(267deg, #F4F914 1.61%, #19C5E2 98.09%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {value}
              </div>
              <div className="text-gray-400 text-sm sm:text-base uppercase tracking-wider">
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TierCard({ tier }) {
  const isActive = tier.status === 'active';
  return (
    <div className={`relative overflow-hidden rounded-xl p-4 border ${
      isActive 
        ? 'bg-gradient-to-br from-[#F4F914]/20 to-[#19C5E2]/20 border-[#19C5E2]/20' 
        : 'bg-black/20 border-gray-800'
    }`}>
      {isActive && (
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#19C5E2]/20 text-[#19C5E2]">
            Active Now
          </span>
        </div>
      )}
      
      <div className="flex items-center gap-4">
        <tier.icon className={`w-6 h-6 ${
          isActive ? 'text-[#19C5E2]' : 'text-gray-400'
        }`} />
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{tier.range}</h3>
          <p className="text-2xl font-bold mt-1">
            {tier.bonus}%
            <span className="text-base text-gray-400 ml-1">bonus</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { isWalletModalOpen, setWalletModalOpen } = useUser();

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white relative overflow-hidden">
      <Header />
      <KebabBackground />
      <main className="relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-12 sm:pb-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight" style={{
                  background: 'linear-gradient(267deg, #F4F914 1.61%, #19C5E2 98.09%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Join the KebappCoin Revolution
                </h1>
                <p className="text-lg text-gray-300/90 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Be part of the first kebab-backed cryptocurrency. Early investors get exclusive benefits and rewards in our limited-time presale event.
                </p>
              </div>
              
              <div className="space-y-4">
                {tiers.map((tier) => (
                  <TierCard key={tier.range} tier={tier} />
                ))}
              </div>

              <CountdownTimer />
            </div>

            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <TokenSaleDetails />
              </div>
            </div>
          </div>
        </div>

        <div className="py-12 sm:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <ReferralSection />
          </div>
        </div>
      </main>

      <WalletModal 
        isOpen={isWalletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />
      
      <NotificationList />
    </div>
  );
}

function App() {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <NotificationProvider>
          <UserProvider>
            <PresaleProvider>
              <AppContent />
            </PresaleProvider>
          </UserProvider>
        </NotificationProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;