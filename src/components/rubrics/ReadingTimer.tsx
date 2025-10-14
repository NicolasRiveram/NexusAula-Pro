import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';

interface ReadingTimerProps {
  onDataChange: (data: { seconds: number; ppm: number }) => void;
}

const ReadingTimer: React.FC<ReadingTimerProps> = ({ onDataChange }) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [words, setWords] = useState('');
  const [ppm, setPpm] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds + 1);
      }, 1000);
    } else if (!isActive && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const remainingSeconds = timeInSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const handleToggle = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setSeconds(0);
    setWords('');
    setPpm(0);
    onDataChange({ seconds: 0, ppm: 0 });
  };

  const calculatePpm = () => {
    const numWords = parseInt(words, 10);
    if (!isNaN(numWords) && numWords > 0 && seconds > 0) {
      const calculatedPpm = Math.round((numWords / seconds) * 60);
      setPpm(calculatedPpm);
      onDataChange({ seconds, ppm: calculatedPpm });
    } else {
      setPpm(0);
      onDataChange({ seconds, ppm: 0 });
    }
  };

  useEffect(() => {
    // Recalculate PPM when words or seconds change, but only if timer is stopped
    if (!isActive) {
      calculatePpm();
    }
  }, [words, seconds, isActive]);


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Timer className="mr-2 h-5 w-5" />
          Módulo de Lectura
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-6xl font-mono font-bold tracking-tighter">
            {formatTime(seconds)}
          </p>
        </div>
        <div className="flex justify-center gap-2">
          <Button onClick={handleToggle} variant="outline">
            {isActive ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {isActive ? 'Pausar' : 'Iniciar'}
          </Button>
          <Button onClick={handleReset} variant="destructive">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reiniciar
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 items-end">
          <div>
            <Label htmlFor="word-count">N° de Palabras Leídas</Label>
            <Input
              id="word-count"
              type="number"
              placeholder="Ej: 120"
              value={words}
              onChange={(e) => setWords(e.target.value)}
              disabled={isActive}
            />
          </div>
          <div className="text-center p-2 bg-muted rounded-md">
            <p className="text-sm font-medium text-muted-foreground">Palabras por Minuto (PPM)</p>
            <p className="text-2xl font-bold">{ppm}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReadingTimer;