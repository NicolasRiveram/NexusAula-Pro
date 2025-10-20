import { EvaluationItem, ItemAlternative } from "@/api/evaluationsApi";

// A simple seeded pseudo-random number generator (Mulberry32)
function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// Simple string to number hash function
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

// Fisher-Yates shuffle algorithm using a seeded PRNG
export function seededShuffle<T>(array: T[], seed: string): T[] {
  const numericalSeed = simpleHash(seed);
  const random = mulberry32(numericalSeed);
  const shuffled = [...array];
  let currentIndex = shuffled.length;
  let randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [shuffled[currentIndex], shuffled[randomIndex]] = [
      shuffled[randomIndex], shuffled[currentIndex]];
  }

  return shuffled;
}

export function generateBalancedShuffledAlternatives(
  questions: (EvaluationItem | (Omit<EvaluationItem, 'item_alternativas'> & { item_alternativas: any[] }))[], 
  seed: string, 
  rowLabel: string
): { [questionId: string]: ItemAlternative[] } {
  
  if (!questions || questions.length === 0) {
    return {};
  }

  const finalShuffledAlternatives: { [questionId: string]: ItemAlternative[] } = {};

  // 1. Generate initial shuffled alternatives and answer key
  const answerKey: { questionId: string; answer: string; order: number }[] = [];
  questions.forEach(q => {
    const alternatives = q.item_alternativas || [];
    const shuffled = seededShuffle(alternatives, `${seed}-${q.id}`);
    finalShuffledAlternatives[q.id] = shuffled;
    const correctIndex = shuffled.findIndex(alt => alt.es_correcta);
    
    if (correctIndex !== -1) { // Safeguard against questions with no correct answer
      answerKey.push({
        questionId: q.id,
        answer: String.fromCharCode(65 + correctIndex),
        order: q.orden
      });
    }
  });
  answerKey.sort((a, b) => a.order - b.order);

  if (answerKey.length === 0) {
    return finalShuffledAlternatives;
  }

  // 2. Balance the answer key
  const numQuestions = answerKey.length; // Use answerKey length as it's the reliable source
  const numOptions = 4; // Assuming A,B,C,D
  const idealCount = Math.floor(numQuestions / numOptions);
  const remainder = numQuestions % numOptions;
  const options = ['A', 'B', 'C', 'D'];
  const targetCounts: { [key: string]: number } = {};
  options.forEach((opt, i) => {
    targetCounts[opt] = idealCount + (i < remainder ? 1 : 0);
  });

  const currentCounts = options.reduce((acc, opt) => ({ ...acc, [opt]: 0 }), {} as { [key: string]: number });
  answerKey.forEach(item => {
    if (currentCounts[item.answer] !== undefined) {
      currentCounts[item.answer]++;
    }
  });

  const overRepresented = options.filter(opt => currentCounts[opt] > targetCounts[opt]);
  
  overRepresented.forEach(overOpt => {
    let excess = currentCounts[overOpt] - targetCounts[overOpt];
    
    while (excess > 0) {
      const underRepresented = options.filter(opt => currentCounts[opt] < targetCounts[opt]);
      if (underRepresented.length === 0) break;
      
      const underOpt = underRepresented[0];
      
      const hash = simpleHash(`${seed}-${rowLabel}-${overOpt}-${underOpt}-${excess}`);
      const startIndex = hash % answerKey.length;
      let swapItemIndex = -1;

      for (let i = 0; i < answerKey.length; i++) {
        const checkIndex = (startIndex + i) % answerKey.length;
        if (answerKey[checkIndex].answer === overOpt) {
          swapItemIndex = checkIndex;
          break;
        }
      }

      if (swapItemIndex === -1) break;

      const itemToChange = answerKey[swapItemIndex];
      const questionId = itemToChange.questionId;
      
      const alternatives = finalShuffledAlternatives[questionId];
      const toIndex = underOpt.charCodeAt(0) - 65;
      const actualCorrectIndex = alternatives.findIndex(a => a.es_correcta);

      if (actualCorrectIndex !== -1 && alternatives[toIndex] && actualCorrectIndex !== toIndex) {
          [alternatives[actualCorrectIndex], alternatives[toIndex]] = [alternatives[toIndex], alternatives[actualCorrectIndex]];
          itemToChange.answer = underOpt;
          currentCounts[overOpt]--;
          currentCounts[underOpt]++;
          excess--;
      } else {
          break; 
      }
    }
  });

  // 3. Correct streaks
  for (let i = 0; i <= answerKey.length - 4; i++) {
    const currentAnswer = answerKey[i].answer;
    if (
      answerKey[i+1].answer === currentAnswer &&
      answerKey[i+2].answer === currentAnswer &&
      answerKey[i+3].answer === currentAnswer
    ) {
      const itemToChange = answerKey[i + 3];
      const questionId = itemToChange.questionId;
      
      const possibleAnswers = options.filter(opt => opt !== currentAnswer);
      const newAnswer = possibleAnswers[(i % possibleAnswers.length)];
      
      const alternatives = finalShuffledAlternatives[questionId];
      const fromIndex = alternatives.findIndex(a => a.es_correcta);
      const toIndex = newAnswer.charCodeAt(0) - 65;

      if (fromIndex !== -1 && alternatives[toIndex] && fromIndex !== toIndex) {
        [alternatives[fromIndex], alternatives[toIndex]] = [alternatives[toIndex], alternatives[fromIndex]];
        itemToChange.answer = newAnswer;
      }
    }
  }

  return finalShuffledAlternatives;
}