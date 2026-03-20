const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf8');
const replacement = `          ) : (
              <div className="mt-8 space-y-4 text-left opacity-50 grayscale pointer-events-none">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Expected AI Feedback Outline</h3>
                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <h3 className="font-bold text-yellow-800 mb-2">🟥 Cleaned Transcript</h3>
                  <p className="text-sm text-gray-500 italic">AI will remove filler words and clean up the text..</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="font-bold text-blue-800 mb-2">🐊 Content & Structure</h3>
                  <p className="text-sm text-gray-500 italic">AI will evaluate if you answered the question effectively...</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <h3 className="font-bold text-purple-800 mb-2">🗣 Tone & Executive Presence</h3>
                  <p className="text-sm text-gray-500 italic">AI will analyze your confidence and delivery...</p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <h3 className="font-bold text-green-800 mb-2">🌯 Actionable Recommendations</h3>
                  <p className="text-sm text-gray-500 italic">AI will provide specific tips for improvement...</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200 col-span-1 md:col-span-2">
                  <h3 className="font-bold text-orange-800 mb-2">✨ Improved Answer</h3>
                  <p className="text-sm text-gray-500 italic">AI will generate a polished, ideal response...</p>
                </div>
              </div>
            )}`;
c = c.replace(') : null}', replacement);
fs.writeFileSync('src/App.jsx', c);
console.log('Done');