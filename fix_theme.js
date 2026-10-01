const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
};

const files = walk(path.join(__dirname, 'src', 'modules'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/bg-slate-900(?!\/)/g, 'bg-slate-50 dark:bg-slate-900');
  content = content.replace(/bg-slate-800(?!\/)/g, 'bg-white dark:bg-slate-800');
  content = content.replace(/bg-slate-800\/50/g, 'bg-white dark:bg-slate-800/50');
  content = content.replace(/bg-slate-800\/30/g, 'bg-slate-50 dark:bg-slate-800/30');
  content = content.replace(/bg-slate-800\/70/g, 'bg-white dark:bg-slate-800/70');
  
  content = content.replace(/border-slate-700(?!\/)/g, 'border-slate-200 dark:border-slate-700');
  content = content.replace(/border-slate-700\/50/g, 'border-slate-200 dark:border-slate-700/50');
  content = content.replace(/border-slate-800(?!\/)/g, 'border-slate-200 dark:border-slate-800');
  
  // Safely replace text-white only if it's not preceded by text- or from- or to-
  // Actually, just replace `text-white` with `text-slate-900 dark:text-white` ONLY IF it's in a label, p, h1, h2, span, th, td.
  // Instead of complex AST, let's just do text replacements for known classes
  content = content.replace(/\btext-white\b/g, (match, offset, str) => {
    // If it's near a button gradient, don't replace
    const context = str.substring(Math.max(0, offset - 50), Math.min(str.length, offset + 50));
    if (context.includes('from-blue') || context.includes('bg-blue-') || context.includes('bg-red-') || context.includes('bg-emerald-') || context.includes('from-violet') || context.includes('bg-black')) {
      return 'text-white';
    }
    return 'text-slate-900 dark:text-white';
  });

  // Safely replace text-slate-400 and text-slate-300
  content = content.replace(/\btext-slate-400\b/g, 'text-slate-500 dark:text-slate-400');
  content = content.replace(/\btext-slate-300\b/g, 'text-slate-600 dark:text-slate-300');
  
  fs.writeFileSync(file, content);
});

console.log('Done replacing themes');
