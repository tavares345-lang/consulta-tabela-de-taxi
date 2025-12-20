
import React, { useState, useEffect, useRef } from 'react';
import type { LongTrip, DistanceResult } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { MapPinIcon } from './icons/MapPinIcon';
import { CarIcon } from './icons/CarIcon';
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
        <label className="block text-xl font-medium text-gray-700 mb-2">{label}</label>
        <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                <MapPinIcon className="w-6 h-6" />
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
                className="w-full pl-12 pr-4 py-4 text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                autoComplete="off"
                inputMode="search"
            />
        </div>
        
        {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-30 w-full bg-white mt-1 rounded-lg shadow-xl max-h-60 overflow-y-auto border border-gray-200">
                <ul>
                    {suggestions.map((suggestion, index) => (
                        <li 
                            key={index}
                            onMouseDown={(e) => { e.preventDefault(); handleSelect(suggestion); }}
                            onTouchStart={(e) => { e.preventDefault(); handleSelect(suggestion); }}
                            className="px-4 py-4 hover:bg-blue-50 cursor-pointer text-lg text-gray-700 border-b last:border-b-0 border-gray-100 flex items-center active:bg-blue-100 transition-colors"
                        >
                            <MapPinIcon className="w-5 h-5 mr-3 text-gray-400" />
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
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg">
        <h2 className="text-3xl font-bold mb-6">{trip ? 'Editar Viagem' : 'Adicionar Nova Viagem'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
                <label className="block text-lg font-medium text-gray-700 mb-1">Cidade</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Ex: Rio de Janeiro" className="w-full p-4 text-xl border rounded-lg" required />
            </div>
            <div>
                <label className="block text-lg font-medium text-gray-700 mb-1">Distância (KM)</label>
                <input type="number" name="kilometers" value={formData.kilometers} onChange={handleChange} placeholder="0" className="w-full p-4 text-xl border rounded-lg" step="0.1" required />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-8">
            <button type="button" onClick={onClose} className="px-8 py-3 text-xl bg-gray-200 rounded-lg font-medium hover:bg-gray-300 transition">Cancelar</button>
            <button type="submit" className="px-8 py-3 text-xl bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-600 transition">Salvar</button>
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
    const [sources, setSources] = useState<{ title: string; uri: string }[]>([]);
    const [isLoadingDistance, setIsLoadingDistance] = useState(false);
    const [distanceError, setDistanceError] = useState<string | null>(null);

    const handleSave = (trip: LongTrip) => {
        if (!isAdmin) return;
        if (editingTrip) {
            onUpdateLongTrip(trip);
        } else {
            onAddLongTrip(trip);
        }
        setIsModalOpen(false);
        setEditingTrip(null);
    };

    const handleCalculateRoute = async () => {
        const destTrimmed = destination.trim();
        if (!origin.trim() || !destTrimmed) {
            setDistanceError("Por favor, preencha a origem e o destino.");
            return;
        }

        setIsLoadingDistance(true);
        setDistanceError(null);
        setCalculatedDistance(null);
        setSources([]);

        try {
            const finalDest = destTrimmed.length < 15 && !destTrimmed.toLowerCase().includes(", mg") && !destTrimmed.toLowerCase().includes(", brasil") 
                ? `${destTrimmed}, MG, Brasil` 
                : destTrimmed;

            const result: DistanceResult = await getDistance(origin, finalDest);
            
            if (result.distance !== null && result.distance > 0) {
                setCalculatedDistance(result.distance);
                setSources(result.sources);
            } else {
                setDistanceError("Não conseguimos calcular a distância exata. Tente ser mais específico, ex: 'Rodoviária de Ipatinga' ou 'Centro, Ipatinga, MG'.");
            }
        } catch (error) {
            console.error(error);
            setDistanceError("Erro ao processar a requisição. Verifique sua conexão ou tente novamente mais tarde.");
        } finally {
            setIsLoadingDistance(false);
        }
    };

    return (
        <div className="bg-transparent">
           {isModalOpen && <LongTripModal trip={editingTrip} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
           
            {/* Seção da Calculadora - Exibida apenas para Administradores */}
            {isAdmin && (
                <div className="bg-white rounded-xl shadow-md p-8 mb-8 border-l-8 border-blue-500 overflow-hidden animate-in fade-in duration-500">
                    <div className="flex items-center mb-6">
                        <CarIcon className="w-10 h-10 text-blue-500 mr-4" />
                        <h2 className="text-3xl font-bold text-gray-800">Calculadora de Rota</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <LocationAutocompleteInput 
                            label="Origem"
                            value={origin}
                            onChange={setOrigin}
                            placeholder="Ex: Aeroporto de Confins..."
                        />
                        <LocationAutocompleteInput 
                            label="Destino"
                            value={destination}
                            onChange={setDestination}
                            placeholder="Ex: Savassi, Belo Horizonte..."
                        />
                    </div>

                    <div className="flex flex-col items-center">
                        <button 
                            onClick={handleCalculateRoute}
                            disabled={isLoadingDistance}
                            className={`w-full md:w-auto px-10 py-5 rounded-full text-2xl font-bold text-white transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3 ${isLoadingDistance ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {isLoadingDistance ? (
                              <>
                                <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Consultando Google...
                              </>
                            ) : 'Calcular Valor'}
                        </button>

                        {distanceError && (
                            <div className="mt-6 w-full p-6 bg-red-50 border-2 border-red-100 rounded-xl">
                              <p className="text-red-600 text-xl font-bold text-center leading-relaxed">{distanceError}</p>
                            </div>
                        )}

                        {calculatedDistance !== null && (
                            <div className="mt-8 bg-blue-50 w-full p-6 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="flex flex-col md:flex-row justify-around items-center gap-6">
                                    <div className="text-center">
                                        <p className="text-gray-500 text-lg uppercase font-semibold tracking-tighter">Distância Encontrada</p>
                                        <p className="text-5xl font-extrabold text-gray-800">{calculatedDistance.toFixed(1).replace('.', ',')} km</p>
                                    </div>
                                    <div className="hidden md:block w-px h-16 bg-blue-200"></div>
                                    <div className="text-center">
                                        <p className="text-gray-500 text-lg uppercase font-semibold tracking-tighter">Valor Estimado</p>
                                        <p className="text-6xl font-extrabold text-green-600">R$ {(calculatedDistance * pricePerKm).toFixed(2).replace('.', ',')}</p>
                                    </div>
                                </div>
                                
                                {sources.length > 0 && (
                                  <div className="mt-8 pt-6 border-t border-blue-200">
                                    <p className="text-sm font-bold text-blue-800 mb-3 uppercase tracking-widest flex items-center">
                                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                      Referências da Pesquisa:
                                    </p>
                                    <ul className="flex flex-wrap gap-x-3 gap-y-2">
                                      {sources.map((source, idx) => (
                                        <li key={idx} className="flex items-center">
                                          <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-900 bg-white px-3 py-1.5 rounded-full border border-blue-100 shadow-sm transition-all hover:shadow flex items-center">
                                            {source.title.length > 35 ? source.title.substring(0, 35) + '...' : source.title}
                                          </a>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tabela Fixa - Visível para todos os usuários */}
            <div className="flex flex-col xl:flex-row justify-between items-center mb-8 gap-6 p-8 bg-white rounded-xl shadow-md">
                <h2 className="text-4xl font-bold text-gray-800 shrink-0">Tabela de Viagens Longas</h2>
                <div className="w-full xl:w-auto flex flex-col xl:flex-row items-center gap-5">
                    <input
                        type="text"
                        placeholder="Buscar cidade..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full xl:w-96 px-6 py-4 text-xl border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    {isAdmin && (
                        <button
                            onClick={() => { setEditingTrip(null); setIsModalOpen(true); }}
                            className="flex items-center justify-center bg-yellow-500 text-white font-bold py-3 px-6 rounded-full hover:bg-yellow-600 transition-colors duration-300 shadow-md text-lg w-full xl:w-auto"
                        >
                            <PlusIcon className="w-7 h-7 xl:mr-2" />
                            <span className="hidden xl:inline">Adicionar</span>
                        </button>
                    )}
                </div>
            </div>

            {isAdmin && (
                <div className="mb-8 p-8 bg-white rounded-xl shadow-md">
                    <label htmlFor="pricePerKm" className="block text-2xl font-bold text-gray-700 mb-4">
                        Valor por KM (Admin)
                    </label>
                    <div className="relative max-w-md">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 text-2xl">R$</span>
                        <input
                            type="number"
                            id="pricePerKm"
                            value={pricePerKm}
                            onChange={(e) => setPricePerKm(parseFloat(e.target.value) || 0)}
                            className="w-full pl-14 pr-4 py-4 text-3xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 font-bold"
                            step="0.01"
                        />
                    </div>
                </div>
            )}

            <div className="mt-8 md:bg-white md:rounded-xl md:shadow overflow-hidden">
                <table className="min-w-full">
                    <thead className="hidden md:table-header-group bg-gray-100">
                        <tr>
                            <th scope="col" className="px-6 py-5 text-left text-lg font-extrabold text-gray-600 uppercase tracking-wider">Cidade</th>
                            <th scope="col" className="px-6 py-5 text-left text-lg font-extrabold text-gray-600 uppercase tracking-wider">KM</th>
                            <th scope="col" className="px-6 py-5 text-left text-lg font-extrabold text-gray-600 uppercase tracking-wider">Valor</th>
                            {isAdmin && <th scope="col" className="relative px-6 py-5"><span className="sr-only">Ações</span></th>}
                        </tr>
                    </thead>
                    <tbody className="bg-transparent md:bg-white md:divide-y md:divide-gray-200">
                        {longTrips.length > 0 ? longTrips.map((trip) => {
                            const calculatedPrice = trip.kilometers * pricePerKm;
                            return (
                            <tr key={trip.id} className="block md:table-row mb-8 md:mb-0 bg-white rounded-xl shadow-md md:shadow-none md:hover:bg-gray-50">
                                <td className="p-5 md:px-6 md:py-6 block md:table-cell border-b md:border-b-0">
                                    <div className="flex justify-between items-center md:block">
                                        <span className="font-bold text-gray-700 md:hidden text-lg">Cidade</span>
                                        <span className="text-xl md:text-2xl font-semibold text-gray-900 md:text-left text-right break-words max-w-[60%] md:max-w-none">{trip.city}</span>
                                    </div>
                                </td>
                                <td className="p-5 md:px-6 md:py-6 block md:table-cell border-b md:border-b-0">
                                    <div className="flex justify-between items-center md:block">
                                        <span className="font-bold text-gray-700 md:hidden text-lg">KM</span>
                                        <span className="text-xl md:text-2xl text-gray-600 md:text-left text-right">{trip.kilometers.toFixed(1).replace('.', ',')} km</span>
                                    </div>
                                </td>
                                <td className="p-5 md:px-6 md:py-6 block md:table-cell border-b md:border-b-0 bg-yellow-50 md:bg-transparent rounded-b-xl md:rounded-none">
                                    <div className="flex justify-between items-center md:block">
                                        <span className="font-bold text-gray-700 md:hidden text-lg">Valor</span>
                                        <span className="text-2xl md:text-3xl text-gray-900 font-bold md:text-left text-right">R$ {calculatedPrice.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                </td>
                                {isAdmin && (
                                    <td className="p-5 md:px-6 md:py-6 block md:table-cell text-right">
                                        <div className="flex items-center justify-end space-x-6 md:mt-0 mt-3">
                                            <button onClick={() => { setEditingTrip(trip); setIsModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900 p-2" title="Editar">
                                                <PencilIcon className="w-8 h-8" />
                                            </button>
                                            <button onClick={() => { if (window.confirm('Tem certeza?')) onDeleteLongTrip(trip.id); }} className="text-red-600 hover:text-red-900 p-2" title="Excluir">
                                                <TrashIcon className="w-8 h-8" />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                            )
                        }) : (
                            <tr className="block md:table-row">
                                <td colSpan={isAdmin ? 4 : 3} className="px-6 py-20 text-center text-gray-500 block">
                                    <p className="text-3xl font-semibold">Nenhuma viagem encontrada.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LongTripCalculator;
