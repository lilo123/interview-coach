const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Update system prompt
code = code.replace(
  /"cleaned_transcript": "The user\'s transcript but cleaned up.*"/,
  '"cleaned_transcript": "The user\'s exact transcript but with transcription errors fixed. DO NOT remove filler words (um, ah, like). Keep all human speech patterns, only fix faulty speech-to-text mistakes."' 
);

code = code.replace(
  /"content": "Evaluate if the answer is structured well.*"/,
  '"content": "Evaluate if the candidate actually answered the specific question asked. Assess the structure and substance of their answer."' 
);

// 2. Remove (McKinsey Style) from UI and prompts
code = code.replace(/📊 Content & Structure \(McKinsey Style\)/g, '📊 Content & Structure');
code = code.replace(/Content & Structure \(McKinsey Style\)/g, 'Content & Structure');

// Make sure we save the file
fs.writeFileSync('src/App.jsx', code);
console.log("Updated App.jsx successfully!");
