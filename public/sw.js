/**
 * KARD - Service Worker
 * Cache de assets estáticos e estratégia cache-first para API
 * Sincronização em background quando conexão for restabelecida
 */

const CACHE_VERSION = 'kard-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Assets estáticos para cache imediato
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/registro.html',
  '/css/style.css',
  '/js/main.js',
  '/js/auth.js',
  '/js/theme.js',
  '/js/keyboard.js',
  '/js/drag-drop.js',
  '/manifest.json'
];

// Rotas de API que devem usar cache-first
const API_ROUTES = [
  '/atividades',
  '/auth/login',
  '/auth/registro'
];

// Fila de sincronização para quando voltar online
let syncQueue = [];

// === INSTALAÇÃO DO SERVICE WORKER ===
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Cache estático aberto');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Assets estáticos cacheados');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Erro ao cachear assets estáticos:', error);
      })
  );
});

// === ATIVAÇÃO DO SERVICE WORKER ===
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('kard-') && 
                     cacheName !== STATIC_CACHE && 
                     cacheName !== API_CACHE && 
                     cacheName !== IMAGE_CACHE;
            })
            .map((cacheName) => {
              console.log('[SW] Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker ativado');
        return self.clients.claim();
      })
  );
});

// === INTERCEPTAÇÃO DE REQUISIÇÕES ===
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignora requisições não-HTTP
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Estratégia para diferentes tipos de requisições
  if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isImageRequest(url)) {
    event.respondWith(handleImageRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

// === VERIFICA SE É REQUISIÇÃO DE API ===
function isAPIRequest(url) {
  return url.pathname.startsWith('/atividades') || 
         url.pathname.startsWith('/auth') ||
         url.pathname.startsWith('/api');
}

// === VERIFICA SE É REQUISIÇÃO DE IMAGEM ===
function isImageRequest(url) {
  return /\.(jpg|jpeg|png|gif|svg|webp|ico)$/i.test(url.pathname);
}

// === ESTRATÉGIA CACHE-FIRST PARA API ===
async function handleAPIRequest(request) {
  try {
    // Tenta buscar no cache primeiro
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Resposta da API servida do cache:', request.url);
      
      // Atualiza o cache em background (stale-while-revalidate)
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, response.clone());
            });
          }
        })
        .catch(() => {
          // Ignora erros de background update
        });
      
      return cachedResponse;
    }
    
    // Se não está no cache, busca da rede
    const networkResponse = await fetch(request);
    
    // Cacheia apenas respostas bem-sucedidas de GET
    if (networkResponse && networkResponse.status === 200 && request.method === 'GET') {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('[SW] Resposta da API cacheada:', request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('[SW] Erro ao buscar da API:', error);
    
    // Se falhou e é uma mutação (POST, PUT, DELETE), adiciona à fila de sincronização
    if (request.method !== 'GET') {
      await addToSyncQueue(request);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Offline - A operação será sincronizada quando voltar online',
          queued: true
        }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Tenta buscar do cache como fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Retorna resposta de erro offline
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Você está offline e não há dados em cache para esta requisição' 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// === ESTRATÉGIA CACHE-FIRST PARA IMAGENS ===
async function handleImageRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Retorna imagem placeholder em caso de erro
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#f1f5f9"/><text x="50%" y="50%" text-anchor="middle" fill="#94a3b8" font-size="14">Imagem indisponível</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// === ESTRATÉGIA CACHE-FIRST PARA ASSETS ESTÁTICOS ===
async function handleStaticRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback para página offline
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }
    
    return new Response('Recurso não disponível offline', { status: 503 });
  }
}

// === ADICIONA REQUISIÇÃO À FILA DE SINCRONIZAÇÃO ===
async function addToSyncQueue(request) {
  try {
    const requestData = {
      url: request.url,
      method: request.method,
      headers: {},
      body: null,
      timestamp: Date.now()
    };
    
    // Copia headers
    for (const [key, value] of request.headers.entries()) {
      requestData.headers[key] = value;
    }
    
    // Copia body se existir
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      requestData.body = await request.clone().text();
    }
    
    syncQueue.push(requestData);
    
    // Salva no IndexedDB para persistência
    await saveToIndexedDB('syncQueue', requestData);
    
    console.log('[SW] Requisição adicionada à fila de sincronização:', requestData);
    
    // Registra sincronização em background
    if ('sync' in self.registration) {
      await self.registration.sync.register('sync-queue');
    }
    
  } catch (error) {
    console.error('[SW] Erro ao adicionar à fila de sincronização:', error);
  }
}

// === SINCRONIZAÇÃO EM BACKGROUND ===
self.addEventListener('sync', (event) => {
  console.log('[SW] Sincronização em background iniciada');
  
  if (event.tag === 'sync-queue') {
    event.waitUntil(processSyncQueue());
  }
});

// === PROCESSA FILA DE SINCRONIZAÇÃO ===
async function processSyncQueue() {
  try {
    // Carrega fila do IndexedDB
    const queue = await loadFromIndexedDB('syncQueue');
    
    if (!queue || queue.length === 0) {
      console.log('[SW] Fila de sincronização vazia');
      return;
    }
    
    console.log('[SW] Processando', queue.length, 'requisições da fila');
    
    for (const requestData of queue) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        });
        
        if (response.ok) {
          console.log('[SW] Requisição sincronizada com sucesso:', requestData.url);
          
          // Remove da fila após sucesso
          await removeFromIndexedDB('syncQueue', requestData.timestamp);
          
          // Notifica o cliente
          await notifyClients({
            type: 'SYNC_SUCCESS',
            url: requestData.url
          });
        } else {
          console.warn('[SW] Falha ao sincronizar requisição:', requestData.url, response.status);
        }
        
      } catch (error) {
        console.error('[SW] Erro ao sincronizar requisição:', error);
      }
    }
    
  } catch (error) {
    console.error('[SW] Erro ao processar fila de sincronização:', error);
  }
}

// === DETECTA QUANDO VOLTA ONLINE ===
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'ONLINE') {
    console.log('[SW] Aplicação voltou online - processando sincronização');
    processSyncQueue();
  }
});

// === NOTIFICA CLIENTES ===
async function notifyClients(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  
  clients.forEach((client) => {
    client.postMessage(message);
  });
}

// === FUNÇÕES PARA INDEXEDDB ===
async function saveToIndexedDB(storeName, data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('KardDB', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      store.add(data);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'timestamp' });
      }
    };
  });
}

async function loadFromIndexedDB(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('KardDB', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      
      if (!db.objectStoreNames.contains(storeName)) {
        resolve([]);
        return;
      }
      
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'timestamp' });
      }
    };
  });
}

async function removeFromIndexedDB(storeName, key) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('KardDB', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      store.delete(key);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  });
}

// === LOG DE STATUS ===
console.log('[SW] Service Worker carregado - Versão:', CACHE_VERSION);