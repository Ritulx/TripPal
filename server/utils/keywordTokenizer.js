// A curated stopword list — common English words that carry no discovery value
// (e.g. "the", "and") are excluded so they never pollute tags or match scoring.
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we',
  'they', 'them', 'their', 'what', 'which', 'who', 'whom', 'to', 'of',
  'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'from', 'up', 'down', 'out', 'off', 'over', 'under', 'again',
  'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
  'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
  'than', 'too', 'very', 'just', 'really', 'also', 'very', 'my', 'me',
  'very', 'was', 'were', 'im', 'ive', 'its', 'us', 'our', 'get', 'got',
  'went', 'go', 'going', 'one', 'place', 'places',
]);

/**
 * Splits raw review text into sentences using punctuation boundaries.
 * Deliberately simple (no NLP sentence-boundary detection) per the
 * project's non-AI requirement — good enough for review-length text.
 */
const splitIntoSentences = (text) => {
  if (!text || typeof text !== 'string') return [];
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

/**
 * Lowercases, strips punctuation (keeping apostrophes inside words like "don't"),
 * and splits a sentence into an array of clean word tokens.
 */
const cleanWords = (sentence) => {
  return sentence
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^'+|'+$/g, '')) // trim stray leading/trailing apostrophes
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
};

/**
 * Extracts unigram + bigram keyword tokens from a single sentence.
 * Bigrams are critical: "fresh lilies", "masala dosa", "authentic dosas"
 * are two-word phrases that unigram-only extraction would never capture together.
 */
const extractTokensFromSentence = (sentence) => {
  const words = cleanWords(sentence);
  const tokens = new Set();

  words.forEach((w) => tokens.add(w));

  for (let i = 0; i < words.length - 1; i++) {
    tokens.add(`${words[i]} ${words[i + 1]}`);
  }

  return Array.from(tokens);
};

/**
 * Extracts a deduplicated list of keyword tokens (unigrams + bigrams) from
 * a full review/tip text. This is what gets stored in
 * Review.extractedKeywords / used to build Place.aggregatedTags.
 */
const extractKeywords = (text) => {
  const sentences = splitIntoSentences(text);
  const allTokens = new Set();

  sentences.forEach((sentence) => {
    extractTokensFromSentence(sentence).forEach((t) => allTokens.add(t));
  });

  return Array.from(allTokens);
};

/**
 * Escapes regex special characters in user-supplied search input so it can
 * be safely embedded in a RegExp without breaking out of the pattern
 * (prevents ReDoS / regex injection from search queries).
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Builds a case-insensitive, whole-phrase-boundary RegExp for a user search
 * keyword, e.g. "lily" won't match inside "lilies" as a substring accident,
 * but "lilies" typed by the user WILL match "lilies" in text exactly.
 */
const buildKeywordRegex = (keyword) => {
  const escaped = escapeRegex(keyword.trim().toLowerCase());
  return new RegExp(`\\b${escaped}\\b`, 'i');
};

module.exports = {
  splitIntoSentences,
  cleanWords,
  extractTokensFromSentence,
  extractKeywords,
  escapeRegex,
  buildKeywordRegex,
};