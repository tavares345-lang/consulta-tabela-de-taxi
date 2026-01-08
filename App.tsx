
import React, { useState, useEffect } from 'react';
import type { Fare, User, LongTrip } from './types';
import Header from './components/Header';
import FareTable from './components/FareTable';
import LongTripCalculator from './components/LongTripCalculator';
import AuthPage from './components/AuthPage';
import UserManagement from './components/UserManagement';
import * as authService from './services/authService';
import * as fareService from './services/fareService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [activeView, setActiveView] = useState<'table' | 'calculator' | 'users'>('table');
  const [fares, setFares] = useState<Fare[]>(fareService.getFares());
  const [longTrips, setLongTrips] = useState<LongTrip[]>(fareService.getLongTrips());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [longTripSearchTerm, setLongTripSearchTerm] = useState<string>('');
  const [longTripKmSearchTerm, setLongTripKmSearchTerm] = useState<string>('');
  
  const [pricePerKm, setPricePerKm] = useState<number>(() => fareService.getPricePerKm());

  // Função utilitária para remover acentos e normalizar strings para busca
  const normalizeString = (str: string) => {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  };

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Sincroniza abas diferentes apenas se as chaves específicas mudarem
      if (e.key === 'taxi_app_fares' || e.key === 'taxi_app_long_trips' || e.key === 'taxi_app_price_per_km') {
        setFares(fareService.getFares());
        setLongTrips(fareService.getLongTrips());
        setPricePerKm(fareService.getPricePerKm());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const uniqueRegions = React.useMemo(() => {
    const regions = fares.map(f => f.region).filter(r => r && r.trim() !== '');
    return Array.from(new Set(regions)).sort();
  }, [fares]);

  const filteredFares = React.useMemo(() => {
    const normalizedSearch = normalizeString(searchTerm);
    return fares.filter(fare => {
      const normalizedDest = normalizeString(fare.destination);
      const normalizedRegion = normalizeString(fare.region);
      
      const matchesSearch = normalizedDest.includes(normalizedSearch) ||
                          normalizedRegion.includes(normalizedSearch);
      const matchesRegion = regionFilter === '' || fare.region === regionFilter;
      return matchesSearch && matchesRegion;
    });
  }, [fares, searchTerm, regionFilter]);

  const filteredLongTrips = React.useMemo(() => {
    const normalizedSearch = normalizeString(longTripSearchTerm);
    return longTrips.filter(trip => {
        const normalizedCity = normalizeString(trip.city);
        const matchesCity = normalizedCity.includes(normalizedSearch);
        
        const kmInput = longTripKmSearchTerm.trim().replace(',', '.');
        const searchNum = parseFloat(kmInput);
        const isSearchNumValid = !isNaN(searchNum) && kmInput !== '';

        let matchesKm = true;
        if (kmInput !== '') {
            const stringIncludes = trip.kilometers.toString().includes(kmInput);
            const tolerance = Math.max(5, trip.kilometers * 0.05);
            const proximityMatch = isSearchNumValid && Math.abs(trip.kilometers - searchNum) <= tolerance;
            matchesKm = stringIncludes || proximityMatch;
        }

        if (normalizedSearch !== '' && longTripKmSearchTerm === '') {
            return matchesCity;
        }
        
        return matchesCity && matchesKm;
    });
  }, [longTrips, longTripSearchTerm, longTripKmSearchTerm]);

  // Handlers com persistência imediata e limpeza de filtros
  const handleAddFare = (newFare: Fare) => {
    const updated = [...fares, newFare];
    setFares(updated);
    fareService.storeFares(updated);
    setSearchTerm(''); // Limpa busca para mostrar o novo item
    setRegionFilter('');
  };

  const handleUpdateFare = (updatedFare: Fare) => {
    const updated = fares.map(f => (f.id === updatedFare.id ? updatedFare : f));
    setFares(updated);
    fareService.storeFares(updated);
  };

  const handleDeleteFare = (fareId: string) => {
    const updated = fares.filter(f => f.id !== fareId);
    setFares(updated);
    fareService.storeFares(updated);
  };
  
  const handleImportFares = (newFares: Fare[]) => {
    const updated = [...fares, ...newFares];
    setFares(updated);
    fareService.storeFares(updated);
  };

  const handleAddLongTrip = (newTrip: LongTrip) => {
    const updated = [...longTrips, newTrip];
    setLongTrips(updated);
    fareService.storeLongTrips(updated);
    setLongTripSearchTerm(''); // Limpa busca para mostrar o novo item
    setLongTripKmSearchTerm('');
  };

  const handleUpdateLongTrip = (updatedTrip: LongTrip) => {
    const updated = longTrips.map(t => (t.id === updatedTrip.id ? updatedTrip : t));
    setLongTrips(updated);
    fareService.storeLongTrips(updated);
  };

  const handleDeleteLongTrip = (tripId: string) => {
    const updated = longTrips.filter(t => t.id !== tripId);
    setLongTrips(updated);
    fareService.storeLongTrips(updated);
  };

  const handleSetPricePerKm = (price: number) => {
    setPricePerKm(price);
    fareService.storePricePerKm(price);
  };

  if (!currentUser) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdmin = currentUser.role === 'admin';

  const renderActiveView = () => {
    switch (activeView) {
      case 'table':
        return (
          <FareTable
            fares={filteredFares}
            isAdmin={isAdmin}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            regionFilter={regionFilter}
            setRegionFilter={setRegionFilter}
            availableRegions={uniqueRegions}
            onAddFare={handleAddFare}
            onUpdateFare={handleUpdateFare}
            onDeleteFare={handleDeleteFare}
            onImportFares={handleImportFares}
          />
        );
      case 'calculator':
        return (
          <LongTripCalculator 
            isAdmin={isAdmin}
            pricePerKm={pricePerKm}
            setPricePerKm={handleSetPricePerKm}
            longTrips={filteredLongTrips}
            searchTerm={longTripSearchTerm}
            setSearchTerm={setLongTripSearchTerm}
            kmSearchTerm={longTripKmSearchTerm}
            setKmSearchTerm={setLongTripKmSearchTerm}
            onAddLongTrip={handleAddLongTrip}
            onUpdateLongTrip={handleUpdateLongTrip}
            onDeleteLongTrip={handleDeleteLongTrip}
            allLongTrips={longTrips}
          />
        );
      case 'users':
        return isAdmin ? <UserManagement /> : <div className="text-center py-20 font-black text-gray-400 uppercase tracking-widest">Acesso Restrito ao Admin</div>;
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <Header 
        user={currentUser}
        onLogout={handleLogout}
        activeView={activeView}
        onViewChange={setActiveView}
      />
      <main className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">
        {renderActiveView()}
      </main>
      <footer className="text-center p-8 text-gray-400 text-sm font-bold uppercase tracking-widest">
        <p>&copy; {new Date().getFullYear()} TABELA TÁXI • CONSULTA RÁPIDA</p>
      </footer>
    </div>
  );
};

export default App;
