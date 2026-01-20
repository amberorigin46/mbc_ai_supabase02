
import React, { useState, useEffect, useRef } from 'react';
import { GameStatus, GameRecord, GuessEntry } from './types';
import { getTopRecords, saveRecord } from './supabase';
import { Trophy, Timer, User, Play, RotateCcw, Send, History as HistoryIcon, PartyPopper, Loader2, Medal, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>('READY');
  const [playerName, setPlayerName] = useState('');
  const [topRecords, setTopRecords] = useState<GameRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [targetNumber, setTargetNumber] = useState(0);
  const [currentGuess, setCurrentGuess] = useState('');
  const [guesses, setGuesses] = useState<GuessEntry[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [message, setMessage] = useState('1~100 사이의 숫자를 맞춰보세요!');
  
  const timerRef = useRef<number | null>(null);

  const fetchRecords = async () => {
    setIsLoading(true);
    const records = await getTopRecords(10);
    setTopRecords(records);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    if (status === 'PLAYING') {
      timerRef.current = window.setInterval(() => {
        setElapsedTime(parseFloat(((Date.now() - startTime) / 1000).toFixed(1)));
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, startTime]);

  const startGame = () => {
    if (!playerName.trim()) {
      alert('도전자님의 멋진 이름을 알려주세요! 😊');
      return;
    }
    setTargetNumber(Math.floor(Math.random() * 100) + 1);
    setStatus('PLAYING');
    setStartTime(Date.now());
    setElapsedTime(0);
    setGuesses([]);
    setCurrentGuess('');
    setMessage('행운의 숫자가 무엇일까요?');
  };

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(currentGuess);
    if (isNaN(num) || num < 1 || num > 100) {
      alert('1에서 100 사이의 숫자를 입력해주세요!');
      return;
    }

    const hint = num === targetNumber ? 'CORRECT' : num < targetNumber ? 'LOW' : 'HIGH';
    const newGuess: GuessEntry = { number: num, hint, timestamp: Date.now() };
    const newGuesses = [newGuess, ...guesses];
    setGuesses(newGuesses);
    setCurrentGuess('');

    if (hint === 'CORRECT') {
      handleWin(newGuesses.length);
    } else {
      setMessage(hint === 'LOW' ? '더 높은 숫자예요! ⬆️' : '더 낮은 숫자예요! ⬇️');
    }
  };

  const handleWin = async (attempts: number) => {
    setStatus('WON');
    const finalTime = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));
    setElapsedTime(finalTime);
    setMessage(`정답입니다! 당신은 천재인가요? 🎉`);
    
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });

    const newRecord: GameRecord = {
      name: playerName,
      attempts: attempts,
      time_seconds: finalTime
    };
    
    await saveRecord(newRecord);
    // 기록 저장 후 즉시 최신 랭킹으로 갱신
    await fetchRecords();
  };

  const resetGame = () => {
    setStatus('READY');
    setPlayerName('');
    fetchRecords();
  };

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0: return <Medal className="text-yellow-400" size={20} />;
      case 1: return <Medal className="text-slate-400" size={20} />;
      case 2: return <Medal className="text-amber-600" size={20} />;
      default: return <span className="font-jua text-gray-400">{index + 1}</span>;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 min-h-screen flex flex-col items-center justify-center">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-jua text-orange-600 drop-shadow-md mb-2 animate-float">
          🌈 숫자 대모험 🌈
        </h1>
        <p className="text-orange-800 font-bold opacity-75">친구들과 경쟁하며 최고의 기록을 세워보세요!</p>
      </div>

      {status === 'READY' && (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* 입력 카드 */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl border-4 border-yellow-300">
            <h2 className="text-2xl font-jua text-orange-600 mb-6 flex items-center gap-2">
              <Star className="text-yellow-500 fill-yellow-500" /> 게임 시작하기
            </h2>
            <div className="space-y-6">
              <div className="relative">
                <label className="block text-gray-700 font-jua mb-2 ml-1">이름을 알려주세요!</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="닉네임 입력"
                  className="w-full px-5 py-4 rounded-2xl border-4 border-yellow-200 focus:border-yellow-400 focus:outline-none transition-all text-xl font-bold bg-yellow-50/30"
                />
              </div>
              <button
                onClick={startGame}
                className="w-full py-5 bg-orange-500 hover:bg-orange-600 text-white font-jua text-2xl rounded-2xl shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Play fill="currentColor" /> 모험 시작!
              </button>
            </div>
          </div>

          {/* 명예의 전당 카드 */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-2xl border-4 border-orange-200">
            <h2 className="text-2xl font-jua text-orange-700 mb-4 flex items-center gap-2">
              <Trophy className="text-yellow-500" /> 명예의 전당 (Top 10)
            </h2>
            <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-orange-400" size={40} /></div>
              ) : topRecords.length > 0 ? (
                topRecords.map((record, index) => (
                  <div key={index} className={`flex items-center justify-between p-3 rounded-2xl transition-all ${index < 3 ? 'bg-orange-50 border-2 border-orange-100 shadow-sm' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 flex justify-center">{getRankBadge(index)}</div>
                      <div className="flex flex-col">
                        <span className={`font-jua text-lg ${index === 0 ? 'text-orange-600' : 'text-gray-700'}`}>{record.name}</span>
                        <span className="text-xs text-gray-400 font-bold">{new Date(record.created_at || '').toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-jua text-sm text-blue-500">{record.attempts}회</div>
                      <div className="font-jua text-xs text-green-500">{record.time_seconds}초</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-400 italic">아직 기록이 없어요!</div>
              )}
            </div>
          </div>
        </div>
      )}

      {status === 'PLAYING' && (
        <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-[3rem] p-8 shadow-2xl border-4 border-sky-400 transition-all">
          <div className="flex justify-around mb-8">
            <div className="text-center">
              <div className="text-sky-500 mb-1"><Timer className="mx-auto" /></div>
              <div className="font-jua text-3xl text-sky-700">{elapsedTime}s</div>
            </div>
            <div className="text-center">
              <div className="text-purple-500 mb-1"><HistoryIcon className="mx-auto" /></div>
              <div className="font-jua text-3xl text-purple-700">{guesses.length}회</div>
            </div>
          </div>

          <div className="text-center mb-6 h-12 flex items-center justify-center">
            <p className="text-2xl font-jua text-gray-700 animate-pulse">{message}</p>
          </div>

          <form onSubmit={handleGuess} className="mb-10 relative">
            <input
              type="number"
              value={currentGuess}
              onChange={(e) => setCurrentGuess(e.target.value)}
              autoFocus
              className="w-full py-8 px-4 rounded-3xl border-4 border-sky-200 text-center text-6xl font-jua text-sky-800 focus:border-sky-500 focus:outline-none bg-sky-50/50 shadow-inner"
              placeholder="?"
            />
            <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 p-5 bg-sky-500 text-white rounded-3xl hover:bg-sky-600 shadow-xl transform active:scale-90 transition-all">
              <Send size={32} />
            </button>
          </form>

          <div className="space-y-3 max-h-52 overflow-y-auto pr-2 custom-scrollbar">
            {guesses.map((g, idx) => (
              <div key={g.timestamp} className={`flex justify-between items-center p-4 rounded-2xl border-b-4 ${g.hint === 'HIGH' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex items-center gap-4">
                  <span className="font-jua text-gray-400 text-sm">#{guesses.length - idx}</span>
                  <span className="font-jua text-3xl text-gray-800">{g.number}</span>
                </div>
                <span className={`font-jua px-4 py-1.5 rounded-full text-xs shadow-sm ${g.hint === 'HIGH' ? 'bg-red-400 text-white' : 'bg-blue-400 text-white'}`}>
                  {g.hint === 'HIGH' ? '더 작게!' : '더 크게!'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {status === 'WON' && (
        <div className="w-full max-w-md bg-white/95 rounded-[3rem] p-10 shadow-2xl border-4 border-pink-400 text-center animate-in zoom-in duration-500">
          <div className="bg-pink-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <PartyPopper size={50} className="text-pink-500 animate-bounce" />
          </div>
          <h2 className="text-4xl font-jua text-pink-600 mb-2">대모험 성공!</h2>
          <p className="text-xl font-jua text-gray-600 mb-8">{message}</p>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-blue-50 p-6 rounded-[2rem] border-2 border-blue-100 shadow-sm transform hover:scale-105 transition-transform">
              <div className="text-blue-500 text-xs font-bold mb-1 uppercase tracking-tighter">총 시도 횟수</div>
              <div className="text-4xl font-jua text-blue-700">{guesses.length}회</div>
            </div>
            <div className="bg-green-50 p-6 rounded-[2rem] border-2 border-green-100 shadow-sm transform hover:scale-105 transition-transform">
              <div className="text-green-500 text-xs font-bold mb-1 uppercase tracking-tighter">소요 시간</div>
              <div className="text-4xl font-jua text-green-700">{elapsedTime}초</div>
            </div>
          </div>

          <button
            onClick={resetGame}
            className="w-full py-5 bg-pink-500 hover:bg-pink-600 text-white font-jua text-2xl rounded-[2rem] shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
          >
            <RotateCcw size={28} /> 처음으로 돌아가기
          </button>
        </div>
      )}
      
      <footer className="mt-12 text-orange-500 font-jua opacity-60 text-sm">
        순위는 실시간으로 반영됩니다! 명예의 전당을 차지해보세요.
      </footer>
    </div>
  );
};

export default App;
