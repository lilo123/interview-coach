const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');
content = content.replace(
  /const MODELS = \[[\s\S]*?\];/,
  `const MODELS = [\n  { id: "openrouter/free", name: "Auto Free Router (openrouter/free)" },\n  { id: "custom", name: "Other (please specify)" }\n];`
);
fs.writeFileSync('src/App.jsx', content);
