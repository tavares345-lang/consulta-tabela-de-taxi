
import React, { useState, useEffect } from 'react';
import type { Fare, User, LongTrip } from './types';
import Header from './components/Header';
import FareTable from './components/FareTable';
import LongTripCalculator from './components/LongTripCalculator';
import AuthPage from './components/AuthPage';
import UserManagement from './components/UserManagement';
import * as authService from './services/authService';
import * as fareService from './services/fareService';
import { db } from './services/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

// Função utilitária para remover acentos e normalizar strings para busca e deduplicação
const normalizeString = (str: string) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [activeView, setActiveView] = useState<'table' | 'calculator' | 'users'>('table');
  const [fares, setFares] = useState<Fare[]>(fareService.getFares());
  const [longTrips, setLongTrips] = useState<LongTrip[]>(() => {
    const raw = fareService.getLongTrips();
    const seen = new Set<string>();
    const cleaned: LongTrip[] = [];
    raw.forEach(trip => {
      const norm = normalizeString(trip.city);
      if (norm && !seen.has(norm)) {
        seen.add(norm);
        cleaned.push({
          ...trip,
          city: trip.city.toUpperCase()
        });
      }
    });
    // Se houve duplicatas removidas ou alteração na caixa alta, atualiza permanentemente
    if (cleaned.length !== raw.length) {
      fareService.storeLongTrips(cleaned);
    }
    return cleaned;
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [longTripSearchTerm, setLongTripSearchTerm] = useState<string>('');
  const [longTripKmSearchTerm, setLongTripKmSearchTerm] = useState<string>('');
  
  const [pricePerKm, setPricePerKm] = useState<number>(() => fareService.getPricePerKm());


  // Sincroniza em tempo real com o Firestore do Firebase para persistir na implantação
  useEffect(() => {
    const unsubFares = onSnapshot(doc(db, 'data', 'fares_doc'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.fares)) {
          setFares(data.fares);
          fareService.storeFares(data.fares);
        }
      } else {
        // Envia do localStorage para persistir na nuvem na primeira execução
        const localFares = fareService.getFares();
        setDoc(doc(db, 'data', 'fares_doc'), { fares: localFares, updatedAt: new Date().toISOString() })
          .catch(err => console.error("Erro ao inicializar tarifas no Firestore:", err));
      }
    }, (error) => {
      console.error("Erro ao escutar tarifas no Firestore:", error);
    });

    const unsubLongTrips = onSnapshot(doc(db, 'data', 'long_trips_doc'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.trips)) {
          // Garante cidades em caixa alta e sem duplicados
          const seen = new Set<string>();
          const cleaned: LongTrip[] = [];
          data.trips.forEach((trip: LongTrip) => {
            const norm = normalizeString(trip.city);
            if (norm && !seen.has(norm)) {
              seen.add(norm);
              cleaned.push({
                ...trip,
                city: trip.city.toUpperCase()
              });
            }
          });
          setLongTrips(cleaned);
          fareService.storeLongTrips(cleaned);
        }
      } else {
        const localTrips = fareService.getLongTrips();
        setDoc(doc(db, 'data', 'long_trips_doc'), { trips: localTrips, updatedAt: new Date().toISOString() })
          .catch(err => console.error("Erro ao inicializar viagens longas no Firestore:", err));
      }
    }, (error) => {
      console.error("Erro ao escutar viagens longas no Firestore:", error);
    });

    const unsubPricing = onSnapshot(doc(db, 'settings', 'pricing_doc'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && typeof data.pricePerKm === 'number') {
          setPricePerKm(data.pricePerKm);
          fareService.storePricePerKm(data.pricePerKm);
        }
      } else {
        const localPrice = fareService.getPricePerKm();
        setDoc(doc(db, 'settings', 'pricing_doc'), { pricePerKm: localPrice, updatedAt: new Date().toISOString() })
          .catch(err => console.error("Erro ao inicializar precificação no Firestore:", err));
      }
    }, (error) => {
      console.error("Erro ao escutar precificação no Firestore:", error);
    });

    const handleStorageChange = (e: StorageEvent) => {
      // Sincroniza abas diferentes apenas se as chaves específicas mudarem no localStorage
      if (e.key === 'taxi_app_fares' || e.key === 'taxi_app_long_trips' || e.key === 'taxi_app_price_per_km') {
        const currentFares = fareService.getFares();
        const currentLongTrips = fareService.getLongTrips();
        const currentPrice = fareService.getPricePerKm();
        
        setFares(currentFares);
        setLongTrips(currentLongTrips);
        setPricePerKm(currentPrice);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      unsubFares();
      unsubLongTrips();
      unsubPricing();
      window.removeEventListener('storage', handleStorageChange);
    };
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
    setDoc(doc(db, 'data', 'fares_doc'), { fares: updated, updatedAt: new Date().toISOString() })
      .catch(err => console.error("Erro ao salvar tarifas no Firestore:", err));
    setSearchTerm(''); // Limpa busca para mostrar o novo item
    setRegionFilter('');
  };

  const handleUpdateFare = (updatedFare: Fare) => {
    const updated = fares.map(f => (f.id === updatedFare.id ? updatedFare : f));
    setFares(updated);
    fareService.storeFares(updated);
    setDoc(doc(db, 'data', 'fares_doc'), { fares: updated, updatedAt: new Date().toISOString() })
      .catch(err => console.error("Erro ao salvar tarifas no Firestore:", err));
  };

  const handleDeleteFare = (fareId: string) => {
    const updated = fares.filter(f => f.id !== fareId);
    setFares(updated);
    fareService.storeFares(updated);
    setDoc(doc(db, 'data', 'fares_doc'), { fares: updated, updatedAt: new Date().toISOString() })
      .catch(err => console.error("Erro ao salvar tarifas no Firestore:", err));
  };
  
  const handleImportFares = (newFares: Fare[]) => {
    const updated = [...fares, ...newFares];
    setFares(updated);
    fareService.storeFares(updated);
    setDoc(doc(db, 'data', 'fares_doc'), { fares: updated, updatedAt: new Date().toISOString() })
      .catch(err => console.error("Erro ao salvar tarifas no Firestore:", err));
  };

  const handleAddLongTrip = (newTrip: LongTrip) => {
    const norm = normalizeString(newTrip.city);
    const existingIndex = longTrips.findIndex(t => normalizeString(t.city) === norm);
    let updated: LongTrip[];
    if (existingIndex !== -1) {
      updated = [...longTrips];
      updated[existingIndex] = {
        ...updated[existingIndex],
        kilometers: newTrip.kilometers,
        city: newTrip.city.toUpperCase()
      };
    } else {
      updated = [...longTrips, { ...newTrip, city: newTrip.city.toUpperCase() }];
    }
    setLongTrips(updated);
    fareService.storeLongTrips(updated);
    setDoc(doc(db, 'data', 'long_trips_doc'), { trips: updated, updatedAt: new Date().toISOString() })
      .catch(err => console.error("Erro ao salvar viagens longas no Firestore:", err));
    setLongTripSearchTerm(''); // Limpa busca para mostrar o novo item
    setLongTripKmSearchTerm('');
  };

  const handleUpdateLongTrip = (updatedTrip: LongTrip) => {
    const norm = normalizeString(updatedTrip.city);
    const otherIndex = longTrips.findIndex(t => t.id !== updatedTrip.id && normalizeString(t.city) === norm);
    let updated: LongTrip[];
    if (otherIndex !== -1) {
      updated = longTrips
        .filter(t => t.id !== updatedTrip.id)
        .map(t => normalizeString(t.city) === norm ? { ...t, kilometers: updatedTrip.kilometers, city: updatedTrip.city.toUpperCase() } : t);
    } else {
      updated = longTrips.map(t => (t.id === updatedTrip.id ? { ...updatedTrip, city: updatedTrip.city.toUpperCase() } : t));
    }
    setLongTrips(updated);
    fareService.storeLongTrips(updated);
    setDoc(doc(db, 'data', 'long_trips_doc'), { trips: updated, updatedAt: new Date().toISOString() })
      .catch(err => console.error("Erro ao salvar viagens longas no Firestore:", err));
  };

  const handleDeleteLongTrip = (tripId: string) => {
    const updated = longTrips.filter(t => t.id !== tripId);
    setLongTrips(updated);
    fareService.storeLongTrips(updated);
    setDoc(doc(db, 'data', 'long_trips_doc'), { trips: updated, updatedAt: new Date().toISOString() })
      .catch(err => console.error("Erro ao salvar viagens longas no Firestore:", err));
  };

  const handleImportLongTrips = (newTrips: LongTrip[], replace: boolean) => {
    let updated: LongTrip[] = [];

    if (replace) {
      // Substituir tudo: cria uma lista sem duplicadas a partir do arquivo importado
      const seen = new Set<string>();
      for (const trip of newTrips) {
        const norm = normalizeString(trip.city);
        if (!seen.has(norm)) {
          seen.add(norm);
          updated.push({
            ...trip,
            city: trip.city.toUpperCase()
          });
        }
      }
    } else {
      // Mesclar: atualiza as que já existem e adiciona as novas, mantendo a tabela anterior ativa
      const mergedMap = new Map<string, LongTrip>();
      
      // Insere as existentes no map
      longTrips.forEach(trip => {
        mergedMap.set(normalizeString(trip.city), {
          ...trip,
          city: trip.city.toUpperCase()
        });
      });
      
      // Insere/atualiza com as importadas
      newTrips.forEach((trip, index) => {
        const norm = normalizeString(trip.city);
        const existing = mergedMap.get(norm);
        if (existing) {
          mergedMap.set(norm, {
            ...existing,
            city: trip.city.toUpperCase(),
            kilometers: trip.kilometers
          });
        } else {
          mergedMap.set(norm, {
            ...trip,
            city: trip.city.toUpperCase(),
            id: trip.id || `imp-lt-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`
          });
        }
      });
      
      updated = Array.from(mergedMap.values());
    }

    setLongTrips(updated);
    fareService.storeLongTrips(updated);
    setDoc(doc(db, 'data', 'long_trips_doc'), { trips: updated, updatedAt: new Date().toISOString() })
      .catch(err => console.error("Erro ao salvar viagens longas no Firestore:", err));
  };

  const handleSetPricePerKm = (price: number) => {
    setPricePerKm(price);
    fareService.storePricePerKm(price);
    setDoc(doc(db, 'settings', 'pricing_doc'), { pricePerKm: price, updatedAt: new Date().toISOString() })
      .catch(err => console.error("Erro ao salvar preço por km no Firestore:", err));
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
            onImportLongTrips={handleImportLongTrips}
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
