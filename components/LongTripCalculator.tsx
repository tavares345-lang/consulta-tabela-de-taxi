
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
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{label}</label>
        <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-300">
                <MapPinIcon className="w-3.5 h-3.5" />
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
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-gray-50"
                autoComplete="off"
            />
            {value && (
              <button 
                  onClick={() => onChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-gray-500"
              >
                  <XIcon className="w-3 h-3" />
              </button>
            )}
        </div>
        
        {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-30 w-full bg-white mt-1 rounded-lg shadow-xl max-h-48 overflow-y-auto border border-gray-100 animate-in fade-in zoom-in duration-150">
                <ul>
                    {suggestions.map((suggestion, index) => (
                        <li 
                            key={index}
                            onMouseDown={(e) => { e.preventDefault(); handleSelect(suggestion); }}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-[11px] text-gray-700 border-b last:border-b-0 border-gray-50"
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
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm animate-in zoom-in duration-200">
        <h2 className="text-lg font-bold mb-4 text-gray-800">{trip ? 'Editar Viagem' : 'Nova Viagem'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Cidade/Destino</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Ex: Rio de Janeiro" className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none" required />
          </div>
          <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Distância (KM)</label>
              <input type="number" name="kilometers" value={formData.kilometers} onChange={handleChange} placeholder="0" className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none" step="0.1" required />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-xs font-bold bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 transition-colors shadow-sm">Salvar</button>
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
  onAddLongTrip: (trip: LongTrip) => void;
  onUpdateLongTrip: (trip: LongTrip) => void;
  onDeleteLongTrip: (id: string) => void;
}

const LongTripCalculator: React.FC<LongTripCalculatorProps> = ({ 
    longTrips, isAdmin, pricePerKm, setPricePerKm, searchTerm, setSearchTerm, 
    onAddLongTrip, onUpdateLongTrip, onDeleteLongTrip 
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTrip, setEditingTrip] = useState<LongTrip | null>(null);

    const [origin, setOrigin] = useState('Aeroporto Internacional de Confins - Tancredo Neves');
    const [destination, setDestination] = useState('');
    const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
    const [isLoadingDistance, setIsLoadingDistance] = useState(false);
    const [distanceError, setDistanceError] = useState<string | null>(null);

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
                setDistanceError("Distância não encontrada.");
            }
        } catch (error) {
            setDistanceError("Erro no cálculo.");
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
        <div className="space-y-4">
            {isModalOpen && <LongTripModal key={editingTrip?.id || 'new'} trip={editingTrip} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
           
            {/* Seção de Cálculo Dinâmico */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 border-l-4 border-l-blue-500">
                <div className="flex items-center mb-4">
                    <CarIcon className="w-5 h-5 text-blue-500 mr-2" />
                    <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest">Calculadora de Rota</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <LocationAutocompleteInput label="Origem" value={origin} onChange={setOrigin} placeholder="Ex: Confins..." />
                    <LocationAutocompleteInput label="Destino" value={destination} onChange={setDestination} placeholder="Ex: Ipatinga..." />
                </div>
                <div className="flex flex-col items-center">
                    <button 
                        onClick={handleCalculateRoute}
                        disabled={isLoadingDistance}
                        className={`w-full md:w-auto px-6 py-2 rounded-full text-xs font-black text-white uppercase shadow-sm active:scale-95 transition-all ${isLoadingDistance ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {isLoadingDistance ? 'Calculando...' : 'Calcular Valor'}
                    </button>
                    {distanceError && <p className="mt-2 text-red-500 text-[10px] font-bold">{distanceError}</p>}
                    {calculatedDistance !== null && (
                        <div className="mt-4 text-center animate-in slide-in-from-bottom-2 duration-300">
                            <p className="text-gray-400 text-[9px] uppercase font-black tracking-widest mb-0.5">KM: {calculatedDistance.toFixed(1).replace('.', ',')}</p>
                            <p className="text-2xl font-black text-green-600">R$ {(calculatedDistance * pricePerKm).toFixed(2).replace('.', ',')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Cabeçalho da Listagem */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest">Viagens Longas</h2>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-56">
                        <input
                            type="text"
                            placeholder="Buscar cidade..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pr-8 pl-3 py-2 text-xs border border-gray-100 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none bg-gray-50"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-gray-600"
                            >
                                <XIcon className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => { setEditingTrip(null); setIsModalOpen(true); }}
                            className="bg-yellow-400 text-gray-900 font-black px-3 py-2 rounded-lg text-[10px] uppercase hover:bg-yellow-500 shadow-sm"
                        >
                            <PlusIcon className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {isAdmin && (
                <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preço/KM</label>
                    <div className="flex items-center border border-gray-100 rounded-lg overflow-hidden bg-gray-50 px-2">
                        <span className="text-[10px] text-gray-400 font-bold mr-1">R$</span>
                        <input
                            type="number"
                            value={pricePerKm}
                            onChange={(e) => setPricePerKm(parseFloat(e.target.value) || 0)}
                            className="w-14 py-1.5 text-xs font-black bg-transparent outline-none text-gray-700"
                            step="0.01"
                        />
                    </div>
                </div>
            )}

            {/* Tabela de Viagens Longas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="hidden md:table-header-group bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase">Cidade</th>
                            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase">KM</th>
                            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase">Valor</th>
                            {isAdmin && <th className="px-4 py-3"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {longTrips.length > 0 ? longTrips.map((trip) => (
                            <tr key={trip.id} className="block md:table-row hover:bg-yellow-50/20">
                                <td className="p-3 md:px-4 md:py-3 block md:table-cell">
                                    <div className="flex justify-between items-center md:block">
                                        <span className="font-bold text-[9px] text-gray-400 md:hidden uppercase">Cidade</span>
                                        <span className="text-xs font-bold text-gray-800">{trip.city}</span>
                                    </div>
                                </td>
                                <td className="px-3 py-1 md:px-4 md:py-3 block md:table-cell">
                                    <div className="flex justify-between items-center md:block">
                                        <span className="font-bold text-[9px] text-gray-400 md:hidden uppercase">KM</span>
                                        <span className="text-[10px] text-gray-500 font-medium">{trip.kilometers.toFixed(1).replace('.', ',')} km</span>
                                    </div>
                                </td>
                                <td className="p-3 md:px-4 md:py-3 block md:table-cell bg-yellow-50/30 md:bg-transparent rounded-b-lg md:rounded-none">
                                    <div className="flex justify-between items-center md:block">
                                        <span className="font-bold text-[9px] text-gray-400 md:hidden uppercase">Valor</span>
                                        <span className="text-sm text-gray-900 font-black">R$ {(trip.kilometers * pricePerKm).toFixed(2).replace('.', ',')}</span>
                                    </div>
                                </td>
                                {isAdmin && (
                                    <td className="px-3 py-2 md:px-4 md:py-3 block md:table-cell text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button 
                                                onClick={() => { setEditingTrip(trip); setIsModalOpen(true); }} 
                                                className="p-1 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <PencilIcon className="w-3.5 h-3.5" />
                                            </button>
                                            <button 
                                                onClick={() => { if (window.confirm('Excluir?')) onDeleteLongTrip(trip.id); }} 
                                                className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <TrashIcon className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        )) : (
                            <tr><td colSpan={isAdmin ? 4 : 3} className="p-10 text-center text-gray-400 text-xs italic">Nenhuma viagem listada.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LongTripCalculator;
