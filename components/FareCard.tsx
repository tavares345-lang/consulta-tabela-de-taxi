
import React from 'react';
import type { Fare } from '../types';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';

interface FareCardProps {
  fare: Fare;
  isAdmin: boolean;
  onEdit: (fare: Fare) => void;
  onDelete: (id: string) => void;
}

const FareCard: React.FC<FareCardProps> = ({ fare, isAdmin, onEdit, onDelete }) => {
  // Fix: Property 'updatedAt' does not exist on type 'Fare'.
  // The component was attempting to access 'fare.updatedAt', which is not defined in the 'Fare' interface.
  // The logic for formatting and displaying this date has been removed to resolve the error.

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl flex flex-col justify-between">
      <div className="p-6">
        {isAdmin && (
            <div className="absolute top-4 right-4 flex items-center space-x-2">
                <button onClick={() => onEdit(fare)} className="p-1.5 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200 transition-colors" title="Editar">
                    <PencilIcon className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(fare.id)} className="p-1.5 bg-red-100 rounded-full text-red-600 hover:bg-red-200 transition-colors" title="Excluir">
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
        )}
        <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-gray-800 uppercase tracking-wide">{fare.destination}</h3>
            <p className="text-sm text-gray-500">{fare.region}</p>
        </div>
        
        <hr className="my-3 border-gray-200" />
        
        <div className="text-center">
            <div className="flex items-center justify-center text-gray-500 text-xs mb-1">
                <span>Valor aproximado taxímetro</span>
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full ml-1.5"></span>
            </div>
            <p className="text-3xl font-bold text-gray-700">
            R$ {fare.meterValue.toFixed(2).replace('.', ',')}
            </p>
        </div>
        
        <hr className="my-3 border-gray-200" />

        <div className="text-center">
            <p className="text-gray-500 text-xs">Valor com desconto</p>
            <p className="text-3xl font-bold text-gray-900">
            R$ {fare.counterValue.toFixed(2).replace('.', ',')}
            </p>
        </div>
      </div>
    </div>
  );
};

export default FareCard;