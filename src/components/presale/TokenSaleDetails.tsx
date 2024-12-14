import { useState, useEffect, useCallback } from 'react';
import { 
  PublicKey, 
  Transaction, 
  SystemProgram,
  TransactionInstruction,
  SendTransactionError,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { Target, Wallet, Copy, CheckCircle2 } from 'lucide-react';
import { usePresale } from '../../context/PresaleContext';
import { TokenInput } from '../ui/TokenInput';
import { useNotifications } from '../../context/NotificationContext';
import { useUser } from '../../context/UserContext';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';

// Phantom wallet types
interface PhantomProvider {
  on: (event: string, callback: () => void) => void;
  removeListener: (event: string, callback: () => void) => void;
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  publicKey: PublicKey | null;
}

interface WalletWindow extends Window {
  solana?: PhantomProvider;
}

declare const window: WalletWindow;

// Program Constants
const PROGRAM_ID = new PublicKey('E8ofPC2RXn7yGC2xVRDwzwMZQKNkXV75Hmpm4AXpNCjz');
const ADMIN_WALLET = new PublicKey('2FcJbN2kgx3eB1JeJgoBKczpAsXxJzosq269CoidxfhA');

// Investment Limits
const MIN_INVESTMENT = 50;
const MAX_INVESTMENT = 5000;
const HARDCAP_SOL = 2250000;

// Available Tokens
const TOKENS = [
  {
    symbol: 'SOL',
    icon: "./images/sol.png",
    decimals: LAMPORTS_PER_SOL,
    instructionIndex: 0
  },
  {
    symbol: 'USDT',
    icon: './images/usdt.png',
    decimals: 1000000,
    instructionIndex: 1
  }
];

export function TokenSaleDetails() {
  const { addNotification } = useNotifications();
  const { walletAddress, connectWallet, getConnection } = useUser();
  const { isPresaleEnded, addDeposit } = usePresale();

  // Balance states
  const [userBalances, setUserBalances] = useState({
    sol: 0,
    usdt: 0
  });
  const [adminBalances, setAdminBalances] = useState({
    sol: 0,
    usdt: 0
  });

  const [totalRaisedSol, setTotalRaisedSol] = useState(0);
  const [progress, setProgress] = useState(90);
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [solPrice, setSolPrice] = useState(0);
  const [usdtPrice, setUsdtPrice] = useState(1);
  const [currentPhantomKey, setCurrentPhantomKey] = useState<string | null>(null);



// Update the wallet change effect
useEffect(() => {
  if (!window.solana) return;

  const handleWalletChange = async () => {
    console.log('Wallet changed');
    const newKey = window.solana?.publicKey?.toString() || null;
    console.log('New wallet key:', newKey);
    console.log('Current stored key:', currentPhantomKey);
    
    if (newKey !== currentPhantomKey) {
      setCurrentPhantomKey(newKey);
      // Force a balance refresh
      const connection = getConnection();
      if (newKey) {
        const balance = await connection.getBalance(new PublicKey(newKey));
        setUserBalances(prev => ({
          ...prev,
          sol: balance / LAMPORTS_PER_SOL
        }));
      }
    }
  };

  // Initial setup
  handleWalletChange();

  // Listen for changes
  window.solana.on('accountChanged', handleWalletChange);

  return () => {
    window.solana.removeListener('accountChanged', handleWalletChange);
  };
}, [getConnection]);

// Update your fetchBalances function to use currentPhantomKey
const fetchBalances = useCallback(async () => {
  if (!currentPhantomKey) return;

  try {
    const connection = getConnection();
    console.log('Fetching balances for wallet:', currentPhantomKey);
    
    const userSolBalance = await connection.getBalance(new PublicKey(currentPhantomKey));
    console.log('User SOL balance:', userSolBalance / LAMPORTS_PER_SOL);
    
    setUserBalances(prev => ({
      ...prev,
      sol: userSolBalance / LAMPORTS_PER_SOL
    }));

    // Admin balance fetching remains the same
    const adminSolBalance = await connection.getBalance(ADMIN_WALLET);
    setAdminBalances(prev => ({
      ...prev,
      sol: adminSolBalance / LAMPORTS_PER_SOL
    }));

    setTotalRaisedSol(adminSolBalance / LAMPORTS_PER_SOL);
    
  } catch (error) {
    console.error('Error fetching balances:', error);
    addNotification('error', 'Failed to fetch wallet balances');
  }
}, [currentPhantomKey, getConnection, addNotification]);

  // Handle wallet changes
  useEffect(() => {
    if (!window.solana) return;

    const handleWalletChange = async () => {
      console.log('Wallet changed, updating balances...');
      await fetchBalances();
    };

    window.solana.on('accountChanged', handleWalletChange);

    // Initial fetch
    fetchBalances();

    return () => {
      window.solana.removeListener('accountChanged', handleWalletChange);
    };
  }, [fetchBalances]);

  // Regular balance updates
  useEffect(() => {
    if (walletAddress) {
      const interval = setInterval(fetchBalances, 10000);
      return () => clearInterval(interval);
    } else {
      setUserBalances({
        sol: 0,
        usdt: 0
      });
    }
  }, [walletAddress, fetchBalances]);

  // Fetch token prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const solResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const solData = await solResponse.json();
        setSolPrice(solData.solana.usd);
      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    };

    fetchPrices();
    const intervalId = setInterval(fetchPrices, 600000);
    return () => clearInterval(intervalId);
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(ADMIN_WALLET.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      addNotification('error', 'Failed to copy address');
    }
  };

  const createInstructionData = (amount: number): Uint8Array => {
    const data = new Uint8Array(9);
    data[0] = selectedToken.instructionIndex;
    
    const value = Math.floor(amount * selectedToken.decimals);
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setBigUint64(0, BigInt(value), true);
    data.set(new Uint8Array(buffer), 1);
    
    return data;
  };

  const validateAmount = (value: string): boolean => {
    if (isPresaleEnded) {
      setError('Presale has ended');
      return false;
    }

    const numAmount = Number(value);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    if (numAmount < MIN_INVESTMENT) {
      setError(`Minimum investment is ${MIN_INVESTMENT} ${selectedToken.symbol}`);
      return false;
    }

    if (numAmount > MAX_INVESTMENT) {
      setError(`Maximum investment is ${MAX_INVESTMENT} ${selectedToken.symbol}`);
      return false;
    }

    const currentBalance = selectedToken.symbol === 'SOL' ? userBalances.sol : userBalances.usdt;
    if (numAmount > currentBalance) {
      setError(`Insufficient ${selectedToken.symbol} balance`);
      return false;
    }

    const solEquivalent = selectedToken.symbol === 'SOL' ? numAmount : numAmount;
    if (totalRaisedSol + solEquivalent > HARDCAP_SOL) {
      setError('Investment would exceed hardcap');
      return false;
    }

    setError('');
    return true;
  };

  const handleInvest = async () => {
    if (!walletAddress) {
      addNotification('warning', 'Please connect your wallet');
      return;
    }

    if (!validateAmount(amount)) {
      addNotification('error', error);
      return;
    }

    setIsProcessing(true);
    try {
      const connection = getConnection();
      if (!window.solana) {
        throw new Error('Wallet not found');
      }

      const rawAmount = Number(amount);
      const instructionData = createInstructionData(rawAmount);

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: new PublicKey(walletAddress), isSigner: true, isWritable: true },
          { pubkey: ADMIN_WALLET, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
        ],
        programId: PROGRAM_ID,
        data: instructionData
      });

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      
      const transaction = new Transaction({
        feePayer: new PublicKey(walletAddress),
        recentBlockhash: blockhash,
        lastValidBlockHeight
      });
      
      transaction.add(instruction);

      const signed = await window.solana.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });
      
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });

      addNotification('success', 'Investment successful!');
      addDeposit(rawAmount);
      setAmount('');
      await fetchBalances();

    } catch (error) {
      console.error('Investment failed:', error);
      if (error instanceof SendTransactionError) {
        addNotification('error', `Transaction failed: ${error.message}`);
      } else {
        addNotification('error', error instanceof Error ? error.message : 'Investment failed');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Rest of the component remains the same...
  return (
    <div className="relative group">
      <div className="absolute -inset-[1px] bg-gradient-brand rounded-2xl blur-sm opacity-10 group-hover:opacity-15 transition-all duration-500" />
      
      <Card className="relative bg-[#12131a]/95 backdrop-blur-sm">
        <div className="space-y-8">
          {/* Progress section */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-yellow" />
              <span className="bg-gradient-brand bg-clip-text text-transparent">
                Fundraising Progress
              </span>
            </h3>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Raised</span>
              <span className="text-white">
              2,025,000 / {HARDCAP_SOL.toLocaleString()} $
              </span>
            </div>

            {/* Deposit address section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Deposit Wallet Address</span>
                <button
                  onClick={copyToClipboard}
                  className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-white/10"
                  aria-label="Copy admin wallet address"
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="font-mono text-xs text-gray-400 break-all">
                {ADMIN_WALLET.toString()}
              </p>
            </div>

            <ProgressBar progress={progress} className="h-3" />
            
            <div className="flex justify-end">
              <span className="text-sm text-gray-400">
                {progress.toFixed(1)}% Complete
              </span>
            </div>
          </div>

          <div className="border-t border-brand-blue/10" />

          {/* Price details section */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent">
              Live Price Details
            </h2>
            <div className='flex justify-between items-center space-x-4 text-sm'>
              <div className="text-gray-400">1 SOL = ${solPrice.toFixed(2)}</div>
              <div className="text-gray-400">1 USDT = ${usdtPrice.toFixed(2)}</div>
            </div>
          </div>

          <div className="border-t border-brand-blue/10" />

          {/* Investment section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent">
              Investment Details
            </h2>
            
            <div className="text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Your Wallet Balance:</span>
                <span className="text-white">
                  {selectedToken.symbol === 'SOL'
                    ? `${userBalances.sol.toLocaleString()} SOL` 
                    : `${userBalances.usdt.toLocaleString()} USDT`
                  }
                </span>
              </div>
            </div>
            
            <TokenInput
              value={amount}
              onChange={setAmount}
              onTokenSelect={setSelectedToken}
              selectedToken={selectedToken}
              tokens={TOKENS}
              label={`Amount (${selectedToken.symbol})`}
              disabled={isProcessing}
            />

            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}

            <button 
              onClick={walletAddress ? handleInvest : connectWallet}
              disabled={isPresaleEnded || isProcessing}
              className="w-full bg-gradient-brand text-black font-bold py-4 px-6 rounded-lg hover:shadow-gradient transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-none"
            >
              {isProcessing ? 'Processing...' : 
               walletAddress ? 'Invest Now' : 'Connect Wallet'}
            </button>

            <div className="flex justify-between text-sm">
              <div>
                <span className="text-gray-400 block">Min Investment</span>
                <span className="text-white">{MIN_INVESTMENT} $</span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 block">Max Investment</span>
                <span className="text-white">{MAX_INVESTMENT} $</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}