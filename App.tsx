
import React, { useState, useEffect, useRef } from 'react';
import { GameStatus, GameRecord, GuessEntry } from './types';
import { getBestRecord, saveRecord } from './supabase';
import { Trophy, Timer, User, Play, RotateCcw, Send, History as HistoryIcon, PartyPopper, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>('READY');
  const [playerName, setPlayerName] = useState('');
  const [bestRecord, setBestRecord] = useState<GameRecord | null>(null);
  const [isLoadingBest, setIsLoadingBest] = useState(true);
  const [targetNumber, setTargetNumber] = useState(0);
  const [currentGuess, setCurrentGuess] = useState('');
  const [guesses, setGuesses] = useState<GuessEntry[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [message, setMessage] = useState('1~100 사이의 숫자를 맞춰보세요!');
  
  const timerRef = useRef<number | null>(null);

  const fetchBest = async () => {
    setIsLoadingBest(true);
    const best = await getBestRecord();
    setBestRecord(best);
    setIsLoadingBest(false);
  };

  useEffect(() => {
    fetchBest();
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
      alert('도전자님의 성함을 입력해주세요! 🏆');
      return;
    }
    setTargetNumber(Math.floor(Math.random() * 100) + 1);
    setStatus('PLAYING');
    setStartTime(Date.now());
    setElapsedTime(0);
    setGuesses([]);
    setCurrentGuess('');
    setMessage('행운을 빌어요! 숫자를 입력하세요.');
  };

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(currentGuess);
    if (isNaN(num) || num < 1 || num > 100) {
      alert('1에서 100 사이의 숫자를 입력해주세요! 😊');
      return;
    }

    const hint = num === targetNumber ? 'CORRECT' : num < targetNumber ? 'LOW' : 'HIGH';
    const newGuess: GuessEntry = { number: num, hint, timestamp: Date.now() };
    
    // 최근 입력이 맨 위로 오도록 배열 앞에 추가
    const newGuesses = [newGuess, ...guesses];
    setGuesses(newGuesses);
    setCurrentGuess('');

    if (hint === 'CORRECT') {
      handleWin(newGuesses.length);
    } else {
      setMessage(hint === 'LOW' ? '더 큰 숫자예요! ⬆️' : '더 작은 숫자예요! ⬇️');
    }
  };

  const handleWin = async (attempts: number) => {
    setStatus('WON');
    const finalTime = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));
    setElapsedTime(finalTime);
    setMessage(`정답입니다! 숫자는 ${targetNumber}였어요! 🎉`);
    
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#fbbf24', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6']
    });

    const isNewRecord = !bestRecord || 
      attempts < bestRecord.attempts || 
      (attempts === bestRecord.attempts && finalTime < bestRecord.time_seconds);

    if (isNewRecord) {
      const newRecord: GameRecord = {
        name: playerName,
        attempts: attempts,
        time_seconds: finalTime
      };
      await saveRecord(newRecord);
      setBestRecord(newRecord);
    }
  };

  const resetGame = () => {
    setStatus('READY');
    setPlayerName('');
    fetchBest();
  };

  return (
    <div className="max-w-md mx-auto p-4 min-h-screen flex flex-col justify-center">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-jua text-orange-600 drop-shadow-sm mb-2 animate-float">
          🔢 숫자 맞추기 대모험
        </h1>
        <p className="text-orange-800 font-medium opacity-80">즐거움이 가득한 기록 도전!</p>
      </div>

      {status === 'READY' && (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border-4 border-yellow-300 transition-all duration-500 hover:shadow-2xl">
          <div className="mb-8 p-4 bg-orange-50 rounded-2xl border-2 border-orange-100">
            <h2 className="flex items-center gap-2 text-xl font-jua text-orange-700 mb-3">
              <Trophy className="text-yellow-500" /> 명예의 전당 (최고 기록)
            </h2>
            {isLoadingBest ? (
              <div className="flex justify-center py-6">
                <Loader2 className="animate-spin text-orange-400" size={32} />
              </div>
            ) : bestRecord ? (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                  <span className="text-gray-500 font-bold flex items-center gap-2 text-sm"><User size={14}/> 도전자</span>
                  <span className="text-orange-600 font-jua text-xl">{bestRecord.name}</span>
                </div>
                <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                  <span className="text-gray-500 font-bold flex items-center gap-2 text-sm"><HistoryIcon size={14}/> 시도 횟수</span>
                  <span className="text-blue-600 font-jua text-xl">{bestRecord.attempts}회</span>
                </div>
                <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                  <span className="text-gray-500 font-bold flex items-center gap-2 text-sm"><Timer size={14}/> 시간 기록</span>
                  <span className="text-green-600 font-jua text-xl">{bestRecord.time_seconds}초</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-center italic py-4">아직 기록이 없어요. 첫 번째 전설이 되어보세요!</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="relative">
              <label className="block text-orange-700 font-jua mb-2 ml-1">당신의 이름은 무엇인가요?</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="도전자 이름을 입력하세요"
                className="w-full px-5 py-4 rounded-2xl border-2 border-yellow-300 focus:outline-none focus:ring-4 focus:ring-yellow-100 transition-all text-lg font-bold text-orange-900 bg-white/50"
              />
            </div>
            <button
              onClick={startGame}
              className="w-full py-5 bg-orange-500 hover:bg-orange-600 text-white font-jua text-2xl rounded-2xl shadow-lg hover:shadow-orange-200 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Play fill="currentColor" /> 모험 시작하기!
            </button>
          </div>
        </div>
      )}

      {status === 'PLAYING' && (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border-4 border-sky-300 animate-in fade-in zoom-in duration-300">
          <div className="flex justify-between items-center mb-6 px-2">
            <div className="flex items-center gap-2 bg-sky-50 px-4 py-2 rounded-full border border-sky-100">
              <Timer className="text-sky-500" size={18} />
              <span className="font-jua text-lg text-sky-700">{elapsedTime}초</span>
            </div>
            <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full border border-purple-100">
              <HistoryIcon className="text-purple-500" size={18} />
              <span className="font-jua text-lg text-purple-700">{guesses.length}회 도전 중</span>
            </div>
          </div>

          <div className="text-center mb-6 min-h-[3rem] flex items-center justify-center">
            <div className="text-2xl font-jua text-gray-700 transition-all transform animate-pulse text-center">
              {message}
            </div>
          </div>

          <form onSubmit={handleGuess} className="mb-8">
            <div className="relative group">
              <input
                type="number"
                value={currentGuess}
                onChange={(e) => setCurrentGuess(e.target.value)}
                autoFocus
                className="w-full px-6 py-6 rounded-3xl border-4 border-sky-400 text-center text-5xl font-jua text-sky-800 focus:outline-none focus:border-sky-500 bg-white/60 shadow-inner group-hover:border-sky-300 transition-colors"
                placeholder="?"
              />
              <button
                type="submit"
                className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-sky-500 text-white rounded-2xl hover:bg-sky-600 active:scale-90 transition-all shadow-lg"
              >
                <Send size={24} />
              </button>
            </div>
          </form>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {guesses.map((g, idx) => (
              <div 
                key={g.timestamp} 
                className={`flex justify-between items-center p-4 rounded-2xl border-b-4 transition-all animate-in slide-in-from-top-4 duration-300 ${
                  g.hint === 'HIGH' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-jua text-white text-lg ${
                    g.hint === 'HIGH' ? 'bg-red-400' : 'bg-blue-400'
                  }`}>
                    {guesses.length - idx}
                  </div>
                  <span className="font-jua text-2xl text-gray-800">{g.number}</span>
                </div>
                <span className={`font-jua px-4 py-1.5 rounded-full text-sm shadow-sm ${
                  g.hint === 'HIGH' ? 'bg-red-200 text-red-700' : 'bg-blue-200 text-blue-700'
                }`}>
                  {g.hint === 'HIGH' ? '더 낮게! ⬇️' : '더 높게! ⬆️'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {status === 'WON' && (
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl border-4 border-pink-300 text-center animate-in zoom-in duration-500">
          <div className="flex justify-center mb-6">
            <div className="bg-pink-100 p-8 rounded-full shadow-inner">
              <PartyPopper size={72} className="text-pink-500 animate-bounce" />
            </div>
          </div>
          <h2 className="text-4xl font-jua text-pink-600 mb-2">🎉 축하합니다! 🎉</h2>
          <p className="text-gray-700 mb-8 font-jua text-xl">{message}</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-50 p-5 rounded-2xl border-2 border-blue-200 shadow-sm transform hover:scale-105 transition-transform">
              <div className="text-blue-500 text-xs font-bold uppercase tracking-wider mb-2">도전 횟수</div>
              <div className="text-4xl font-jua text-blue-700">{guesses.length}회</div>
            </div>
            <div className="bg-green-50 p-5 rounded-2xl border-2 border-green-200 shadow-sm transform hover:scale-105 transition-transform">
              <div className="text-green-500 text-xs font-bold uppercase tracking-wider mb-2">소요 시간</div>
              <div className="text-4xl font-jua text-green-700">{elapsedTime}초</div>
            </div>
          </div>

          <button
            onClick={resetGame}
            className="w-full py-5 bg-pink-500 hover:bg-pink-600 text-white font-jua text-2xl rounded-2xl shadow-lg hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={24} /> 다시 도전하기!
          </button>
        </div>
      )}
      
      <footer className="mt-8 text-center text-orange-400 font-jua opacity-60">
        최고의 기록에 도전하세요! 🏆
      </footer>
    </div>
  );
};

export default App;
