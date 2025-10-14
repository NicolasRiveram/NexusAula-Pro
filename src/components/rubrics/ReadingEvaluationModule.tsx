import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Timer, Play, Pause, RotateCcw, Mic } from 'lucide-react';
import useSpeechRecognition from '@/hooks/useSpeechRecognition';
import DictationView from './DictationView';
import { showError } from '@/utils/toast';

interface ReadingEvaluationModuleProps {
  onDataChange: (data: { seconds: number; ppm: number; errors: number[], transcript: string }) => void;
  onTextChange: (text: string) => void;
  originalText: string;
  isDictationEnabled: boolean;
}

const ReadingEvaluationModule: React.FC<ReadingEvaluationModuleProps> = ({
  onDataChange,
  onTextChange,
  originalText,
  isDictationEnabled,
}) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [words, setWords] = useState('');
  const [ppm, setPpm] = useState(0);
  const [markedErrors, setMarkedErrors] = useState<number[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { transcript, isListening, startListening, stopListening, hasRecognitionSupport } = useSpeechRecognition();

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
    if (isListening) stopListening();
    setSeconds(0);
    setWords('');
    setPpm(0);
    setMarkedErrors([]);
    onDataChange({ seconds: 0, ppm: 0, errors: [], transcript: '' });
  };

  const calculatePpm = () => {
    const numWords = parseInt(words, 10);
    if (!isNaN(numWords) && numWords > 0 && seconds > 0) {
      const calculatedPpm = Math.round((numWords / seconds) * 60);
      setPpm(calculatedPpm);
      onDataChange({ seconds, ppm: calculatedPpm, errors: markedErrors, transcript });
    } else {
      setPpm(0);
      onDataChange({ seconds, ppm: 0, errors: markedErrors, transcript });
    }
  };

  useEffect(() => {
    if (!isActive) {
      calculatePpm();
    }
  }, [words, seconds, isActive, markedErrors, transcript]);

  const handleToggleDictation = () => {
    if (!hasRecognitionSupport) {
      showError("Tu navegador no soporta el reconocimiento de voz.");
      return;
    }
    if (isListening) {
      stopListening();
      setIsActive(false);
    } else {
      startListening();
      setIsActive(true);
    }
  };

  const handleWordClick = (wordIndex: number) => {
    setMarkedErrors(prev => 
      prev.includes(wordIndex) 
        ? prev.filter(i => i !== wordIndex)
        : [...prev, wordIndex]
    );
  };

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
          <Button onClick={handleToggleTimer} variant="outline" disabled={isListening}>
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

        {isDictationEnabled && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <Label htmlFor="original-text">Texto Original para Lectura</Label>
              <Textarea
                id="original-text"
                placeholder="Pega o escribe aquí el texto que el estudiante leerá."
                rows={6}
                value={originalText}
                onChange={(e) => onTextChange(e.target.value)}
                disabled={isListening || isActive}
              />
            </div>
            <div>
              <Label>Transcripción y Marcado de Errores</Label>
              <DictationView
                originalText={originalText}
                liveTranscript={transcript}
                markedErrors={markedErrors}
                onWordClick={handleWordClick}
              />
            </div>
            <div className="flex justify-center">
              <Button onClick={handleToggleDictation} disabled={!originalText.trim()}>
                <Mic className="mr-2 h-4 w-4" /> {isListening ? 'Detener Dictado' : 'Iniciar Dictado'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReadingEvaluationModule;