import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNotifications } from '../../context/NotificationContext';
import { 
  Transaction,
  TransactionInstruction,
  PublicKey,
  Connection,
  SendTransactionError,
} from '@solana/web3.js';

//Dev: FgkLDmnXJaPwRAjudDiC9AzSCaMUumdjv3RW2zkWKLXH
//Prod: E1SA8MMtdEDSoriuBi1BJhnbwc3jCnSPmH2to6cyBzSn

const PROGRAM_ID = new PublicKey('6dCobFnsRDbeER46eRFG6a7wy7NN9iNDLrJzEcUHhm3H');
const ADMIN_WALLET = new PublicKey('2FcJbN2kgx3eB1JeJgoBKczpAsXxJzosq269CoidxfhA');
const KEBAB_TOKEN_MINT = new PublicKey('5fEEqD2GxnJ64cMoZGxKTd9ypiU2oc8CTSRyRxFRhNZP');
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const NETWORK = 'devnet';
const COMMITMENT = 'processed';

export const TgeTrigger = () => {
  const { publicKey, signTransaction } = useWallet();
  const { addNotification } = useNotifications();
  const [isProcessing, setIsProcessing] = useState(false);
  const [referralAccounts, setReferralAccounts] = useState<{ pubkey: PublicKey, owner: PublicKey }[]>([]);

  const getConnection = () => {
    return new Connection(
      `https://mainnet.helius-rpc.com/?api-key=a1d5b3f4-f7c0-499a-b729-6f7ef05cacaa`,
      { commitment: COMMITMENT }
    );
  };

  useEffect(() => {
    const fetchReferralAccounts = async () => {
      if (!publicKey) return;
      
      try {
        const connection = getConnection();
        const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
          filters: [
            { dataSize: 55 }, // Size of ReferralCode struct
          ],
        });

        const processedAccounts = accounts.map(account => {
          const ownerBytes = account.account.data.slice(1, 33);
          const owner = new PublicKey(ownerBytes);
          return {
            pubkey: account.pubkey,
            owner
          };
        });

        setReferralAccounts(processedAccounts);
        console.log('Found referral accounts:', processedAccounts);
      } catch (error) {
        console.error('Failed to fetch referral accounts:', error);
        addNotification('error', 'Failed to fetch referral accounts');
      }
    };

    fetchReferralAccounts();
  }, [publicKey, addNotification]);

  const handleTriggerTge = async () => {
    if (!publicKey || !signTransaction) {
      addNotification('warning', 'Please connect your wallet');
      return;
    }

    if (publicKey.toString() !== ADMIN_WALLET.toString()) {
      addNotification('error', 'Only admin can trigger TGE');
      return;
    }

    setIsProcessing(true);
    try {
      const connection = getConnection();

      // Match the exact account order from processor.rs
      const [mintAuthority] = PublicKey.findProgramAddressSync(
        [new TextEncoder().encode('mint_authority')],
        PROGRAM_ID
      );

      const [distributionState] = PublicKey.findProgramAddressSync(
        [new TextEncoder().encode('distribution')],
        PROGRAM_ID
      );

      const tgeKeys = [
        { pubkey: publicKey, isSigner: true, isWritable: true },
        { pubkey: KEBAB_TOKEN_MINT, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: mintAuthority, isSigner: false, isWritable: false },
        { pubkey: distributionState, isSigner: false, isWritable: true },
      ];

      // Process referral accounts
      for (const account of referralAccounts) {
        tgeKeys.push(
          { pubkey: account.pubkey, isSigner: false, isWritable: true },
          { pubkey: account.owner, isSigner: false, isWritable: true }
        );
      }

      const instruction = new TransactionInstruction({
        keys: tgeKeys,
        programId: PROGRAM_ID,
        data: new Uint8Array([3]) // ProcessTgeAndVesting instruction
      });

      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      const transaction = new Transaction().add(instruction);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signed = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: true
      });

      await connection.confirmTransaction(signature, 'confirmed');
      addNotification('success', 'TGE triggered successfully!');

    } catch (error) {
      console.error('Failed to trigger TGE:', error);
      if (error instanceof SendTransactionError) {
        const logs = error.logs ? error.logs.join('\n') : error.message;
        addNotification('error', `Transaction failed: ${logs}`);
      } else {
        addNotification('error', error instanceof Error ? error.message : 'TGE trigger failed');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mt-6">
      <button
        onClick={handleTriggerTge}
        disabled={isProcessing || !publicKey || publicKey.toString() !== ADMIN_WALLET.toString()}
        className="w-full bg-gradient-brand text-black font-bold py-4 px-6 rounded-lg hover:shadow-gradient transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-none"
      >
        {isProcessing 
          ? 'Processing TGE...' 
          : `Trigger TGE (${referralAccounts.length} referrals found)`}
      </button>
    </div>
  );
};