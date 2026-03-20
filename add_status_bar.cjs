const fs = require('fs');
const path = './src/App.jsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('AI Status:')) {
  const statusBarCode = `
        {/* Model Status Bar */}
        <div className={\`mb-4 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between border \${
          modelStatus === 'online' ? 'bg-green-50 text-green-700 border-green-200' :
          modelStatus === 'checking' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
          'bg-red-50 text-red-700 border-red-200'
        }\`}>
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              {modelStatus === 'checking' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>}
              <span className={\`relative inline-flex rounded-full h-3 w-3 \${
                modelStatus === 'online' ? 'bg-green-500' :
                modelStatus === 'checking' ? 'bg-yellow-500' :
                'bg-red-500'
              }\`}></span>
            </span>
            <span>
              AI Status: {modelStatus === 'online' ? 'Online & Ready' : modelStatus === 'checking' ? 'Checking connection...' : 'Offline / Error'}
            </span>
          </div>
          {modelStatus !== 'online' && (
            <button onClick={() => setShowSettings(true)} className="underline text-xs ml-2">Configure API</button>
          )}
        </div>
`;

  code = code.replace(/<\/header>/, `</header>\n${statusBarCode}`);
  fs.writeFileSync(path, code);
  console.log('Status bar UI added successfully!');
} else {
  console.log('Status bar already exists.');
}
