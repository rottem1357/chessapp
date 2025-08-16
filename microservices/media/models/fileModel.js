const files = new Map();

async function save(file) {
  files.set(file.key, file);
  return file;
}

async function get(key) {
  return files.get(key);
}

module.exports = { save, get };
