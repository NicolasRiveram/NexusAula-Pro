import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Timer, Play, Pause, RotateCcw, Mic } from 'lucide-react';

interface ReadingEvaluationModuleProps {
  onDataChange: (data: { seconds: number; ppm: number }) => void;
  onTextChange: (text: string) => void;
  originalText: string;
  isDictationActive: boolean;
  onToggleDictation: () => void;
}

const ReadingEvaluationModule: React.FC<ReadingEvaluationModuleProps> = ({
  onDataChange,
  onTextChange,
  originalText,
  isDictationActive,
  onToggleDictation,
}) => {
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

  const handleToggleTimer = () => {
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
          <Button onClick={handleToggleTimer} variant="outline">
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

        {isDictationActive && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <Label htmlFor="original-text">Texto Original para Lectura</Label>
              <Textarea
                id="original-text"
                placeholder="Pega o escribe aquí el texto que el estudiante leerá."
                rows={6}
                value={originalText}
                onChange={(e) => onTextChange(e.target.value)}
              />
            </div>
            <div>
              <Label>Transcripción en Vivo</Label>
              <div className="p-4 border rounded-md bg-muted/50 min-h-[100px]">
                <p className="text-sm text-muted-foreground italic">La transcripción en vivo aparecerá aquí cuando inicies el dictado...</p>
              </div>
            </div>
            <div className="flex justify-center">
              <Button onClick={onToggleDictation}>
                <Mic className="mr-2 h-4 w-4" /> Iniciar Dictado
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReadingEvaluationModule;