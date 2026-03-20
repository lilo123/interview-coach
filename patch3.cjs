const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

content = content.replace(
  /const MODELS = \[[\s\S]*?\];/,
  `const MODELS = [
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B (Free)" },
  { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B (Free)" },
  { id: "custom", name: "Other (please specify)" }
];`
);

fs.writeFileSync('src/App.jsx', content);
