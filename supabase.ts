
import { createClient } from '@supabase/supabase-js';
import { GameRecord } from './types';

const SUPABASE_URL = 'https://cjszztzssoziopcrydbg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable__JTfuZAjbk0izvx1-jV7DQ_eaqJj1av';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const getBestRecord = async (): Promise<GameRecord | null> => {
  try {
    const { data, error } = await supabase
      .from('game_records')
      .select('*')
      .order('attempts', { ascending: true })
      .order('time_seconds', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('최고 기록 로딩 중 알림 (테이블이 비어있을 수 있음):', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('기록 조회 중 예상치 못한 오류:', err);
    return null;
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
    console.error('기록 저장 중 예상치 못한 오류:', err);
  }
};
