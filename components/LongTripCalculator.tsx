
import React, { useState, useEffect, useRef } from 'react';
import type { LongTrip, DistanceResult } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { MapPinIcon } from './icons/MapPinIcon';
import { CarIcon } from './icons/CarIcon';
import { XIcon } from './icons/XIcon';
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
        <h2 className="text-2xl font-black mb-8 text-gray-800 uppercase tracking-tight">Novo Destino Fixo</h2>
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
            <button type="submit" className="px-8 py-4 text-sm font-black bg-yellow-400 text-gray-900 rounded-2xl hover:bg-yellow-500 transition-colors shadow-lg uppercase tracking-widest">Confirmar</button>
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

    const [origin, setOrigin] = useState('Aeroporto Internacional de Confins - Tancredo Neves');
    const [destination, setDestination] = useState('');
    const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
    const [isLoadingDistance, setIsLoadingDistance] = useState(false);
    const [distanceError, setDistanceError] = useState<string | null>(null);

    const isFiltered = searchTerm !== '' || kmSearchTerm !== '';

    // Encontrar se o destino atual já existe na tabela fixa para comparação
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
                // Se o usuário já estiver pesquisando por nome, mantemos o nome e preenchemos o KM apenas para destacar
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
                alert("Tabela atualizada com sucesso!");
            }
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

    return (
        <div className="space-y-10">
            {isModalOpen && <LongTripModal key={editingTrip?.id || 'new'} trip={editingTrip} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
           
            {/* Calculadora Dinâmica - EXCLUSIVA PARA ADMIN */}
            {isAdmin && (
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 border-l-[12px] border-l-blue-600 animate-in slide-in-from-top-6 duration-500">
                  <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-2xl mr-4">
                            <CarIcon className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest">Painel de Cálculo Inteligente</h2>
                      </div>
                      {isLoadingDistance && (
                        <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-full text-blue-600 text-sm font-black animate-pulse">
                          <span>IA CALCULANDO</span>
                        </div>
                      )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                      <LocationAutocompleteInput 
                          label="Ponto de Partida" 
                          value={origin} 
                          onChange={setOrigin} 
                          placeholder="Endereço ou local de saída..." 
                          onUseCurrentLocation={handleUseCurrentLocation}
                      />
                      <LocationAutocompleteInput 
                          label="Destino Final" 
                          value={destination} 
                          onChange={setDestination} 
                          placeholder="Cidade ou local de chegada..." 
                      />
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
                          <span>{isLoadingDistance ? 'Calculando Rota...' : 'Calcular com Google Maps'}</span>
                      </button>
                      
                      {distanceError && (
                        <div className="mt-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl w-full max-w-md">
                          <p className="text-red-600 text-sm font-black text-center uppercase tracking-widest">{distanceError}</p>
                        </div>
                      )}
                      
                      {calculatedDistance !== null && (
                          <div className="mt-10 w-full max-w-4xl space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                                  {/* Card do Google Maps */}
                                  <div className="bg-gray-50 p-8 rounded-[40px] border-2 border-blue-100 shadow-inner">
                                      <span className="text-blue-500 text-xs font-black uppercase tracking-widest mb-1 block">Google Maps (Tempo Real)</span>
                                      <span className="text-5xl font-black text-gray-800">{calculatedDistance.toFixed(1).replace('.', ',')} KM</span>
                                      <p className="mt-4 text-sm text-gray-500 font-bold uppercase">Valor: R$ {(calculatedDistance * pricePerKm).toFixed(2).replace('.', ',')}</p>
                                  </div>

                                  {/* Card de Comparação com Tabela Fixa */}
                                  <div className={`p-8 rounded-[40px] border-2 flex flex-col justify-center ${matchedSavedTrip ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                                      <span className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1 block">Tabela Fixa Cadastrada</span>
                                      {matchedSavedTrip ? (
                                          <div>
                                              <span className="text-3xl font-black text-gray-800">{matchedSavedTrip.kilometers.toFixed(1).replace('.', ',')} KM</span>
                                              <div className="mt-2 flex items-center space-x-2">
                                                  {Math.abs(calculatedDistance - matchedSavedTrip.kilometers) > 5 ? (
                                                      <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Divergência: {(calculatedDistance - matchedSavedTrip.kilometers).toFixed(1)} KM</span>
                                                  ) : (
                                                      <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Dados Batem</span>
                                                  )}
                                              </div>
                                              {isAdmin && (
                                                  <button 
                                                      onClick={handleSyncWithGPS}
                                                      className="mt-4 w-full bg-yellow-400 text-gray-900 py-3 rounded-xl text-xs font-black uppercase hover:bg-yellow-500 shadow-sm"
                                                  >
                                                      Sincronizar Tabela
                                                  </button>
                                              )}
                                          </div>
                                      ) : (
                                          <p className="text-sm text-gray-400 font-bold uppercase italic mt-2">Destino não encontrado na tabela fixa.</p>
                                      )}
                                  </div>
                              </div>

                              <div className="bg-green-600 rounded-[50px] p-12 shadow-2xl border-8 border-white ring-12 ring-green-50 animate-in zoom-in duration-500">
                                  <span className="text-white/80 text-sm font-black uppercase tracking-widest mb-2 block">Orçamento Final Sugerido</span>
                                  <p className="text-7xl font-black text-white drop-shadow-lg">R$ {(calculatedDistance * pricePerKm).toFixed(2).replace('.', ',')}</p>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
            )}

            {/* Listagem Fixa para todos os usuários com BUSCA APRIMORADA */}
            <div className="space-y-6">
                <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center">
                            <div className="w-2 h-8 bg-yellow-400 rounded-full mr-4"></div>
                            <div>
                                <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest">Tabela de Viagens Longas</h2>
                                <p className="text-[11px] text-gray-400 font-bold uppercase mt-0.5">Consulte destinos fixos e valores pré-definidos</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className="bg-yellow-100 text-yellow-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-tighter">
                                {longTrips.length} {longTrips.length === 1 ? 'Destino Encontrado' : 'Destinos Encontrados'}
                            </span>
                            {isFiltered && (
                                <button 
                                    onClick={clearFilters}
                                    className="text-[11px] font-black text-red-500 uppercase hover:underline flex items-center"
                                >
                                    <XIcon className="w-3.5 h-3.5 mr-1" /> Limpar Filtros
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                        <div className="xl:col-span-7 relative">
                             <span className="absolute inset-y-0 left-0 pl-5 flex items-center text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Pesquisar por cidade ou destino..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pr-12 pl-14 py-5 text-lg border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-400 outline-none bg-gray-50 font-medium shadow-inner placeholder:text-gray-300"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600">
                                    <XIcon className="w-6 h-6" />
                                </button>
                            )}
                        </div>
                        <div className="xl:col-span-3 relative">
                            <input
                                type="text"
                                placeholder="KM..."
                                value={kmSearchTerm}
                                onChange={(e) => setKmSearchTerm(e.target.value)}
                                className="w-full pr-12 pl-6 py-5 text-lg border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-400 outline-none bg-gray-50 font-black shadow-inner placeholder:text-gray-300"
                            />
                            {kmSearchTerm && (
                                <button onClick={() => setKmSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600">
                                    <XIcon className="w-6 h-6" />
                                </button>
                            )}
                        </div>
                        <div className="xl:col-span-2">
                            {isAdmin && (
                                <button
                                    onClick={() => { setEditingTrip(null); setIsModalOpen(true); }}
                                    className="w-full bg-yellow-400 text-gray-900 font-black py-5 rounded-2xl text-sm uppercase hover:bg-yellow-500 shadow-lg flex items-center justify-center transition-transform active:scale-95"
                                >
                                    <PlusIcon className="w-5 h-5 mr-2" /> Novo
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="hidden md:table-header-group bg-gray-50/50">
                            <tr>
                                <th className="px-8 py-6 text-sm font-black text-gray-400 uppercase tracking-widest">Cidade de Destino</th>
                                <th className="px-8 py-6 text-sm font-black text-gray-400 uppercase tracking-widest">Distância</th>
                                <th className="px-8 py-6 text-sm font-black text-gray-400 uppercase tracking-widest">Valor Estimado</th>
                                {isAdmin && <th className="px-8 py-6 text-right">Ações</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {longTrips.length > 0 ? longTrips.map((trip) => {
                                // Alerta visual de divergência se o GPS estiver ativo e for para este destino
                                const hasDivergence = calculatedDistance && 
                                    (trip.city.toLowerCase().includes(destination.toLowerCase()) || destination.toLowerCase().includes(trip.city.toLowerCase())) &&
                                    Math.abs(calculatedDistance - trip.kilometers) > 5;

                                return (
                                    <tr key={trip.id} className={`block md:table-row hover:bg-yellow-50/20 transition-colors ${hasDivergence ? 'bg-red-50/30' : ''}`}>
                                        <td className="p-6 md:px-8 md:py-6 block md:table-cell">
                                            <div className="flex justify-between items-center md:block">
                                                <span className="font-bold text-xs text-gray-400 md:hidden uppercase">Destino</span>
                                                <div className="flex items-center">
                                                    <span className="text-lg font-black text-gray-800 uppercase tracking-tight">{trip.city}</span>
                                                    {hasDivergence && (
                                                        <span title="Divergência detectada com o GPS" className="ml-2 text-red-500 animate-pulse">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-2 md:px-8 md:py-6 block md:table-cell">
                                            <div className="flex justify-between items-center md:block">
                                                <span className="font-bold text-xs text-gray-400 md:hidden uppercase">Distância</span>
                                                <span className={`text-base font-bold ${hasDivergence ? 'text-red-600' : 'text-gray-600'}`}>
                                                    {trip.kilometers.toFixed(1).replace('.', ',')} KM
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6 md:px-8 md:py-6 block md:table-cell bg-yellow-50/10 md:bg-transparent">
                                            <div className="flex justify-between items-center md:block">
                                                <span className="font-bold text-xs text-gray-400 md:hidden uppercase">Valor</span>
                                                <span className="text-xl text-gray-900 font-black">R$ {(trip.kilometers * pricePerKm).toFixed(2).replace('.', ',')}</span>
                                            </div>
                                        </td>
                                        {isAdmin && (
                                            <td className="px-6 py-4 md:px-8 md:py-6 block md:table-cell text-right">
                                                <div className="flex items-center justify-end space-x-4">
                                                    {hasDivergence && (
                                                        <button 
                                                            onClick={handleSyncWithGPS}
                                                            className="p-3 text-green-600 hover:bg-green-100 rounded-2xl transition-all"
                                                            title="Sincronizar com GPS"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    <button onClick={() => { setEditingTrip(trip); setIsModalOpen(true); }} className="p-3 text-blue-500 hover:bg-blue-100 rounded-2xl transition-all"><PencilIcon className="w-6 h-6" /></button>
                                                    <button onClick={() => { if (confirm('Excluir destino?')) onDeleteLongTrip(trip.id); }} className="p-3 text-red-500 hover:bg-red-100 rounded-2xl transition-all"><TrashIcon className="w-6 h-6" /></button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={isAdmin ? 4 : 3} className="p-24 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="bg-gray-50 p-6 rounded-full mb-4">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <p className="text-gray-400 text-lg font-medium italic">Nenhum destino encontrado com esses filtros.</p>
                                            <button onClick={clearFilters} className="mt-4 text-blue-500 font-black uppercase text-xs hover:underline">Ver todos os destinos</button>
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
