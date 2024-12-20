import { useState, useEffect, useCallback } from 'react';
import { 
  PublicKey, 
  Transaction, 
  SystemProgram,
  TransactionInstruction,
  SendTransactionError,
  LAMPORTS_PER_SOL, 
  Connection
} from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { Target, Copy, CheckCircle2 } from 'lucide-react';
import { usePresale } from '../../context/PresaleContext';
import { TokenInput } from '../ui/TokenInput';
import { useNotifications } from '../../context/NotificationContext';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { TgeTrigger } from './TgeTrigger';
import { WalletModal } from '../wallet/WalletModal';
const USDT_MINT = new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

const PROGRAM_ID = new PublicKey('J21bAjfqCQtrkYjKS8W6JAb8mFmjDPA7x7eEGoMswAvq');
const ADMIN_WALLET = new PublicKey('GTqSn12ucdeEJCFQQwZ9ZwDPhyXMPb3aKyfymt29bHuK');
const NETWORK = 'devnet';
const COMMITMENT = 'processed';

const MIN_INVESTMENT = 50;
const MAX_INVESTMENT = 5000;
const HARDCAP = 2250000;

const TOKENS = [
  {
    symbol: 'USDT',
    icon: './images/usdt.png',
    decimals: 1000000,
    instructionIndex: 1,
    currency : '$'
  },
  {
    symbol: 'SOL',
    icon: "./images/sol.png",
    decimals: LAMPORTS_PER_SOL,
    instructionIndex: 0,
    currency : 'SOL',
    MIN_INVESTMENT: 0.27,
    MAX_INVESTMENT: 27,
  }
];

export function TokenSaleDetails() {
  const { 
    publicKey, 
    connected,
    connecting,
    disconnect,
    wallet,
    signTransaction
  } = useWallet();
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const { addNotification } = useNotifications();
  const { isPresaleEnded, addDeposit } = usePresale();

  // State
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [balances, setBalances] = useState({ sol: 0, usdt: 0 });
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [totalRaisedSol, setTotalRaisedSol] = useState(0);
  const [progress, setProgress] = useState(0);
  const [solPrice, setSolPrice] = useState(0);
  const [usdtPrice, setUsdtPrice] = useState(1);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralInput, setReferralInput] = useState('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [adminUSDTBalance, setAdminUSDTBalance] = useState(0);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [currentTransactionDetails, setCurrentTransactionDetails] = useState({
    signature: '',
    amount: 0,
    kebabCoins: 0.0,
  });


  const getConnection = useCallback(() => {
    return new Connection(
      `https://mainnet.helius-rpc.com/?api-key=a1d5b3f4-f7c0-499a-b729-6f7ef05cacaa`,
      { commitment: COMMITMENT }
    );
  }, []);

 // Keep the original price fetching effect
useEffect(() => {
  const fetchPrices = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const data = await response.json();
      setSolPrice(data.solana.usd);
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };

  fetchPrices();
  const interval = setInterval(fetchPrices, 300000);
  return () => clearInterval(interval);
}, []);

  // Add a new effect for total raised that runs independently
  useEffect(() => {
    const fetchTotalRaised = async () => {
      try {
        const connection = getConnection();
        const adminSolBalance = await connection.getBalance(ADMIN_WALLET);
        const adminUsdtBalance = await connection.getParsedTokenAccountsByOwner(
          ADMIN_WALLET,
          { mint: USDT_MINT }
        );
        setAdminUSDTBalance(adminUsdtBalance.value[0]?.account.data.parsed.info.tokenAmount.uiAmount || 0);
        setTotalRaisedSol(adminSolBalance / LAMPORTS_PER_SOL);
        setProgress(((((adminSolBalance / LAMPORTS_PER_SOL) * solPrice)+(adminUsdtBalance.value[0]?.account.data.parsed.info.tokenAmount.uiAmount || 0)) / HARDCAP) * 100);
      } catch (error) {
        console.error('Error fetching total raised:', error);
      }
    };

    fetchTotalRaised();
    const interval = setInterval(fetchTotalRaised, 10000);
    return () => clearInterval(interval);
  }, [getConnection, solPrice]); // Include solPrice dependency

  // Keep the existing wallet balance effect
  useEffect(() => {
    const fetchBalances = async () => {
      if (!publicKey) return;
      
      try {
        const connection = getConnection();
        const solBalance = await connection.getBalance(publicKey);
        const response = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { mint: USDT_MINT }
        );
      
        const usdtBalance = response.value[0]?.account.data.parsed.info.tokenAmount.uiAmount || 0;
        setBalances(prev => ({ ...prev, sol: solBalance / LAMPORTS_PER_SOL, usdt: usdtBalance }));
      } catch (error) {
        console.error('Error fetching balances:', error);
        addNotification('error', 'Failed to fetch wallet balances');
      }
    };

    if (connected) {
      fetchBalances();
      const interval = setInterval(fetchBalances, 6000000);
      return () => clearInterval(interval);
    }
  }, [publicKey, connected, getConnection, addNotification]);

  // Fetch referral code effect
  useEffect(() => {
    const fetchReferralCode = async () => {
      if (!publicKey) return;
      
      try {
        const connection = getConnection();
        const code = await getReferralCode(connection, publicKey, PROGRAM_ID);
        setReferralCode(code);
      } catch (error) {
        console.error('Error fetching referral code:', error);
      }
    };

    if (connected) {
      fetchReferralCode();
    }
  }, [publicKey, connected, getConnection]);

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

    if ((selectedToken.symbol === "SOL") ? numAmount < 0.27 : numAmount < MIN_INVESTMENT) {
      if((selectedToken.symbol === "SOL")) {
        setError(`Minimum investment is SOL 0.27 ${selectedToken.symbol}`);
      } else {
        setError(`Minimum investment is ${MIN_INVESTMENT} ${selectedToken.symbol}`);
      }
      return false;
    }

    if ((selectedToken.symbol === "SOL") ? numAmount > 27 : numAmount > MAX_INVESTMENT) {
      if((selectedToken.symbol === "SOL")) {
        setError(`Maximum investment is SOL 27 ${selectedToken.symbol}`);
      } else {
        setError(`Maximum investment is ${MAX_INVESTMENT} ${selectedToken.symbol}`);
      }
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

  const handleInvest = async () => {
    if (!publicKey || !signTransaction) {
      setShowWalletModal(true);
      return;
    }

    if(!validateAmount(amount)) {
      addNotification('error', error);
      return;
    }

    setIsProcessing(true);
    try {
      const connection = getConnection();
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

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      const transaction = new Transaction({
        feePayer: publicKey,
        blockhash,
        lastValidBlockHeight,
      });

      let baseAccounts;
      
      if (selectedToken.symbol === 'SOL') {
        baseAccounts = [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: ADMIN_WALLET, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ];
      } else {
        // USDT transfer accounts
        const userAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { mint: USDT_MINT }
        );
        
        const adminAccounts = await connection.getParsedTokenAccountsByOwner(
          ADMIN_WALLET,
          { mint: USDT_MINT }
        );

        if (!userAccounts.value[0]?.pubkey || !adminAccounts.value[0]?.pubkey) {
          throw new Error('USDT token accounts not found');
        }

        const userTokenAccount = userAccounts.value[0].pubkey;
        const adminTokenAccount = adminAccounts.value[0].pubkey;

         baseAccounts = [
            { pubkey: publicKey, isSigner: true, isWritable: true }, // investor_info
            { pubkey: userTokenAccount, isSigner: false, isWritable: true }, // investor_token_account
            { pubkey: adminTokenAccount, isSigner: false, isWritable: true }, // admin_token_account
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token_program
        ];
      }

      // Add referral account if needed
      if (referralInput) {
        const seed = new TextEncoder().encode("referral");
        const [referralAccount] = PublicKey.findProgramAddressSync(
          [seed, publicKey.toBytes()],
          PROGRAM_ID
        );

        console.log('Referral account:', referralAccount.toString());

        // Adjust position based on program requirements
        if (selectedToken.symbol === 'SOL') {
          baseAccounts.splice(2, 0, {
            pubkey: referralAccount,
            isSigner: false,
            isWritable: true,
          });
        } else if (selectedToken.symbol === 'USDT') {
          // Adjust index or placement for USDT
          baseAccounts.push({
            pubkey: referralAccount,
            isSigner: false,
            isWritable: true,
          });
        }
      }

      console.log('Final baseAccounts:', baseAccounts.map(acc => acc.pubkey.toString()));

      const instruction = new TransactionInstruction({
        keys: baseAccounts,
        programId: PROGRAM_ID,
        data
      });

      transaction.add(instruction);
      const signed = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());
      
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });

      if (selectedToken.symbol === 'SOL') {
        setCurrentTransactionDetails({
          signature,
          amount: Number(amount),
          kebabCoins: ((solPrice * Number(amount))/0.02).toFixed(2)
        });
      } else {
        setCurrentTransactionDetails({
          signature,
          amount: Number(amount),
          kebabCoins: (Number(amount) / 0.02).toFixed(2)
        });
      }

      setShowTransactionDialog(true);

      addNotification('success', 'Investment successful!');
      addDeposit(Number(amount));
      setAmount('');

    } catch (error) {
      console.error('Investment failed:', error);
      if (error instanceof SendTransactionError) {
        addNotification('error', `Transaction failed: ${error.logs?.join('\n') || error.message}`);
      } else {
        addNotification('error', error instanceof Error ? error.message : 'Investment failed');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const generateReferralCode = async () => {
    if (!publicKey || !signTransaction) {
      setShowWalletModal(true);
      return;
    }

    setIsGeneratingCode(true);
    try {
      const connection = getConnection();
      const seed = new TextEncoder().encode("referral");
      const [referralAccount] = PublicKey.findProgramAddressSync(
        [seed, publicKey.toBytes()],
        PROGRAM_ID
      );

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: referralAccount, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: new Uint8Array([2])
      });

      const { blockhash } = await connection.getLatestBlockhash();
      const transaction = new Transaction();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      transaction.add(instruction);

      const signed = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(signature);

      const code = await getReferralCode(connection, publicKey, PROGRAM_ID);
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
          {publicKey?.toString() === ADMIN_WALLET.toString() && <TgeTrigger />}
          
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
                  ${((totalRaisedSol * solPrice)+(adminUSDTBalance)).toLocaleString()} / ${HARDCAP.toLocaleString()}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400"><b>CHAIN: SOLANA</b></span>
                  <span className="text-gray-400"><b>TOKEN: USDT/SOLANA</b></span>
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
                  <p>WALLET ADDRESS:</p>
                  <p className="text-white text-md">{ADMIN_WALLET.toString()}</p>
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

          {/* Investment Section */}
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
          {!isMobile ? (
            <button
              onClick={connected ? handleInvest : () => setShowWalletModal(true)}
              disabled={isPresaleEnded || isProcessing || connecting}
              className="w-full bg-gradient-brand text-black font-bold py-4 px-6 rounded-lg hover:shadow-gradient transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-none"
            >
              {isProcessing ? 'Processing...' : 
               connecting ? 'Connecting...' :
               !connected ? 'Connect Wallet' : 'Invest Now'}
            </button>
          ):(
            <div className="w-full bg-gradient-brand text-black font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
              <div className="flex justify-center items-center">
                <div className="text-black text-sm">
                  <p>Presale only on PC/Web/Laptops</p>
                </div>
              </div>
            </div>
          )}

            {showTransactionDialog && (
              <div className="fixed inset-0 flex items-center justify-center z-50" style={{ top: '-210px' }}>
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              
              <div className="relative bg-[#12131a]/95 rounded-lg p-6 w-96 text-center">
                <h2 className="text-2xl font-bold mb-4 bg-gradient-brand bg-clip-text text-transparent">
                  Transaction Successful
                </h2>
                
              
                
                <p className="mb-2 text-gray-400">
                  <span className="text-gray-300">Amount Invested:</span>{' '}
                  <span className="text-white">
                  {selectedToken.symbol === 'SOL' ? `SOL ${currentTransactionDetails.amount}` :
                    `$ ${currentTransactionDetails.amount}`
                   }
                   </span>
                </p>
                
                <p className="mb-4 text-gray-400">
                  <span className="text-gray-300">Kebab Coins Purchased:</span>{' '}
                  <span className="text-white">{currentTransactionDetails.kebabCoins} Coins</span>
                </p>
                
                <button
                  onClick={() => setShowTransactionDialog(false)}
                  className="w-full bg-gradient-brand text-black font-bold py-2 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Close
                </button>
              </div>
              </div>

            )}

            <div className="flex justify-between text-sm">
              <div>
                <span className="text-gray-400 block">Min Investment</span>
                <span className="text-white">
                  {selectedToken.symbol === 'SOL'
                    ? `SOL ${(0.27).toLocaleString()}`
                    : `$ ${MIN_INVESTMENT}`
                  }
                </span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 block">Max Investment</span>
                <span className="text-white">
                  {selectedToken.symbol === 'SOL'
                    ? `SOL ${(27).toLocaleString()}`
                    : `$ ${MAX_INVESTMENT}`
                  }
                </span>
              </div>
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
                  Share your referral link and earn 2% Kebapp token rewards and 1% as bonus if referal link is used for every successful purchase
                </p>
              </div>
            ) : (
              <button
                onClick={generateReferralCode}
                disabled={isGeneratingCode || !connected}
                className="w-full bg-gradient-brand text-black font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {!connected ? 'Connect Wallet to Generate Code' : 
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

          {/* Price Details Section */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent">
              Live Price Details
            </h2>
            <div className="flex justify-between items-center space-x-4 text-sm">
              <div className="text-gray-400">1 SOL = ${solPrice.toFixed(2)}</div>
              <div className="text-gray-400">1 USDT = ${usdtPrice.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Wallet Modal */}
      <WalletModal 
        isOpen={showWalletModal} 
        onClose={() => setShowWalletModal(false)}
        onConnect={() => setShowWalletModal(false)}
      />
    </div>
  );
}

// Utility function for getting referral code
const getReferralCode = async (
  connection: Connection,
  userPublicKey: PublicKey,
  programId: PublicKey
): Promise<string | null> => {
  try {
    const seed = new TextEncoder().encode("referral");
    const [referralAccount] = PublicKey.findProgramAddressSync(
      [seed, userPublicKey.toBytes()],
      programId
    );

    const accountInfo = await connection.getAccountInfo(referralAccount);
    
    if (!accountInfo) {
      return null;
    }

    const codeBytes = accountInfo.data.slice(33, 41);
    const decoder = new TextDecoder();
    const code = decoder.decode(codeBytes);

    return code;
  } catch (error) {
    console.error('Error fetching referral code:', error);
    return null;
  }
};