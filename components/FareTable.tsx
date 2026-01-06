
import React, { useState, useRef } from 'react';
import type { Fare } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { XIcon } from './icons/XIcon';

interface FareModalProps {
  fare: Fare | null;
  onSave: (fare: Fare) => void;
  onClose: () => void;
}

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

const FareModal: React.FC<FareModalProps> = ({ fare, onSave, onClose }) => {
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
      id: fare?.id || `f-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-30 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-in zoom-in duration-200 border-t-8 border-yellow-400">
        <h2 className="text-xl font-black text-gray-800 mb-6 uppercase tracking-tight">{fare ? 'Editar Corrida' : 'Nova Corrida'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Destino / Local</label>
              <input type="text" name="destination" value={formData.destination} onChange={handleChange} placeholder="Ex: Aeroporto" className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm" required />
          </div>
          <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Região / Bairro</label>
              <input type="text" name="region" value={formData.region} onChange={handleChange} placeholder="Ex: Centro-Sul" className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Taxímetro</label>
                <input type="number" name="meterValue" value={formData.meterValue} onChange={handleChange} placeholder="0.00" className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm font-bold" step="0.01" required />
            </div>
            <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Balcão</label>
                <input type="number" name="counterValue" value={formData.counterValue} onChange={handleChange} placeholder="0.00" className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm font-bold" step="0.01" required />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-6">
            <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors uppercase tracking-widest">Cancelar</button>
            <button type="submit" className="px-6 py-3 text-sm font-black bg-yellow-400 text-gray-900 rounded-xl hover:bg-yellow-500 shadow-md transition-all uppercase tracking-widest">Salvar</button>
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
        if (window.confirm('Excluir esta corrida da tabela?')) {
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
                        const parts = line.split(',');
                        if (parts.length < 4) return null;
                        
                        const destination = parts[0]?.replace(/^"|"$/g, '').trim();
                        const region = parts[1]?.replace(/^"|"$/g, '').trim();
                        const meterValue = parseFloat(parts[2]);
                        const counterValue = parseFloat(parts[3]);

                        if (!destination || !region || isNaN(meterValue) || isNaN(counterValue)) return null;
                        
                        return {
                            id: `imp-${Date.now()}-${index}`,
                            region,
                            destination,
                            meterValue,
                            counterValue,
                        };
                    }).filter((f): f is Fare => f !== null);

                if (newFares.length > 0) {
                    onImportFares(newFares);
                    alert(`${newFares.length} registros importados com sucesso.`);
                } else {
                    alert('Nenhum dado válido encontrado no CSV.');
                }
            } catch (error) {
                alert('Erro ao processar o arquivo CSV.');
            }
        };
        reader.readAsText(file);
        event.target.value = ''; 
    };

    const handleExport = () => {
        if (!isAdmin || fares.length === 0) return;

        const header = "Destino,Regiao,ValorTaximetro,ValorBalcao\n";
        const csvRows = fares.map(fare => {
            return `"${fare.destination}","${fare.region}",${fare.meterValue.toFixed(2)},${fare.counterValue.toFixed(2)}`;
        }).join('\n');
        
        const blob = new Blob(["\uFEFF" + header + csvRows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `tabela_taxi_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

  return (
    <div className="space-y-6">
       {isModalOpen && <FareModal key={editingFare?.id || 'new'} fare={editingFare} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
      
      <div className="flex flex-col gap-4 p-5 bg-white rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center">
            <div className="w-2 h-8 bg-yellow-400 rounded-full mr-4 shadow-sm"></div>
            <div>
              <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest">Bairro / Hotel</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Consulta de valores aproximados</p>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 self-end sm:self-auto">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-100" title="Importar CSV"><UploadIcon className="w-5 h-5" /></button>
                <button onClick={handleExport} className="p-2.5 text-gray-500 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100" title="Exportar CSV"><DownloadIcon className="w-5 h-5" /></button>
                <button onClick={handleAdd} className="flex items-center bg-yellow-400 text-gray-900 px-6 py-3 rounded-xl text-xs font-black uppercase hover:bg-yellow-500 active:scale-95 transition-all shadow-md">
                  <PlusIcon className="w-4 h-4 mr-2" /> Novo
                </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-8 relative">
                <input
                    type="text"
                    placeholder="Pesquisar destino ou hotel (ignora acentos)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-12 pl-5 py-4 text-base border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-400 outline-none bg-gray-50/50 shadow-inner font-medium"
                />
                {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 bg-white/50 rounded-lg"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="md:col-span-4 relative">
                <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="w-full px-5 py-4 text-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-400 outline-none bg-gray-50/50 appearance-none cursor-pointer font-bold text-gray-700 shadow-inner"
                >
                    <option value="">Todas as Regiões</option>
                    {availableRegions.map(region => (
                        <option key={region} value={region}>{region}</option>
                    ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
            </div>
        </div>
      </div>
      
      <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead className="hidden md:table-header-group bg-gray-800">
                <tr>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Destino / Hotel</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Região</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Aprox. Taxímetro</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Valor Balcão</th>
                    {isAdmin && <th className="px-8 py-6 w-32"></th>}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {fares.length > 0 ? fares.map((fare, index) => (
                    <tr 
                      key={fare.id} 
                      className={`block md:table-row transition-all duration-200 hover:bg-yellow-50/30 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/80'}`}
                    >
                        <td className="p-6 md:px-8 md:py-6 block md:table-cell">
                            <div className="flex justify-between items-start md:block">
                                <span className="font-bold text-[9px] text-gray-300 md:hidden uppercase tracking-widest mb-1.5 block">Destino</span>
                                <span className="text-base font-black text-gray-800 uppercase tracking-tight leading-tight">{fare.destination}</span>
                            </div>
                        </td>
                        <td className="px-6 py-2 md:px-8 md:py-6 block md:table-cell">
                            <div className="flex justify-between items-center md:block">
                                <span className="font-bold text-[9px] text-gray-300 md:hidden uppercase tracking-widest block">Região</span>
                                <span className="text-[10px] text-gray-500 font-black bg-gray-100/50 border border-gray-100 px-3 py-1.5 rounded-full uppercase">{fare.region}</span>
                            </div>
                        </td>
                        <td className="px-6 py-2 md:px-8 md:py-6 block md:table-cell">
                             <div className="flex justify-between items-center md:block">
                                <span className="font-bold text-[9px] text-gray-300 md:hidden uppercase tracking-widest block">Taxímetro</span>
                                <span className="text-sm text-gray-500 font-bold">R$ {fare.meterValue.toFixed(2).replace('.', ',')}</span>
                            </div>
                        </td>
                        <td className="p-6 md:px-8 md:py-6 block md:table-cell md:bg-transparent">
                            <div className="flex justify-between items-center md:block">
                                <span className="font-bold text-[9px] text-gray-300 md:hidden uppercase tracking-widest block">Balcão</span>
                                <div className="flex flex-col items-end md:items-start">
                                  <span className="text-xl text-gray-900 font-black">R$ {fare.counterValue.toFixed(2).replace('.', ',')}</span>
                                  <span className="text-[9px] text-green-600 font-black uppercase tracking-tighter">Desconto Aplicado</span>
                                </div>
                            </div>
                        </td>
                        {isAdmin && (
                            <td className="px-6 py-4 md:px-8 md:py-6 block md:table-cell text-right">
                                <div className="flex items-center justify-end space-x-2">
                                    <button onClick={() => handleEdit(fare)} className="p-2.5 text-blue-500 hover:bg-blue-100/50 rounded-xl transition-all border border-transparent hover:border-blue-100" title="Editar"><PencilIcon className="w-5 h-5" /></button>
                                    <button onClick={() => handleDelete(fare.id)} className="p-2.5 text-red-500 hover:bg-red-100/50 rounded-xl transition-all border border-transparent hover:border-red-100" title="Excluir"><TrashIcon className="w-5 h-5" /></button>
                                </div>
                            </td>
                        )}
                    </tr>
                )) : (
                    <tr>
                      <td colSpan={isAdmin ? 5 : 4} className="p-32 text-center">
                        <div className="flex flex-col items-center opacity-30">
                          <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          <p className="text-xl font-black uppercase tracking-[0.2em]">Nenhum Resultado</p>
                          <p className="text-sm font-bold mt-2">Tente ajustar seus filtros ou busca</p>
                        </div>
                      </td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default FareTable;
