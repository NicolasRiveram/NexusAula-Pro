import React from 'react';
import * as Diff from 'diff';
import { cn } from '@/lib/utils';

interface DictationViewProps {
  originalText: string;
  liveTranscript: string;
  markedErrors: number[];
  onWordClick: (wordIndex: number) => void;
}

const DictationView: React.FC<DictationViewProps> = ({ originalText, liveTranscript, markedErrors, onWordClick }) => {
  const diff = Diff.diffWords(originalText.trim(), liveTranscript.trim(), { ignoreCase: true });

  let originalWordIndex = 0;

  return (
    <div className="p-4 border rounded-md bg-muted/50 min-h-[150px] text-lg leading-relaxed">
      {diff.map((part, index) => {
        const words = part.value.trim().split(/\s+/).filter(Boolean);
        
        return words.map((word, i) => {
          const currentWordIndex = originalWordIndex;
          let className = '';

          if (part.added) {
            className = 'bg-blue-200 dark:bg-blue-900/50 rounded px-1';
          } else if (part.removed) {
            className = 'bg-red-200 dark:bg-red-900/50 rounded px-1 line-through';
          } else if (markedErrors.includes(currentWordIndex)) {
            className = 'bg-yellow-200 dark:bg-yellow-900/50 rounded px-1 cursor-pointer';
          } else {
            className = 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 rounded px-1';
          }
          
          if (!part.added) {
            originalWordIndex++;
          }

          return (
            <span
              key={`${index}-${i}`}
              className={className}
              onClick={() => !part.added && onWordClick(currentWordIndex)}
            >
              {word}{' '}
            </span>
          );
        });
      })}
    </div>
  );
};

export default DictationView;