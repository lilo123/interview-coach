const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const promptRegex = /content:\s*`You are an expert McKinsey interview coach[\s\S]*?Do not output any other text, markdown blocks, or introduction.`/;

const newPrompt = `content: \`You are an expert McKinsey interview coach. Analyze the candidate's response.\nFocus on:\n1. Content: Structured thinking, Top-Down communication, MECE principle.\n2. Tone & Pace: Executive presence, confidence, clarity.\n3. Recommendations: Actionable steps to improve.\n4. Cleaned Transcript: Clean up the exact answer by removing filler words (ums, ahs, like) and fixing basic grammar. DO NOT change the substance. Wrap any changes in **bold**.\n5. Improved Answer: Rewrite their answer to sound more professional, structured, and impactful. Wrap any modified or added words in **bold**.\n\nYou MUST respond in ONLY valid JSON format with exactly these SEVEN keys:\n{\n  "score": "A score out of 10 (e.g. '7/10')",\n  "short_summary": "A 1-sentence overarching summary of their performance.",\n  "content": "Your detailed feedback on structure...",\n  "tone_and_pace": "Your feedback on delivery...",\n  "recommendations": "Your actionable steps...",\n  "cleaned_transcript": "The cleaned up original transcript...",\n  "improved_answer": "The structurally rewritten answer..."\n}\nDo not output any other text, markdown blocks, or introduction.\``;

content = content.replace(promptRegex, newPrompt);
fs.writeFileSync('src/App.jsx', content);
console.log("Prompt replaced successfully!");
