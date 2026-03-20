const fs = require('fs');
const file = 'src/App.jsx';
let data = fs.readFileSync(file, 'utf8');

const newModels = `const MODELS = [
  { id: "openrouter/free", name: "✨ Auto Free Router (Always Available)" },
  { id: "custom", name: "Other (Enter custom model ID)" }
];`;
data = data.replace(/const MODELS = \[([\s\S]*?)\];/, newModels);

const newState = `const [selectedModel, setSelectedModel] = useState(localStorage.getItem('openrouter_model') || 'openrouter/free');
  const [customModel, setCustomModel] = useState(localStorage.getItem('openrouter_custom_model') || '');`;
data = data.replace(/const \[selectedModel, setSelectedModel\] = useState[^
]*;/, newState);

const newSaveSettings = `localStorage.setItem('openrouter_model', selectedModel);
    localStorage.setItem('openrouter_custom_model', customModel);`;
data = data.replace(/localStorage\.setItem\('openrouter_model', selectedModel\);/, newSaveSettings);

const newFetchBody = `model: selectedModel === 'custom' ? customModel : selectedModel,`;
data = data.replace(/model: selectedModel,/, newFetchBody);

const selectRegex = /<select[\s\S]*?<\/select>/;
const newSelect = `<select \n              value={selectedModel}\n              onChange={(e) => setSelectedModel(e.target.value)}\n              className="w-full p-2 border rounded mb-4 bg-white"\n            >\n              {MODELS.map(m => (\n                <option key={m.id} value={m.id}>{m.name}</option>\n              ))}\n            </select>\n            {selectedModel === 'custom' && (\n              <input \n                type="text" \n                value={customModel}\n                onChange={(e) => setCustomModel(e.target.value)}\n                placeholder="e.g. google/gemini-2.5-flash"\n                className="w-full p-2 border rounded mb-4"\n              />\n            )}`;
data = data.replace(selectRegex, newSelect);

fs.writeFileSync(file, data);
console.log("Update applied");
