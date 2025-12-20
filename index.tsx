
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Elemento raiz 'root' não encontrado no HTML.");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Erro crítico ao renderizar o aplicativo:", error);
    // Fallback visual simples em caso de erro catastrófico de renderização
    rootElement.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; text-align: center; padding: 20px;">
        <h1 style="color: #e53e3e;">Erro de Inicialização</h1>
        <p style="color: #4a5568;">Ocorreu um erro ao carregar o aplicativo. Por favor, tente recarregar a página.</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; background: #ecc94b; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Recarregar</button>
      </div>
    `;
  }
}
