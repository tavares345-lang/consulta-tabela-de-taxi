
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
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-tighter">{label}</label>
            {onUseCurrentLocation && (
                <button 
                    onClick={(e) => { e.preventDefault(); onUseCurrentLocation(); }}
                    className="text-[11px] font-black text-blue-600 uppercase hover:text-blue-800 flex items-center bg-blue-50 px-3 py-1 rounded-full transition-colors"
                >
                    <MapPinIcon className="w-3.5 h-3.5 mr-1" /> GPS
                </button>
            )}
        </div>
        <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <MapPinIcon className="w-4 h-4" />
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
                className="w-full pl-10 pr-10 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none bg-gray-50 shadow-sm"
                autoComplete="off"
            />
            {value && (
              <button 
                  onClick={() => onChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-gray-500"
              >
                  <XIcon className="w-4 h-4" />
              </button>
            )}
        </div>
        
        {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-30 w-full bg-white mt-2 rounded-xl shadow-2xl max-h-60 overflow-y-auto border border-gray-100 animate-in fade-in zoom-in duration-150">
                <ul>
                    {suggestions.map((suggestion, index) => (
                        <li 
                            key={index}
                            onMouseDown={(e) => { e.preventDefault(); handleSelect(suggestion); }}
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b last:border-b-0 border-gray-50 font-medium"
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-in zoom-in duration-200">
        <h2 className="text-xl font-black mb-6 text-gray-800">CADASTRAR DESTINO</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Cidade/Destino</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Ex: Rio de Janeiro" className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm" required />
          </div>
          <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Distância (KM)</label>
              <input type="number" name="kilometers" value={formData.kilometers} onChange={handleChange} placeholder="0" className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm font-bold" step="0.1" required />
          </div>
          <div className="flex justify-end space-x-3 pt-6">
            <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors uppercase">Cancelar</button>
            <button type="submit" className="px-6 py-3 text-sm font-black bg-yellow-400 text-gray-900 rounded-xl hover:bg-yellow-500 transition-colors shadow-md uppercase">Salvar Destino</button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface LongTripCalculatorProps {
  longTrips: LongTrip[];
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
    longTrips, isAdmin, pricePerKm, setPricePerKm, searchTerm, setSearchTerm, 
    kmSearchTerm, setKmSearchTerm,
    onAddLongTrip, onUpdateLongTrip, onDeleteLongTrip 
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTrip, setEditingTrip] = useState<LongTrip | null>(null);

    const [origin, setOrigin] = useState('Aeroporto Internacional de Confins - Tancredo Neves');
    const [destination, setDestination] = useState('');
    const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
    const [sources, setSources] = useState<{ title: string; uri: string }[]>([]);
    const [isLoadingDistance, setIsLoadingDistance] = useState(false);
    const [distanceError, setDistanceError] = useState<string | null>(null);

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Seu navegador não suporta geolocalização.");
            return;
        }

        setIsLoadingDistance(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setOrigin(`${latitude}, ${longitude}`);
                setIsLoadingDistance(false);
            },
            (error) => {
                let msg = "Não foi possível obter sua localização.";
                if (error.code === 1) msg = "Permissão de localização negada.";
                alert(msg);
                setIsLoadingDistance(false);
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    const handleCalculateRoute = async () => {
        if (!origin.trim() || !destination.trim()) return;
        setIsLoadingDistance(true);
        setDistanceError(null);
        setCalculatedDistance(null);
        setSources([]);

        try {
            const result: DistanceResult = await getDistance(origin, destination);
            if (result.distance !== null && result.distance > 0) {
                setCalculatedDistance(result.distance);
                setSources(result.sources || []);
            } else {
                setDistanceError("Distância não encontrada. Tente refinar os endereços.");
            }
        } catch (error) {
            setDistanceError("Falha na conexão com o serviço de mapas.");
        } finally {
            setIsLoadingDistance(false);
        }
    };

    const handleSave = (trip: LongTrip) => {
        if (editingTrip) onUpdateLongTrip(trip);
        else onAddLongTrip(trip);
        setIsModalOpen(false);
        setEditingTrip(null);
    };

    return (
        <div className="space-y-6">
            {isModalOpen && <LongTripModal key={editingTrip?.id || 'new'} trip={editingTrip} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
           
            {/* Seção de Cálculo Dinâmico - APENAS ADMIN */}
            {isAdmin && (
              <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 border-l-8 border-l-blue-600">
                  <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                            <CarIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-base font-black text-gray-800 uppercase tracking-widest">Calculadora Inteligente</h2>
                      </div>
                      {isLoadingDistance && (
                        <div className="flex items-center space-x-1.5 px-3 py-1 bg-blue-50 rounded-full text-blue-600 text-xs font-bold animate-pulse">
                          <span>PROCESSANDO</span>
                        </div>
                      )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <LocationAutocompleteInput 
                          label="Ponto de Partida" 
                          value={origin} 
                          onChange={setOrigin} 
                          placeholder="Digite o endereço de origem..." 
                          onUseCurrentLocation={handleUseCurrentLocation}
                      />
                      <LocationAutocompleteInput 
                          label="Destino da Viagem" 
                          value={destination} 
                          onChange={setDestination} 
                          placeholder="Digite a cidade ou local..." 
                      />
                  </div>
                  
                  <div className="flex flex-col items-center">
                      <button 
                          onClick={handleCalculateRoute}
                          disabled={isLoadingDistance}
                          className={`w-full md:w-auto px-12 py-4 rounded-2xl text-sm font-black text-white uppercase shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-2 ${isLoadingDistance ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                          {isLoadingDistance ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Calculando KM...</span>
                              </>
                          ) : (
                              <>
                                <MapPinIcon className="w-4 h-4" />
                                <span>Calcular Valor via Google Maps</span>
                              </>
                          )}
                      </button>
                      
                      {distanceError && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl w-full max-w-md">
                          <p className="text-red-600 text-xs font-bold text-center uppercase tracking-wide">{distanceError}</p>
                        </div>
                      )}
                      
                      {calculatedDistance !== null && (
                          <div className="mt-8 text-center animate-in slide-in-from-bottom-6 duration-500 w-full max-w-lg">
                              <div className="inline-flex flex-col items-center mb-4">
                                  <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Distância Rodoviária</span>
                                  <span className="text-2xl font-black text-gray-800">{calculatedDistance.toFixed(1).replace('.', ',')} KM</span>
                              </div>
                              
                              <div className="bg-green-50 rounded-3xl p-6 border-2 border-green-100 shadow-inner">
                                  <span className="text-green-600 text-xs font-black uppercase tracking-widest mb-2 block">Valor Total Estimado</span>
                                  <p className="text-5xl font-black text-green-700 drop-shadow-sm">R$ {(calculatedDistance * pricePerKm).toFixed(2).replace('.', ',')}</p>
                              </div>

                              {/* NOVO LAYOUT DE FONTES / GROUNDING */}
                              {sources.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-gray-100 text-left">
                                    <div className="flex items-center mb-3">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Confirmação de Trajeto</h3>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {sources.map((source, idx) => (
                                            <a 
                                                key={idx} 
                                                href={source.uri} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center p-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all group shadow-sm"
                                            >
                                                <div className="p-2 bg-white rounded-lg border border-gray-200 mr-3 group-hover:border-blue-200 shadow-sm transition-colors">
                                                    <MapPinIcon className="w-5 h-5 text-blue-500" />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-[13px] font-black text-gray-700 truncate group-hover:text-blue-700 transition-colors uppercase">{source.title}</p>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Ver no Google Maps</span>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                              )}
                          </div>
                      )}
                  </div>
              </div>
            )}

            {/* Cabeçalho da Listagem com Filtros Duplos */}
            <div className="flex flex-col xl:flex-row justify-between items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center">
                    <div className="w-1.5 h-6 bg-yellow-400 rounded-full mr-3"></div>
                    <h2 className="text-base font-black text-gray-800 uppercase tracking-widest">Destinos Frequentes</h2>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                    {/* Busca por Cidade */}
                    <div className="relative flex-1 sm:w-64">
                        <input
                            type="text"
                            placeholder="Buscar destino salvo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pr-10 pl-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none bg-gray-50"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-gray-600"
                            >
                                <XIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {/* Busca por KM */}
                    <div className="relative flex-1 sm:w-40">
                        <input
                            type="text"
                            placeholder="KM..."
                            value={kmSearchTerm}
                            onChange={(e) => setKmSearchTerm(e.target.value)}
                            className="w-full pr-10 pl-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none bg-gray-50 font-black"
                        />
                        {kmSearchTerm && (
                            <button 
                                onClick={() => setKmSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-gray-600"
                            >
                                <XIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => { setEditingTrip(null); setIsModalOpen(true); }}
                            className="bg-yellow-400 text-gray-900 font-black px-4 py-3 rounded-xl text-xs uppercase hover:bg-yellow-500 shadow-md flex items-center transition-transform active:scale-95"
                        >
                            <PlusIcon className="w-4 h-4 mr-2" /> Novo
                        </button>
                    )}
                </div>
            </div>

            {isAdmin && (
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="flex flex-col">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Taxa Base p/ Viagens Longas (Admin)</label>
                        <span className="text-[10px] text-blue-500 font-bold uppercase">Ajuste o valor por KM rodado</span>
                    </div>
                    <div className="flex items-center border-2 border-yellow-100 rounded-xl overflow-hidden bg-yellow-50 px-3">
                        <span className="text-sm text-yellow-600 font-black mr-2">R$</span>
                        <input
                            type="number"
                            value={pricePerKm}
                            onChange={(e) => setPricePerKm(parseFloat(e.target.value) || 0)}
                            className="w-20 py-3 text-sm font-black bg-transparent outline-none text-gray-800"
                            step="0.01"
                        />
                    </div>
                </div>
            )}

            {/* Tabela de Viagens Longas */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="hidden md:table-header-group bg-gray-50/80">
                        <tr>
                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Cidade/Destino</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Distância</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Preço Estimado</th>
                            {isAdmin && <th className="px-6 py-4"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {longTrips.length > 0 ? longTrips.map((trip) => (
                            <tr key={trip.id} className="block md:table-row hover:bg-yellow-50/30 transition-colors">
                                <td className="p-4 md:px-6 md:py-4 block md:table-cell">
                                    <div className="flex justify-between items-center md:block">
                                        <span className="font-bold text-xs text-gray-400 md:hidden uppercase">Destino</span>
                                        <span className="text-sm font-black text-gray-800 uppercase tracking-tight">{trip.city}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-2 md:px-6 md:py-4 block md:table-cell">
                                    <div className="flex justify-between items-center md:block">
                                        <span className="font-bold text-xs text-gray-400 md:hidden uppercase">Distância</span>
                                        <span className="text-sm text-gray-600 font-bold">{trip.kilometers.toFixed(1).replace('.', ',')} KM</span>
                                    </div>
                                </td>
                                <td className="p-4 md:px-6 md:py-4 block md:table-cell bg-yellow-50/20 md:bg-transparent rounded-b-xl md:rounded-none border-t md:border-t-0 mt-2 md:mt-0">
                                    <div className="flex justify-between items-center md:block">
                                        <span className="font-bold text-xs text-gray-400 md:hidden uppercase">Preço</span>
                                        <span className="text-base text-gray-900 font-black">R$ {(trip.kilometers * pricePerKm).toFixed(2).replace('.', ',')}</span>
                                    </div>
                                </td>
                                {isAdmin && (
                                    <td className="px-4 py-3 md:px-6 md:py-4 block md:table-cell text-right">
                                        <div className="flex items-center justify-end space-x-3">
                                            <button 
                                                onClick={() => { setEditingTrip(trip); setIsModalOpen(true); }} 
                                                className="p-2 text-blue-500 hover:bg-blue-100 rounded-xl transition-all"
                                                title="Editar"
                                            >
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => { if (window.confirm('Excluir destino salvo?')) onDeleteLongTrip(trip.id); }} 
                                                className="p-2 text-red-500 hover:bg-red-100 rounded-xl transition-all"
                                                title="Excluir"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        )) : (
                            <tr><td colSpan={isAdmin ? 4 : 3} className="p-16 text-center text-gray-400 text-sm font-medium italic">Nenhum registro encontrado para a busca.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LongTripCalculator;
