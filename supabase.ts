
import { createClient } from '@supabase/supabase-js';
import { GameRecord } from './types';

const SUPABASE_URL = 'https://cjszztzssoziopcrydbg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable__JTfuZAjbk0izvx1-jV7DQ_eaqJj1av';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const getTopRecords = async (limit: number = 10): Promise<GameRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('game_records')
      .select('*')
      .order('attempts', { ascending: true })
      .order('time_seconds', { ascending: true })
      .limit(limit);

    if (error) {
      console.warn('기록 로딩 알림:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('리더보드 조회 중 오류:', err);
    return [];
  }
};

export const saveRecord = async (record: GameRecord) => {
  try {
    const { error } = await supabase
      .from('game_records')
      .insert([record]);
    
    if (error) {
      console.error('기록 저장 실패:', error.message);
    }
  } catch (err) {
    console.error('기록 저장 중 오류:', err);
  }
};
