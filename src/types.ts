import { Connection } from '@solana/web3.js';

export interface TokenSaleDetails {
  connection: Connection | null;
  programId: string;
  totalRaised: number;
  totalParticipants: number;
  saleActive: boolean;
  loading: boolean;
  hardCap: number;
  startTime: number;
  endTime: number;
}

export interface UserDetails {
  invested: number;
  referralCode: string | null;
  rewards: number;
}