const fs = require('fs');
const path = require('path');
const base = 'C:/Users/hp/Desktop/uptech';
function w(rel, content) {
  const full = base + '/' + rel;
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  console.log('WROTE ' + rel + ' (' + fs.statSync(full).size + ' bytes)');
}
module.exports = { w, base };
