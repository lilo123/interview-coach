const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

content = content.replace(
  /const MODELS = \[[\s\S]*?\];/,
  `const MODELS = [
  { id: "openrouter/auto", name: "Auto Free Router" },
  { id: "custom", name: "Other (please specify)" }
];`
);

fs.writeFileSync('src/App.jsx', content);
