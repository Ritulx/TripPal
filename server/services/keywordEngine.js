// A compact, general-purpose English stopword list — good enough for a
// non-ML keyword extractor operating on short review/tip text.
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be',
  'been', 'being', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'this',
  'that', 'it', 'its', 'very', 'so', 'i', 'we', 'they', 'he', 'she',
  'my', 'our', 'their', 'you', 'your', 'me', 'him', 'her', 'them',
  'have', 'has', 'had', 'do', 'does', 'did', 'not', 'no', 'yes', 'as',
  'if', 'than', 'then', 'there', 'here', 'just', 'really', 'also',
  'was', 'were', 'am', 'will', 'would', 'can', 'could', 'should',
  'from', 'by', 'about', 'out', 'up', 'down', 'over', 'again', 'all',
  'some', 'such', 'only', 'own', 'same', 'too', 'more', 'most', 'other',
]);

/** Strips punctuation, lowercases, and splits into cleaned word tokens. */
const tokenize = (text) => {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
};

/**
 * Extracts unigrams AND bigrams from review/tip text, e.g.
 * "The fresh lilies were amazing" -> ["fresh", "lilies", "amazing", "fresh lilies"]
 * This lets phrase searches like "fresh lilies" match even though it's two words.
 * Capped at 40 phrases per text block to keep aggregatedTags arrays bounded.
 */
const extractKeyPhrases = (text) => {
  const tokens = tokenize(text);
  const unigrams = [...tokens];
  const bigrams = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return [...new Set([...unigrams, ...bigrams])].slice(0, 40);
};

/** Escapes user input for safe use inside a RegExp constructor. */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Builds a case-insensitive RegExp for a raw keyword/phrase search string. */
const buildKeywordRegex = (keyword) => new RegExp(escapeRegex(keyword.trim()), 'i');

module.exports = { tokenize, extractKeyPhrases, escapeRegex, buildKeywordRegex };