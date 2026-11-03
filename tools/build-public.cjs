// Publish only client assets. Server functions are bundled by Wrangler from /functions.
const fs = require('fs');
const path = require('path');
const root = process.cwd();
const output = path.join(root, 'safe-public');
if (fs.existsSync(output)) throw new Error('safe-public already exists; use a fresh checkout');
fs.mkdirSync(output);
for (const entry of fs.readdirSync(root, {withFileTypes: true})) {
  if (entry.isFile() && /\.(html|js|css|webmanifest)$/i.test(entry.name)) {
    fs.copyFileSync(path.join(root, entry.name), path.join(output, entry.name));
  }
}
for (const dir of ['icons', 'stickers']) {
  fs.cpSync(path.join(root, dir), path.join(output, dir), {recursive: true});
}
for (const forbidden of ['supabase', 'docs', 'rotations', 'functions', 'deploy', 'tools', 'seed']) {
  if (fs.existsSync(path.join(output, forbidden))) throw new Error('Private directory in output: ' + forbidden);
}
console.log('Public assets prepared; private source directories are excluded.');
