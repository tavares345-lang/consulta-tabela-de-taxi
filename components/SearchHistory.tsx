import React, { useEffect, useState } from 'react';
import { Clock, Trash2, X, MapPin } from 'lucide-react';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface SearchHistoryProps {
  historyKey: string; // 'fares' | 'long_trips'
  currentSearchTerm: string;
  onSelectSearch: (term: string) => void;
}

// Salva busca no Firestore para que o administrador possa visualizar
export const saveSearchToFirestore = async (historyKey: string, term: string) => {
  const trimmed = term.trim().toUpperCase();
  if (!trimmed || trimmed.length < 3) return;

  try {
    let currentUserEmail = 'Anônimo';
    try {
      const stored = localStorage.getItem('taxi_app_current_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u && u.email) {
          currentUserEmail = u.email;
        }
      }
    } catch (e) {}

    const docRef = doc(db, 'data', 'global_searches_doc');
    let searches: any[] = [];
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.searches)) {
          searches = data.searches;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar buscas globais:', e);
    }

    const newLog = {
      id: `search-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      term: trimmed,
      historyKey,
      timestamp: new Date().toISOString(),
      userEmail: currentUserEmail,
    };

    // Remove busca duplicada do mesmo termo pelo mesmo usuário para manter limpo, e limita a 50
    const filtered = searches.filter(item => !(item.term === trimmed && item.userEmail === currentUserEmail));
    const updated = [newLog, ...filtered].slice(0, 50);

    await setDoc(docRef, {
      searches: updated,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao salvar busca no Firestore:', error);
  }
};

// Helper para outros componentes adicionarem buscas diretamente ao histórico
export const addSearchToHistory = (historyKey: string, term: string) => {
  const trimmed = term.trim().toUpperCase();
  if (!trimmed || trimmed.length < 3) return;

  const localStorageKey = `taxi_app_search_history_${historyKey}`;
  let history: string[] = [];
  
  try {
    const stored = localStorage.getItem(localStorageKey);
    if (stored) {
      history = JSON.parse(stored);
    }
  } catch (e) {
    console.error('Erro ao carregar histórico:', e);
  }

  const filtered = history.filter(item => item !== trimmed);
  const updated = [trimmed, ...filtered].slice(0, 5);
  localStorage.setItem(localStorageKey, JSON.stringify(updated));
  
  // Salva no Firestore também
  saveSearchToFirestore(historyKey, trimmed);

  // Dispara um evento customizado para notificar o componente ativo a atualizar seu estado
  window.dispatchEvent(new Event('taxi_app_search_history_updated'));
};

export const SearchHistory: React.FC<SearchHistoryProps> = ({
  historyKey,
  currentSearchTerm,
  onSelectSearch,
}) => {
  const [history, setHistory] = useState<string[]>([]);
  const localStorageKey = `taxi_app_search_history_${historyKey}`;

  const loadHistory = () => {
    const stored = localStorage.getItem(localStorageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(0, 5));
        }
      } catch (e) {
        console.error('Erro ao analisar histórico de buscas:', e);
      }
    } else {
      setHistory([]);
    }
  };

  // Carrega o histórico no mount e quando a chave mudar
  useEffect(() => {
    loadHistory();

    // Ouve atualizações manuais do histórico (ex: ao clicar nas linhas da tabela)
    const handleManualUpdate = () => {
      loadHistory();
    };
    
    window.addEventListener('taxi_app_search_history_updated', handleManualUpdate);
    return () => {
      window.removeEventListener('taxi_app_search_history_updated', handleManualUpdate);
    };
  }, [localStorageKey]);

  const saveHistory = (newHistory: string[]) => {
    const limited = newHistory.slice(0, 5);
    setHistory(limited);
    localStorage.setItem(localStorageKey, JSON.stringify(limited));
  };

  const addToHistoryLocal = (term: string) => {
    const trimmed = term.trim().toUpperCase();
    if (!trimmed || trimmed.length < 3) return;

    const filtered = history.filter(item => item !== trimmed);
    const updated = [trimmed, ...filtered].slice(0, 5);
    saveHistory(updated);
  };

  // Debounce de digitação ativa na busca
  useEffect(() => {
    if (!currentSearchTerm || currentSearchTerm.trim().length < 3) return;

    const handler = setTimeout(() => {
      addToHistoryLocal(currentSearchTerm);
      saveSearchToFirestore(historyKey, currentSearchTerm);
    }, 1200); // 1.2s de debounce para evitar salvar termos parciais

    return () => clearTimeout(handler);
  }, [currentSearchTerm]);

  const handleRemoveItem = (e: React.MouseEvent, item: string) => {
    e.stopPropagation(); // Evita ativar a busca ao clicar no botão de fechar
    const updated = history.filter(i => i !== item);
    saveHistory(updated);
  };

  const handleClearAll = () => {
    if (window.confirm('Deseja limpar todo o seu histórico de consultas?')) {
      saveHistory([]);
    }
  };

  if (history.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-black uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span>Consultas Recentes (Últimas 5)</span>
        </div>
        <button
          onClick={handleClearAll}
          className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter"
          title="Limpar tudo"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Limpar Histórico</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {history.map((item) => (
          <div
            key={item}
            onClick={() => onSelectSearch(item)}
            className="flex items-center gap-2 bg-white hover:bg-amber-50/60 active:scale-95 border border-gray-200 hover:border-amber-300 px-3 py-2 rounded-full cursor-pointer transition-all shadow-sm group"
          >
            <MapPin className="w-3 h-3 text-gray-400 group-hover:text-amber-500" />
            <span className="text-xs font-black text-gray-700 uppercase tracking-tight">
              {item}
            </span>
            <button
              onClick={(e) => handleRemoveItem(e, item)}
              className="p-0.5 rounded-full hover:bg-gray-150 text-gray-400 hover:text-gray-600 transition-colors ml-1"
              title="Remover"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
