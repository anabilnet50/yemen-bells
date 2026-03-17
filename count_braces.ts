import fs from 'fs';

const filePath = 'c:/Users/Almuhtarif-One/Desktop/website Agras/src/App.tsx';
const content = fs.readFileSync(filePath, 'utf8');

const count = (char) => content.split(char).length - 1;

console.log('{ count:', count('{'));
console.log('} count:', count('}'));
console.log('( count:', count('('));
console.log(') count:', count(')'));
console.log('[ count:', count('['));
console.log('] count:', count(']'));
console.log('< count:', count('<'));
console.log('> count:', count('>'));
