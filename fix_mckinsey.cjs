const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// Update box title
content = content.replace(
  /<h3 className="font-bold text-blue-800 mb-2">📊 Content & Structure \(McKinsey Style\)<\/h3>/g,
  '<h3 className="font-bold text-blue-800 mb-2">📊 Content & Structure</h3>'
);

// Update prompt
content = content.replace(
  /1\. Content: Structured thinking, Top-Down communication, MECE principle\./g,
  '1. Content: Did they actually answer the specific question asked? Structured thinking, Top-Down communication, MECE principle.'
);

fs.writeFileSync('src/App.jsx', content);
console.log("File updated successfully!");
