const fs = require('fs');
const file = 'c:/Users/josue.cueva/Desktop/tfg/cine-vault/frontend/src/pages/MovieDetail.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');
lines.splice(1045, 1402 - 1045 + 1);
fs.writeFileSync(file, lines.join('\n'));
console.log('Done');
