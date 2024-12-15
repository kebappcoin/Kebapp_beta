import { useState, useEffect, useCallback } from 'react';
import { 
  PublicKey, 
  Transaction, 
  SystemProgram,
  TransactionInstruction,
  SendTransactionError,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { Target, Copy, CheckCircle2 } from 'lucide-react';
import { usePresale } from '../../context/PresaleContext';
import { TokenInput } from '../ui/TokenInput';
import { useNotifications } from '../../context/NotificationContext';
import { useUser } from '../../context/UserContext';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';

// Constants
//GsXzMeeQyj3eS5hqPTGQGu5rxmSkDB2r3vKnWoLti5Ln
const PROGRAM_ID = new PublicKey('D3DKMWoEHotwkhtqUYfSDnifvgquepTyzQY3YMjkSJRy');
const ADMIN_WALLET = new PublicKey('2FcJbN2kgx3eB1JeJgoBKczpAsXxJzosq269CoidxfhA');

const MIN_INVESTMENT = 0.000001;
const MAX_INVESTMENT = 5000;
const HARDCAP = 2250000;

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
  // Context hooks
  const { addNotification } = useNotifications();
  const { walletAddress, connectWallet, getConnection } = useUser();
  const { isPresaleEnded, addDeposit } = usePresale();

  // State
  const [balances, setBalances] = useState({ sol: 0, usdt: 0 });
  const [adminBalances, setAdminBalances] = useState({ sol: 0, usdt: 0 });
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [totalRaisedSol, setTotalRaisedSol] = useState(0);
  const [progress, setProgress] = useState(0);
  const [solPrice, setSolPrice] = useState(0);
  const [usdtPrice, setUsdtPrice] = useState(1);
  const [currentPhantomKey, setCurrentPhantomKey] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralInput, setReferralInput] = useState('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  // Update wallet change effect
  useEffect(() => {
    if (!window.solana) return;

    const handleWalletChange = async () => {
      console.log('Wallet changed');
      const newKey = window.solana?.publicKey?.toString() || null;
      console.log('New wallet key:', newKey);
      console.log('Current stored key:', currentPhantomKey);
      
      if (newKey !== currentPhantomKey) {
        setCurrentPhantomKey(newKey);
        if (newKey) {
          const connection = getConnection();
          const code = await getReferralCode(connection, new PublicKey(newKey), PROGRAM_ID);
          setReferralCode(code);
          const balance = await connection.getBalance(new PublicKey(newKey));
          setBalances(prev => ({
            ...prev,
            sol: balance / LAMPORTS_PER_SOL
          }));
        }
      }
    };

    handleWalletChange();
    window.solana.on('accountChanged', handleWalletChange);

    return () => {
      window.solana.removeListener('accountChanged', handleWalletChange);
    };
  }, [getConnection, currentPhantomKey]);

  // Fetch prices
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

  // Fetch balances and total raised
  const fetchBalances = useCallback(async () => {
    if (!currentPhantomKey) return;

    try {
      const connection = getConnection();
      console.log('Fetching balances for wallet:', currentPhantomKey);
      
      const userSolBalance = await connection.getBalance(new PublicKey(currentPhantomKey));
      setBalances(prev => ({
        ...prev,
        sol: userSolBalance / LAMPORTS_PER_SOL
      }));

      const adminSolBalance = await connection.getBalance(ADMIN_WALLET);
      setAdminBalances(prev => ({
        ...prev,
        sol: adminSolBalance / LAMPORTS_PER_SOL
      }));

      const totalRaisedUsd = adminSolBalance / LAMPORTS_PER_SOL * solPrice;
      setTotalRaisedSol(adminSolBalance / LAMPORTS_PER_SOL);
      setProgress((totalRaisedUsd / HARDCAP) * 100);
      
    } catch (error) {
      console.error('Error fetching balances:', error);
      addNotification('error', 'Failed to fetch wallet balances');
    }
  }, [currentPhantomKey, getConnection, addNotification, solPrice]);

  useEffect(() => {
    if (currentPhantomKey) {
      fetchBalances();
      const interval = setInterval(fetchBalances, 10000);
      return () => clearInterval(interval);
    }
  }, [currentPhantomKey, fetchBalances]);

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

    const currentBalance = selectedToken.symbol === 'SOL' ? balances.sol : balances.usdt;
    if (numAmount > currentBalance) {
      setError(`Insufficient ${selectedToken.symbol} balance`);
      return false;
    }

    setError('');
    return true;
  };

  const generateReferralCode = async () => {
    if (!walletAddress) {
      addNotification('warning', 'Please connect your wallet');
      return;
    }

    setIsGeneratingCode(true);
    try {
      const connection = getConnection();
      const userPubkey = new PublicKey(walletAddress);
      
      const seed = new TextEncoder().encode("referral");
      const [referralAccount] = PublicKey.findProgramAddressSync(
        [seed, userPubkey.toBytes()],
        PROGRAM_ID
      );

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: userPubkey, isSigner: true, isWritable: true },
          { pubkey: referralAccount, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: new Uint8Array([2])
      });

      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      const transaction = new Transaction();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userPubkey;
      transaction.add(instruction);

      const signed = await window.solana.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(signature, 'confirmed');

      const code = await getReferralCode(connection, userPubkey, PROGRAM_ID);
      if (code) {
        setReferralCode(code);
        addNotification('success', 'Referral code generated successfully!');
      }
    } catch (error) {
      console.error('Failed to generate referral code:', error);
      addNotification('error', `Failed to generate referral code: ${error.message}`);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const findReferralAccountByCode = async (
    connection: Connection,
    programId: PublicKey,
    code: string
): Promise<PublicKey | null> => {
    try {
        // Get all program accounts
        const accounts = await connection.getProgramAccounts(programId, {
            filters: [
                {
                    dataSize: 55, // Size of ReferralCode struct (1 + 32 + 8 + 2 + 4 + 8)
                },
            ],
        });

        // Check each account for matching code
        for (const { pubkey, account } of accounts) {
            // Skip uninitialized accounts
            if (!account.data[0]) continue;

            // Extract the code bytes (offset by 33 bytes: 1 for initialized + 32 for owner)
            const codeBytes = account.data.slice(33, 41);
            const accountCode = new TextDecoder().decode(codeBytes);
            
            if (accountCode === code.padEnd(8, ' ')) {
                return pubkey;
            }
        }
        return null;
    } catch (error) {
        console.error('Error finding referral account:', error);
        return null;
    }
};


  // Helper function to create transfer instruction
  // Keep createTransferInstruction the same
  const createTransferInstruction = (
    fromPubkey: PublicKey,
    toPubkey: PublicKey,
    lamports: number
  ): TransactionInstruction => {
    return new TransactionInstruction({
        keys: [
            { pubkey: fromPubkey, isSigner: true, isWritable: true },
            { pubkey: toPubkey, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: SystemProgram.programId,
        data: (() => {
            const data = new Uint8Array(12);
            data[0] = 2;
            const view = new DataView(data.buffer, 4);
            view.setUint32(0, lamports, true);
            return data;
        })()
    });
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
      const userPubkey = new PublicKey(walletAddress);
      const lamports = Number(amount) * selectedToken.decimals;
  
      // Create instruction data
      const data = new Uint8Array(referralInput ? 17 : 9);
      data[0] = selectedToken.instructionIndex;
      const view = new DataView(data.buffer);
      view.setBigUint64(1, BigInt(lamports), true);
      
      if (referralInput) {
        const encoder = new TextEncoder();
        const referralBytes = encoder.encode(referralInput.padEnd(8));
        data.set(referralBytes, 9);
      }
  
      // Get latest blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  
      // Create transaction
      const transaction = new Transaction({
        feePayer: userPubkey,
        blockhash,
        lastValidBlockHeight,
      });
      //const systemProgramId = new PublicKey('11111111111111111111111111111111');

      // Set up account keys
      const baseAccounts = [
        { pubkey: userPubkey, isSigner: true, isWritable: true },
        { pubkey: ADMIN_WALLET, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ];
  
      const keys = [...baseAccounts];
      if (referralInput) {
        const seed = new TextEncoder().encode("referral");
        const [referralAccount] = PublicKey.findProgramAddressSync(
            [seed, userPubkey.toBytes()],
            PROGRAM_ID
        );
        
        keys.splice(2, 0, { pubkey: referralAccount, isSigner: false, isWritable: true });
      }
  
      // Add owner account for USDT investments
      if (selectedToken.symbol === 'USDT') {
        keys.push({ pubkey: userPubkey, isSigner: true, isWritable: true });
      }
  
      // Create program instruction
      const instruction = new TransactionInstruction({
        keys,
        programId: PROGRAM_ID,
        data
      });
  
      transaction.add(instruction);
  
      // Sign and send transaction
      const signed = await window.solana.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());
      
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });
  
      if (confirmation.value.err) {
        throw new Error('Transaction failed: ' + JSON.stringify(confirmation.value.err));
      }
  
      addNotification('success', 'Investment successful!');
      addDeposit(Number(amount));
      setAmount('');
      await fetchBalances();
  
    } catch (error) {
      console.error('Investment failed:', error);
      if (error instanceof SendTransactionError) {
        const logs = error.logs ? error.logs.join('\n') : error.message;
        addNotification('error', `Transaction failed: ${logs}`);
      } else {
        addNotification('error', error instanceof Error ? error.message : 'Investment failed');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      addNotification('success', message);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      addNotification('error', 'Failed to copy to clipboard');
    }
  };

  return (
    <div className="relative group">
      <div className="absolute -inset-[1px] bg-gradient-brand rounded-2xl blur-sm opacity-10 group-hover:opacity-15 transition-all duration-500" />
      
      <Card className="relative bg-[#12131a]/95 backdrop-blur-sm">
        <div className="space-y-8">
          {/* Progress Section */}
          <div>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-yellow" />
              <span className="bg-gradient-brand bg-clip-text text-transparent">
                Fundraising Progress
              </span>
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Raised</span>
                <span className="text-white">
                  ${(totalRaisedSol * solPrice).toLocaleString()} / ${HARDCAP.toLocaleString()}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Deposit Wallet Address</span>
                  <button
                    onClick={() => copyToClipboard(ADMIN_WALLET.toString(), 'Address copied!')}
                    className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-white/10"
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

              <ProgressBar progress={Math.min(progress, 100)} className="h-3" />
              
              <div className="flex justify-end">
                <span className="text-sm text-gray-400">
                  {progress.toFixed(1)}% Complete
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-brand-blue/10" />

          {/* Price Details Section */}
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

          {/* Referral Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent">
              Referral Program
            </h2>
            
            {referralCode ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Your Referral Code:</span>
                  <button
                    onClick={() => copyToClipboard(referralCode, 'Referral code copied!')}
                    className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-white/10"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="font-mono text-lg text-white bg-black/20 rounded-lg px-4 py-2">
                  {referralCode}
                </p>
                <p className="text-sm text-gray-400">
                  Share your code and earn 2% rewards on referral investments
                </p>
              </div>
            ) : (
              <button
                onClick={generateReferralCode}
                disabled={isGeneratingCode || !walletAddress}
                className="w-full bg-gradient-brand text-black font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {!walletAddress ? 'Connect Wallet to Generate Code' : 
                 isGeneratingCode ? 'Generating...' : 'Generate Referral Code'}
              </button>
            )}
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400">
                Have a referral code?
              </label>
              <input
                type="text"
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                placeholder="Enter referral code"
                maxLength={8}
                className="w-full bg-black/20 border border-brand-blue/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue/30"
              />
            </div>
          </div>

          <div className="border-t border-brand-blue/10" />

          {/* Investment Details Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent">
              Investment Details
            </h2>
            
            <div className="text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Your Balance:</span>
                <span className="text-white">
                  {selectedToken.symbol === 'SOL'
                    ? `${balances.sol.toLocaleString()} SOL`
                    : `${balances.usdt.toLocaleString()} USDT`
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
               !walletAddress ? 'Connect Wallet' : 'Invest Now'}
            </button>

            <div className="flex justify-between text-sm">
              <div>
                <span className="text-gray-400 block">Min Investment</span>
                <span className="text-white">
                  {MIN_INVESTMENT} $
                </span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 block">Max Investment</span>
                <span className="text-white">
                  {MAX_INVESTMENT} $
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Keep the getReferralCode function as is
export const getReferralCode = async (
  connection,
  userPublicKey: PublicKey,
  programId: PublicKey
): Promise<string | null> => {
  try {
    // Create the seed as Uint8Array
    const seed = new TextEncoder().encode("referral");
    const [referralAccount] = PublicKey.findProgramAddressSync(
      [seed, userPublicKey.toBytes()],
      programId
    );

    const accountInfo = await connection.getAccountInfo(referralAccount);
    
    if (!accountInfo) {
      console.log("No referral code found for this user");
      return null;
    }

    // Convert bytes to string
    const codeBytes = accountInfo.data.slice(33, 41);
    const decoder = new TextDecoder();
    const code = decoder.decode(codeBytes);

    console.log("Retrieved referral code:", code);
    return code;

  } catch (error) {
    console.error('Error fetching referral code:', error);
    return null;
  }
};