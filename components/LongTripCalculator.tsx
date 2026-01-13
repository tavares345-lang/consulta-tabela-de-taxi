
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
  "Mineirão",
  "Praça da Liberdade",
  "Inhotim, Brumadinho",
  "Savassi, Belo Horizonte",
  "Centro, Belo Horizonte",
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
}

const LocationAutocompleteInput: React.FC<LocationAutocompleteInputProps> = ({ label, value, onChange, placeholder }) => {
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
        <label className="block text-sm font-black text-gray-500 uppercase tracking-tighter mb-2">{label}</label>
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
              <button onClick={() => onChange('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-gray-500">
                  <XIcon className="w-5 h-5" />
              </button>
            )}
        </div>
        {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-30 w-full bg-white mt-2 rounded-2xl shadow-2xl max-h-72 overflow-y-auto border border-gray-100 animate-in fade-in zoom-in duration-150">
                <ul>
                    {suggestions.map((suggestion, index) => (
                        <li key={index} onMouseDown={(e) => { e.preventDefault(); handleSelect(suggestion); }} className="px-5 py-4 hover:bg-blue-50 cursor-pointer text-base text-gray-700 border-b last:border-b-0 border-gray-50 font-bold">{suggestion}</li>
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
}

const LongTripCalculator: React.FC<LongTripCalculatorProps> = ({ 
    longTrips, allLongTrips, isAdmin, pricePerKm, setPricePerKm, searchTerm, setSearchTerm, 
    kmSearchTerm, setKmSearchTerm,
    onAddLongTrip, onUpdateLongTrip, onDeleteLongTrip 
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTrip, setEditingTrip] = useState<LongTrip | null>(null);
    const [origin, setOrigin] = useState('Aeroporto Internacional de Confins - Tancredo Neves');
    const [destination, setDestination] = useState('');
    const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
    const [isLoadingDistance, setIsLoadingDistance] = useState(false);
    const [distanceError, setDistanceError] = useState<string | null>(null);

    const [localPriceInput, setLocalPriceInput] = useState(pricePerKm.toString().replace('.', ','));
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        setLocalPriceInput(pricePerKm.toString().replace('.', ','));
    }, [pricePerKm]);

    const handleCalculateRoute = async () => {
        if (!origin.trim() || !destination.trim()) return;

        setIsLoadingDistance(true);
        setDistanceError(null);
        setCalculatedDistance(null);

        try {
            const result: DistanceResult = await getDistance(origin, destination);
            if (result.distance !== null && result.distance > 0) {
                setCalculatedDistance(result.distance);
            } else {
                setDistanceError("Não foi possível localizar uma rota precisa.");
            }
        } catch (error) {
            setDistanceError("Erro ao acessar serviço de mapas.");
        } finally {
            setIsLoadingDistance(false);
        }
    };

    const handlePriceSave = () => {
        const val = parseFloat(localPriceInput.trim().replace(',', '.'));
        if (!isNaN(val)) {
            setPricePerKm(val);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        }
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
           
            {isAdmin && (
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 border-l-[12px] border-l-blue-600 animate-in slide-in-from-top-6 duration-500">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 items-start">
                    <div className="lg:col-span-2">
                      <div className="flex items-center mb-6">
                        <div className="p-3 bg-blue-100 rounded-2xl mr-4">
                            <CarIcon className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest">Consulta de Rota (Google Maps)</h2>
                        <span className="ml-4 bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">Exclusivo Admin</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <LocationAutocompleteInput label="Partida" value={origin} onChange={setOrigin} placeholder="Origem..." />
                          <LocationAutocompleteInput label="Destino" value={destination} onChange={setDestination} placeholder="Cidade ou Local..." />
                      </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200">
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
                  
                  <div className="flex flex-col items-center">
                      <button onClick={handleCalculateRoute} disabled={isLoadingDistance} className={`w-full md:w-auto px-16 py-5 rounded-2xl text-base font-black text-white uppercase shadow-2xl active:scale-95 transition-all flex items-center justify-center space-x-3 ${isLoadingDistance ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                          {isLoadingDistance ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <MapPinIcon className="w-6 h-6" />}
                          <span>{isLoadingDistance ? 'Localizando...' : 'Consultar Distância Oficial'}</span>
                      </button>
                      
                      {distanceError && <div className="mt-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-red-600 text-sm font-black uppercase tracking-widest">{distanceError}</div>}
                      
                      {calculatedDistance !== null && (
                          <div className="mt-10 w-full max-w-4xl animate-in zoom-in">
                              <div className="bg-gray-900 rounded-[50px] p-12 shadow-2xl border-8 border-white ring-12 ring-gray-100 text-center">
                                  <span className="text-blue-400 text-xs font-black uppercase tracking-widest mb-1 block">Distância: {calculatedDistance.toFixed(1).replace('.', ',')} KM</span>
                                  <span className="text-yellow-400 text-sm font-black uppercase tracking-widest mb-2 block">VALOR ESTIMADO DA CORRIDA</span>
                                  <p className="text-7xl font-black text-white">R$ {(calculatedDistance * pricePerKm).toFixed(2).replace('.', ',')}</p>
                              </div>
                          </div>
                      )}
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
                        <div className="flex items-center space-x-3">
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
                                    <td colSpan={isAdmin ? 4 : 3} className="p-32 text-center text-gray-400 text-lg font-black uppercase tracking-widest opacity-30 italic">Nenhum destino na tabela</td>
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
