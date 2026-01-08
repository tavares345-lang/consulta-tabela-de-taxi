
import React, { useState, useEffect, useRef } from 'react';
import type { LongTrip, DistanceResult } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { MapPinIcon } from './icons/MapPinIcon';
import { CarIcon } from './icons/CarIcon';
import { XIcon } from './icons/XIcon';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { getDistance } from '../services/geminiService';

const POPULAR_LOCATIONS = [
  "Aeroporto Internacional de Confins - Tancredo Neves",
  "Rodoviária de Belo Horizonte",
  "Shopping Cidade, Belo Horizonte",
  "BH Shopping, Belvedere",
  "Expominas, Gameleira",
  "Mineirão - Estádio Governador Magalhães Pinto",
  "Praça da Liberdade, Savassi",
  "Inhotim, Brumadinho",
  "Savassi, Belo Horizonte",
  "Centro, Belo Horizonte",
  "Vila da Serra, Nova Lima",
  "Lagoa Santa",
  "Vespasiano",
  "Santa Luzia",
  "Betim Centro"
];

interface LocationAutocompleteInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onUseCurrentLocation?: () => void;
}

const LocationAutocompleteInput: React.FC<LocationAutocompleteInputProps> = ({ label, value, onChange, placeholder, onUseCurrentLocation }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim() === '') {
      setSuggestions(POPULAR_LOCATIONS.slice(0, 4));
    } else {
      const filtered = POPULAR_LOCATIONS.filter(loc => 
        loc.toLowerCase().includes(value.toLowerCase()) && 
        loc.toLowerCase() !== value.toLowerCase()
      );
      setSuggestions(filtered.slice(0, 5));
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleSelect = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
        <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-black text-gray-500 uppercase tracking-tighter">{label}</label>
            {onUseCurrentLocation && (
                <button 
                    onClick={(e) => { e.preventDefault(); onUseCurrentLocation(); }}
                    className="text-xs font-black text-blue-600 uppercase hover:text-blue-800 flex items-center bg-blue-50 px-4 py-2 rounded-xl transition-colors"
                >
                    <MapPinIcon className="w-4 h-4 mr-1.5" /> USAR GPS
                </button>
            )}
        </div>
        <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                <MapPinIcon className="w-5 h-5" />
            </span>
            <input 
                type="text" 
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={placeholder}
                className="w-full pl-12 pr-12 py-4 text-base border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-400 outline-none bg-white shadow-sm font-medium"
                autoComplete="off"
            />
            {value && (
              <button 
                  onClick={() => onChange('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-gray-500"
              >
                  <XIcon className="w-5 h-5" />
              </button>
            )}
        </div>
        
        {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-30 w-full bg-white mt-2 rounded-2xl shadow-2xl max-h-72 overflow-y-auto border border-gray-100 animate-in fade-in zoom-in duration-150">
                <ul>
                    {suggestions.map((suggestion, index) => (
                        <li 
                            key={index}
                            onMouseDown={(e) => { e.preventDefault(); handleSelect(suggestion); }}
                            className="px-5 py-4 hover:bg-blue-50 cursor-pointer text-base text-gray-700 border-b last:border-b-0 border-gray-50 font-bold"
                        >
                            {suggestion}
                        </li>
                    ))}
                </ul>
            </div>
        )}
    </div>
  );
};

interface LongTripModalProps {
  trip: LongTrip | null;
  onSave: (trip: LongTrip) => void;
  onClose: () => void;
}

const LongTripModal: React.FC<LongTripModalProps> = ({ trip, onSave, onClose }) => {
  const [formData, setFormData] = useState<Omit<LongTrip, 'id'>>({
    city: trip?.city || '',
    kilometers: trip?.kilometers || 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: trip?.id || `lt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-40 p-4 backdrop-blur-md">
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-lg animate-in zoom-in duration-200">
        <h2 className="text-2xl font-black mb-8 text-gray-800 uppercase tracking-tight">{trip ? 'Editar Destino' : 'Novo Destino Fixo'}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">Cidade / Destino</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Ex: Divinópolis" className="w-full p-4 text-base border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm" required />
          </div>
          <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">Distância (KM)</label>
              <input type="number" name="kilometers" value={formData.kilometers} onChange={handleChange} placeholder="0" className="w-full p-4 text-base border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm font-black" step="0.1" required />
          </div>
          <div className="flex justify-end space-x-4 pt-8">
            <button type="button" onClick={onClose} className="px-8 py-4 text-sm font-black text-gray-500 hover:bg-gray-100 rounded-2xl transition-colors uppercase tracking-widest">Cancelar</button>
            <button type="submit" className="px-8 py-4 text-sm font-black bg-yellow-400 text-gray-900 rounded-2xl hover:bg-yellow-500 transition-colors shadow-lg uppercase tracking-widest">Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface LongTripCalculatorProps {
  longTrips: LongTrip[];
  allLongTrips: LongTrip[];
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
}

const LongTripCalculator: React.FC<LongTripCalculatorProps> = ({ 
    longTrips, allLongTrips, isAdmin, pricePerKm, setPricePerKm, searchTerm, setSearchTerm, 
    kmSearchTerm, setKmSearchTerm,
    onAddLongTrip, onUpdateLongTrip, onDeleteLongTrip 
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTrip, setEditingTrip] = useState<LongTrip | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [origin, setOrigin] = useState('Aeroporto Internacional de Confins - Tancredo Neves');
    const [destination, setDestination] = useState('');
    const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
    const [isLoadingDistance, setIsLoadingDistance] = useState(false);
    const [distanceError, setDistanceError] = useState<string | null>(null);

    // Estado local para o input de preço para evitar triggers excessivos
    const [localPriceInput, setLocalPriceInput] = useState(pricePerKm.toString());
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        setLocalPriceInput(pricePerKm.toString());
    }, [pricePerKm]);

    const isFiltered = searchTerm !== '' || kmSearchTerm !== '';

    const matchedSavedTrip = allLongTrips.find(t => 
        destination.toLowerCase().includes(t.city.toLowerCase()) || 
        t.city.toLowerCase().includes(destination.toLowerCase())
    );

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Navegador sem suporte a GPS.");
            return;
        }
        setIsLoadingDistance(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setOrigin(`${pos.coords.latitude}, ${pos.coords.longitude}`);
                setIsLoadingDistance(false);
            },
            () => {
                alert("Erro ao obter GPS.");
                setIsLoadingDistance(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleCalculateRoute = async () => {
        if (!origin.trim() || !destination.trim()) return;
        setIsLoadingDistance(true);
        setDistanceError(null);
        setCalculatedDistance(null);

        try {
            const result: DistanceResult = await getDistance(origin, destination);
            if (result.distance !== null && result.distance > 0) {
                setCalculatedDistance(result.distance);
                if (!searchTerm) setSearchTerm(destination);
                setKmSearchTerm(Math.floor(result.distance).toString());
            } else {
                setDistanceError("Rota não localizada. Tente endereços mais simples.");
            }
        } catch (error) {
            setDistanceError("Erro de comunicação com o servidor de mapas.");
        } finally {
            setIsLoadingDistance(false);
        }
    };

    const handleSyncWithGPS = () => {
        if (isAdmin && matchedSavedTrip && calculatedDistance) {
            if (confirm(`Deseja atualizar a quilometragem de "${matchedSavedTrip.city}" de ${matchedSavedTrip.kilometers}km para ${calculatedDistance.toFixed(1)}km na tabela fixa?`)) {
                onUpdateLongTrip({
                    ...matchedSavedTrip,
                    kilometers: parseFloat(calculatedDistance.toFixed(1))
                });
            }
        }
    };

    const handlePriceSave = () => {
        const val = parseFloat(localPriceInput);
        if (!isNaN(val)) {
            setPricePerKm(val);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        }
    };

    const handleSave = (trip: LongTrip) => {
        if (editingTrip) onUpdateLongTrip(trip);
        else onAddLongTrip(trip);
        setIsModalOpen(false);
        setEditingTrip(null);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setKmSearchTerm('');
    };

    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n');
            const newTrips: LongTrip[] = [];
            
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const parts = line.split(',');
                if (parts.length >= 2) {
                    newTrips.push({
                        id: `lt-imp-${Date.now()}-${i}`,
                        city: parts[0].replace(/"/g, '').trim(),
                        kilometers: parseFloat(parts[1]) || 0
                    });
                }
            }
            
            if (newTrips.length > 0) {
                newTrips.forEach(trip => onAddLongTrip(trip));
                alert(`${newTrips.length} viagens importadas.`);
            }
        };
        reader.readAsText(file);
    };

    const handleExportCSV = () => {
        const header = "Cidade,KM\n";
        const rows = allLongTrips.map(t => `"${t.city}",${t.kilometers}`).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'viagens_longas.csv';
        a.click();
    };

    return (
        <div className="space-y-10">
            {isModalOpen && <LongTripModal key={editingTrip?.id || 'new'} trip={editingTrip} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
           
            {/* Painel Administrativo de Preço e Cálculo */}
            {isAdmin && (
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 border-l-[12px] border-l-blue-600 animate-in slide-in-from-top-6 duration-500">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 items-start">
                    <div className="lg:col-span-2">
                      <div className="flex items-center mb-6">
                        <div className="p-3 bg-blue-100 rounded-2xl mr-4">
                            <CarIcon className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest">Configuração e Cálculo de Rota</h2>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <LocationAutocompleteInput 
                              label="Ponto de Partida" 
                              value={origin} 
                              onChange={setOrigin} 
                              placeholder="Local de saída..." 
                              onUseCurrentLocation={handleUseCurrentLocation}
                          />
                          <LocationAutocompleteInput 
                              label="Destino Final" 
                              value={destination} 
                              onChange={setDestination} 
                              placeholder="Cidade ou endereço..." 
                          />
                      </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Valor cobrado por KM (R$)</label>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                            <input 
                            type="number" 
                            value={localPriceInput} 
                            onChange={(e) => setLocalPriceInput(e.target.value)}
                            step="0.10"
                            className="w-full p-4 text-2xl font-black text-gray-800 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-400 outline-none shadow-inner"
                            />
                            <span className="text-sm font-black text-gray-400 whitespace-nowrap">/ KM</span>
                        </div>
                        <button 
                            onClick={handlePriceSave}
                            className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${saveSuccess ? 'bg-green-500 text-white' : 'bg-gray-800 text-white hover:bg-black'}`}
                        >
                            {saveSuccess ? '✓ PREÇO SALVO' : 'SALVAR PREÇO'}
                        </button>
                      </div>
                      <p className="mt-3 text-[9px] text-gray-400 font-bold uppercase leading-relaxed italic">Este valor altera o total de todas as viagens na tabela para todos os usuários.</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                      <button 
                          onClick={handleCalculateRoute}
                          disabled={isLoadingDistance}
                          className={`w-full md:w-auto px-16 py-5 rounded-2xl text-base font-black text-white uppercase shadow-2xl active:scale-95 transition-all flex items-center justify-center space-x-3 ${isLoadingDistance ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                          {isLoadingDistance ? (
                              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : <MapPinIcon className="w-6 h-6" />}
                          <span>{isLoadingDistance ? 'Calculando Rota...' : 'Consultar Distância Oficial'}</span>
                      </button>
                      
                      {distanceError && (
                        <div className="mt-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl w-full max-w-md text-center">
                          <p className="text-red-600 text-sm font-black uppercase tracking-widest">{distanceError}</p>
                        </div>
                      )}
                      
                      {calculatedDistance !== null && (
                          <div className="mt-10 w-full max-w-4xl space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                                  <div className="bg-blue-50 p-8 rounded-[40px] border-2 border-blue-100 shadow-inner flex flex-col items-center">
                                      <span className="text-blue-500 text-xs font-black uppercase tracking-widest mb-1 block">Google Maps (Distância Real)</span>
                                      <span className="text-5xl font-black text-gray-800">{calculatedDistance.toFixed(1).replace('.', ',')} KM</span>
                                  </div>

                                  <div className={`p-8 rounded-[40px] border-2 flex flex-col items-center justify-center ${matchedSavedTrip ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                                      <span className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1 block">Tabela Fixa Cadastrada</span>
                                      {matchedSavedTrip ? (
                                          <div className="text-center">
                                              <span className="text-3xl font-black text-gray-800">{matchedSavedTrip.kilometers.toFixed(1).replace('.', ',')} KM</span>
                                              {Math.abs(calculatedDistance - matchedSavedTrip.kilometers) > 5 && (
                                                <div className="mt-3 bg-red-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase">
                                                  DIVERGÊNCIA DETECTADA
                                                </div>
                                              )}
                                              <button 
                                                  onClick={handleSyncWithGPS}
                                                  className="mt-4 px-6 py-2.5 bg-yellow-400 text-gray-900 rounded-xl text-[10px] font-black uppercase hover:bg-yellow-500 shadow-sm"
                                              >
                                                  Atualizar Tabela
                                              </button>
                                          </div>
                                      ) : (
                                          <p className="text-sm text-gray-400 font-bold uppercase italic mt-2">Local não cadastrado</p>
                                      )}
                                  </div>
                              </div>

                              <div className="bg-green-600 rounded-[50px] p-12 shadow-2xl border-8 border-white ring-12 ring-green-50 animate-in zoom-in duration-500 text-center">
                                  <span className="text-white/80 text-sm font-black uppercase tracking-widest mb-2 block">VALOR SUGERIDO (KM × PREÇO ATUAL)</span>
                                  <p className="text-7xl font-black text-white drop-shadow-lg">R$ {(calculatedDistance * pricePerKm).toFixed(2).replace('.', ',')}</p>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
            )}

            {/* Listagem Fixa */}
            <div className="space-y-6">
                <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center">
                            <div className="w-2 h-8 bg-yellow-400 rounded-full mr-4 shadow-sm"></div>
                            <div>
                                <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest">Tabela de Viagens Longas</h2>
                                <p className="text-[11px] text-gray-400 font-bold uppercase mt-0.5">Base de cálculo: <span className="text-gray-900 font-black">R$ {pricePerKm.toFixed(2).replace('.', ',')}/KM</span></p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className="bg-yellow-100 text-yellow-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-tighter">
                                {longTrips.length} Destinos
                            </span>
                            {isFiltered && (
                                <button onClick={clearFilters} className="text-[11px] font-black text-red-500 uppercase hover:underline flex items-center">
                                    <XIcon className="w-3.5 h-3.5 mr-1" /> Limpar Filtros
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                        <div className="xl:col-span-6 relative">
                             <span className="absolute inset-y-0 left-0 pl-5 flex items-center text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar cidade (ignore acentos)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pr-12 pl-14 py-5 text-lg border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-400 outline-none bg-gray-50 font-medium shadow-inner"
                            />
                        </div>
                        <div className="xl:col-span-2 relative">
                            <input
                                type="text"
                                placeholder="KM..."
                                value={kmSearchTerm}
                                onChange={(e) => setKmSearchTerm(e.target.value)}
                                className="w-full pr-12 pl-6 py-5 text-lg border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-400 outline-none bg-gray-50 font-black shadow-inner"
                            />
                        </div>
                        <div className="xl:col-span-4 flex items-center space-x-2">
                            {isAdmin && (
                              <>
                                <input type="file" ref={fileInputRef} onChange={handleImportCSV} className="hidden" accept=".csv" />
                                <button onClick={() => fileInputRef.current?.click()} className="p-4 text-blue-500 hover:bg-blue-50 rounded-2xl transition-colors border border-gray-100" title="Importar CSV"><UploadIcon className="w-6 h-6" /></button>
                                <button onClick={handleExportCSV} className="p-4 text-gray-500 hover:bg-gray-50 rounded-2xl transition-colors border border-gray-100" title="Exportar CSV"><DownloadIcon className="w-6 h-6" /></button>
                                <button onClick={() => { setEditingTrip(null); setIsModalOpen(true); }} className="flex-1 bg-yellow-400 text-gray-900 font-black py-5 rounded-2xl text-sm uppercase hover:bg-yellow-500 shadow-lg flex items-center justify-center transition-transform active:scale-95">
                                    <PlusIcon className="w-5 h-5 mr-2" /> Novo Registro
                                </button>
                              </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="hidden md:table-header-group bg-gray-800">
                            <tr>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Destino</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Distância</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor</th>
                                {isAdmin && <th className="px-8 py-6 text-right"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {longTrips.length > 0 ? longTrips.map((trip, index) => {
                                const isMatchedGPS = calculatedDistance && 
                                    (trip.city.toLowerCase().includes(destination.toLowerCase()) || destination.toLowerCase().includes(trip.city.toLowerCase()));
                                
                                return (
                                    <tr 
                                        key={trip.id} 
                                        className={`block md:table-row transition-all duration-200 hover:bg-yellow-50/30 ${isMatchedGPS ? 'bg-blue-50 ring-2 ring-blue-200' : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50/80')}`}
                                    >
                                        <td className="p-6 md:px-8 md:py-6 block md:table-cell">
                                            <div className="flex justify-between items-center md:block">
                                                <span className="font-black text-[9px] text-gray-300 md:hidden uppercase tracking-widest">Destino</span>
                                                <span className="text-lg font-black text-gray-800 uppercase tracking-tight">{trip.city}</span>
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
                                                <span className="font-black text-[9px] text-gray-300 md:hidden uppercase tracking-widest">Valor</span>
                                                <span className="text-2xl text-gray-900 font-black">R$ {(trip.kilometers * pricePerKm).toFixed(2).replace('.', ',')}</span>
                                            </div>
                                        </td>
                                        {isAdmin && (
                                            <td className="px-6 py-4 md:px-8 md:py-6 block md:table-cell text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button onClick={() => { setEditingTrip(trip); setIsModalOpen(true); }} className="p-2.5 text-blue-500 hover:bg-blue-100/50 rounded-xl transition-all border border-transparent hover:border-blue-100"><PencilIcon className="w-5 h-5" /></button>
                                                    <button onClick={() => { if (confirm(`Excluir ${trip.city}?`)) onDeleteLongTrip(trip.id); }} className="p-2.5 text-red-500 hover:bg-red-100/50 rounded-xl transition-all border border-transparent hover:border-red-100"><TrashIcon className="w-5 h-5" /></button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={isAdmin ? 4 : 3} className="p-32 text-center">
                                        <p className="text-gray-400 text-lg font-black uppercase tracking-widest opacity-30 italic">Nenhum resultado encontrado</p>
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
