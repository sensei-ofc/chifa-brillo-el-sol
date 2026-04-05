import { useState, useEffect } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { PremiumCard } from '../components/ui/PremiumCard';
import { Button, cn } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Search, Utensils, RefreshCw, Info, LayoutGrid, List, Edit2, Save, X, AlertCircle } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { useToastStore } from '../store/useToastStore';
import { collection, onSnapshot, query, orderBy, doc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import { handleFirestoreError, OperationType } from '../services/firestoreErrorHandler';
import { Modal } from '../components/ui/Modal';
import { CONFIG } from '../config';

interface MenuItem {
  id: string; // Document ID (usually code)
  code?: string;
  name: string;
  description: string;
  flavor?: string;
  price: number;
  category: string;
  subcategory?: string;
  common_description?: string;
  imageUrl?: string;
  order?: number;
}

export function MenuPage() {
  const { userRole, user } = useAuthStore();
  const { profile } = useAppStore();
  const { addToast } = useToastStore();
  
  const [firestoreItems, setFirestoreItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);

  // Editing state
  const isCreator = user?.email === CONFIG.creator.email || profile?.email === CONFIG.creator.email;
  const isAdmin = userRole === 'admin' || isCreator;
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [pendingEdits, setPendingEdits] = useState<Record<string, MenuItem>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Load pending edits from localStorage on mount
  useEffect(() => {
    const savedEdits = localStorage.getItem('pendingMenuEdits');
    if (savedEdits) {
      try {
        setPendingEdits(JSON.parse(savedEdits));
      } catch (e) {
        console.error("Error parsing pending edits", e);
      }
    }
  }, []);

  // Save pending edits to localStorage when they change
  useEffect(() => {
    localStorage.setItem('pendingMenuEdits', JSON.stringify(pendingEdits));
  }, [pendingEdits]);

  useEffect(() => {
    // Fetch all items without orderBy to avoid missing items without an order field
    const q = query(collection(db, 'menu'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: MenuItem[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as MenuItem);
      });
      // Sort client-side by order
      data.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
      setFirestoreItems(data);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'menu');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Apply pending edits to the displayed items
  const items = firestoreItems.map(item => pendingEdits[item.id] || item);

  const categories = ['Todos', ...Array.from(new Set(items.map(i => i.category))).filter(Boolean)];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSaveLocalEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    
    setPendingEdits(prev => ({
      ...prev,
      [editingItem.id]: editingItem
    }));
    
    setEditingItem(null);
    addToast('Cambios guardados localmente. No olvides subir la actualización.', 'success');
  };

  const handleCommitEdits = async () => {
    const editKeys = Object.keys(pendingEdits);
    if (editKeys.length === 0) return;

    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      editKeys.forEach(id => {
        const docRef = doc(db, 'menu', id);
        // Remove the 'id' field before saving to Firestore
        const { id: _, ...dataToSave } = pendingEdits[id];
        batch.update(docRef, dataToSave);
      });

      await batch.commit();
      setPendingEdits({});
      localStorage.removeItem('pendingMenuEdits');
      addToast(`Se actualizaron ${editKeys.length} platos en la base de datos.`, 'success');
    } catch (error) {
      console.error("Error committing edits:", error);
      addToast('Error al guardar los cambios en la base de datos.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardEdits = () => {
    if (window.confirm('¿Estás seguro de descartar todos los cambios locales?')) {
      setPendingEdits({});
      localStorage.removeItem('pendingMenuEdits');
    }
  };

  return (
    <PageWrapper className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gold-champagne shadow-[0_0_15px_rgba(212,175,55,0.3)] bg-black shrink-0">
            <img src={CONFIG.brand.logo} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-1 flex items-center">
              <Utensils className="w-6 h-6 sm:w-8 sm:h-8 mr-3 text-gold-champagne" />
              CARTA <span className="gold-text ml-2">DIGITAL</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-mono text-[10px] sm:text-xs md:text-sm uppercase tracking-widest">
              Catálogo de Platos Actualizado
            </p>
          </div>
        </div>
        
        {isAdmin && (
          <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 flex-wrap justify-end">
            <Button
              variant={isEditMode ? "primary" : "outline"}
              onClick={() => setIsEditMode(!isEditMode)}
              className={cn("flex items-center justify-center", isEditMode ? "bg-gold-champagne text-black hover:bg-gold-champagne/90" : "border-gold-champagne/50 text-gold-champagne")}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              {isEditMode ? 'Modo Edición: ON' : 'Editar Carta'}
            </Button>

            {Object.keys(pendingEdits).length > 0 && (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleDiscardEdits} 
                  disabled={isSaving}
                  className="flex items-center justify-center border-dragon-red/50 text-dragon-red hover:bg-dragon-red/10"
                >
                  <X className="w-4 h-4 mr-1" />
                  Descartar
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleCommitEdits} 
                  disabled={isSaving}
                  className="flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white border-none shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                >
                  <Save className={cn("w-4 h-4 mr-2", isSaving && "animate-spin")} />
                  {isSaving ? 'Guardando...' : `Subir Cambios (${Object.keys(pendingEdits).length})`}
                </Button>
              </>
            )}
          </div>
        )}
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
                className="whitespace-nowrap text-[10px] sm:text-sm px-4 py-1.5 sm:px-5 sm:py-2 rounded-full capitalize"
              >
                {cat.replace(/_/g, ' ')}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className={cn(
            "gap-4 sm:gap-6",
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
              : "flex flex-col space-y-4"
          )}>
            {[...Array(8)].map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "rounded-2xl border border-black/5 dark:border-white/10 flex",
                  viewMode === 'grid' ? "flex-col" : "flex-row items-stretch h-40"
                )}
              >
                <Skeleton className={cn(
                  viewMode === 'grid' ? "aspect-video w-full rounded-b-none" : "w-28 sm:w-48 h-full rounded-r-none"
                )} />
                <div className="p-4 flex-grow space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 font-mono text-sm">
            NO SE ENCONTRARON PLATOS.
          </div>
        ) : (
          <div className={cn(
            "gap-4 sm:gap-6",
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
              : "flex flex-col space-y-4"
          )}>
            {filteredItems.map((item) => {
              const isEdited = !!pendingEdits[item.id];
              return (
                <div 
                  key={item.id} 
                  className={cn(
                    "group relative overflow-hidden rounded-2xl bg-white dark:bg-black/40 border transition-all duration-300 flex",
                    isEdited ? "border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]" : "border-black/5 dark:border-white/10 hover:border-gold-champagne/50",
                    viewMode === 'grid' ? "flex-col" : "flex-row items-stretch h-auto sm:h-40 min-h-[120px]"
                  )}
                >
                  <div 
                    onClick={() => !isEditMode && setSelectedItem(item)}
                    className={cn(
                      "bg-gray-200 dark:bg-gray-800 relative overflow-hidden shrink-0",
                      !isEditMode && "cursor-pointer",
                      viewMode === 'grid' ? "aspect-video w-full" : "w-28 sm:w-48 h-full min-h-[120px]"
                    )}
                  >
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl.replace('open?', 'uc?export=view&')} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
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
                    {item.subcategory && viewMode === 'grid' && (
                      <div className="absolute bottom-2 left-2 bg-dragon-red/80 backdrop-blur-sm text-white font-mono text-[8px] sm:text-[10px] px-2 py-0.5 rounded uppercase tracking-tighter max-w-[80%] truncate">
                        {item.subcategory.replace(/_/g, ' ')}
                      </div>
                    )}
                  </div>
                  
                  <div 
                    onClick={() => !isEditMode && setSelectedItem(item)}
                    className={cn(
                      "p-3 sm:p-5 flex flex-col flex-grow",
                      !isEditMode && "cursor-pointer",
                      viewMode === 'list' && "justify-center"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <div className="text-[10px] text-dragon-red font-bold tracking-wider uppercase truncate max-w-[100px] sm:max-w-[150px]">
                          {item.category.replace(/_/g, ' ')}
                        </div>
                        {item.subcategory && viewMode === 'list' && (
                          <div className="text-[10px] text-gray-400 font-bold tracking-wider uppercase border-l border-white/20 pl-2 truncate max-w-[100px] sm:max-w-[150px]">
                            {item.subcategory.replace(/_/g, ' ')}
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] text-gold-champagne font-mono font-bold">#{item.code || item.id}</div>
                    </div>
                    <h3 className="font-heading font-bold text-base sm:text-lg mb-1 sm:mb-2 line-clamp-1">{item.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2 sm:mb-3 flex-grow">{item.description}</p>
                    
                    {item.flavor && (
                      <div className="flex items-center text-[10px] text-gray-400 uppercase tracking-wider mb-2">
                        <Info className="w-3 h-3 mr-1 shrink-0" />
                        <span className="truncate">{item.flavor}</span>
                      </div>
                    )}
                    
                    {isEdited && (
                      <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
                        <AlertCircle className="w-3 h-3 mr-1" /> Editado localmente
                      </div>
                    )}

                    {isEditMode && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <Button
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); setEditingItem(item); }}
                          className="w-full text-xs py-1.5 border-gold-champagne/50 text-gold-champagne hover:bg-gold-champagne/10"
                        >
                          <Edit2 className="w-3 h-3 mr-2" /> Editar Plato
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
                      {selectedItem.category.replace(/_/g, ' ')}
                    </span>
                    {selectedItem.subcategory && (
                      <span className="bg-white/5 text-gray-300 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-white/10">
                        {selectedItem.subcategory.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-silk-white-dark">{selectedItem.name}</h2>
                  <p className="text-gold-champagne font-mono text-sm mt-1">CÓDIGO: {selectedItem.code || selectedItem.id}</p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <div className="text-3xl font-bold font-mono text-gold-champagne">S/ {selectedItem.price.toFixed(2)}</div>
                </div>
              </div>
              
              <div className="space-y-6">
                {selectedItem.common_description && (
                  <div className="bg-gold-champagne/10 border border-gold-champagne/20 p-4 rounded-xl">
                    <p className="text-gold-champagne text-sm italic">
                      {selectedItem.common_description}
                    </p>
                  </div>
                )}
                
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

      {/* Edit Item Modal */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Editar Plato (Local)"
        maxWidth="max-w-md"
      >
        {editingItem && (
          <form onSubmit={handleSaveLocalEdit} className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg flex items-start mb-4">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 mr-2 shrink-0" />
              <p className="text-xs text-blue-300">
                Los cambios se guardarán localmente. Debes presionar "Subir Cambios" en la parte superior para aplicarlos a la base de datos.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 uppercase tracking-wider">Código</label>
                <Input 
                  value={editingItem.code || ''} 
                  onChange={e => setEditingItem({...editingItem, code: e.target.value})}
                  className="w-full text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 uppercase tracking-wider">Precio (S/)</label>
                <Input 
                  type="number"
                  step="0.1"
                  value={editingItem.price} 
                  onChange={e => setEditingItem({...editingItem, price: parseFloat(e.target.value) || 0})}
                  className="w-full text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 uppercase tracking-wider">Nombre</label>
              <Input 
                value={editingItem.name} 
                onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                className="w-full text-sm"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 uppercase tracking-wider">Descripción</label>
              <textarea 
                value={editingItem.description} 
                onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-gold-champagne outline-none transition-all resize-none h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 uppercase tracking-wider">Categoría</label>
                <Input 
                  value={editingItem.category} 
                  onChange={e => setEditingItem({...editingItem, category: e.target.value})}
                  className="w-full text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 uppercase tracking-wider">Subcategoría</label>
                <Input 
                  value={editingItem.subcategory || ''} 
                  onChange={e => setEditingItem({...editingItem, subcategory: e.target.value})}
                  className="w-full text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 uppercase tracking-wider">Sabor</label>
              <Input 
                value={editingItem.flavor || ''} 
                onChange={e => setEditingItem({...editingItem, flavor: e.target.value})}
                className="w-full text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 uppercase tracking-wider">URL de Imagen</label>
              <Input 
                value={editingItem.imageUrl || ''} 
                onChange={e => setEditingItem({...editingItem, imageUrl: e.target.value})}
                className="w-full text-sm"
                placeholder="https://..."
              />
            </div>

            <div className="pt-4 flex gap-3">
              <Button type="button" variant="outline" onClick={() => setEditingItem(null)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" variant="primary" className="flex-1">
                Guardar Local
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </PageWrapper>
  );
}
