const scoringConstants = require('../config/scoringConstants');
const { computeWR } = require('../services/scoringService');

console.log('Loaded scoringConstants:', scoringConstants);

if (
  typeof scoringConstants.MIN_REVIEW_THRESHOLD_M !== 'number' ||
  typeof scoringConstants.DEFAULT_MEAN_RATING_C !== 'number'
) {
  console.error(
    '\n❌ scoringConstants.js is missing or malformed — MIN_REVIEW_THRESHOLD_M / DEFAULT_MEAN_RATING_C are not numbers.'
  );
  console.error('   Check that server/config/scoringConstants.js exists and exports both values.');
  process.exit(1);
}

// SRS §4.2 Figure 4.2 worked example:
// Place A: v=2, R=5.0  -> expected WR = 3.888
// Place B: v=2000, R=4.4 -> expected WR = 4.391
const wrA = computeWR(2, 5.0);
const wrB = computeWR(2000, 4.4);

console.log(`Place A (v=2, R=5.0):    WR = ${wrA}  (SRS expects 3.888)`);
console.log(`Place B (v=2000, R=4.4): WR = ${wrB}  (SRS expects 4.391)`);

// Number.isNaN check FIRST — Math.abs(NaN - x) > 0.01 is always false,
// which was the bug that let this script falsely report success last time.
if (Number.isNaN(wrA) || Number.isNaN(wrB)) {
  console.error('\n❌ WR computed as NaN — computeWR() is not receiving valid numeric inputs.');
  console.error('   Most likely cause: server/config/scoringConstants.js is missing/misnamed.');
  process.exit(1);
}

if (Math.abs(wrA - 3.888) > 0.01 || Math.abs(wrB - 4.391) > 0.01) {
  console.error('\n❌ Scoring formula does NOT match SRS specification. Check computeWR().');
  process.exit(1);
}

console.log(`Verdict: ${wrB > wrA ? 'Place B correctly outranks Place A ✅' : 'MISMATCH ❌'}`);
console.log('\n✅ Scoring formula matches SRS §4.2 specification exactly.');