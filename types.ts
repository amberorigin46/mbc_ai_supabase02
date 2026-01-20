
export interface GameRecord {
  id?: number;
  name: string;
  attempts: number;
  time_seconds: number;
  created_at?: string;
}

export type GameStatus = 'READY' | 'PLAYING' | 'WON';

export interface GuessEntry {
  number: number;
  hint: 'HIGH' | 'LOW' | 'CORRECT';
  timestamp: number;
}
