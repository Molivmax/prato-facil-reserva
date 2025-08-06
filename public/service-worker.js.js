// service-worker.js
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalação concluída');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativação concluída');
});

self.addEventListener('fetch', (event) => {
  // Aqui você pode adicionar lógica para caching de arquivos
  // para que o aplicativo funcione offline.
});