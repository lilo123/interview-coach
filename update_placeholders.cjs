const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Update placeholder descriptions to match the new behavior
code = code.replace(
  'AI will remove filler words and clean up the text..',
  'AI will fix transcription errors but keep your natural speech patterns (um, ah, like)...'
);

code = code.replace(
  'AI will evaluate if you answered the question effectively...',
  'AI will evaluate if you actually answered the specific question asked and assess your structure...'
);

fs.writeFileSync('src/App.jsx', code);
console.log("Updated placeholders in App.jsx successfully!");
