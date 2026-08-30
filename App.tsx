
import React, { useState, useEffect } from 'react';
import type { Fare, User, LongTrip } from './types';
import Header from './components/Header';
import FareTable from './components/FareTable';
import LongTripCalculator from './components/LongTripCalculator';
import AuthPage from './components/AuthPage';
import UserManagement from './components/UserManagement';
import { AdminContactBanner } from './components/AdminContactBanner';
import * as authService from './services/authService';
import * as fareService from './services/fareService';
import { db, auth } from './services/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

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
  
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced' | 'error'>('synced');
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Autentica anonimamente no Firebase para que a conexão seja autenticada,
    // o que é um requisito de segurança para vários ambientes do Firestore.
    signInAnonymously(auth)
      .then(() => {
        console.log("Autenticação anônima do Firebase estabelecida.");
      })
      .catch((err) => {
        console.warn("Autenticação anônima temporariamente desabilitada ou falhou, operando em modo offline/público:", err);
      });
  }, []);

  enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
  }

  interface FirestoreErrorInfo {
    error: string;
    operationType: OperationType;
    path: string | null;
    authInfo: {
      userId?: string | null;
      email?: string | null;
      emailVerified?: boolean | null;
      isAnonymous?: boolean | null;
      tenantId?: string | null;
      providerInfo?: {
        providerId?: string | null;
        email?: string | null;
      }[];
    }
  }

  const handleFirestoreErrorLocal = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: currentUser?.email || 'Anonymous',
        email: currentUser?.email || 'Anonymous',
        emailVerified: true,
        isAnonymous: false,
      },
      operationType,
      path
    };
    const jsonStr = JSON.stringify(errInfo);
    console.error('Firestore Error: ', jsonStr);
    throw new Error(jsonStr);
  };

  // Sincroniza em tempo real com o Firestore do Firebase para persistir na implantação
  useEffect(() => {
    setSyncStatus('syncing');

    const unsubFares = onSnapshot(doc(db, 'data', 'fares_doc'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.fares) && data.fares.length > 0) {
          setFares(data.fares);
          fareService.storeFares(data.fares);
          setSyncStatus('synced');
          setSyncErrorMessage(null);
        } else {
          // Documento existe mas está vazio ou corrompido - vamos reiniciar a partir do local
          const localFares = fareService.getFares();
          if (localFares && localFares.length > 0) {
            setSyncStatus('syncing');
            setDoc(doc(db, 'data', 'fares_doc'), { fares: localFares, updatedAt: new Date().toISOString() })
              .then(() => {
                setSyncStatus('synced');
                setSyncErrorMessage(null);
              })
              .catch(err => {
                setSyncStatus('error');
                setSyncErrorMessage(`Erro ao salvar tarifas no Firebase: ${err instanceof Error ? err.message : String(err)}`);
                handleFirestoreErrorLocal(err, OperationType.WRITE, 'data/fares_doc');
              });
          }
        }
      } else {
        // Envia do localStorage para persistir na nuvem na primeira execução
        const localFares = fareService.getFares();
        setDoc(doc(db, 'data', 'fares_doc'), { fares: localFares, updatedAt: new Date().toISOString() })
          .then(() => {
            setSyncStatus('synced');
            setSyncErrorMessage(null);
          })
          .catch(err => {
            setSyncStatus('error');
            setSyncErrorMessage(`Erro ao inicializar tarifas no Firebase: ${err instanceof Error ? err.message : String(err)}`);
            handleFirestoreErrorLocal(err, OperationType.WRITE, 'data/fares_doc');
          });
      }
    }, (error) => {
      setSyncStatus('error');
      setSyncErrorMessage(`Erro ao escutar tarifas no Firebase: ${error.message}`);
      handleFirestoreErrorLocal(error, OperationType.GET, 'data/fares_doc');
    });

    const unsubLongTrips = onSnapshot(doc(db, 'data', 'long_trips_doc'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.trips) && data.trips.length > 0) {
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
          setSyncStatus('synced');
          setSyncErrorMessage(null);
        } else {
          // Documento existe mas está vazio ou corrompido - vamos reiniciar a partir do local
          const localTrips = fareService.getLongTrips();
          if (localTrips && localTrips.length > 0) {
            setSyncStatus('syncing');
            setDoc(doc(db, 'data', 'long_trips_doc'), { trips: localTrips, updatedAt: new Date().toISOString() })
              .then(() => {
                setSyncStatus('synced');
                setSyncErrorMessage(null);
              })
              .catch(err => {
                setSyncStatus('error');
                setSyncErrorMessage(`Erro ao salvar viagens longas no Firebase: ${err instanceof Error ? err.message : String(err)}`);
                handleFirestoreErrorLocal(err, OperationType.WRITE, 'data/long_trips_doc');
              });
          }
        }
      } else {
        const localTrips = fareService.getLongTrips();
        setDoc(doc(db, 'data', 'long_trips_doc'), { trips: localTrips, updatedAt: new Date().toISOString() })
          .then(() => {
            setSyncStatus('synced');
            setSyncErrorMessage(null);
          })
          .catch(err => {
            setSyncStatus('error');
            setSyncErrorMessage(`Erro ao inicializar viagens longas no Firebase: ${err instanceof Error ? err.message : String(err)}`);
            handleFirestoreErrorLocal(err, OperationType.WRITE, 'data/long_trips_doc');
          });
      }
    }, (error) => {
      setSyncStatus('error');
      setSyncErrorMessage(`Erro ao escutar viagens longas no Firebase: ${error.message}`);
      handleFirestoreErrorLocal(error, OperationType.GET, 'data/long_trips_doc');
    });

    const unsubPricing = onSnapshot(doc(db, 'settings', 'pricing_doc'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && typeof data.pricePerKm === 'number') {
          setPricePerKm(data.pricePerKm);
          fareService.storePricePerKm(data.pricePerKm);
          setSyncStatus('synced');
          setSyncErrorMessage(null);
        } else {
          const localPrice = fareService.getPricePerKm();
          setSyncStatus('syncing');
          setDoc(doc(db, 'settings', 'pricing_doc'), { pricePerKm: localPrice, updatedAt: new Date().toISOString() })
            .then(() => {
              setSyncStatus('synced');
              setSyncErrorMessage(null);
            })
            .catch(err => {
              setSyncStatus('error');
              setSyncErrorMessage(`Erro ao salvar precificação no Firebase: ${err instanceof Error ? err.message : String(err)}`);
              handleFirestoreErrorLocal(err, OperationType.WRITE, 'settings/pricing_doc');
            });
        }
      } else {
        const localPrice = fareService.getPricePerKm();
        setDoc(doc(db, 'settings', 'pricing_doc'), { pricePerKm: localPrice, updatedAt: new Date().toISOString() })
          .then(() => {
            setSyncStatus('synced');
            setSyncErrorMessage(null);
          })
          .catch(err => {
            setSyncStatus('error');
            setSyncErrorMessage(`Erro ao inicializar precificação no Firebase: ${err instanceof Error ? err.message : String(err)}`);
            handleFirestoreErrorLocal(err, OperationType.WRITE, 'settings/pricing_doc');
          });
      }
    }, (error) => {
      setSyncStatus('error');
      setSyncErrorMessage(`Erro ao escutar precificação no Firebase: ${error.message}`);
      handleFirestoreErrorLocal(error, OperationType.GET, 'settings/pricing_doc');
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
    setSyncStatus('syncing');
    setDoc(doc(db, 'data', 'fares_doc'), { fares: updated, updatedAt: new Date().toISOString() })
      .then(() => {
        setSyncStatus('synced');
        setSyncErrorMessage(null);
      })
      .catch(err => {
        setSyncStatus('error');
        setSyncErrorMessage(`Erro ao adicionar tarifa no Firebase: ${err instanceof Error ? err.message : String(err)}`);
        handleFirestoreErrorLocal(err, OperationType.WRITE, 'data/fares_doc');
      });
    setSearchTerm(''); // Limpa busca para mostrar o novo item
    setRegionFilter('');
  };

  const handleUpdateFare = (updatedFare: Fare) => {
    const updated = fares.map(f => (f.id === updatedFare.id ? updatedFare : f));
    setFares(updated);
    fareService.storeFares(updated);
    setSyncStatus('syncing');
    setDoc(doc(db, 'data', 'fares_doc'), { fares: updated, updatedAt: new Date().toISOString() })
      .then(() => {
        setSyncStatus('synced');
        setSyncErrorMessage(null);
      })
      .catch(err => {
        setSyncStatus('error');
        setSyncErrorMessage(`Erro ao atualizar tarifa no Firebase: ${err instanceof Error ? err.message : String(err)}`);
        handleFirestoreErrorLocal(err, OperationType.WRITE, 'data/fares_doc');
      });
  };

  const handleDeleteFare = (fareId: string) => {
    const updated = fares.filter(f => f.id !== fareId);
    setFares(updated);
    fareService.storeFares(updated);
    setSyncStatus('syncing');
    setDoc(doc(db, 'data', 'fares_doc'), { fares: updated, updatedAt: new Date().toISOString() })
      .then(() => {
        setSyncStatus('synced');
        setSyncErrorMessage(null);
      })
      .catch(err => {
        setSyncStatus('error');
        setSyncErrorMessage(`Erro ao excluir tarifa no Firebase: ${err instanceof Error ? err.message : String(err)}`);
        handleFirestoreErrorLocal(err, OperationType.WRITE, 'data/fares_doc');
      });
  };
  
  const handleImportFares = (newFares: Fare[]) => {
    const mergedMap = new Map<string, Fare>();
    
    // Insere as tarifas existentes no map usando a destinação normalizada como chave
    fares.forEach(fare => {
      mergedMap.set(normalizeString(fare.destination), {
        ...fare,
        destination: fare.destination.toUpperCase()
      });
    });
    
    // Atualiza/Insere com as importadas
    newFares.forEach((fare, index) => {
      const norm = normalizeString(fare.destination);
      const existing = mergedMap.get(norm);
      if (existing) {
        // Se já existe, preserva o registro original e apenas atualiza os valores
        mergedMap.set(norm, {
          ...existing,
          destination: fare.destination.toUpperCase(),
          region: fare.region ? fare.region.toUpperCase() : existing.region,
          meterValue: fare.meterValue,
          counterValue: fare.counterValue
        });
      } else {
        // Se é inédito, adiciona
        mergedMap.set(norm, {
          ...fare,
          destination: fare.destination.toUpperCase(),
          region: fare.region ? fare.region.toUpperCase() : "GERAL",
          id: fare.id || `imp-fr-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`
        });
      }
    });
    
    const updated = Array.from(mergedMap.values());
    
    setFares(updated);
    fareService.storeFares(updated);
    setSyncStatus('syncing');
    setDoc(doc(db, 'data', 'fares_doc'), { fares: updated, updatedAt: new Date().toISOString() })
      .then(() => {
        setSyncStatus('synced');
        setSyncErrorMessage(null);
      })
      .catch(err => {
        setSyncStatus('error');
        setSyncErrorMessage(`Erro ao importar tarifas no Firebase: ${err instanceof Error ? err.message : String(err)}`);
        handleFirestoreErrorLocal(err, OperationType.WRITE, 'data/fares_doc');
      });
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
    setSyncStatus('syncing');
    setDoc(doc(db, 'data', 'long_trips_doc'), { trips: updated, updatedAt: new Date().toISOString() })
      .then(() => {
        setSyncStatus('synced');
        setSyncErrorMessage(null);
      })
      .catch(err => {
        setSyncStatus('error');
        setSyncErrorMessage(`Erro ao adicionar viagem no Firebase: ${err instanceof Error ? err.message : String(err)}`);
        handleFirestoreErrorLocal(err, OperationType.WRITE, 'data/long_trips_doc');
      });
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
    setSyncStatus('syncing');
    setDoc(doc(db, 'data', 'long_trips_doc'), { trips: updated, updatedAt: new Date().toISOString() })
      .then(() => {
        setSyncStatus('synced');
        setSyncErrorMessage(null);
      })
      .catch(err => {
        setSyncStatus('error');
        setSyncErrorMessage(`Erro ao atualizar viagem no Firebase: ${err instanceof Error ? err.message : String(err)}`);
        handleFirestoreErrorLocal(err, OperationType.WRITE, 'data/long_trips_doc');
      });
  };

  const handleDeleteLongTrip = (tripId: string) => {
    const updated = longTrips.filter(t => t.id !== tripId);
    setLongTrips(updated);
    fareService.storeLongTrips(updated);
    setSyncStatus('syncing');
    setDoc(doc(db, 'data', 'long_trips_doc'), { trips: updated, updatedAt: new Date().toISOString() })
      .then(() => {
        setSyncStatus('synced');
        setSyncErrorMessage(null);
      })
      .catch(err => {
        setSyncStatus('error');
        setSyncErrorMessage(`Erro ao remover viagem no Firebase: ${err instanceof Error ? err.message : String(err)}`);
        handleFirestoreErrorLocal(err, OperationType.WRITE, 'data/long_trips_doc');
      });
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
    setSyncStatus('syncing');
    setDoc(doc(db, 'data', 'long_trips_doc'), { trips: updated, updatedAt: new Date().toISOString() })
      .then(() => {
        setSyncStatus('synced');
        setSyncErrorMessage(null);
      })
      .catch(err => {
        setSyncStatus('error');
        setSyncErrorMessage(`Erro ao importar viagens no Firebase: ${err instanceof Error ? err.message : String(err)}`);
        handleFirestoreErrorLocal(err, OperationType.WRITE, 'data/long_trips_doc');
      });
  };

  const handleSetPricePerKm = (price: number) => {
    setPricePerKm(price);
    fareService.storePricePerKm(price);
    setSyncStatus('syncing');
    setDoc(doc(db, 'settings', 'pricing_doc'), { pricePerKm: price, updatedAt: new Date().toISOString() })
      .then(() => {
        setSyncStatus('synced');
        setSyncErrorMessage(null);
      })
      .catch(err => {
        setSyncStatus('error');
        setSyncErrorMessage(`Erro ao atualizar preço por km no Firebase: ${err instanceof Error ? err.message : String(err)}`);
        handleFirestoreErrorLocal(err, OperationType.WRITE, 'settings/pricing_doc');
      });
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
      
      {syncStatus === 'syncing' && (
        <div className="bg-yellow-50 border-b border-yellow-105-normal px-4 py-2 text-center text-[10px] font-black text-yellow-800 uppercase tracking-widest flex items-center justify-center gap-2">
          <svg className="animate-spin h-3.5 w-3.5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Sincronizando com o Firebase Cloud...
        </div>
      )}
      
      {syncStatus === 'error' && (
        <div className="bg-red-50 border-b border-red-100 px-6 py-3 text-center text-xs text-red-700 font-semibold flex flex-col sm:flex-row items-center justify-center gap-2">
          <span className="font-black uppercase tracking-widest bg-red-600 text-white px-2 py-0.5 rounded text-[9px]">Erro Firebase</span>
          <span className="font-medium text-xs text-red-800">{syncErrorMessage}</span>
          <button 
            type="button" 
            onClick={() => window.location.reload()} 
            className="mt-1 sm:mt-0 sm:ml-4 bg-red-100 hover:bg-red-200 text-red-800 font-extrabold px-3 py-1 rounded-md transition-colors text-[10px] uppercase tracking-wider">
            Reconectar
          </button>
        </div>
      )}

      {syncStatus === 'synced' && (
        <div className="bg-emerald-50/50 border-b border-emerald-100/30 px-4 py-1 text-center text-[9px] font-extrabold text-emerald-700 uppercase tracking-widest flex items-center justify-center gap-1.5 opacity-80">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Conectado e Sincronizado com Firebase
        </div>
      )}

      {/* Barra de Contato do Administrador */}
      <AdminContactBanner variant="bar" />

      <main className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">
        {renderActiveView()}
        
        {/* Card explicativo com telefone do Administrador para suporte/alterações */}
        <AdminContactBanner variant="card" />
      </main>
      <footer className="text-center p-8 text-gray-400 text-sm font-bold uppercase tracking-widest">
        <p>&copy; {new Date().getFullYear()} TABELA TÁXI • CONSULTA RÁPIDA</p>
        <p className="text-xs text-gray-400 mt-1 font-semibold">Contato do Administrador: (31) 99869-9742</p>
      </footer>
    </div>
  );
};

export default App;
