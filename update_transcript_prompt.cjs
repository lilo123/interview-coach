const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const oldText = "4. Cleaned Transcript: Clean up the exact answer by removing filler words (ums, ahs, like) and fixing basic grammar. DO NOT change the substance. Wrap any changes in **bold**.";
const newText = "4. Cleaned Transcript: Fix transcription errors (misheard words by the microphone) to reflect what the candidate actually said. DO NOT remove filler words (um, ah, like), false starts, or fix the candidate's grammar. DO NOT change the substance. Wrap any corrected transcription errors in **bold**.";

if (content.includes(oldText)) {
  content = content.replace(oldText, newText);
  fs.writeFileSync('src/App.jsx', content);
  console.log("Updated prompt successfully!");
} else {
  console.log("Could not find the target text.");
}
