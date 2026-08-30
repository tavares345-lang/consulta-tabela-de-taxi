
import React, { useState, useEffect, useRef } from 'react';
import type { LongTrip } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { XIcon } from './icons/XIcon';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { SearchHistory, addSearchToHistory } from './SearchHistory';
import { ADMIN_PHONE_DISPLAY, getWhatsAppLink } from './AdminContactBanner';
import { MessageCircle } from 'lucide-react';

interface LongTripModalProps {
  trip: LongTrip | null;
  onSave: (trip: LongTrip) => void;
  onClose: () => void;
}

const LongTripModal: React.FC<LongTripModalProps> = ({ trip, onSave, onClose }) => {
  const [city, setCity] = useState(trip?.city || '');
  const [kmStr, setKmStr] = useState(trip?.kilometers.toString().replace('.', ',') || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Normalização rigorosa do KM para salvar como número
    const kilometers = parseFloat(kmStr.trim().replace(',', '.')) || 0;
    onSave({
      id: trip?.id || `lt-${Date.now()}`,
      city: city.trim().toUpperCase(),
      kilometers,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-40 p-4 backdrop-blur-md">
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-lg animate-in zoom-in duration-200">
        <h2 className="text-2xl font-black mb-8 text-gray-800 uppercase tracking-tight">{trip ? 'Editar Destino' : 'Novo Destino Fixo'}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Cidade / Destino</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex: Divinópolis" className="w-full p-4 text-base border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm" required />
          </div>
          <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Distância (KM)</label>
              <input type="text" value={kmStr} onChange={(e) => setKmStr(e.target.value)} placeholder="0,0" className="w-full p-4 text-base border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm font-black" required />
          </div>
          <div className="flex justify-end space-x-4 pt-8">
            <button type="button" onClick={onClose} className="px-8 py-4 text-sm font-black text-gray-500 hover:bg-gray-100 rounded-2xl uppercase tracking-widest">Cancelar</button>
            <button type="submit" className="px-8 py-4 text-sm font-black bg-yellow-400 text-gray-900 rounded-2xl hover:bg-yellow-500 shadow-lg uppercase tracking-widest">Confirmar e Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface LongTripCalculatorProps {
  longTrips: LongTrip[]; // Filtrados
  allLongTrips: LongTrip[]; // Todos
  isAdmin: boolean;
  pricePerKm: number;
  setPricePerKm: (price: number) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  kmSearchTerm: string;
  setKmSearchTerm: (term: string) => void;
  onAddLongTrip: (trip: LongTrip) => void;
  onUpdateLongTrip: (trip: LongTrip) => void;
  onDeleteLongTrip: (id: string) => void;
  onImportLongTrips: (trips: LongTrip[], replace: boolean) => void;
}

const LongTripCalculator: React.FC<LongTripCalculatorProps> = ({ 
    longTrips, allLongTrips, isAdmin, pricePerKm, setPricePerKm, searchTerm, setSearchTerm, 
    kmSearchTerm, setKmSearchTerm,
    onAddLongTrip, onUpdateLongTrip, onDeleteLongTrip, onImportLongTrips
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTrip, setEditingTrip] = useState<LongTrip | null>(null);

    const [localPriceInput, setLocalPriceInput] = useState(pricePerKm.toString().replace('.', ','));
    const [saveSuccess, setSaveSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // States do Custom Import Modal
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [parsedImportTrips, setParsedImportTrips] = useState<LongTrip[]>([]);
    const [importErrorMsg, setImportErrorMsg] = useState<string | null>(null);
    const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
    const [importAction, setImportAction] = useState<'replace' | 'merge'>('merge');

    useEffect(() => {
        setLocalPriceInput(pricePerKm.toString().replace('.', ','));
    }, [pricePerKm]);

    const handlePriceSave = () => {
        const val = parseFloat(localPriceInput.trim().replace(',', '.'));
        if (!isNaN(val)) {
            setPricePerKm(val);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) return;

            try {
                // Split lines, ignoring carriage returns and trimming empty spaces safely
                const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
                if (lines.length <= 1) {
                    setImportErrorMsg('Nenhum dado válido encontrado no arquivo CSV.');
                    setParsedImportTrips([]);
                    setIsImportModalOpen(true);
                    return;
                }

                const newTrips: LongTrip[] = lines.slice(1)
                    .map((line, index) => {
                        let city = '';
                        let kilometers = 0;

                        // Auto-detect delimiter: either semicolon or comma
                        const delimiter = line.includes(';') ? ';' : ',';

                        if (delimiter === ';') {
                            const parts = line.split(';');
                            city = parts[0]?.replace(/^"|"$/g, '').trim() || '';
                            const kmStr = parts[1]?.replace(/^"|"$/g, '').replace(',', '.').trim() || '';
                            kilometers = parseFloat(kmStr) || 0;
                        } else {
                            // Commas, taking quoted values into consideration
                            if (line.startsWith('"')) {
                                const nextQuoteIndex = line.indexOf('"', 1);
                                if (nextQuoteIndex !== -1) {
                                    city = line.substring(1, nextQuoteIndex).trim();
                                    const rest = line.substring(nextQuoteIndex + 1);
                                    const kmPart = rest.replace(/^[, ]+/, '').replace(/^"|"$/g, '').replace(',', '.').trim();
                                    kilometers = parseFloat(kmPart) || 0;
                                } else {
                                    const parts = line.split(',');
                                    city = parts[0]?.replace(/^"|"$/g, '').trim() || '';
                                    const kmStr = parts[1]?.replace(/^"|"$/g, '').replace(',', '.').trim() || '';
                                    kilometers = parseFloat(kmStr) || 0;
                                }
                            } else {
                                const parts = line.split(',');
                                city = parts[0]?.replace(/^"|"$/g, '').trim() || '';
                                const kmStr = parts[1]?.replace(/^"|"$/g, '').replace(',', '.').trim() || '';
                                kilometers = parseFloat(kmStr) || 0;
                            }
                        }

                        if (!city || isNaN(kilometers) || kilometers <= 0) return null;

                        return {
                            id: `imp-lt-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
                            city: city.toUpperCase(),
                            kilometers,
                        };
                    }).filter((t): t is LongTrip => t !== null);

                if (newTrips.length > 0) {
                    setParsedImportTrips(newTrips);
                    setImportErrorMsg(null);
                    setImportSuccessMsg(null);
                    setIsImportModalOpen(true);
                } else {
                    setImportErrorMsg('Nenhum dado válido de viagem encontrado no CSV.');
                    setParsedImportTrips([]);
                    setIsImportModalOpen(true);
                }
            } catch (error) {
                setImportErrorMsg('Erro ao processar o arquivo CSV de viagens.');
                setParsedImportTrips([]);
                setIsImportModalOpen(true);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const handleConfirmImport = () => {
        if (parsedImportTrips.length === 0) return;

        onImportLongTrips(parsedImportTrips, importAction === 'replace');
        
        const modeText = importAction === 'replace' ? 'substituídos' : 'mesclados/atualizados';
        setImportSuccessMsg(`Sucesso! ${parsedImportTrips.length} registros foram ${modeText} na tabela.`);
        setParsedImportTrips([]);

        setTimeout(() => {
            setIsImportModalOpen(false);
            setImportSuccessMsg(null);
        }, 2200);
    };

    const handleExport = () => {
        if (allLongTrips.length === 0) return;

        const header = "Cidade,DistanciaKM\n";
        const csvRows = allLongTrips.map(trip => {
            return `"${trip.city}",${trip.kilometers.toFixed(1)}`;
        }).join('\n');

        const blob = new Blob(["\uFEFF" + header + csvRows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `tabela_viagens_longas_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-10">
            {isModalOpen && (
              <LongTripModal 
                trip={editingTrip} 
                onSave={(t) => { 
                  if(editingTrip) onUpdateLongTrip(t); 
                  else onAddLongTrip(t); 
                  setIsModalOpen(false); 
                  setEditingTrip(null);
                }} 
                onClose={() => {
                  setIsModalOpen(false);
                  setEditingTrip(null);
                }} 
              />
            )}

            {isImportModalOpen && (
                <div id="import-modal" className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl p-8 border border-gray-100 relative animate-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => setIsImportModalOpen(false)} 
                            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors font-black"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>

                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                <UploadIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-800 uppercase tracking-widest">Importar Viagens Longas (CSV)</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Configuração e validação antes da importação</p>
                            </div>
                        </div>

                        {importErrorMsg ? (
                            <div className="bg-red-50 border border-red-100 text-red-700 p-5 rounded-2xl text-xs font-bold uppercase mb-6 flex flex-col items-center justify-center text-center">
                                <span className="text-lg mb-1">⚠️</span>
                                {importErrorMsg}
                            </div>
                        ) : importSuccessMsg ? (
                            <div className="bg-green-50 border border-green-100 text-green-700 p-8 rounded-2xl text-xs font-bold uppercase mb-4 flex flex-col items-center justify-center text-center">
                                <span className="text-3xl mb-2">🎉</span>
                                {importSuccessMsg}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl text-center">
                                    <p className="text-xs font-bold text-gray-600 uppercase">Registros Válidos Detectados</p>
                                    <p className="text-4xl font-black text-blue-600 mt-1">{parsedImportTrips.length}</p>
                                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mt-2">Dados normalizados em caixa alta</p>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">O que deseja fazer?</label>
                                    
                                    <div 
                                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${importAction === 'replace' ? 'border-blue-600 bg-blue-50/20' : 'border-gray-250 hover:border-gray-300 bg-gray-50'}`}
                                        onClick={() => setImportAction('replace')}
                                    >
                                        <input 
                                            type="radio" 
                                            name="importAction" 
                                            checked={importAction === 'replace'} 
                                            onChange={() => setImportAction('replace')}
                                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" 
                                        />
                                        <div>
                                            <p className="text-xs font-black text-gray-800 uppercase tracking-tight">Substituir Tabela Inteira (Recomendado)</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 leading-relaxed">Exclui permanentemente todos os registros anteriores e mantém apenas as novas viagens importadas do arquivo. Remove duplicados automáticos.</p>
                                        </div>
                                    </div>

                                    <div 
                                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${importAction === 'merge' ? 'border-blue-600 bg-blue-50/20' : 'border-gray-250 hover:border-gray-300 bg-gray-50'}`}
                                        onClick={() => setImportAction('merge')}
                                    >
                                        <input 
                                            type="radio" 
                                            name="importAction" 
                                            checked={importAction === 'merge'} 
                                            onChange={() => setImportAction('merge')}
                                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" 
                                        />
                                        <div>
                                            <p className="text-xs font-black text-gray-800 uppercase tracking-tight">Mesclar e Atualizar sem Duplicados</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 leading-relaxed">Mantém as viagens antigas, atualiza a quilometragem daquelas que repetirem no arquivo e adiciona as novas com segurança.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button 
                                        onClick={() => setIsImportModalOpen(false)}
                                        className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-750 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        onClick={handleConfirmImport}
                                        className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-blue-500/10"
                                    >
                                        Confirmar Importação
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
           
            {isAdmin && (
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 border-l-[12px] border-l-blue-600 animate-in slide-in-from-top-6 duration-500">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest mb-2">Configurações da Tabela</h2>
                        <p className="text-sm font-bold text-gray-400 uppercase">Ajuste o valor por KM para toda a tabela de viagens.</p>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200 min-w-[300px]">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Preço por KM (R$)</label>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                            <input type="text" value={localPriceInput} onChange={(e) => setLocalPriceInput(e.target.value)} className="w-full p-4 text-2xl font-black text-gray-800 bg-white border border-gray-200 rounded-2xl outline-none shadow-inner" />
                            <span className="text-sm font-black text-gray-400">/KM</span>
                        </div>
                        <button onClick={handlePriceSave} className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${saveSuccess ? 'bg-green-500 text-white' : 'bg-gray-800 text-white hover:bg-black'}`}>
                            {saveSuccess ? '✓ PREÇO SALVO' : 'ATUALIZAR TARIFA'}
                        </button>
                      </div>
                    </div>
                  </div>
              </div>
            )}

            <div className="space-y-6">
                <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center">
                            <div className="w-2 h-8 bg-yellow-400 rounded-full mr-4 shadow-sm"></div>
                            <div>
                                <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest">Tabela de Distâncias Oficiais</h2>
                                <p className="text-[11px] text-gray-400 font-bold uppercase mt-0.5">KM de referência para cobrança fixa</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
                            {isAdmin && (
                                <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-100 flex items-center gap-1.5 text-xs font-black uppercase" title="Importar CSV de Viagens">
                                    <UploadIcon className="w-5 h-5" />
                                    <span className="hidden sm:inline">Importar</span>
                                </button>
                            )}
                            <button onClick={handleExport} className="p-2.5 text-gray-500 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100 flex items-center gap-1.5 text-xs font-black uppercase" title="Exportar CSV de Viagens">
                                <DownloadIcon className="w-5 h-5" />
                                <span className="hidden sm:inline">Exportar</span>
                            </button>
                            <span className="bg-yellow-100 text-yellow-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-tighter">
                                {longTrips.length} Cidades localizadas
                            </span>
                            {(searchTerm || kmSearchTerm) && (
                                <button onClick={() => { setSearchTerm(''); setKmSearchTerm(''); }} className="text-[11px] font-black text-red-500 uppercase hover:underline flex items-center">
                                    <XIcon className="w-3.5 h-3.5 mr-1" /> Limpar Busca
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                        <div className="xl:col-span-6 relative">
                             <span className="absolute inset-y-0 left-0 pl-5 flex items-center text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </span>
                            <input type="text" placeholder="Procurar cidade na tabela..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pr-12 pl-14 py-5 text-lg border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-400 outline-none bg-gray-50 font-medium shadow-inner" />
                        </div>
                        <div className="xl:col-span-3 relative">
                            <input type="text" placeholder="Filtrar por KM (ex: 45,5)..." value={kmSearchTerm} onChange={(e) => setKmSearchTerm(e.target.value)} className="w-full pr-12 pl-6 py-5 text-lg border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-400 outline-none bg-gray-50 font-black shadow-inner" />
                        </div>
                        <div className="xl:col-span-3">
                            {isAdmin && (
                                <button onClick={() => { setEditingTrip(null); setIsModalOpen(true); }} className="w-full bg-yellow-400 text-gray-900 font-black py-5 rounded-2xl text-sm uppercase hover:bg-yellow-500 shadow-lg flex items-center justify-center transition-transform active:scale-95">
                                    <PlusIcon className="w-5 h-5 mr-2" /> Novo Destino
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="mt-4">
                        <SearchHistory 
                          historyKey="long_trips" 
                          currentSearchTerm={searchTerm} 
                          onSelectSearch={setSearchTerm} 
                        />
                    </div>
                </div>

                <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="hidden md:table-header-group bg-gray-800">
                            <tr>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cidade</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">KM Oficial</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor Tabelado (KM R$ {pricePerKm.toFixed(2).replace('.', ',')})</th>
                                {isAdmin && <th className="px-8 py-6 text-right">Ações</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {longTrips.length > 0 ? longTrips.map((trip, index) => (
                                <tr key={trip.id} className={`block md:table-row transition-all duration-200 hover:bg-yellow-50/30 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/80'}`}>
                                    <td className="p-6 md:px-8 md:py-6 block md:table-cell">
                                        <div className="flex justify-between items-center md:block">
                                            <span className="font-black text-[9px] text-gray-300 md:hidden uppercase tracking-widest">Cidade</span>
                                            <span 
                                              onClick={() => {
                                                setSearchTerm(trip.city);
                                                addSearchToHistory('long_trips', trip.city);
                                              }}
                                              className="text-lg font-black text-gray-800 uppercase tracking-tight hover:text-amber-600 hover:underline cursor-pointer transition-colors"
                                              title="Clique para pesquisar e adicionar ao histórico"
                                            >
                                              {trip.city}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-2 md:px-8 md:py-6 block md:table-cell">
                                        <div className="flex justify-between items-center md:block">
                                            <span className="font-black text-[9px] text-gray-300 md:hidden uppercase tracking-widest">Distância</span>
                                            <span className="text-base text-gray-600 font-bold">{trip.kilometers.toFixed(1).replace('.', ',')} KM</span>
                                        </div>
                                    </td>
                                    <td className="p-6 md:px-8 md:py-6 block md:table-cell">
                                        <div className="flex justify-between items-center md:block">
                                            <span className="font-black text-[9px] text-gray-300 md:hidden uppercase tracking-widest">Preço</span>
                                            <span className="text-2xl text-gray-900 font-black">R$ {(trip.kilometers * pricePerKm).toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    </td>
                                    {isAdmin && (
                                        <td className="px-6 py-4 md:px-8 md:py-6 block md:table-cell text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button onClick={() => { setEditingTrip(trip); setIsModalOpen(true); }} className="p-2.5 text-blue-500 hover:bg-blue-100/50 rounded-xl transition-all border border-transparent hover:border-blue-100"><PencilIcon className="w-5 h-5" /></button>
                                                <button onClick={() => { if (confirm(`Deseja EXCLUIR "${trip.city}" permanentemente?`)) onDeleteLongTrip(trip.id); }} className="p-2.5 text-red-500 hover:bg-red-100/50 rounded-xl transition-all border border-transparent hover:border-red-100"><TrashIcon className="w-5 h-5" /></button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={isAdmin ? 4 : 3} className="py-16 px-4 text-center">
                                        <div className="flex flex-col items-center max-w-md mx-auto">
                                            <p className="text-lg font-black uppercase tracking-wider text-gray-700">Nenhuma Cidade Encontrada</p>
                                            <p className="text-xs font-bold text-gray-400 mt-1 mb-5">Deseja calcular ou cadastrar uma cidade que não consta na lista?</p>
                                            
                                            <a
                                                href={getWhatsAppLink(searchTerm ? `Olá! Gostaria de solicitar a inclusão da cidade "${searchTerm}" nas Viagens Longas da Tabela Táxi.` : undefined)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider py-3 px-5 rounded-2xl shadow-lg transition-all"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                <span>Solicitar Inclusão ao Administrador: {ADMIN_PHONE_DISPLAY}</span>
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LongTripCalculator;
