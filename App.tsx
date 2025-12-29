
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

  useEffect(() => {
    const handleStorageChange = () => {
      setFares(fareService.getFares());
      setLongTrips(fareService.getLongTrips());
      setPricePerKm(fareService.getPricePerKm());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    fareService.storeFares(fares);
  }, [fares]);

  useEffect(() => {
    fareService.storeLongTrips(longTrips);
  }, [longTrips]);

  useEffect(() => {
    if (!isNaN(pricePerKm)) {
        fareService.storePricePerKm(pricePerKm);
    }
  }, [pricePerKm]);

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
    return fares.filter(fare => {
      const matchesSearch = fare.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          fare.region.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion = regionFilter === '' || fare.region === regionFilter;
      return matchesSearch && matchesRegion;
    });
  }, [fares, searchTerm, regionFilter]);

  const filteredLongTrips = React.useMemo(() => {
    return longTrips.filter(trip => {
        const cityLower = trip.city.toLowerCase();
        const searchLower = longTripSearchTerm.toLowerCase().trim();
        const matchesCity = cityLower.includes(searchLower);
        
        const kmInput = longTripKmSearchTerm.trim().replace(',', '.');
        const searchNum = parseFloat(kmInput);
        const isSearchNumValid = !isNaN(searchNum) && kmInput !== '';

        let matchesKm = true;
        if (kmInput !== '') {
            // Busca textual no KM
            const stringIncludes = trip.kilometers.toString().includes(kmInput);
            // Tolerância inteligente de 5% ou 5km (o que for maior) para lidar com variações de rota do Maps
            const tolerance = Math.max(5, trip.kilometers * 0.05);
            const proximityMatch = isSearchNumValid && Math.abs(trip.kilometers - searchNum) <= tolerance;
            
            matchesKm = stringIncludes || proximityMatch;
        }

        // Se houver busca por nome, não filtramos por KM a menos que o KM seja o único filtro
        // Isso resolve o problema da tabela sumir quando o GPS dá um valor diferente do salvo
        if (searchLower !== '' && longTripKmSearchTerm === '') {
            return matchesCity;
        }
        
        return matchesCity && matchesKm;
    });
  }, [longTrips, longTripSearchTerm, longTripKmSearchTerm]);

  const handleAddFare = (newFare: Fare) => {
    setFares(prevFares => [...prevFares, newFare]);
  };

  const handleUpdateFare = (updatedFare: Fare) => {
    setFares(prevFares => prevFares.map(f => (f.id === updatedFare.id ? updatedFare : f)));
  };

  const handleDeleteFare = (fareId: string) => {
    setFares(prevFares => prevFares.filter(f => f.id !== fareId));
  };
  
  const handleImportFares = (newFares: Fare[]) => {
    setFares(prevFares => [...prevFares, ...newFares]);
  };

  const handleAddLongTrip = (newTrip: LongTrip) => {
    setLongTrips(prev => [...prev, newTrip]);
  };

  const handleUpdateLongTrip = (updatedTrip: LongTrip) => {
    setLongTrips(prev => prev.map(t => (t.id === updatedTrip.id ? updatedTrip : t)));
  };

  const handleDeleteLongTrip = (tripId: string) => {
    setLongTrips(prev => prev.filter(t => t.id !== tripId));
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
            setPricePerKm={setPricePerKm}
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
