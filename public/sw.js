```javascript
// ============================================================
// SERVICE WORKER - AcadémIA Pro PWA
// Version: 2.0.0
// ============================================================

'use strict';

// ============================================================
// CONFIGURATION & CONSTANTES
// ============================================================

const SW_VERSION = '2.0.0';
const APP_NAME = 'AcademIA-Pro';

const CACHE_NAMES = {
  STATIC: `${APP_NAME}-static-v${SW_VERSION}`,
  DYNAMIC: `${APP_NAME}-dynamic-v${SW_VERSION}`,
  PDF: `${APP_NAME}-pdf-v${SW_VERSION}`,
  API: `${APP_NAME}-api-v${SW_VERSION}`,
  IMAGES: `${APP_NAME}-images-v${SW_VERSION}`,
  OFFLINE: `${APP_NAME}-offline-v${SW_VERSION}`,
};

const CACHE_CONFIG = {
  PDF: {
    maxEntries: 50,
    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 jours
  },
  API: {
    maxEntries: 100,
    maxAgeSeconds: 60 * 60 * 24 * 7, // 7 jours
  },
  IMAGES: {
    maxEntries: 200,
    maxAgeSeconds: 60 * 60 * 24 * 14, // 14 jours
  },
  DYNAMIC: {
    maxEntries: 150,
    maxAgeSeconds: 60 * 60 * 24 * 3, // 3 jours
  },
};

const SYNC_TAGS = {
  PROGRESSION: 'sync-progression',
  QUIZ_RESULTS: 'sync-quiz-results',
  COMPLETION: 'sync-completion',
  NOTES: 'sync-notes',
};

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/css/app.css',
  '/css/offline.css',
  '/js/app.js',
  '/js/router.js',
  '/js/store.js',
  '/fonts/inter-var.woff2',
  '/fonts/jetbrains-mono.woff2',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/icons/badge-72x72.png',
  '/images/logo.svg',
  '/images/offline-illustration.svg',
];

const API_ROUTES = {
  FORMATIONS: /\/api\/formations(\/.*)?$/,
  MODULES: /\/api\/modules(\/.*)?$/,
  PROGRESSION: /\/api\/progression(\/.*)?$/,
  USER: /\/api\/user(\/.*)?$/,
  QUIZ: /\/api\/quiz(\/.*)?$/,
};

const PDF_ROUTE = /\.(pdf)$/i;
const IMAGE_ROUTE = /\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$/i;
const FONT_ROUTE = /\.(woff|woff2|ttf|eot)$/i;

// ============================================================
// UTILITAIRES
// ============================================================

const Utils = {
  /**
   * Log formaté avec timestamp
   */
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = `[AcadémIA SW ${timestamp}]`;
    const levels = {
      info: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };
    const logFn = levels[level] || console.log;
    if (data) {
      logFn(`${prefix} ${message}`, data);
    } else {
      logFn(`${prefix} ${message}`);
    }
  },

  /**
   * Vérifie si une réponse est valide et cacheable
   */
  isValidResponse(response) {
    return (
      response &&
      response.status === 200 &&
      response.type !== 'error'
    );
  },

  /**
   * Vérifie si une réponse est expirée
   */
  isResponseExpired(response, maxAgeSeconds) {
    const dateHeader = response.headers.get('date');
    if (!dateHeader) return false;
    const responseDate = new Date(dateHeader).getTime();
    const now = Date.now();
    return (now - responseDate) / 1000 > maxAgeSeconds;
  },

  /**
   * Sérialise une requête pour IndexedDB
   */
  async serializeRequest(request) {
    const body = ['POST', 'PUT', 'PATCH'].includes(request.method)
      ? await request.text()
      : null;

    return {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body,
      timestamp: Date.now(),
    };
  },

  /**
   * Génère un ID unique
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Délai asynchrone
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
};

// ============================================================
// GESTIONNAIRE INDEXEDDB - FILE D'ATTENTE SYNC
// ============================================================

const SyncQueue = {
  DB_NAME: 'AcademiaPro-SyncQueue',
  DB_VERSION: 1,
  STORE_NAME: 'pending-requests',
  db: null,

  async getDB() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, {
            keyPath: 'id',
          });
          store.createIndex('tag', 'tag', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        Utils.log('error', 'IndexedDB ouverture échouée', event.target.error);
        reject(event.target.error);
      };
    });
  },

  async addRequest(tag, requestData) {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      const entry = {
        id: Utils.generateId(),
        tag,
        requestData,
        status: 'pending',
        attempts: 0,
        maxAttempts: 5,
        timestamp: Date.now(),
        nextAttempt: Date.now(),
      };

      return new Promise((resolve, reject) => {
        const req = store.add(entry);
        req.onsuccess = () => {
          Utils.log('info', `Requête ajoutée à la file: ${tag}`, entry.id);
          resolve(entry.id);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (error) {
      Utils.log('error', 'Erreur ajout file sync', error);
      throw error;
    }
  },

  async getPendingRequests(tag = null) {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);

      return new Promise((resolve, reject) => {
        const results = [];
        let request;

        if (tag) {
          const index = store.index('tag');
          request = index.openCursor(IDBKeyRange.only(tag));
        } else {
          request = store.openCursor();
        }

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            const entry = cursor.value;
            if (
              entry.status === 'pending' &&
              entry.attempts < entry.maxAttempts &&
              entry.nextAttempt <= Date.now()
            ) {
              results.push(entry);
            }
            cursor.continue();
          } else {
            resolve(results);
          }
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      Utils.log('error', 'Erreur récupération file sync', error);
      return [];
    }
  },

  async updateRequest(id, updates) {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      return new Promise((resolve, reject) => {
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          const entry = getReq.result;
          if (entry) {
            const updated = { ...entry, ...updates };
            const putReq = store.put(updated);
            putReq.onsuccess = () => resolve(true);
            putReq.onerror = () => reject(putReq.error);
          } else {
            resolve(false);
          }
        };
        getReq.onerror = () => reject(getReq.error);
      });
    } catch (error) {
      Utils.log('error', 'Erreur mise à jour file sync', error);
    }
  },

  async deleteRequest(id) {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      return new Promise((resolve, reject) => {
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch (error) {
      Utils.log('error', 'Erreur suppression file sync', error);
    }
  },

  async clearCompleted() {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('status');

      const request = index.openCursor(IDBKeyRange.only('completed'));

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    } catch (error) {
      Utils.log('error', 'Erreur nettoyage file sync', error);
    }
  },
};

// 