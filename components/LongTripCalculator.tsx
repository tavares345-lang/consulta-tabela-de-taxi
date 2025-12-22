
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
  "Aeroporto da Pampulha - Carlos Drummond de Andrade",
  "Rodoviária de Belo Horizonte",
  "Shopping Cidade, Belo Horizonte",
  "BH Shopping, Belvedere",
  "Diamond Mall, Lourdes",
  "Minas Shopping, Belo Horizonte",
  "Shopping Del Rey, Pampulha",
  "Shopping Estação BH",
  "Expominas, Gameleira",
  "Mineirão - Estádio Governador Magalhães Pinto",
  "Praça da Liberdade, Savassi",
  "Praça Sete de Setembro, Centro",
  "Mercado Central de Belo Horizonte",
  "Cidade Administrativa de Minas Gerais",
  "Inhotim, Brumadinho",
  "Savassi, Belo Horizonte",
  "Lourdes, Belo Horizonte",
  "Belvedere, Belo Horizonte",
  "Centro, Belo Horizonte",
  "Centro, Contagem",
  "Eldorado, Contagem",
  "Shopping Contagem",
  "Centro, Betim",
  "Partage Shopping Betim",
  "Centro, Nova Lima",
  "Vila da Serra, Nova Lima",
  "Lagoa Santa",
  "Vespasiano",
  "Santa Luzia",
  "Sabará",
  "Ibirité",
  "Ribeirão das Neves"
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
      setSuggestions(POPULAR_LOCATIONS.slice(0, 5));
    } else {
      const filtered = POPULAR_LOCATIONS.filter(loc => 
        loc.toLowerCase().includes(value.toLowerCase()) && 
        loc.toLowerCase() !== value.toLowerCase()
      );
      setSuggestions(filtered);
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
  }, [wrapperRef]);

  const handleSelect = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{label}</label>
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
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all bg-gray-50"
                autoComplete="off"
                inputMode="search"
            />
        </div>
        
        {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-30 w-full bg-white mt-1 rounded-lg shadow-xl max-h-60 overflow-y-auto border border-gray-100">
                <ul>
                    {suggestions.map((suggestion, index) => (
                        <li 
                            key={index}
                            onMouseDown={(e) => { e.preventDefault(); handleSelect(suggestion); }}
                            className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b last:border-b-0 border-gray-50 transition-colors"
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

const LongTripModal: React.FC<{
  trip: LongTrip | null;
  onSave: (trip: LongTrip) => void;
  onClose: () => void;
}> = ({ trip, onSave, onClose }) => {
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
      id: trip?.id || new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">{trip ? 'Editar Viagem' : 'Adicionar Viagem'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cidade</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Ex: Rio de Janeiro" className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none" required />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Distância (KM)</label>
                <input type="number" name="kilometers" value={formData.kilometers} onChange={handleChange} placeholder="0" className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none" step="0.1" required />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 rounded-lg font-bold hover:bg-gray-200 transition">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm bg-yellow-400 text-gray-900 rounded-lg font-bold hover:bg-yellow-500 transition">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
            setDistanceError("Erro ao calcular rota.");
        } finally {
            setIsLoadingDistance(false);
        }
    };

    return (
        <div className="bg-transparent">
           {isModalOpen && <LongTripModal trip={editingTrip} onSave={(trip) => {
               if(editingTrip) onUpdateLongTrip(trip);
               else onAddLongTrip(trip);
               setIsModalOpen(false);
               setEditingTrip(null);
           }} onClose={() => setIsModalOpen(false)} />}
           
            {/* Calculadora - Apenas Admins */}
            {isAdmin && (
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 border-l-4 border-blue-500 border border-gray-100">
                    <div className="flex items-center mb-4">
                        <CarIcon className="w-6 h-6 text-blue-500 mr-2" />
                        <h2 className="text-lg font-bold text-gray-800 tracking-tight">Calculadora de Rota</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <LocationAutocompleteInput label="Origem" value={origin} onChange={setOrigin} placeholder="Origem..." />
                        <LocationAutocompleteInput label="Destino" value={destination} onChange={setDestination} placeholder="Destino..." />
                    </div>
                    <div className="flex flex-col items-center">
                        <button 
                            onClick={handleCalculateRoute}
                            disabled={isLoadingDistance}
                            className={`w-full md:w-auto px-6 py-2.5 rounded-full text-sm font-bold text-white transition-all shadow-sm active:scale-95 ${isLoadingDistance ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {isLoadingDistance ? 'Calculando...' : 'Calcular Valor'}
                        </button>
                        {distanceError && <p className="mt-2 text-red-500 text-xs font-bold">{distanceError}</p>}
                        {calculatedDistance !== null && (
                            <div className="mt-4 text-center animate-in fade-in slide-in-from-top-2 duration-300">
                                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-0.5">Distância: {calculatedDistance.toFixed(1).replace('.', ',')} km</p>
                                <p className="text-3xl font-black text-green-600">R$ {(calculatedDistance * pricePerKm).toFixed(2).replace('.', ',')}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex flex-col xl:flex-row justify-between items-center mb-4 gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-black text-gray-800 shrink-0">Viagens Longas</h2>
                <div className="w-full xl:w-auto flex flex-col sm:flex-row items-center gap-2">
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Buscar cidade..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pr-8 pl-4 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-gray-50"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                <XIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => { setEditingTrip(null); setIsModalOpen(true); }}
                            className="flex items-center justify-center bg-yellow-400 text-gray-900 font-bold py-2 px-4 rounded-full hover:bg-yellow-500 shadow-sm text-sm whitespace-nowrap"
                        >
                            <PlusIcon className="w-4 h-4 mr-1" />
                            Add
                        </button>
                    )}
                </div>
            </div>

            {isAdmin && (
                <div className="mb-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Valor por KM (Admin)</label>
                    <div className="flex items-center">
                        <span className="mr-2 text-gray-500 font-black text-sm">R$</span>
                        <input
                            type="number"
                            value={pricePerKm}
                            onChange={(e) => setPricePerKm(parseFloat(e.target.value) || 0)}
                            className="w-24 p-1.5 text-base border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none font-bold"
                            step="0.01"
                        />
                    </div>
                </div>
            )}

            <div className="md:bg-white md:rounded-xl md:shadow-sm overflow-hidden">
                <table className="min-w-full">
                    <thead className="hidden md:table-header-group bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Cidade</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">KM</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Valor</th>
                            {isAdmin && <th className="px-6 py-3"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {longTrips.length > 0 ? longTrips.map((trip) => (
                            <tr key={trip.id} className="block md:table-row mb-3 md:mb-0 bg-white rounded-lg shadow-sm md:shadow-none hover:bg-yellow-50/30 transition-colors">
                                <td className="p-3 md:px-6 md:py-4 block md:table-cell border-b md:border-b-0">
                                    <div className="flex justify-between items-center md:block">
                                        <span className="font-bold text-gray-400 md:hidden text-[10px] uppercase tracking-tighter">Cidade</span>
                                        <span className="text-sm font-bold text-gray-800 leading-tight">{trip.city}</span>
                                    </div>
                                </td>
                                <td className="p-3 md:px-6 md:py-4 block md:table-cell border-b md:border-b-0">
                                    <div className="flex justify-between items-center md:block">
                                        <span className="font-bold text-gray-400 md:hidden text-[10px] uppercase tracking-tighter">KM</span>
                                        <span className="text-xs text-gray-500 font-medium">{trip.kilometers.toFixed(1).replace('.', ',')} km</span>
                                    </div>
                                </td>
                                <td className="p-3 md:px-6 md:py-4 block md:table-cell border-b md:border-b-0 bg-yellow-50/50 md:bg-transparent rounded-b-lg md:rounded-none">
                                    <div className="flex justify-between items-center md:block">
                                        <span className="font-bold text-gray-400 md:hidden text-[10px] uppercase tracking-tighter">Valor</span>
                                        <span className="text-base text-gray-900 font-black">R$ {(trip.kilometers * pricePerKm).toFixed(2).replace('.', ',')}</span>
                                    </div>
                                </td>
                                {isAdmin && (
                                    <td className="p-3 md:px-6 md:py-4 block md:table-cell text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => { setEditingTrip(trip); setIsModalOpen(true); }} className="text-blue-600 p-1.5 hover:bg-blue-50 rounded-full transition-colors"><PencilIcon className="w-4 h-4" /></button>
                                            <button onClick={() => { if (window.confirm('Excluir?')) onDeleteLongTrip(trip.id); }} className="text-red-600 p-1.5 hover:bg-red-50 rounded-full transition-colors"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        )) : (
                            <tr><td colSpan={isAdmin ? 4 : 3} className="p-10 text-center text-gray-400 text-sm italic">Nenhum resultado.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LongTripCalculator;
