const fs = require('fs');
const file = 'src/App.jsx';
let data = fs.readFileSync(file, 'utf8');

const newQuestions = `const QUESTIONS = [
  "Tell me about your biggest professional challenge and how you overcame it.",
  "Describe a time you had to pivot quickly when a project didn't go as planned.",
  "Walk me through a complex problem you solved. What was your thought process?",
  "Tell me about a time you had to influence someone who didn't report to you.",
  "Describe a situation where you had to make a decision without having all the information you needed.",
  "Tell me about a time you received critical feedback. How did you handle it and what did you change?",
  "Can you share an example of a project that failed? What did you learn from that experience?",
  "Tell me about a time you had to balance competing priorities or tight deadlines. How did you manage it?",
  "Describe a time you went above and beyond for a customer, client, or stakeholder.",
  "Tell me about a time you had to work closely with someone whose personality or working style was very different from yours.",
  "Walk me through your resume.",
  "Tell me about the project that you're most proud of."
];`;

data = data.replace(/const QUESTIONS = \[[\s\S]*?\];/, newQuestions);
fs.writeFileSync(file, data);
console.log("Questions updated successfully");
