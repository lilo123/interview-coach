const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add state
if (!code.includes('const [modelStatus, setModelStatus]')) {
  code = code.replace(
    'const [currentQuestion, setCurrentQuestion] = useState(QUESTIONS[0]);',
    `const [currentQuestion, setCurrentQuestion] = useState(QUESTIONS[0]);\n  const [modelStatus, setModelStatus] = useState('checking');`
  );
}

// 2. Add useEffect for testing the model
if (!code.includes('// Test model connection')) {
  const useEffectHook = `
  // Test model connection
  useEffect(() => {
    if (!apiKey) {
      setModelStatus('offline');
      return;
    }
    
    const testModel = async () => {
      setModelStatus('checking');
      try {
        const modelId = selectedModel === 'other' ? customModel : selectedModel;
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${apiKey}\`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:5173',
            'X-Title': 'Interview Coach'
          },
          body: JSON.stringify({
            model: modelId,
            messages: [{ role: 'user', content: 'Reply "ok"' }],
            max_tokens: 5
          })
        });
        
        if (response.ok) {
          setModelStatus('online');
        } else {
          setModelStatus('offline');
        }
      } catch (err) {
        setModelStatus('offline');
      }
    };
    
    testModel();
  }, [apiKey, selectedModel, customModel]);
  `;
  
  code = code.replace(
    'const mediaRecorder = useRef(null);',
    `${useEffectHook}\n  const mediaRecorder = useRef(null);`
  );
}

// 3. Add status bar UI
if (!code.includes('Model Status:')) {
  const statusBar = `
      {/* Status Bar */}
      <div className="bg-gray-800 text-white text-xs py-1 px-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="font-semibold">Model Status:</span>
          {modelStatus === 'checking' && <span className="text-yellow-400 flex items-center"><svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Checking...</span>}
          {modelStatus === 'online' && <span className="text-green-400">● Online</span>}
          {modelStatus === 'offline' && <span className="text-red-400">● Offline / Error</span>}
        </div>
        <div className="opacity-75">
          {selectedModel === 'other' ? customModel || 'No model specified' : selectedModel}
        </div>
      </div>
`;
  code = code.replace(
    '<div className="min-h-screen bg-gray-50 text-gray-900 font-sans">',
    `<div className="min-h-screen bg-gray-50 text-gray-900 font-sans">\n${statusBar}`
  );
}

fs.writeFileSync('src/App.jsx', code);
console.log("Updated App.jsx successfully!");
