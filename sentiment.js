// utils/sentiment.js — Keyword-based Sentiment Analysis

const POSITIVE_WORDS = [
  'amazing', 'wonderful', 'fantastic', 'great', 'excellent', 'beautiful',
  'loved', 'perfect', 'stunning', 'breathtaking', 'awesome', 'incredible',
  'outstanding', 'superb', 'magnificent', 'delightful', 'enjoyable', 'pleasant',
  'good', 'nice', 'best', 'recommended', 'peaceful', 'clean', 'friendly',
  'gorgeous', 'spectacular', 'impressive', 'lovely', 'charming', 'scenic',
  'unforgettable', 'paradise', 'worth', 'must-visit', 'treasure', 'gem',
];

const NEGATIVE_WORDS = [
  'terrible', 'awful', 'horrible', 'bad', 'poor', 'disappointing', 'worst',
  'disgusting', 'dirty', 'crowded', 'overrated', 'expensive', 'rude', 'avoid',
  'waste', 'boring', 'mediocre', 'unpleasant', 'ugly', 'loud', 'smelly',
  'dangerous', 'overpriced', 'scam', 'disappointing', 'dull', 'filthy',
  'chaotic', 'overwhelming', 'polluted', 'sketchy', 'unsafe', 'trash',
];

/**
 * Classify a review text as positive, negative, or neutral
 * @param {string} text - The review text
 * @returns {'positive'|'negative'|'neutral'} sentiment label
 */
function analyzeSentiment(text) {
  if (!text) return 'neutral';

  const lower = text.toLowerCase();
  let posScore = 0;
  let negScore = 0;

  // Check for negation (e.g., "not good")
  const negationPattern = /\b(not|never|no|don't|doesn't|wasn't|weren't|isn't|aren't)\s+\w+/gi;
  const negations = lower.match(negationPattern) || [];

  POSITIVE_WORDS.forEach(word => {
    if (lower.includes(word)) posScore++;
  });

  NEGATIVE_WORDS.forEach(word => {
    if (lower.includes(word)) negScore++;
  });

  // Adjust for negations (rough heuristic)
  posScore = Math.max(0, posScore - negations.length);

  if (posScore === 0 && negScore === 0) return 'neutral';
  if (posScore > negScore) return 'positive';
  if (negScore > posScore) return 'negative';
  return 'neutral';
}

module.exports = { analyzeSentiment };
