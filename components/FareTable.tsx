
import React, { useState, useRef } from 'react';
import type { Fare } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { XIcon } from './icons/XIcon';

interface FareTableProps {
  fares: Fare[];
  isAdmin: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  regionFilter: string;
  setRegionFilter: (region: string) => void;
  availableRegions: string[];
  onAddFare: (fare: Fare) => void;
  onUpdateFare: (fare: Fare) => void;
  onDeleteFare: (id: string) => void;
  onImportFares: (fares: Fare[]) => void;
}

const FareModal: React.FC<{
  fare: Fare | null;
  onSave: (fare: Fare) => void;
  onClose: () => void;
}> = ({ fare, onSave, onClose }) => {
  const [formData, setFormData] = useState<Omit<Fare, 'id'>>({
    region: fare?.region || '',
    destination: fare?.destination || '',
    meterValue: fare?.meterValue || 0,
    counterValue: fare?.counterValue || 0,
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
      id: fare?.id || new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">{fare ? 'Editar Corrida' : 'Adicionar Corrida'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Destino</label>
                <input type="text" name="destination" value={formData.destination} onChange={handleChange} placeholder="Ex: Aeroporto" className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none" required />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Região</label>
                <input type="text" name="region" value={formData.region} onChange={handleChange} placeholder="Ex: Pampulha" className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Taxímetro</label>
                  <input type="number" name="meterValue" value={formData.meterValue} onChange={handleChange} placeholder="0.00" className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none" step="0.01" required />
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Balcão</label>
                  <input type="number" name="counterValue" value={formData.counterValue} onChange={handleChange} placeholder="0.00" className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none" step="0.01" required />
              </div>
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


const FareTable: React.FC<FareTableProps> = ({ 
    fares, isAdmin, searchTerm, setSearchTerm, regionFilter, setRegionFilter, availableRegions,
    onAddFare, onUpdateFare, onDeleteFare, onImportFares 
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFare, setEditingFare] = useState<Fare | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAdd = () => {
        if (!isAdmin) return;
        setEditingFare(null);
        setIsModalOpen(true);
    };

    const handleEdit = (fare: Fare) => {
        if (!isAdmin) return;
        setEditingFare(fare);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (!isAdmin) return;
        if (window.confirm('Excluir esta corrida?')) {
            onDeleteFare(id);
        }
    };

    const handleSave = (fare: Fare) => {
        if (!isAdmin) return;
        if (editingFare) {
            onUpdateFare(fare);
        } else {
            onAddFare(fare);
        }
        setIsModalOpen(false);
        setEditingFare(null);
    };

    const handleImportClick = () => {
        if (!isAdmin) return;
        fileInputRef.current?.click();
    };

    const handleExport = () => {
        if (!isAdmin) return;
        if (fares.length === 0) return;

        const header = "Destino,Regiao,ValorTaximetro,ValorBalcao\n";
        const csvRows = fares.map(fare => {
            const destination = `"${fare.destination.replace(/"/g, '""')}"`;
            const region = `"${fare.region.replace(/"/g, '""')}"`;
            const meterValue = fare.meterValue.toFixed(2);
            const counterValue = fare.counterValue.toFixed(2);
            return [destination, region, meterValue, counterValue].join(',');
        }).join('\n');
        
        const csvContent = "\uFEFF" + header + csvRows;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `tabela_taxi.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!isAdmin) return;
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) return;

            try {
                const lines = text.split('\n').filter(line => line.trim() !== '');
                const newFares: Fare[] = lines.slice(1)
                    .map((line, index) => {
                        const [destination, region, meterValueStr, counterValueStr] = line.split(',');
                        if (!region || !destination || !meterValueStr || !counterValueStr) return null;
                        
                        const meterValue = parseFloat(meterValueStr.trim());
                        const counterValue = parseFloat(counterValueStr.trim());

                        if (isNaN(meterValue) || isNaN(counterValue)) return null;
                        
                        return {
                            id: `imported-${Date.now()}-${index}`,
                            region: region.trim(),
                            destination: destination.trim(),
                            meterValue,
                            counterValue,
                        };
                    }).filter((fare): fare is Fare => fare !== null);

                if (newFares.length > 0) {
                    onImportFares(newFares);
                    setSearchTerm('');
                    alert(`${newFares.length} registros importados.`);
                }
            } catch (error) {
                alert('Erro ao processar CSV.');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

  return (
    <div className="bg-transparent">
       {isModalOpen && <FareModal fare={editingFare} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
      <div className="flex flex-col xl:flex-row justify-between items-center mb-4 gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-black text-gray-800 shrink-0">Bairro/Hotel</h2>
        <div className="w-full xl:w-auto flex flex-col sm:flex-row items-center gap-2">
            <div className="flex flex-col sm:flex-row gap-2 w-full">
                {/* Busca por texto com X */}
                <div className="relative w-full sm:w-60">
                    <input
                        type="text"
                        placeholder="Buscar destino..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pr-8 pl-3 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400 transition bg-gray-50"
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

                {/* Filtro de Região */}
                <div className="w-full sm:w-40">
                    <select
                        value={regionFilter}
                        onChange={(e) => setRegionFilter(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-gray-50 transition cursor-pointer"
                    >
                        <option value="">Região: Todas</option>
                        {availableRegions.map(region => (
                            <option key={region} value={region}>{region}</option>
                        ))}
                    </select>
                </div>
            </div>

            {isAdmin && (
                <div className="flex items-center gap-1.5 justify-center w-full sm:w-auto mt-1 sm:mt-0">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
                    <button onClick={handleImportClick} className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-sm" title="Importar">
                        <UploadIcon className="w-5 h-5" />
                    </button>
                    <button onClick={handleExport} className="p-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 shadow-sm" title="Exportar">
                        <DownloadIcon className="w-5 h-5" />
                    </button>
                    <button onClick={handleAdd} className="flex items-center justify-center bg-yellow-400 text-gray-900 font-bold py-2 px-4 rounded-full hover:bg-yellow-500 shadow-sm text-sm whitespace-nowrap">
                        <PlusIcon className="w-4 h-4 mr-1" />
                        Add
                    </button>
                </div>
            )}
        </div>
      </div>
      
      <div className="md:bg-white md:rounded-xl md:shadow-sm overflow-hidden">
        <table className="min-w-full">
            <thead className="hidden md:table-header-group bg-gray-50 border-b border-gray-100">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Destino</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Região</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Taxímetro</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Balcão</th>
                    {isAdmin && <th className="px-6 py-3"></th>}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {fares.length > 0 ? fares.map((fare) => (
                    <tr key={fare.id} className="block md:table-row mb-3 md:mb-0 bg-white rounded-lg shadow-sm md:shadow-none hover:bg-yellow-50/30 transition-colors">
                        <td className="p-3 md:px-6 md:py-4 block md:table-cell border-b md:border-b-0">
                            <div className="flex justify-between items-center md:block">
                                <span className="font-bold text-gray-400 md:hidden text-[10px] uppercase tracking-tighter">Destino</span>
                                <span className="text-sm font-bold text-gray-800 leading-tight">{fare.destination}</span>
                            </div>
                        </td>
                        <td className="p-3 md:px-6 md:py-4 block md:table-cell border-b md:border-b-0">
                            <div className="flex justify-between items-center md:block">
                                <span className="font-bold text-gray-400 md:hidden text-[10px] uppercase tracking-tighter">Região</span>
                                <span className="text-xs text-gray-500 font-medium">{fare.region}</span>
                            </div>
                        </td>
                        <td className="p-3 md:px-6 md:py-4 block md:table-cell border-b md:border-b-0">
                             <div className="flex justify-between items-center md:block">
                                <span className="font-bold text-gray-400 md:hidden text-[10px] uppercase tracking-tighter">Taxímetro</span>
                                <span className="text-xs text-gray-600 font-bold">R$ {fare.meterValue.toFixed(2).replace('.', ',')}</span>
                            </div>
                        </td>
                        <td className="p-3 md:px-6 md:py-4 block md:table-cell border-b md:border-b-0 bg-yellow-50/50 md:bg-transparent rounded-b-lg md:rounded-none">
                            <div className="flex justify-between items-center md:block">
                                <span className="font-bold text-gray-400 md:hidden text-[10px] uppercase tracking-tighter">Balcão</span>
                                <span className="text-base text-gray-900 font-black">R$ {fare.counterValue.toFixed(2).replace('.', ',')}</span>
                            </div>
                        </td>
                        {isAdmin && (
                            <td className="p-3 md:px-6 md:py-4 block md:table-cell text-right">
                                <div className="flex items-center justify-end space-x-2">
                                    <button onClick={() => handleEdit(fare)} className="text-blue-600 p-1.5 hover:bg-blue-50 rounded-full transition-colors"><PencilIcon className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(fare.id)} className="text-red-600 p-1.5 hover:bg-red-50 rounded-full transition-colors"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            </td>
                        )}
                    </tr>
                )) : (
                    <tr><td colSpan={isAdmin ? 5 : 4} className="p-10 text-center text-gray-400 text-sm italic">Nenhum resultado encontrado.</td></tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default FareTable;
