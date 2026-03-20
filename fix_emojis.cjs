const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf8');
c = c.replace('🟥 Cleaned Transcript', '🧹 Cleaned Transcript');
c = c.replace('🐊 Content & Structure', '📊 Content & Structure');
c = c.replace('🗣 Tone & Executive Presence', '🗣️ Tone & Executive Presence');
c = c.replace('🌯 Actionable Recommendations', '🎯 Actionable Recommendations');
fs.writeFileSync('src/App.jsx', c);
console.log('Fixed emojis');
