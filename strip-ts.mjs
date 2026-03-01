import fs from 'fs';
import { globSync } from 'glob';
import babel from '@babel/core';

// Strip both frontend and backend JS files
const files = globSync('{src,server/src}/**/*.{js,jsx}');

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  
  try {
    const result = babel.transformSync(content, {
      filename: file,
      plugins: [
        ['@babel/plugin-syntax-jsx'],
        ['@babel/plugin-transform-typescript', { isTSX: true }]
      ]
    });
    
    if (result && result.code) {
      fs.writeFileSync(file, result.code);
      console.log(`Successfully stripped TS: ${file}`);
    }
  } catch (error) {
    console.error(`Error stripping TS from ${file}:`, error.message);
  }
}
