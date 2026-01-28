// ✅ tiny helpers so your code runs
function getRandomWords(n = 3) {
  const pool = [
    "cat", "house", "tree", "car", "phone", "river",
    "pizza", "guitar", "computer", "sunflower", "mountain", "ocean"
  ];
  // Fisher–Yates for fair shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

function createHint(word = "") {
  // keep spaces and punctuation, hide letters
  return word.replace(/[A-Za-z]/g, "_");
}

module.exports = {
  getRandomWords,
  createHint,
};