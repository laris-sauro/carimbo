
const NOME_DB = 'carimbo-db';
const VERSAO_DB = 1;

function abrirDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(NOME_DB, VERSAO_DB);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('memorias')) {
        const store = db.createObjectStore('memorias', { keyPath: 'id', autoIncrement: true });
        store.createIndex('data', 'data');
      }
      if (!db.objectStoreNames.contains('prefs')) {
        db.createObjectStore('prefs', { keyPath: 'chave' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}


async function operacao(nomeStore, modo, fn) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(nomeStore, modo);
    const req = fn(tx.objectStore(nomeStore));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
  });
}

const salvarMemoria     = m  => operacao('memorias', 'readwrite', s => s.add(m));
const atualizarMemoria  = m  => operacao('memorias', 'readwrite', s => s.put(m));
const excluirMemoria    = id => operacao('memorias', 'readwrite', s => s.delete(id));
const buscarMemoria     = id => operacao('memorias', 'readonly',  s => s.get(id));

async function listarMemorias() {
  const todas = await operacao('memorias', 'readonly', s => s.getAll());
  return todas.sort((a, b) => b.data.localeCompare(a.data) || b.criadaEm - a.criadaEm);
}

const salvarPref = (chave, valor) => operacao('prefs', 'readwrite', s => s.put({ chave, valor }));
async function lerPref(chave, padrao = null) {
  const r = await operacao('prefs', 'readonly', s => s.get(chave));
  return r ? r.valor : padrao;
}