import idb from './idb.js';

const Storage = (() => {
  let database;
  const init = () => {
    if (!('indexedDB' in window) && !('idb' in window)) {
      console.log('This browser does not support IndexedDB');
      return null;
    } else {
      console.log('indexedDB is supported');
      return idb.open('files', 1, upgradeDb => {
        if (!upgradeDb.objectStoreNames.contains('data')) {
          const store = upgradeDb.createObjectStore('data');
          store.createIndex('src', 'src');
          store.createIndex('text', 'text');
        }
      });
    }
  };
  const addData = (data, child, key) => new Promise(resolve => {
    return database.then(db => {
      const transaction = db.transaction(child, 'readwrite');
      const store = transaction.objectStore(child);
      store.put(data, key);
      resolve(transaction.complete);
    })
  });
  const getData = key => new Promise(resolve => {
      return database.then(db => {
        const transaction = db.transaction('data', 'readonly');
        const store = transaction.objectStore('data');
        resolve(store.get(key));
      });
  });
 
  return {
    init: () => {
      if (!database) {
        database = init();
      }
      return {
        addData,
        getData
      };
    }
  };
})();
export default Storage.init();
