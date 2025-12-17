
import React, { useState, useRef } from 'react';
import type { Fare } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface FareTableProps {
  fares: Fare[];
  isAdmin: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg">
        <h2 className="text-3xl font-bold mb-6">{fare ? 'Editar Corrida' : 'Adicionar Nova Corrida'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
                <label className="block text-lg font-medium text-gray-700 mb-1">Destino</label>
                <input type="text" name="destination" value={formData.destination} onChange={handleChange} placeholder="Ex: Aeroporto" className="w-full p-4 text-xl border rounded-lg" required />
            </div>
            <div>
                <label className="block text-lg font-medium text-gray-700 mb-1">Região</label>
                <input type="text" name="region" value={formData.region} onChange={handleChange} placeholder="Ex: Pampulha" className="w-full p-4 text-xl border rounded-lg" required />
            </div>
            <div>
                <label className="block text-lg font-medium text-gray-700 mb-1">Valor Taxímetro</label>
                <input type="number" name="meterValue" value={formData.meterValue} onChange={handleChange} placeholder="0.00" className="w-full p-4 text-xl border rounded-lg" step="0.01" required />
            </div>
            <div>
                <label className="block text-lg font-medium text-gray-700 mb-1">Valor Balcão</label>
                <input type="number" name="counterValue" value={formData.counterValue} onChange={handleChange} placeholder="0.00" className="w-full p-4 text-xl border rounded-lg" step="0.01" required />
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


const FareTable: React.FC<FareTableProps> = ({ fares, isAdmin, searchTerm, setSearchTerm, onAddFare, onUpdateFare, onDeleteFare, onImportFares }) => {
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
        if (window.confirm('Tem certeza que deseja excluir esta corrida?')) {
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

    const handleDownloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Destino,Regiao,ValorTaximetro,ValorBalcao\n"
            + "Exemplo Destino A,Zona Sul,35.50,40.00\n"
            + "Exemplo Destino B,Zona Norte,22.00,25.00\n";
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "modelo_importacao.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExport = () => {
        if (!isAdmin) return;
        if (fares.length === 0) {
            alert("Não há dados na tabela para exportar.");
            return;
        }

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
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        link.setAttribute("download", `export_tabela_taxi_${timestamp}.csv`);
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
                const newFares: Fare[] = lines.slice(1) // Skip header row
                    .map((line, index) => {
                        const [destination, region, meterValueStr, counterValueStr] = line.split(',');
                        if (!region || !destination || !meterValueStr || !counterValueStr) return null;
                        
                        const meterValue = parseFloat(meterValueStr.trim());
                        const counterValue = parseFloat(counterValueStr.trim());

                        if (isNaN(meterValue) || isNaN(counterValue)) return null;
                        
                        return {
                            id: `imported-${new Date().getTime()}-${index}`,
                            region: region.trim(),
                            destination: destination.trim(),
                            meterValue,
                            counterValue,
                        };
                    }).filter((fare): fare is Fare => fare !== null);

                if (newFares.length > 0) {
                    onImportFares(newFares);
                    setSearchTerm('');
                    alert(`${newFares.length} corridas importadas com sucesso! A tabela foi atualizada.`);
                } else {
                    alert('Nenhuma corrida válida encontrada no arquivo. Verifique o formato.');
                }
            } catch (error) {
                console.error("Erro ao processar o arquivo CSV:", error);
                alert('Ocorreu um erro ao processar o arquivo. Verifique se ele está no formato CSV correto (Destino,Regiao,ValorTaximetro,ValorBalcao).');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

  return (
    <div className="bg-transparent">
       {isModalOpen && <FareModal fare={editingFare} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
      <div className="flex flex-col xl:flex-row justify-between items-center mb-8 gap-6 p-8 bg-white rounded-xl shadow-md">
        <h2 className="text-4xl font-bold text-gray-800 shrink-0">Tabela de Bairro/Hotel</h2>
        <div className="w-full xl:w-auto flex flex-col xl:flex-row items-center gap-5">
            <input
                type="text"
                placeholder="Buscar por região ou destino..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full xl:w-96 px-6 py-4 text-xl border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            />
            {isAdmin && (
                <div className="flex flex-wrap items-center gap-3 justify-center w-full xl:w-auto">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".csv"
                    />
                    <button
                        onClick={handleDownloadTemplate}
                        className="flex items-center justify-center bg-green-500 text-white font-bold py-3 px-6 rounded-full hover:bg-green-600 transition-colors duration-300 shadow-md text-lg"
                        title="Baixar modelo CSV"
                    >
                        <DownloadIcon className="w-7 h-7 xl:mr-2" />
                        <span className="hidden xl:inline">Modelo</span>
                    </button>
                    <button
                        onClick={handleImportClick}
                        className="flex items-center justify-center bg-blue-500 text-white font-bold py-3 px-6 rounded-full hover:bg-blue-600 transition-colors duration-300 shadow-md text-lg"
                        title="Importar CSV"
                    >
                        <UploadIcon className="w-7 h-7 xl:mr-2" />
                        <span className="hidden xl:inline">Importar</span>
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center justify-center bg-gray-500 text-white font-bold py-3 px-6 rounded-full hover:bg-gray-600 transition-colors duration-300 shadow-md text-lg"
                        title="Exportar CSV"
                    >
                        <DownloadIcon className="w-7 h-7 xl:mr-2" />
                        <span className="hidden xl:inline">Exportar</span>
                    </button>
                    <button
                        onClick={handleAdd}
                        className="flex items-center justify-center bg-yellow-500 text-white font-bold py-3 px-6 rounded-full hover:bg-yellow-600 transition-colors duration-300 shadow-md text-lg"
                    >
                        <PlusIcon className="w-7 h-7 xl:mr-2" />
                        <span className="hidden xl:inline">Adicionar</span>
                    </button>
                </div>
            )}
        </div>
      </div>
      
      <div className="mt-8 md:bg-white md:rounded-xl md:shadow overflow-hidden">
        <table className="min-w-full">
            <thead className="hidden md:table-header-group bg-gray-100">
                <tr>
                    <th scope="col" className="px-6 py-5 text-left text-lg font-extrabold text-gray-600 uppercase tracking-wider">Destino</th>
                    <th scope="col" className="px-6 py-5 text-left text-lg font-extrabold text-gray-600 uppercase tracking-wider">Região</th>
                    <th scope="col" className="px-6 py-5 text-left text-lg font-extrabold text-gray-600 uppercase tracking-wider">Valor Taxímetro</th>
                    <th scope="col" className="px-6 py-5 text-left text-lg font-extrabold text-gray-600 uppercase tracking-wider">Valor Balcão</th>
                    {isAdmin && <th scope="col" className="relative px-6 py-5"><span className="sr-only">Ações</span></th>}
                </tr>
            </thead>
            <tbody className="bg-transparent md:bg-white md:divide-y md:divide-gray-200">
                {fares.length > 0 ? fares.map((fare) => (
                    <tr key={fare.id} className="block md:table-row mb-8 md:mb-0 bg-white rounded-xl shadow-md md:shadow-none md:hover:bg-gray-50">
                        <td className="p-5 md:px-6 md:py-6 block md:table-cell border-b md:border-b-0">
                            <div className="flex justify-between items-center md:block">
                                <span className="font-bold text-gray-700 md:hidden text-lg">Destino</span>
                                <span className="text-xl md:text-2xl font-semibold text-gray-900 md:text-left text-right break-words max-w-[60%] md:max-w-none">{fare.destination}</span>
                            </div>
                        </td>
                        <td className="p-5 md:px-6 md:py-6 block md:table-cell border-b md:border-b-0">
                            <div className="flex justify-between items-center md:block">
                                <span className="font-bold text-gray-700 md:hidden text-lg">Região</span>
                                <span className="text-xl md:text-2xl text-gray-600 md:text-left text-right">{fare.region}</span>
                            </div>
                        </td>
                        <td className="p-5 md:px-6 md:py-6 block md:table-cell border-b md:border-b-0">
                             <div className="flex justify-between items-center md:block">
                                <span className="font-bold text-gray-700 md:hidden text-lg">Valor Taxímetro</span>
                                <span className="text-xl md:text-2xl text-gray-600 md:text-left text-right">R$ {fare.meterValue.toFixed(2).replace('.', ',')}</span>
                            </div>
                        </td>
                        <td className="p-5 md:px-6 md:py-6 block md:table-cell border-b md:border-b-0 bg-yellow-50 md:bg-transparent rounded-b-xl md:rounded-none">
                            <div className="flex justify-between items-center md:block">
                                <span className="font-bold text-gray-700 md:hidden text-lg">Valor Balcão</span>
                                <span className="text-2xl md:text-3xl text-gray-900 font-bold md:text-left text-right">R$ {fare.counterValue.toFixed(2).replace('.', ',')}</span>
                            </div>
                        </td>
                        {isAdmin && (
                            <td className="p-5 md:px-6 md:py-6 block md:table-cell text-right">
                                <div className="flex items-center justify-end space-x-6 md:mt-0 mt-3">
                                    <button onClick={() => handleEdit(fare)} className="text-indigo-600 hover:text-indigo-900 p-2" title="Editar">
                                        <PencilIcon className="w-8 h-8" />
                                    </button>
                                    <button onClick={() => handleDelete(fare.id)} className="text-red-600 hover:text-red-900 p-2" title="Excluir">
                                        <TrashIcon className="w-8 h-8" />
                                    </button>
                                </div>
                            </td>
                        )}
                    </tr>
                )) : (
                    <tr className="block md:table-row">
                        <td colSpan={isAdmin ? 5 : 4} className="px-6 py-20 text-center text-gray-500 block">
                            <p className="text-3xl font-semibold">Nenhum resultado encontrado.</p>
                            <p className="mt-4 text-xl">Tente ajustar os termos da sua busca.</p>
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
