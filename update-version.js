const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');

if (!fs.existsSync(indexPath)) {
    console.error('index.html not found');
    process.exit(1);
}

let content = fs.readFileSync(indexPath, 'utf8');

// Regex to find version and date in sidebar-version block
const versionRegex = /<span>v(\d+)\.(\d+)\.(\d+)<\/span>/;
const dateRegex = /<span>\d{4}-\d{2}-\d{2}<\/span>/;

const versionMatch = content.match(versionRegex);
const dateMatch = content.match(dateRegex);

if (!versionMatch || !dateMatch) {
    console.log('Version or date pattern not found in index.html');
    process.exit(0);
}

// Increment patch version
let major = parseInt(versionMatch[1], 10);
let minor = parseInt(versionMatch[2], 10);
let patch = parseInt(versionMatch[3], 10);
patch += 1;

const newVersion = `v${major}.${minor}.${patch}`;

// Get current date in KST (Korean Standard Time, UTC+9)
const now = new Date();
const kstOffset = 9 * 60 * 60 * 1000;
const kstDate = new Date(now.getTime() + kstOffset);
const newDate = kstDate.toISOString().split('T')[0];

console.log(`Updating version: ${versionMatch[0]} -> <span>${newVersion}</span>`);
console.log(`Updating date: ${dateMatch[0]} -> <span>${newDate}</span>`);

content = content.replace(versionRegex, `<span>${newVersion}</span>`);
content = content.replace(dateRegex, `<span>${newDate}</span>`);

fs.writeFileSync(indexPath, content, 'utf8');
console.log('Successfully updated version info in index.html!');
