// test-env.js
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Current directory:", __dirname);
console.log("Files in directory:");
fs.readdirSync(__dirname).forEach(file => {
    if (file.includes('.env')) {
        console.log(`📁 ${file}`);
        console.log(`Content of ${file}:`);
        console.log(fs.readFileSync(path.resolve(__dirname, file), 'utf8'));
        console.log('---');
    }
});

// Test loading
dotenv.config();
console.log("After dotenv.config():");
console.log("EMAIL_USER:", process.env.EMAIL_USER || "NOT FOUND");