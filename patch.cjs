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

content = content.replace(
  /const savedModel = localStorage\.getItem\('or_model'\) \|\| MODELS\[0\]\.id;/,
  `let savedModel = localStorage.getItem('or_model') || MODELS[0].id;
    if (savedModel !== 'custom' && !MODELS.find(m => m.id === savedModel)) {
      savedModel = MODELS[0].id;
    }`
);

content = content.replace(
  /let options = \{\};\s*if \(typeof MediaRecorder\.isTypeSupported === 'function'\) \{\s*if \(MediaRecorder\.isTypeSupported\('audio\/mp4'\)\) \{\s*options = \{ mimeType: 'audio\/mp4' \};\s*\} else if \(MediaRecorder\.isTypeSupported\('audio\/webm'\)\) \{\s*options = \{ mimeType: 'audio\/webm' \};\s*\}\s*\}\s*mediaRecorder\.current = new MediaRecorder\(stream, options\);/g,
  `mediaRecorder.current = new MediaRecorder(stream);`
);

content = content.replace(
  /const type = mediaRecorder\.current\.mimeType \|\| \(audioChunks\.current\[0\] && audioChunks\.current\[0\]\.type\) \|\| 'audio\/mp4';\s*const audioBlob = new Blob\(audioChunks\.current, \{ type \}\);/g,
  `const type = audioChunks.current[0] ? audioChunks.current[0].type : 'audio/webm';\n        const audioBlob = new Blob(audioChunks.current, { type });`
);

fs.writeFileSync('src/App.jsx', content);
