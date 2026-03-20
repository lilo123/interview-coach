const fs = require('fs');
const file = 'src/App.jsx';
let data = fs.readFileSync(file, 'utf8');

const oldPrompt = `"You are an expert interview coach. Analyze the user's interview response based on the transcribed text. Provide brief, actionable feedback on: 1. Content (Did they answer the question well?) 2. Tone & Pace (Do they sound confident, based on the text structure and filler words?) Be encouraging but constructive."`;
const newPrompt = `\`You are an expert McKinsey interview coach. Analyze the candidate's response.\\nFocus on:\\n1. Content: Structured thinking, Top-Down communication, MECE principle.\\n2. Tone & Pace: Executive presence, confidence, clarity.\\n3. Recommendations: Actionable steps to improve.\\n\\nYou MUST respond in ONLY valid JSON format with exactly these three keys:\\n{\\n  "content": "Your feedback...",\\n  "tone_and_pace": "Your feedback...",\\n  "recommendations": "Your recommendations..."\\n}\\nDo not output any other text or markdown block.\``;

if (data.includes(oldPrompt)) { data = data.replace(oldPrompt, newPrompt); console.log("Prompt replaced."); }
else { console.log("Prompt NOT found."); }

const oldParseStr1 = `setFeedback(data.choices[0].message.content);`;
const newParseStr = `const rawContent = data.choices[0].message.content;
        try {
          const jsonMatch = rawContent.match(/\\{[\\s\\S]*\\}/);
          const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
          setFeedback(parsed);
        } catch (e) {
          console.error("Failed to parse JSON", rawContent);
          setFeedback(rawContent);
        }`;

if (data.includes(oldParseStr1)) { data = data.replace(oldParseStr1, newParseStr); console.log("Parse logic replaced."); }
else { console.log("Parse logic NOT found."); }

const oldRenderRegex = /\{feedback && \([\s\S]*?Coach's Feedback[\s\S]*?<\/div>\s*\)\}/;
const newRenderString = `{feedback && typeof feedback === 'object' && !Array.isArray(feedback) ? (
          <div className="mt-6 space-y-4 text-left">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="font-bold text-blue-800 mb-2">📊 Content & Structure (McKinsey Style)</h3>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{feedback.content}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
              <h3 className="font-bold text-purple-800 mb-2">🗣️ Tone & Executive Presence</h3>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{feedback.tone_and_pace}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <h3 className="font-bold text-green-800 mb-2">🎯 Actionable Recommendations</h3>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{feedback.recommendations}</p>
            </div>
          </div>
        ) : feedback ? (
          <div className="mt-6 p-5 bg-gray-50 rounded-xl border border-gray-200 overflow-x-auto text-left">
            <h3 className="font-bold text-gray-800 mb-3">💡 Raw Feedback</h3>
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">{typeof feedback === 'string' ? feedback : JSON.stringify(feedback, null, 2)}</pre>
          </div>
        ) : null}`;

if (oldRenderRegex.test(data)) { data = data.replace(oldRenderRegex, newRenderString); console.log("Render logic replaced."); }
else { console.log("Render logic NOT found."); }

fs.writeFileSync(file, data);
