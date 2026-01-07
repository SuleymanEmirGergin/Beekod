
import '../env.js';

console.log('Checking Environment Variables...');
const key = process.env.GEMINI_API_KEY;

if (key) {
    console.log('GEMINI_API_KEY is SET');
    console.log('Key length:', key.length);
    console.log('Key preview:', key.substring(0, 5) + '...');
} else {
    console.log('❌ GEMINI_API_KEY is NOT set');
}

console.log('DOTENV_CONFIG_PATH:', process.env.DOTENV_CONFIG_PATH || 'Not set');
console.log('CWD:', process.cwd());
