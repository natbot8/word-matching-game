const fs = require('fs-extra');
const path = require('path');

const sourceDir = path.resolve(__dirname);
const targetDir = path.resolve(__dirname, 'www');

const copyDirectories = [
  'card-images',
  'game-sounds',
  'icons',
  'images',
  'letter-sounds'
];

const copyFiles = [
  'word-categories.json',
  'letter-sounds.json'
];

copyDirectories.forEach(dir => {
  fs.copySync(path.join(sourceDir, dir), path.join(targetDir, dir), { overwrite: true });
  console.log(`Copied ${dir} directory`);
});

copyFiles.forEach(file => {
  fs.copySync(path.join(sourceDir, file), path.join(targetDir, file), { overwrite: true });
  console.log(`Copied ${file}`);
});

console.log('Asset copy complete');
