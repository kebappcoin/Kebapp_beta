import { useState, useEffect } from 'react';
import { 
  PublicKey, 
  Transaction, 
  SystemProgram,
  TransactionInstruction,
  SendTransactionError,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { Target, Wallet } from 'lucide-react';
import { usePresale } from '../../context/PresaleContext';
import { TokenInput } from '../ui/TokenInput';
import { useNotifications } from '../../context/NotificationContext';
import { useUser } from '../../context/UserContext';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';

// Program Constants
const PROGRAM_ID = new PublicKey('E8ofPC2RXn7yGC2xVRDwzwMZQKNkXV75Hmpm4AXpNCjz');
const ADMIN_WALLET = new PublicKey('2FcJbN2kgx3eB1JeJgoBKczpAsXxJzosq269CoidxfhA');

// Investment Limits
const MIN_INVESTMENT = 0.00000001;
const MAX_INVESTMENT = 5000;
const HARDCAP_SOL = 2250000;

// Available Tokens
const TOKENS = [
  {
    symbol: 'SOL',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" fill="#14F195" />
        <path
          d="M8 8.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5V9a.5.5 0 0 1 .5-.5zM8 12.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .5-.5z"
          fill="#000"
        />
      </svg>
    ),
    decimals: LAMPORTS_PER_SOL,
    instructionIndex: 0
  },
  {
    symbol: 'USDT',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" fill="#26A17B" />
        <path
          d="M12 5v3m0 0v8m0-8h4m-4 0H8"
          stroke="#FFF"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    decimals: 1000000,
    instructionIndex: 1
  }
];

export function TokenSaleDetails() {
  const { addNotification } = useNotifications();
  const { walletAddress, connectWallet, getConnection } = useUser();
  const { isPresaleEnded, addDeposit } = usePresale();

  const [adminSolBalance, setAdminSolBalance] = useState(0);
  const [adminUsdtBalance, setAdminUsdtBalance] = useState(0);
  const [totalRaisedSol, setTotalRaisedSol] = useState(0);
  const [progress, setProgress] = useState(0);
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchBalances = async () => {
    try {
      const connection = getConnection();
      const solBalance = await connection.getBalance(ADMIN_WALLET);
      setAdminSolBalance(solBalance / LAMPORTS_PER_SOL);

      // For both SOL and USDT investments, we'll use the same admin wallet
      const totalInSol = solBalance / LAMPORTS_PER_SOL;
      setTotalRaisedSol(totalInSol);
      setProgress(Math.min((totalInSol / HARDCAP_SOL) * 100, 100));
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  };

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 10000);
    return () => clearInterval(interval);
  }, []);

  const createInstructionData = (amount: number): Uint8Array => {
    const data = new Uint8Array(9);
    // isSOL is backwards in current logic, need to fix
    data[0] = selectedToken.instructionIndex; // Use token's instruction index directly
    
    const value = Math.floor(amount * selectedToken.decimals);
    
    // Write the amount in little-endian format
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setBigUint64(0, BigInt(value), true);
    data.set(new Uint8Array(buffer), 1);
    
    console.log('Instruction data:', {
        index: data[0],
        amount: value,
        data: Array.from(data)
    });
    
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

      const isSOL = selectedToken.symbol === 'SOL';
      const rawAmount = Number(amount);
      const value = Math.floor(rawAmount * selectedToken.decimals);

      // Check balance
      const balance = await connection.getBalance(new PublicKey(walletAddress));
      if (balance < value) {
        throw new Error(`Insufficient balance. Required: ${rawAmount} ${selectedToken.symbol}`);
      }

      // Log instruction data for debugging
      const instructionData = createInstructionData(rawAmount);
      console.log('Sending instruction:', {
          index: instructionData[0],
          amount: value,
          data: Array.from(instructionData)
      });

      const instruction = new TransactionInstruction({
        keys: [
            { pubkey: window.solana.publicKey, isSigner: true, isWritable: true },
            { pubkey: ADMIN_WALLET, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            // Add owner key for USDT transactions
            ...(isSOL ? [] : [
                { pubkey: window.solana.publicKey, isSigner: true, isWritable: false }
            ])
        ],
        programId: PROGRAM_ID,
        data: instructionData
      });


      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      
      const transaction = new Transaction();
      transaction.add(instruction);
      transaction.feePayer = new PublicKey(walletAddress);
      transaction.recentBlockhash = blockhash;

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
      fetchBalances();

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

  return (
    <div className="relative group">
      <div className="absolute -inset-[1px] bg-gradient-brand rounded-2xl blur-sm opacity-10 group-hover:opacity-15 transition-all duration-500" />
      
      <Card className="relative bg-[#12131a]/95 backdrop-blur-sm">
        <div className="space-y-8">
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
                {totalRaisedSol.toLocaleString()} / {HARDCAP_SOL.toLocaleString()} SOL
              </span>
            </div>
            
            <ProgressBar progress={progress} className="h-3" />
            
            <div className="flex justify-end">
              <span className="text-sm text-gray-400">
                {progress.toFixed(1)}% Complete
              </span>
            </div>
          </div>

          <div className="border-t border-brand-blue/10" />

          <div className="space-y-6">
            <h2 className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent">
              Investment Details
            </h2>
            
            <div className="text-sm text-gray-400">
              <div className="flex justify-between mb-2">
                <span>Admin Balance:</span>
                <span className="text-white">
                  {selectedToken.symbol === 'SOL' 
                    ? `${adminSolBalance.toLocaleString()} SOL`
                    : `${adminUsdtBalance.toLocaleString()} USDT`
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
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button 
              onClick={walletAddress ? handleInvest : connectWallet}
              disabled={isPresaleEnded || isProcessing}
              className="w-full bg-gradient-brand text-black font-bold py-4 px-6 rounded-lg hover:shadow-gradient transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-none"
            >
              {isProcessing ? 'Processing...' : 
               walletAddress ? (
                 <div className="flex items-center justify-center gap-2">
                   <Wallet className="w-5 h-5" />
                   <span>Invest Now</span>
                 </div>
               ) : 'Connect Wallet'}
            </button>

            <div className="flex justify-between text-sm mt-4">
              <div>
                <span className="text-gray-400 block">Min Investment</span>
                <span className="text-white">{MIN_INVESTMENT} {selectedToken.symbol}</span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 block">Max Investment</span>
                <span className="text-white">{MAX_INVESTMENT} {selectedToken.symbol}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}