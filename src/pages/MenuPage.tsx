import { useState, useEffect } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { PremiumCard } from '../components/ui/PremiumCard';
import { Button, cn } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Search, Utensils, RefreshCw, Info, LayoutGrid, List } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { handleFirestoreError, OperationType } from '../services/firestoreErrorHandler';
import { MenuItem } from '../services/menuService';
import { useMenuStore } from '../store/useMenuStore';
import { Modal } from '../components/ui/Modal';

export function MenuPage() {
  const { userRole } = useAuthStore();
  const { addToast } = useToastStore();
  const { items: apiItems, isLoading: isSyncing, fetchMenu, forceFetchMenu } = useMenuStore();
  const [firestoreItems, setFirestoreItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = ['Todos', 'Menú Diario', 'Carta', 'Banquetes', 'Familiares'];

  // Derive items by merging apiItems and firestoreItems
  const items = (() => {
    const apiIds = new Set(apiItems.map(i => i.id));
    const uniqueFirestore = firestoreItems.filter(i => !apiIds.has(i.id));
    return [...apiItems, ...uniqueFirestore];
  })();

  const loadMenu = async () => {
    try {
      if (forceFetchMenu) {
        await forceFetchMenu();
      } else {
        await fetchMenu();
      }
      addToast('Carta sincronizada correctamente.', 'success');
    } catch (error) {
      console.error('Error loading menu:', error);
      addToast('Error crítico al sincronizar la carta.', 'error');
    }
  };

  useEffect(() => {
    // Initial load from API if not already loaded
    fetchMenu();

    // Listen to Firestore for any "extra" or "local" items
    const q = query(collection(db, 'menu'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: MenuItem[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as MenuItem);
      });
      setFirestoreItems(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'menu');
    });

    return () => unsubscribe();
  }, [fetchMenu]);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <PageWrapper className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-2 flex items-center">
            <Utensils className="w-6 h-6 sm:w-8 sm:h-8 mr-3 text-gold-champagne" />
            CARTA <span className="gold-text ml-2">DIGITAL</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-mono text-[10px] sm:text-xs md:text-sm uppercase tracking-widest">
            Catálogo de Platos Actualizado
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadMenu} 
            disabled={isSyncing}
            className="flex items-center justify-center w-full md:w-auto"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isSyncing && "animate-spin")} />
            Sincronizar
          </Button>
        </div>
      </div>

      <PremiumCard className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <Input 
                placeholder="Buscar platos, ingredientes..." 
                className="pl-9 sm:pl-10 w-full text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-1 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-1.5 sm:p-2 rounded-md transition-colors",
                  viewMode === 'grid' ? "bg-white dark:bg-white/10 text-gold-champagne shadow-sm" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                )}
                title="Vista de Cuadrícula"
              >
                <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-1.5 sm:p-2 rounded-md transition-colors",
                  viewMode === 'list' ? "bg-white dark:bg-white/10 text-gold-champagne shadow-sm" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                )}
                title="Vista de Lista"
              >
                <List className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {categories.map(cat => (
              <Button 
                key={cat}
                variant={selectedCategory === cat ? 'primary' : 'outline'}
                onClick={() => setSelectedCategory(cat)}
                className="whitespace-nowrap text-[10px] sm:text-sm px-4 py-1.5 sm:px-5 sm:py-2 rounded-full"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {items.length === 0 && !isSyncing ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 font-mono text-sm">
            CARGANDO MENÚ IMPERIAL...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 font-mono text-sm">
            {isSyncing ? 'SINCRONIZANDO CARTA...' : 'NO SE ENCONTRARON PLATOS.'}
          </div>
        ) : (
          <div className={cn(
            "gap-4 sm:gap-6",
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
              : "flex flex-col space-y-4"
          )}>
            {filteredItems.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedItem(item)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl bg-white dark:bg-black/40 border border-black/5 dark:border-white/10 hover:border-gold-champagne/50 transition-all duration-300 cursor-pointer flex",
                  viewMode === 'grid' ? "flex-col" : "flex-row items-stretch h-auto sm:h-40 min-h-[120px]"
                )}
              >
                <div className={cn(
                  "bg-gray-200 dark:bg-gray-800 relative overflow-hidden shrink-0",
                  viewMode === 'grid' ? "aspect-video w-full" : "w-28 sm:w-48 h-full min-h-[120px]"
                )}>
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl.replace('open?', 'uc?export=view&')} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <Utensils className="w-10 h-10 sm:w-12 sm:h-12 opacity-20" />
                    </div>
                  )}
                  <div className={cn(
                    "absolute bg-black/60 backdrop-blur-md text-gold-champagne font-mono font-bold px-2 py-1 sm:px-3 sm:py-1 rounded-lg text-[10px] sm:text-sm border border-gold-champagne/30",
                    viewMode === 'grid' ? "top-2 right-2" : "bottom-2 right-2"
                  )}>
                    S/ {item.price.toFixed(2)}
                  </div>
                  {item.subCategory && viewMode === 'grid' && (
                    <div className="absolute bottom-2 left-2 bg-dragon-red/80 backdrop-blur-sm text-white font-mono text-[8px] sm:text-[10px] px-2 py-0.5 rounded uppercase tracking-tighter">
                      {item.subCategory}
                    </div>
                  )}
                </div>
                <div className={cn(
                  "p-3 sm:p-5 flex flex-col flex-grow",
                  viewMode === 'list' && "justify-center"
                )}>
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] text-dragon-red font-bold tracking-wider uppercase">{item.category}</div>
                      {item.subCategory && viewMode === 'list' && (
                        <div className="text-[10px] text-gray-400 font-bold tracking-wider uppercase border-l border-white/20 pl-2">
                          {item.subCategory}
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] text-gold-champagne font-mono font-bold">#{item.id}</div>
                  </div>
                  <h3 className="font-heading font-bold text-base sm:text-lg mb-1 sm:mb-2 line-clamp-1">{item.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2 sm:mb-3 flex-grow">{item.description}</p>
                  
                  {item.flavor && (
                    <div className="flex items-center text-[10px] text-gray-400 uppercase tracking-wider mb-2">
                      <Info className="w-3 h-3 mr-1 shrink-0" />
                      <span className="truncate">{item.flavor}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </PremiumCard>

      {/* Item Detail Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        maxWidth="max-w-2xl"
      >
        {selectedItem && (
          <div className="-m-8 flex flex-col max-h-[90vh]">
            <div className="relative aspect-video sm:aspect-[16/7] bg-gray-900 shrink-0">
              {selectedItem.imageUrl ? (
                <img 
                  src={selectedItem.imageUrl.replace('open?', 'uc?export=view&')} 
                  alt={selectedItem.name} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-700">
                  <Utensils className="w-16 h-16 opacity-20" />
                </div>
              )}
            </div>
            
            <div className="p-6 sm:p-8 overflow-y-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="bg-dragon-red/20 text-dragon-red text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-dragon-red/20">
                      {selectedItem.category}
                    </span>
                    {selectedItem.subCategory && (
                      <span className="bg-white/5 text-gray-300 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-white/10">
                        {selectedItem.subCategory}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-silk-white-dark">{selectedItem.name}</h2>
                  <p className="text-gold-champagne font-mono text-sm mt-1">CÓDIGO: {selectedItem.id}</p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <div className="text-3xl font-bold font-mono text-gold-champagne">S/ {selectedItem.price.toFixed(2)}</div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-bold flex items-center">
                    <Utensils className="w-4 h-4 mr-2" />
                    Ingredientes / Descripción
                  </h3>
                  <p className="text-gray-300 text-sm sm:text-base leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                    {selectedItem.description || 'Sin descripción disponible.'}
                  </p>
                </div>
                
                {selectedItem.flavor && (
                  <div>
                    <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-bold flex items-center">
                      <Info className="w-4 h-4 mr-2" />
                      Perfil de Sabor
                    </h3>
                    <p className="text-gray-300 text-sm sm:text-base capitalize bg-white/5 p-4 rounded-xl border border-white/5">
                      {selectedItem.flavor}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
