const fs = require('fs');
const path = require('path');
const base = 'C:/Users/hp/Desktop/uptech';

function w(rel, content) {
  const full = base + '/' + rel;
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  console.log('WROTE ' + rel + ' (' + Buffer.byteLength(content, 'utf8') + ' bytes)');
}

w('src/app/actions/attendance.ts', require('fs').readFileSync(base + '/attendance_actions_content.txt', 'utf8'));
w('src/app/api/attendance/route.ts', require('fs').readFileSync(base + '/attendance_api_content.txt', 'utf8'));
w('src/app/(dashboard)/attendance/page.tsx', require('fs').readFileSync(base + '/attendance_page_content.txt', 'utf8'));
w('src/app/(dashboard)/attendance/saisir/page.tsx', require('fs').readFileSync(base + '/attendance_saisir_content.txt', 'utf8'));
w('src/components/attendance/attendance-table.tsx', require('fs').readFileSync(base + '/attendance_table_content.txt', 'utf8'));
w('src/components/attendance/attendance-filter.tsx', require('fs').readFileSync(base + '/attendance_filter_content.txt', 'utf8'));

console.log('All files written!');
