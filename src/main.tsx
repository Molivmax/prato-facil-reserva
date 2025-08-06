
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Este código registra o service worker para habilitar o PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('SW registrado com sucesso:', registration);
      })
      .catch((error) => {
        console.log('Falha no registro do SW:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);