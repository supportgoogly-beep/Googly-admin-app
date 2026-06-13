import React, { useState, useEffect, useRef } from "react";
import { MenuItem, Restaurant } from "../types";
import { 
  Layers, Plus, Search, Edit, Trash2, Copy, ArrowUp, ArrowDown, 
  ChevronRight, ChevronDown, Check, AlertCircle, X, Upload, 
  MoreVertical, Move, Sun, Moon, Star, CheckSquare, Square, 
  Settings2, Download, Info, Eye, EyeOff, ShieldCheck, 
  ArrowLeftRight, HelpCircle, FileSpreadsheet, Sparkles
} from "lucide-react";

export interface MenuItemAddon {
  id: string;
  name: string;
  price: number;
  maxQty: number;
  required: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image?: string;
  priority: number;
  active: boolean;
}

interface MenuManagementModuleProps {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  triggerToast: (title: string, message: string, type: "success" | "error" | "info") => void;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Starters", description: "Mouth-watering light appetizers to kickstart your feast.", image: "https://images.unsplash.com/photo-1541014741259-df5290bc008c?w=120&q=80", priority: 1, active: true },
  { id: "cat-2", name: "Main Course", description: "Savor our legendary corporate chef signature platters.", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=120&q=80", priority: 2, active: true },
  { id: "cat-3", name: "Beverages", description: "Ice-cold sodas, high-caffeine brews, and natural fruit juices.", image: "https://images.unsplash.com/photo-1497534446932-c925b458314e?w=120&q=80", priority: 3, active: true },
  { id: "cat-4", name: "Desserts", description: "Delectable artisan pastries, cheesecakes, and layered cups.", image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=120&q=80", priority: 4, active: true },
  { id: "cat-5", name: "Combos", description: "Curated value boxes for lunch meetings and group gatherings.", image: "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=120&q=80", priority: 5, active: true }
];

export default function MenuManagementModule({
  restaurants,
  menuItems,
  setMenuItems,
  triggerToast
}: MenuManagementModuleProps) {
  // --- Persistent & UI State ---
  const [selectedRestIdMenu, setSelectedRestIdMenu] = useState<string>(() => {
    return restaurants.length > 0 ? restaurants[0].id : "rest-1";
  });
  
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem("googly_menu_categories");
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  useEffect(() => {
    localStorage.setItem("googly_menu_categories", JSON.stringify(categories));
  }, [categories]);

  // Dark/Light SaaS Layout override
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

  // Loading indicator for list updates
  const [isLoading, setIsLoading] = useState(false);

  // Tree View Expand Tracker
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({
    "Starters": true,
    "Main Course": true,
    "Beverages": true,
    "Desserts": true,
    "Combos": true
  });

  // Filters & Searches
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [quickFilter, setQuickFilter] = useState<"All" | "Veg" | "Non-Veg" | "Egg" | "Available" | "Out of Stock" | "Hidden">("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Bulk operation tracking
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [bulkMoveCatValue, setBulkMoveCatValue] = useState("");
  const [showBulkConfirmAction, setShowBulkConfirmAction] = useState<"delete" | "enable" | "disable" | "move" | null>(null);

  // Active 3-dots menus
  const [activeItem3Dots, setActiveItem3Dots] = useState<string | null>(null);
  const [activeCat3Dots, setActiveCat3Dots] = useState<string | null>(null);

  // Details drawer
  const [viewingItemDetail, setViewingItemDetail] = useState<MenuItem | null>(null);

  // Add/Edit Modals open triggers
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Confirmation alerts
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [catToDelete, setCatToDelete] = useState<Category | null>(null);

  // Add/Edit Item Form State
  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    shortDescription: "",
    price: "",
    discountPrice: "",
    taxPercent: "5",
    packagingCharge: "15",
    category: "",
    sku: "",
    foodType: "Veg" as "Veg" | "Non-Veg" | "Egg",
    availability: "Available" as "Available" | "Out of Stock" | "Hidden",
    image: ""
  });

  // Validations inside forms
  const [itemFormErrors, setItemFormErrors] = useState<Record<string, string>>({});

  // Dynamic Add-ons local stack in item form
  const [addOnsStack, setAddOnsStack] = useState<MenuItemAddon[]>([]);
  const [newAddOn, setNewAddOn] = useState({ name: "", price: "", maxQty: "1", required: false });

  // Category Form State
  const [catForm, setCatForm] = useState({
    name: "",
    description: "",
    image: "",
    priority: "5",
    active: "true"
  });
  const [catFormErrors, setCatFormErrors] = useState<Record<string, string>>({});

  // Image Upload Simulated variables
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropScale, setCropScale] = useState(1);
  const [cropRotate, setCropRotate] = useState(0);

  const dragNodeRef = useRef<string | null>(null);

  // Initialize selected restaurant stats
  const selectedRest = restaurants.find(r => r.id === selectedRestIdMenu) || restaurants[0] || null;
  const restaurantItems = menuItems.filter(mi => mi.restaurantId === (selectedRest?.id || ""));

  // Derived statistics for selection info card
  const totalCategoriesCount = categories.length;
  const totalItemsCount = restaurantItems.length;
  const activeItemsCount = restaurantItems.filter(mi => {
    const isHidden = (mi as any).availability === "Hidden";
    const isOos = (mi as any).availability === "Out of Stock";
    return !isHidden && !isOos;
  }).length;
  const oosItemsCount = restaurantItems.filter(mi => (mi as any).availability === "Out of Stock").length;

  // Toggle Category expanded state
  const toggleCatExpand = (cat: string) => {
    setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Close menus on outside click helper
  useEffect(() => {
    const closeMenus = () => {
      setActiveItem3Dots(null);
      setActiveCat3Dots(null);
    };
    window.addEventListener("click", closeMenus);
    return () => window.removeEventListener("click", closeMenus);
  }, []);

  // Filter & Search Logic
  const filteredItemsResult = restaurantItems.filter(item => {
    // 1. Search item names, short description or SKU
    const lowerSku = ((item as any).sku || "").toLowerCase();
    const queryMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       lowerSku.includes(searchQuery.toLowerCase());
    
    // 2. Search category Name
    const categoryMatch = item.category.toLowerCase().includes(searchCategory.toLowerCase());

    // 3. Quick Filter status checks
    let statusMatch = true;
    const avail = (item as any).availability || "Available";
    if (quickFilter === "Veg") statusMatch = item.isVeg && ((item as any).foodType !== "Egg");
    else if (quickFilter === "Non-Veg") statusMatch = (item as any).foodType === "Non-Veg" || (!item.isVeg && !(item as any).foodType);
    else if (quickFilter === "Egg") statusMatch = (item as any).foodType === "Egg";
    else if (quickFilter === "Available") statusMatch = avail === "Available";
    else if (quickFilter === "Out of Stock") statusMatch = avail === "Out of Stock";
    else if (quickFilter === "Hidden") statusMatch = avail === "Hidden";

    // 4. Price Boundaries
    let priceMatch = true;
    if (minPrice) priceMatch = priceMatch && item.price >= parseFloat(minPrice);
    if (maxPrice) priceMatch = priceMatch && item.price <= parseFloat(maxPrice);

    return queryMatch && categoryMatch && statusMatch && priceMatch;
  });

  // Skeletons trigger when switching restaurant node
  const handleRestSelect = (restId: string) => {
    setIsLoading(true);
    setSelectedRestIdMenu(restId);
    setSelectedItems([]);
    setTimeout(() => {
      setIsLoading(false);
    }, 450);
  };

  // Drag & drop sorting simulated inside tree
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData("text/plain", itemId);
    dragNodeRef.current = itemId;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnCategory = (e: React.DragEvent, targetCategory: string) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData("text/plain") || dragNodeRef.current;
    if (!itemId) return;

    setMenuItems(prev => prev.map(mi => {
      if (mi.id === itemId) {
        return { 
          ...mi, 
          category: targetCategory,
          lastUpdated: new Date().toLocaleDateString()
        };
      }
      return mi;
    }));

    triggerToast("Category Reallocated", `Moved item to category: "${targetCategory}" through grid drop.`, "success");
    dragNodeRef.current = null;
  };

  // Helper of category display priority reordering
  const handleMoveCategoryPriority = (index: number, direction: "up" | "down") => {
    const nextCategories = [...categories];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= nextCategories.length) return;

    // Swap priority
    const tempPr = nextCategories[index].priority;
    nextCategories[index].priority = nextCategories[targetIdx].priority;
    nextCategories[targetIdx].priority = tempPr;

    // Swap elements
    const temp = nextCategories[index];
    nextCategories[index] = nextCategories[targetIdx];
    nextCategories[targetIdx] = temp;

    setCategories(nextCategories);
    triggerToast("Display Order Updated", `Shifted category priority bounds successfully.`, "info");
  };

  // Item form dynamic loading
  const openItemModal = (item: MenuItem | null = null) => {
    setItemFormErrors({});
    if (item) {
      setEditingItem(item);
      setItemForm({
        name: item.name,
        description: item.description,
        shortDescription: (item as any).shortDescription || "",
        price: item.price.toString(),
        discountPrice: (item as any).discountPrice ? (item as any).discountPrice.toString() : "",
        taxPercent: (item as any).taxPercent ? (item as any).taxPercent.toString() : "5",
        packagingCharge: (item as any).packagingCharge ? (item as any).packagingCharge.toString() : "15",
        category: item.category,
        sku: (item as any).sku || `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
        foodType: (item as any).foodType || (item.isVeg ? "Veg" : "Non-Veg"),
        availability: ((item as any).availability as any) || "Available",
        image: item.image || ""
      });
      setAddOnsStack((item as any).addOnsConfig || (item.addOns ? item.addOns.map((add, idx) => ({
        id: `add-old-${idx}`,
        name: add.split(" (Rs")[0],
        price: parseFloat(add.split(" (Rs ")[1]?.replace(")", "") || "15"),
        maxQty: 1,
        required: false
      })) : []));
    } else {
      setEditingItem(null);
      setItemForm({
        name: "",
        description: "",
        shortDescription: "",
        price: "",
        discountPrice: "",
        taxPercent: "5",
        packagingCharge: "15",
        category: categories[0]?.name || "Starters",
        sku: `PRD-${Math.floor(100000 + Math.random() * 900000)}`,
        foodType: "Veg",
        availability: "Available",
        image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80"
      });
      setAddOnsStack([
        { id: "add-def-1", name: "Extra Cheese Melt", price: 60, maxQty: 2, required: false },
        { id: "add-def-2", name: "Upgrade to Large Shake", price: 95, maxQty: 1, required: false }
      ]);
    }
    // reset upload states
    setIsUploading(false);
    setUploadProgress(0);
    setFileDetails(null);
    setShowAddItemModal(true);
  };

  // Save Item handle with Validation
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!itemForm.name.trim()) errors.name = "Food item name cannot be zero-spaced.";
    if (!itemForm.category) errors.category = "Please select a specific category.";
    
    const priceVal = parseFloat(itemForm.price);
    if (isNaN(priceVal) || priceVal <= 0) {
      errors.price = "Enter standard numeric base price greater than zero.";
    }

    if (itemForm.discountPrice) {
      const discountVal = parseFloat(itemForm.discountPrice);
      if (isNaN(discountVal) || discountVal < 0 || discountVal >= priceVal) {
        errors.discountPrice = "Applied discount price must be positive and strictly lower than base price.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setItemFormErrors(errors);
      triggerToast("Form Verification Failed", "Correct the highlighted parameters.", "error");
      return;
    }

    // Map addOns for legacy modules: e.g. ["Extra Cheese Melt (Rs 60)", ...]
    const legacyAddOns = addOnsStack.map(add => `${add.name} (Rs ${add.price})`);

    const finalItem: MenuItem = {
      id: editingItem ? editingItem.id : `menu-${Date.now()}`,
      restaurantId: selectedRestIdMenu,
      name: itemForm.name.trim(),
      description: itemForm.description.trim() || `${itemForm.name} freshly flavored with premium chef selected seasonings.`,
      category: itemForm.category,
      price: priceVal,
      isVeg: itemForm.foodType === "Veg" || itemForm.foodType === "Egg", // helper
      image: itemForm.image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
      addOns: legacyAddOns,
      
      // Extended fields
      shortDescription: itemForm.shortDescription.trim() || `${itemForm.name} specialty dish.`,
      sku: itemForm.sku.trim(),
      discountPrice: itemForm.discountPrice ? parseFloat(itemForm.discountPrice) : undefined,
      taxPercent: parseFloat(itemForm.taxPercent),
      packagingCharge: parseFloat(itemForm.packagingCharge),
      foodType: itemForm.foodType,
      addOnsConfig: addOnsStack,
      availability: itemForm.availability,
      rating: editingItem?.rating || parseFloat((4.0 + Math.random() * 1.0).toFixed(1)),
      lastUpdated: new Date().toLocaleDateString(),
      createdAt: (editingItem as any)?.createdAt || new Date().toLocaleDateString()
    };

    if (editingItem) {
      setMenuItems(prev => prev.map(mi => mi.id === editingItem.id ? finalItem : mi));
      triggerToast("Item Profile Modified", `Successfully updated "${finalItem.name}" menu card.`, "success");
    } else {
      setMenuItems(prev => [finalItem, ...prev]);
      triggerToast("Item Spawned Successfully", `Added "${finalItem.name}" to the restaurant menu tree.`, "success");
    }

    setShowAddItemModal(false);
  };

  // Handle Duplicating item
  const handleDuplicateItem = (item: MenuItem) => {
    const newItem: MenuItem = {
      ...item,
      id: `menu-dup-${Date.now()}`,
      name: `${item.name} (Duplicate)`,
      sku: `PRD-${Math.floor(100000 + Math.random() * 900000)}`,
      lastUpdated: new Date().toLocaleDateString()
    };
    setMenuItems(prev => [newItem, ...prev]);
    triggerToast("Item Duplicated", `Cloned "${item.name}" profile. Modified SKU to prevent collisions.`, "success");
  };

  // Add category handler
  const openCategoryModal = (cat: Category | null = null) => {
    setCatFormErrors({});
    if (cat) {
      setEditingCategory(cat);
      setCatForm({
        name: cat.name,
        description: cat.description,
        image: cat.image || "",
        priority: cat.priority.toString(),
        active: cat.active ? "true" : "false"
      });
    } else {
      setEditingCategory(null);
      setCatForm({
        name: "",
        description: "",
        image: "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=120&q=80",
        priority: (categories.length + 1).toString(),
        active: "true"
      });
    }
    setShowAddCatModal(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!catForm.name.trim()) errors.name = "Category designation identifier required.";
    
    const prVal = parseInt(catForm.priority);
    if (isNaN(prVal) || prVal <= 0) {
      errors.priority = "Priority tier must be a positive integer.";
    }

    if (Object.keys(errors).length > 0) {
      setCatFormErrors(errors);
      return;
    }

    const finalCat: Category = {
      id: editingCategory ? editingCategory.id : `cat-${Date.now()}`,
      name: catForm.name.trim(),
      description: catForm.description.trim() || `${catForm.name} curated culinary category.`,
      image: catForm.image || "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=120&q=80",
      priority: prVal,
      active: catForm.active === "true"
    };

    if (editingCategory) {
      // If we rename category, update items belonging here as well
      const oldName = editingCategory.name;
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? finalCat : c));
      
      if (oldName !== finalCat.name) {
        setMenuItems(prev => prev.map(mi => mi.category === oldName ? { ...mi, category: finalCat.name } : mi));
      }
      triggerToast("Category Refined", `Updated constraints matching category "${finalCat.name}".`, "success");
    } else {
      setCategories(prev => [...prev, finalCat].sort((a,b) => a.priority - b.priority));
      triggerToast("Category Registered", `Registered new node "${finalCat.name}" inside taxonomy tree.`, "success");
    }

    setShowAddCatModal(false);
  };

  // Image Upload Drag events
  const handleDragFile = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileInput(e.dataTransfer.files[0]);
    }
  };

  const selectDeviceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileInput(e.target.files[0]);
    }
  };

  const handleFileInput = (file: File) => {
    // Validation size
    const limit = 10 * 1024 * 1024; // 10MB limit
    if (file.size > limit) {
      triggerToast("Rejected Payload", "File exceeds 10MB maximum capacity. Compress payload before upload.", "error");
      return;
    }

    const formats = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!formats.includes(file.type)) {
      triggerToast("Format Unacceptable", "Supported files are PNG, WEBP, and JPG/JPEG format rules.", "error");
      return;
    }

    setFileDetails({
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + " MB"
    });

    // Start simulated progress bar
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          // Set preview mock image
          setItemForm(prevForm => ({
            ...prevForm,
            image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80"
          }));
          triggerToast("Upload Cleared", "Transmitted media payload. Ready to bind.", "success");
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  // Add add-on handle
  const handleAddLocalAddOn = () => {
    if (!newAddOn.name.trim()) return;
    const priceFloat = parseFloat(newAddOn.price) || 0;
    const addOnNode: MenuItemAddon = {
      id: `add-on-${Date.now()}`,
      name: newAddOn.name.trim(),
      price: priceFloat,
      maxQty: parseInt(newAddOn.maxQty) || 1,
      required: newAddOn.required
    };
    setAddOnsStack(prev => [...prev, addOnNode]);
    setNewAddOn({ name: "", price: "", maxQty: "1", required: false });
    triggerToast("Add-on Attached", "Appended customizable addition option in local stack.", "info");
  };

  const handleRemoveLocalAddOn = (id: string) => {
    setAddOnsStack(prev => prev.filter(a => a.id !== id));
  };

  const handleMoveAddOnOrder = (idx: number, dir: "up" | "down") => {
    const nextList = [...addOnsStack];
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= nextList.length) return;
    const temp = nextList[idx];
    nextList[idx] = nextList[target];
    nextList[target] = temp;
    setAddOnsStack(nextList);
  };

  // Bulk selectors
  const toggleItemBulkSelection = (itemId: string) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const toggleSelectAllPageResult = () => {
    const visibleIds = filteredItemsResult.map(item => item.id);
    const isAllSel = visibleIds.every(id => selectedItems.includes(id));
    if (isAllSel) {
      setSelectedItems(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedItems(prev => {
        const unique = new Set([...prev, ...visibleIds]);
        return Array.from(unique);
      });
    }
  };

  // Execute Bulk commands
  const handleExecuteBulkAction = (actionType: "delete" | "enable" | "disable" | "move") => {
    if (selectedItems.length === 0) {
      triggerToast("No items selected", "Mark active check boxes to target menu points.", "info");
      return;
    }

    if (actionType === "delete") {
      setMenuItems(prev => prev.filter(mi => !selectedItems.includes(mi.id)));
      triggerToast("Bulk Deletion Complete", `Permanently stripped ${selectedItems.length} elements from restaurant list.`, "success");
    } else if (actionType === "enable") {
      setMenuItems(prev => prev.map(mi => {
        if (selectedItems.includes(mi.id)) {
          return { ...mi, availability: "Available", lastUpdated: new Date().toLocaleDateString() };
        }
        return mi;
      }));
      triggerToast("Bulk Out of Stock Toggled", `Updated availability states to Active order.`, "success");
    } else if (actionType === "disable") {
      setMenuItems(prev => prev.map(mi => {
        if (selectedItems.includes(mi.id)) {
          return { ...mi, availability: "Out of Stock", lastUpdated: new Date().toLocaleDateString() };
        }
        return mi;
      }));
      triggerToast("Bulk Status Changed", `Set ${selectedItems.length} products to Out of stock list.`, "success");
    } else if (actionType === "move") {
      if (!bulkMoveCatValue) {
        triggerToast("Destination required", "Select a categorical destination node first.", "error");
        return;
      }
      setMenuItems(prev => prev.map(mi => {
        if (selectedItems.includes(mi.id)) {
          return { ...mi, category: bulkMoveCatValue, lastUpdated: new Date().toLocaleDateString() };
        }
        return mi;
      }));
      triggerToast("Bulk Category Migration Complete", `Migrated selected items into "${bulkMoveCatValue}".`, "success");
    }

    setSelectedItems([]);
    setShowBulkConfirmAction(null);
  };

  // CSV menu exporting simulation
  const handleExportCSVMenu = () => {
    if (filteredItemsResult.length === 0) {
      triggerToast("Nothing to export", "No active elements found matching filter rules.", "info");
      return;
    }
    const headers = ["Item SKU", "Item Name", "Price (INR)", "Category", "Veg Flag", "Status", "Rating", "Updated Date"];
    const rows = filteredItemsResult.map(item => [
      (item as any).sku || "N/A",
      item.name,
      item.price.toString(),
      item.category,
      item.isVeg ? "Veg" : "Non-Veg",
      (item as any).availability || "Available",
      (item as any).rating || "4.5",
      (item as any).lastUpdated || "2026"
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedRest?.name.replace(/ /g, "_")}_GooglyMenu_Taxonomy.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast("Data Stream Transmitted", "CSV invoice of current menu structure catalog successfully downloaded.", "success");
  };

  return (
    <div className={`rounded-3xl shadow-xl transition-all border ${
      themeMode === "dark" 
        ? "bg-[#161618] text-gray-200 border-[#2D2D31]" 
        : "bg-white text-gray-800 border-gray-100"
    }`}>
      {/* Top Controller Ribbon */}
      <div className={`p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        themeMode === "dark" ? "border-[#2D2D31] bg-[#1E1E22]/60" : "border-gray-200 bg-gray-50/50"
      }`}>
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
              Menu Configuration Hub
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                themeMode === "dark" ? "bg-red-900 text-[#FF4D5B]" : "bg-red-100 text-[#E23744]"
              }`}>
                Enterprise V2
              </span>
            </h1>
            {/* dark light module switcher */}
            <button
              onClick={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                themeMode === "dark" ? "border-gray-700 bg-gray-800 hover:bg-gray-800 text-amber-400" : "border-gray-300 bg-white hover:bg-gray-50 text-gray-600"
              }`}
              title="Toggle SaaS Layout Variant Theme Mode"
            >
              {themeMode === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Manage global delivery taxonomies, operational pricing thresholds, and compliance availability metrics.</p>
        </div>

        {/* Global Action items */}
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => openCategoryModal(null)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border shadow-sm flex items-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-95 ${
              themeMode === "dark" 
                ? "bg-[#252528] hover:bg-[#2F2F34] border-gray-800 text-gray-100" 
                : "bg-white hover:bg-gray-50 border-gray-200 text-slate-800"
            }`}
          >
            <Layers className="w-4 h-4 text-[#E23744]" /> Add Category
          </button>
          
          <button
            onClick={() => openItemModal(null)}
            className="px-4 py-2.5 bg-[#E23744] hover:bg-red-700 hover:bg-red-600 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95 shadow-[#E23744]/10"
          >
            <Plus className="w-4 h-4 text-white" /> Add New Item
          </button>
        </div>
      </div>

      {/* Grid: Secondary controls */}
      <div className="p-6 space-y-6">
        {/* Row 1: Restaurant Selector with dynamic metrics analysis */}
        <div className={`p-5 rounded-2xl border ${
          themeMode === "dark" ? "bg-[#1E1E22] border-gray-800" : "bg-slate-50/60 border-gray-200/60"
        }`}>
          <div className="flex flex-col lg:flex-row gap-5 items-stretch lg:items-center justify-between">
            {/* Restaurant Selector Dropdown */}
            <div className="space-y-1.5 text-left max-w-sm w-full">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-gray-400">Active Restaurant Boundary</label>
              <div className="relative">
                <select
                  value={selectedRestIdMenu}
                  onChange={(e) => handleRestSelect(e.target.value)}
                  className={`w-full p-3 rounded-xl border font-bold text-xs focus:ring-1 focus:ring-[#E23744] focus:outline-hidden appearance-none cursor-pointer ${
                    themeMode === "dark" ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-200 text-slate-800"
                  }`}
                >
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.cuisine})</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-3.5 pointer-events-none text-gray-400" />
              </div>
            </div>

            {/* Metrics cards */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className={`p-3.5 rounded-xl border text-center ${
                themeMode === "dark" ? "bg-[#252528]/80 border-[#2D2D31]" : "bg-white border-gray-100"
              }`}>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Total Categories</span>
                <strong className="text-xl font-black text-slate-800 block mt-0.5">{totalCategoriesCount}</strong>
              </div>

              <div className={`p-3.5 rounded-xl border text-center ${
                themeMode === "dark" ? "bg-[#252528]/80 border-[#2D2D31]" : "bg-white border-gray-100"
              }`}>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Menu Items</span>
                <strong className="text-xl font-black text-[#E23744] block mt-0.5">{totalItemsCount}</strong>
              </div>

              <div className={`p-3.5 rounded-xl border text-center ${
                themeMode === "dark" ? "bg-[#252528]/80 border-[#2D2D31]" : "bg-white border-gray-100"
              }`}>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Active Orderable</span>
                <strong className="text-xl font-black text-emerald-500 block mt-0.5">{activeItemsCount}</strong>
              </div>

              <div className={`p-3.5 rounded-xl border text-center ${
                themeMode === "dark" ? "bg-[#252528]/80 border-[#2D2D31]" : "bg-white border-gray-100"
              }`}>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Out of Stock</span>
                <strong className="text-xl font-black text-rose-500 block mt-0.5">{oosItemsCount}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Search, Filters & Bulk Actions Toolbar */}
        <div className={`p-4 rounded-2xl border font-sans space-y-4 ${
          themeMode === "dark" ? "bg-[#1E1E22] border-gray-800" : "bg-white border-gray-200"
        }`}>
          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-1.5">
              {(["All", "Veg", "Non-Veg", "Egg", "Available", "Out of Stock", "Hidden"] as const).map(pill => (
                <button
                  key={pill}
                  onClick={() => setQuickFilter(pill)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-black transition-all cursor-pointer ${
                    quickFilter === pill
                      ? "bg-[#E23744] text-white"
                      : themeMode === "dark"
                        ? "bg-gray-800 hover:bg-gray-800 text-gray-300"
                        : "bg-gray-100 hover:bg-gray-200 text-stone-700"
                  }`}
                >
                  {pill}
                </button>
              ))}
            </div>

            <button
              onClick={handleExportCSVMenu}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                themeMode === "dark" 
                  ? "bg-gray-800 border-gray-700 hover:bg-gray-800 text-gray-200" 
                  : "bg-white border-gray-200 hover:bg-gray-50 text-slate-700"
              }`}
            >
              <Download className="w-3.5 h-3.5" /> Export Menu CSV
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search items Input */}
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search food item name, short notes, SKU code or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border focus:outline-hidden focus:ring-1 focus:ring-[#E23744] font-bold ${
                  themeMode === "dark" ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-gray-50 border-gray-200 text-gray-800"
                }`}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")} 
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter by Category */}
            <div className="relative">
              <input
                type="text"
                placeholder="Select / Type Category filter..."
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className={`w-full px-4 py-2 text-xs rounded-xl border focus:outline-hidden focus:ring-1 focus:ring-[#E23744] font-bold ${
                  themeMode === "dark" ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-gray-50 border-gray-200 text-gray-800"
                }`}
              />
              {searchCategory && (
                <button 
                  onClick={() => setSearchCategory("")} 
                  className="absolute right-3 top-2.5 text-gray-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Price boundaries selection */}
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="₹ Min Price"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className={`w-full px-2 py-2 text-xs rounded-xl border focus:outline-hidden font-bold ${
                  themeMode === "dark" ? "bg-gray-900 border-gray-800 text-gray-100" : "bg-gray-50 border-gray-200 text-gray-800"
                }`}
              />
              <span className="text-gray-400">to</span>
              <input
                type="number"
                placeholder="₹ Max Price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className={`w-full px-2 py-2 text-xs rounded-xl border focus:outline-hidden font-bold ${
                  themeMode === "dark" ? "bg-gray-900 border-gray-800 text-gray-100" : "bg-gray-50 border-gray-200 text-gray-800"
                }`}
              />
              {(minPrice || maxPrice) && (
                <button 
                  onClick={() => { setMinPrice(""); setMaxPrice(""); }} 
                  className="p-1 rounded bg-red-50 text-red-600 font-bold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Bulk operation controls section */}
          {selectedItems.length > 0 && (
            <div className="p-3 bg-[#E23744]/5 rounded-xl border border-[#E23744]/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                <span>Selected: <strong className="text-[#E23744]">{selectedItems.length} menu items</strong></span>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={() => setShowBulkConfirmAction("enable")}
                  className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-bold"
                >
                  Mark Active
                </button>
                <button
                  onClick={() => setShowBulkConfirmAction("disable")}
                  className="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded font-bold"
                >
                  Mark Out of Stock
                </button>
                
                {/* Move category drop trigger */}
                <div className="flex items-center gap-1">
                  <select
                    value={bulkMoveCatValue}
                    onChange={(e) => {
                      setBulkMoveCatValue(e.target.value);
                      if (e.target.value) {
                        setShowBulkConfirmAction("move");
                      }
                    }}
                    className={`max-w-[130px] p-1 border font-bold text-[10px] rounded ${
                      themeMode === "dark" ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-800 border-gray-200"
                    }`}
                  >
                    <option value="">Move category...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setShowBulkConfirmAction("delete")}
                  className="px-2.5 py-1.5 bg-[#1C1C1C] hover:bg-black text-white rounded font-black flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Purge Selected
                </button>
                
                <button
                  onClick={() => setSelectedItems([])}
                  className="p-1 px-2 hover:bg-gray-200 text-gray-500 rounded font-bold"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic List Rendering */}
        {isLoading ? (
          /* Skeletons Loader view */
          <div className="space-y-4">
            {[1, 2, 3].map(sk => (
              <div key={sk} className="space-y-3 bg-gray-50/40 p-5 rounded-2xl animate-pulse text-left border border-gray-100">
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                <div className="h-16 bg-gray-100 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : filteredItemsResult.length === 0 && searchQuery ? (
          /* Empty Search results matching layout constraint */
          <div className="p-12 text-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-16">
            <div className="text-4xl text-gray-300 font-bold mb-3">🔍</div>
            <h3 className="text-sm font-bold text-gray-700">No matching culinary assets located</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1 leading-normal">
              Your filtering bounds yields zero results. Revise search identifiers or clear the parameters below to reset the hierarchy list tree.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchCategory("");
                setQuickFilter("All");
                setMinPrice("");
                setMaxPrice("");
              }}
              className="mt-4 px-4 py-2 bg-gray-900 bg-gray-900 hover:bg-black text-white font-black text-xs rounded-xl cursor-pointer"
            >
              Clear Filtering Bounds
            </button>
          </div>
        ) : (
          /* CORE TAXONOMY TREE STRUCTURE VIEWPORT */
          <div className="space-y-6">
            {categories.map((cat, catIdx) => {
              // Filters match items specifically nested in this category branch
              const visibleItemsInBranch = filteredItemsResult.filter(mi => mi.category === cat.name);
              
              // Toggle expanded default
              const isExpanded = expandedCats[cat.name] !== false;

              return (
                <div 
                  key={cat.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnCategory(e, cat.name)}
                  className={`rounded-2xl border transition-all overflow-hidden text-left ${
                    !cat.active ? "opacity-55" : ""
                  } ${
                    themeMode === "dark" 
                      ? "bg-[#1E1E22] border-gray-800" 
                      : "bg-white border-slate-100 shadow-sm"
                  }`}
                >
                  {/* Category Node Head line */}
                  <div className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dashed transition-colors ${
                    themeMode === "dark" 
                      ? "border-gray-800 bg-[#232328]" 
                      : "border-gray-200 bg-slate-50/50 hover:bg-slate-50"
                  }`}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        onClick={() => toggleCatExpand(cat.name)}
                        className="p-1 hover:bg-gray-200 hover:bg-gray-200/50 rounded text-gray-400"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>

                      {cat.image && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-gray-200 bg-white">
                          <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}

                      <div className="truncate text-left">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-xs text-gray-800">{cat.name}</h3>
                          <span className="text-[9px] bg-slate-100 text-stone-600 font-extrabold px-1.5 py-0.5 rounded-sm">
                            {visibleItemsInBranch.length} items
                          </span>
                          {!cat.active && (
                            <span className="text-[8px] bg-amber-50 text-amber-800 font-bold px-1 rounded uppercase">Inactive</span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 truncate max-w-md">{cat.description}</p>
                      </div>
                    </div>

                    {/* Category Command Triggers */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {/* Priority Sort arrows */}
                      <div className="flex items-center gap-0.5 border border-gray-200 rounded-lg bg-white p-0.5">
                        <button
                          disabled={catIdx === 0}
                          onClick={() => handleMoveCategoryPriority(catIdx, "up")}
                          className="p-1 hover:bg-slate-100 rounded text-gray-400 disabled:opacity-30 cursor-pointer"
                          title="Increase category menu display priority order"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          disabled={catIdx === categories.length - 1}
                          onClick={() => handleMoveCategoryPriority(catIdx, "down")}
                          className="p-1 hover:bg-slate-100 rounded text-gray-400 disabled:opacity-30 cursor-pointer"
                          title="Decrease category menu display priority order"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Add Item trigger directly to this branch */}
                      <button
                        onClick={() => {
                          openItemModal();
                          setItemForm(prev => ({ ...prev, category: cat.name }));
                        }}
                        className="px-2 py-1 bg-[#E23744]/10 hover:bg-[#E23744]/20 text-[#E23744] text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        title="Add item directly inside this category"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>

                      {/* Three-dots mini dropdown popover */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCat3Dots(activeCat3Dots === cat.id ? null : cat.id);
                          }}
                          className={`p-1.5 rounded-lg border hover:bg-gray-100 transition-colors cursor-pointer ${
                            themeMode === "dark" ? "border-gray-700 hover:bg-gray-800" : "border-gray-200 bg-white"
                          }`}
                        >
                          <MoreVertical className="w-4.5 h-4.5 text-gray-400" />
                        </button>

                        {activeCat3Dots === cat.id && (
                          <div className={`absolute right-0 mt-1 w-44 rounded-xl shadow-xl z-10 text-xs border p-1 ${
                            themeMode === "dark" ? "bg-[#1E1E22] border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-800"
                          }`} onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => { openCategoryModal(cat); setActiveCat3Dots(null); }}
                              className="w-full text-left p-2 hover:bg-gray-50 rounded-lg font-bold flex items-center gap-1.5"
                            >
                              <Edit className="w-3.5 h-3.5 text-[#E23744]" /> Edit Category Details
                            </button>
                            <button
                              onClick={() => {
                                setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, active: !c.active } : c));
                                triggerToast("Category Status Switched", `Visibility toggled for "${cat.name}".`, "info");
                                setActiveCat3Dots(null);
                              }}
                              className="w-full text-left p-2 hover:bg-gray-50 rounded-lg font-bold flex items-center gap-1.5"
                            >
                              {cat.active ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5 text-emerald-600" />}
                              {cat.active ? "Hide Category" : "Show Category"}
                            </button>
                            <button
                              onClick={() => { setCatToDelete(cat); setActiveCat3Dots(null); }}
                              className="w-full text-left p-2 hover:bg-red-50 text-red-600 rounded-lg font-black border-t border-gray-100 flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete Category Branch
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Category branch items */}
                  {isExpanded && (
                    <div className={`divide-y transition-all ${
                      themeMode === "dark" ? "divide-gray-750" : "divide-gray-100"
                    }`}>
                      {visibleItemsInBranch.map(item => {
                        const isSelectedInBulk = selectedItems.includes(item.id);
                        const av = (item as any).availability || "Available";
                        
                        return (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            className={`p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:bg-gray-50/40 cursor-grab active:cursor-grabbing relative ${
                              isSelectedInBulk ? "bg-red-50/15" : ""
                            }`}
                          >
                            {/* Left Section: Checkbox, Drag handle, Image name details */}
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              {/* Drag anchor tag visual */}
                              <div className="text-gray-300 p-1 hover:text-gray-400 self-center hidden sm:block">
                                <Move className="w-4 h-4 cursor-drag" />
                              </div>

                              {/* Bulk check */}
                              <button
                                type="button"
                                onClick={() => toggleItemBulkSelection(item.id)}
                                className="p-1 hover:bg-gray-100 rounded self-center"
                              >
                                {isSelectedInBulk ? (
                                  <CheckSquare className="w-4 h-4 text-[#E23744]" />
                                ) : (
                                  <Square className="w-4 h-4 text-gray-300" />
                                )}
                              </button>

                              {/* Fast food icon layout */}
                              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-gray-200 bg-white relative">
                                <img 
                                  src={item.image || "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=100&q=80"} 
                                  alt={item.name} 
                                  className="w-full h-full object-cover" 
                                  referrerPolicy="no-referrer"
                                />

                                {/* Mini Dot marker overlay */}
                                <div className="absolute top-1 right-1 bg-white p-0.5 rounded-sm">
                                  <span className={`w-2 h-2 rounded-full block border ${
                                    (item as any).foodType === "Egg" 
                                      ? "bg-amber-400 border-amber-600"
                                      : item.isVeg 
                                        ? "bg-green-500 border-green-700" 
                                        : "bg-red-500 border-red-700"
                                  }`}></span>
                                </div>
                              </div>

                              {/* Text descriptors */}
                              <div className="truncate text-left min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <h4 
                                    onClick={() => setViewingItemDetail(item)}
                                    className="font-bold text-gray-900 hover:text-[#E23744] transition-colors cursor-pointer text-xs truncate"
                                  >
                                    {item.name}
                                  </h4>

                                  {/* Food classification badges */}
                                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded-sm border ${
                                    (item as any).foodType === "Egg"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : item.isVeg 
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                        : "bg-rose-50 text-rose-700 border-rose-200"
                                  }`}>
                                    {(item as any).foodType || (item.isVeg ? "Veg" : "Non-Veg")}
                                  </span>

                                  {/* Availability badge */}
                                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded-sm ${
                                    av === "Available" 
                                      ? "bg-emerald-100 text-emerald-800" 
                                      : av === "Out of Stock"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-stone-200 text-stone-700 bg-gray-200"
                                  }`}>
                                    {av}
                                  </span>
                                </div>
                                
                                <p className="text-[10px] text-gray-400 mt-0.5 truncate leading-relaxed">
                                  {(item as any).shortDescription || item.description}
                                </p>

                                <div className="flex items-center gap-2 mt-1.5 text-gray-400 text-[9px] font-semibold">
                                  <span>SKU: <strong className="font-mono text-gray-500">{(item as any).sku || `PRD-${item.id.slice(-4)}`}</strong></span>
                                  <span>•</span>
                                  <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {(item as any).rating || "4.5"}</span>
                                  <span>•</span>
                                  <span>Updated: {(item as any).lastUpdated || "Today"}</span>
                                </div>
                              </div>
                            </div>

                            {/* Middle Section: Pricing pricing discount details */}
                            <div className="flex items-center gap-4 text-left self-end md:self-center shrink-0">
                              <div className="text-right">
                                {(item as any).discountPrice ? (
                                  <div>
                                    <span className="text-[10px] line-through text-gray-400 mr-1.5 font-bold">₹{item.price}</span>
                                    <strong className="text-xs font-black text-[#E23744]">₹{(item as any).discountPrice}</strong>
                                    <span className="text-[8px] block text-emerald-600 font-extrabold font-mono">
                                      Save {Math.round((1 - (item as any).discountPrice / item.price) * 100)}%
                                    </span>
                                  </div>
                                ) : (
                                  <strong className="text-xs font-black text-gray-800">₹{item.price}</strong>
                                )}
                              </div>

                              {/* Fast inline status toggle */}
                              <div className="relative inline-flex items-center">
                                <select
                                  value={av}
                                  onChange={(e) => {
                                    const nextAv = e.target.value as any;
                                    setMenuItems(prev => prev.map(mi => mi.id === item.id ? { ...mi, availability: nextAv, lastUpdated: new Date().toLocaleDateString() } : mi));
                                    triggerToast("Availability Transmuted", `"${item.name}" marked: ${nextAv}.`, "info");
                                  }}
                                  className={`p-1.5 border font-extrabold text-[10px] rounded-lg cursor-pointer ${
                                    av === "Available" ? "border-emerald-200 bg-emerald-50 text-emerald-800" :
                                    av === "Out of Stock" ? "border-red-200 bg-red-50 text-red-800" : "border-gray-300 bg-gray-50 text-gray-600"
                                  }`}
                                >
                                  <option value="Available">Available</option>
                                  <option value="Out of Stock">Out of Stock</option>
                                  <option value="Hidden">Hidden (Privatized)</option>
                                </select>
                              </div>

                              {/* Three-dots item trigger menu */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveItem3Dots(activeItem3Dots === item.id ? null : item.id);
                                  }}
                                  className={`p-1 rounded-lg border hover:bg-gray-100 cursor-pointer ${
                                    themeMode === "dark" ? "border-gray-700 hover:bg-gray-800" : "border-gray-200 bg-white"
                                  }`}
                                >
                                  <MoreVertical className="w-4 h-4 text-gray-400" />
                                </button>

                                {activeItem3Dots === item.id && (
                                  <div className={`absolute right-0 mt-1 w-44 rounded-xl shadow-xl z-20 border p-1 text-left ${
                                    themeMode === "dark" ? "bg-[#1E1E22] border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-800"
                                  }`} onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      onClick={() => { setViewingItemDetail(item); setActiveItem3Dots(null); }}
                                      className="w-full text-left p-2 hover:bg-gray-50 rounded-lg font-bold flex items-center gap-1.5"
                                    >
                                      <Info className="w-3.5 h-3.5 text-blue-500" /> View Item Details
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { openItemModal(item); setActiveItem3Dots(null); }}
                                      className="w-full text-left p-2 hover:bg-gray-50 rounded-lg font-bold flex items-center gap-1.5"
                                    >
                                      <Edit className="w-3.5 h-3.5 text-[#E23744]" /> Edit Item Details
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { handleDuplicateItem(item); setActiveItem3Dots(null); }}
                                      className="w-full text-left p-2 hover:bg-gray-50 rounded-lg font-bold flex items-center gap-1.5"
                                    >
                                      <Copy className="w-3.5 h-3.5 text-purple-500" /> Duplicate Item Card
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextAv = av === "Available" ? "Out of Stock" : "Available";
                                        setMenuItems(prev => prev.map(mi => mi.id === item.id ? { ...mi, availability: nextAv, lastUpdated: new Date().toLocaleDateString() } : mi));
                                        triggerToast("Stock Altered", `Changed to ${nextAv}.`, "info");
                                        setActiveItem3Dots(null);
                                      }}
                                      className="w-full text-left p-2 hover:bg-gray-50 rounded-lg font-bold flex items-center gap-1.5"
                                    >
                                      <AlertCircle className="w-3.5 h-3.5 text-zinc-500" /> Mark OOS / In Stock
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setItemToDelete(item); setActiveItem3Dots(null); }}
                                      className="w-full text-left p-2 hover:bg-red-50 text-red-600 rounded-lg font-black border-t border-gray-100 flex items-center gap-1.5"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" /> Delete permanently
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {visibleItemsInBranch.length === 0 && (
                        <div className="p-6 text-center text-gray-400 text-[11px] font-medium font-sans">
                          No orderable assets available inside this brand category.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- ADD / EDIT ITEM SYSTEM SLIDE-OVER DRAWER --- */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-end z-55 p-0 antialiased">
          <div 
            onClick={() => setShowAddItemModal(false)}
            className="absolute inset-0 cursor-pointer"
          ></div>

          <div className={`w-full max-w-lg h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between animate-slide-in-right relative rounded-l-3xl ${
            themeMode === "dark" ? "bg-[#1E1E22] text-gray-100" : "bg-white text-gray-800"
          }`}>
            <div className="space-y-6">
              {/* Header Title */}
              <div className="flex justify-between items-center border-b pb-4 border-gray-200">
                <div className="text-left">
                  <span className="text-[9px] text-[#E23744] font-black uppercase tracking-wider block">Enterprise Product Editor</span>
                  <h2 className="text-base font-black text-gray-900">{editingItem ? "Refine Product Card Details" : "Publish New Culinary Asset"}</h2>
                </div>
                <button 
                  onClick={() => setShowAddItemModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-full cursor-pointer text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form viewport */}
              <form onSubmit={handleSaveItem} className="space-y-5 text-left text-xs font-semibold text-gray-700">
                
                {/* Visual Type selector with Green, Red, Yellow indications */}
                <div className="space-y-2">
                  <label className="block text-gray-500 font-bold">Food Classification Type *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: "Veg", label: "Pure Veg", color: "bg-green-500 border-green-700", ring: "focus:ring-green-400" },
                      { type: "Non-Veg", label: "Non-Veg", color: "bg-red-500 border-red-700", ring: "focus:ring-red-400" },
                      { type: "Egg", label: "Eggitarian", color: "bg-amber-400 border-amber-600", ring: "focus:ring-amber-400" }
                    ].map(item => (
                      <label 
                        key={item.type}
                        className={`border rounded-xl p-3 flex items-center gap-2 cursor-pointer transition-all ${
                          itemForm.foodType === item.type
                            ? themeMode === "dark"
                              ? "bg-gray-800 border-stone-500 text-white"
                              : "bg-[#E23744]/5 border-[#E23744] text-slate-900"
                            : "bg-white border-gray-200 text-gray-500"
                        }`}
                      >
                        <input
                          type="radio"
                          name="foodType"
                          value={item.type}
                          checked={itemForm.foodType === item.type}
                          onChange={() => setItemForm(prev => ({ ...prev, foodType: item.type as any }))}
                          className="mr-1 accent-[#E23744]"
                        />
                        <span className={`w-3 h-3 rounded-full border ${item.color}`}></span>
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Section A: Product Identification */}
                <div className="space-y-3.5">
                  <h3 className="text-[10px] uppercase tracking-widest text-[#E23744] font-black border-b pb-1.5">A. Basic Product Definition</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-500 mb-1 font-bold">Food Item Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Pepperoni Deluxe Slice"
                        value={itemForm.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setItemForm(prev => ({ ...prev, name: val }));
                          if (itemFormErrors.name) setItemFormErrors(prev => ({ ...prev, name: "" }));
                        }}
                        className={`w-full border rounded-xl p-2.5 text-xs font-bold ${
                          itemFormErrors.name ? "border-red-500" : "border-gray-200 bg-white"
                        }`}
                      />
                      {itemFormErrors.name && <p className="text-[10px] text-red-500 mt-0.5">{itemFormErrors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-gray-500 mb-1 font-bold">Taxonomy Category *</label>
                      <select
                        value={itemForm.category}
                        onChange={(e) => setItemForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl p-2.5 text-xs bg-white font-bold cursor-pointer"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-500 mb-1 font-bold">SKU Registry Code (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. PRD-881290"
                        value={itemForm.sku}
                        onChange={(e) => setItemForm(prev => ({ ...prev, sku: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-mono font-bold bg-gray-50/50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-500 mb-1 font-bold">Catalog Short Tagline</label>
                      <input
                        type="text"
                        placeholder="e.g. Smoked crust layered extra hot cheese."
                        value={itemForm.shortDescription}
                        onChange={(e) => setItemForm(prev => ({ ...prev, shortDescription: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-bold bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-500 mb-1 font-bold">Full Ingredients Description</label>
                    <textarea
                      placeholder="List details of culinary process, allergen warnings, or seasoning parameters..."
                      value={itemForm.description}
                      onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-semibold bg-white"
                    ></textarea>
                  </div>
                </div>

                {/* Section B: Pricing Ledger */}
                <div className="space-y-3.5">
                  <h3 className="text-[10px] uppercase tracking-widest text-[#E23744] font-black border-b pb-1.5">B. Pricing & Financial Ledger</h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-gray-500 mb-1 font-bold">Base Price (INR) *</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-gray-400">₹</span>
                        <input
                          type="number"
                          required
                          placeholder="380"
                          value={itemForm.price}
                          onChange={(e) => {
                            setItemForm(prev => ({ ...prev, price: e.target.value }));
                            if (itemFormErrors.price) setItemFormErrors(prev => ({ ...prev, price: "" }));
                          }}
                          className={`w-full border pl-6 pr-2 py-2 text-xs font-bold rounded-xl ${
                            itemFormErrors.price ? "border-red-500" : "border-gray-200 bg-white"
                          }`}
                        />
                      </div>
                      {itemFormErrors.price && <p className="text-[9px] text-red-500 mt-0.5">{itemFormErrors.price}</p>}
                    </div>

                    <div>
                      <label className="block text-gray-500 mb-1 font-bold">Offer Price</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-gray-400">₹</span>
                        <input
                          type="number"
                          placeholder="Optional"
                          value={itemForm.discountPrice}
                          onChange={(e) => {
                            setItemForm(prev => ({ ...prev, discountPrice: e.target.value }));
                            if (itemFormErrors.discountPrice) setItemFormErrors(prev => ({ ...prev, discountPrice: "" }));
                          }}
                          className={`w-full border pl-6 pr-2 py-2 text-xs font-bold rounded-xl ${
                            itemFormErrors.discountPrice ? "border-red-500" : "border-gray-200 bg-white"
                          }`}
                        />
                      </div>
                      {itemFormErrors.discountPrice && <p className="text-[9px] text-red-500 mt-0.5">{itemFormErrors.discountPrice}</p>}
                    </div>

                    <div>
                      <label className="block text-gray-500 mb-1 font-bold">Tax GST (%)</label>
                      <select
                        value={itemForm.taxPercent}
                        onChange={(e) => setItemForm(prev => ({ ...prev, taxPercent: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl p-2 text-xs bg-white font-bold cursor-pointer"
                      >
                        <option value="0">0% (GST Free)</option>
                        <option value="5">5% (Fast-Food)</option>
                        <option value="12">12% (Beverages)</option>
                        <option value="18">18% (Luxury Delicacies)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-500 mb-1 font-bold">Packaging Fee</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-gray-400">₹</span>
                        <input
                          type="number"
                          value={itemForm.packagingCharge}
                          onChange={(e) => setItemForm(prev => ({ ...prev, packagingCharge: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl pl-6 pr-2 py-2 text-xs font-bold bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section C: Premium Image Drag & Drop area */}
                <div className="space-y-3">
                  <h3 className="text-[10px] uppercase tracking-widest text-[#E23744] font-black border-b pb-1.5">C. Marketing Cover Image</h3>
                  
                  <div 
                    onDragEnter={handleDragFile}
                    onDragOver={handleDragFile}
                    onDragLeave={handleDragFile}
                    onDrop={handleDropFile}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all relative ${
                      dragActive 
                        ? "border-[#E23744] bg-[#E23744]/5" 
                        : themeMode === "dark" 
                          ? "border-gray-700 bg-gray-900/80 hover:bg-gray-800" 
                          : "border-gray-200 bg-gray-50/50 hover:bg-red-50/10"
                    }`}
                  >
                    <input
                      type="file"
                      id="upload-item-file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={selectDeviceFile}
                    />

                    {itemForm.image ? (
                      <div className="space-y-3">
                        <div className="w-24 h-24 rounded-xl overflow-hidden mx-auto border border-gray-300 relative shadow-md">
                          <img src={itemForm.image} alt="Crop Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="text-[10px] text-gray-400 flex flex-wrap justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowCropModal(true)}
                            className="px-2.5 py-1 bg-white border rounded text-stone-700 font-bold"
                          >
                            🎨 Crop Image
                          </button>
                          <label
                            htmlFor="upload-item-file"
                            className="px-2.5 py-1 bg-white border rounded text-[#E23744] font-bold cursor-pointer"
                          >
                            Replace
                          </label>
                          <button
                            type="button"
                            onClick={() => setItemForm(prev => ({ ...prev, image: "" }))}
                            className="px-2.5 py-1 bg-white border rounded text-red-700 font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label htmlFor="upload-item-file" className="cursor-pointer space-y-1 block">
                        <Upload className="w-6 h-6 mx-auto text-[#E23744] mb-1 animate-bounce" />
                        <span className="text-[11px] font-black text-slate-800 block">Drag & Drop Cover Photo here</span>
                        <span className="text-[9px] text-[#E23744] block font-black">or click to browse local files</span>
                        <span className="text-[9px] text-gray-400 block font-normal">Formats: PNG, JPG, JPEG, WEBP | Limit: 10MB (1000x1000px recommended)</span>
                      </label>
                    )}

                    {/* Progress Loader simulation */}
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/90 rounded-2xl flex flex-col items-center justify-center p-4">
                        <div className="w-full max-w-[150px] bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-[#E23744] h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                        <span className="text-[10px] text-gray-500 font-extrabold mt-1.5">Uploading payload... {uploadProgress}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section D: Add-ons Configuration */}
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center border-b pb-1.5">
                    <h3 className="text-[10px] uppercase tracking-widest text-[#E23744] font-black">D. Add-ons Configuration</h3>
                    <span className="text-[10px] text-gray-400 font-normal">Customize extra additions</span>
                  </div>

                  {/* Addon Inputs Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <div className="sm:col-span-2">
                      <label className="text-[9px] text-gray-400 font-bold block mb-0.5">Add-on Item Designation</label>
                      <input
                        type="text"
                        placeholder="e.g. Extra Cheese Melt"
                        value={newAddOn.name}
                        onChange={(e) => setNewAddOn(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full border border-gray-200 rounded p-1 text-[11px] font-bold"
                      />
                    </div>
                    
                    <div>
                      <label className="text-[9px] text-gray-400 font-bold block mb-0.5">Price (INR)</label>
                      <input
                        type="number"
                        placeholder="60"
                        value={newAddOn.price}
                        onChange={(e) => setNewAddOn(prev => ({ ...prev, price: e.target.value }))}
                        className="w-full border border-gray-200 rounded p-1 text-[11px] font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-gray-400 font-bold block mb-0.5">Max Qty</label>
                      <input
                        type="number"
                        value={newAddOn.maxQty}
                        onChange={(e) => setNewAddOn(prev => ({ ...prev, maxQty: e.target.value }))}
                        className="w-full border border-gray-200 rounded p-1 text-[11px] font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center justify-between text-[11px] pt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newAddOn.required}
                          onChange={(e) => setNewAddOn(prev => ({ ...prev, required: e.target.checked }))}
                          className="accent-[#E23744]"
                        />
                        <span>Required / Mandatory Toggle</span>
                      </label>
                    </div>

                    <div className="sm:col-span-2 text-right pt-1">
                      <button
                        type="button"
                        onClick={handleAddLocalAddOn}
                        className="p-1 px-3 bg-[#E23744] text-white rounded font-bold hover:bg-red-700 text-[10px] cursor-pointer"
                      >
                        Append Add-on
                      </button>
                    </div>
                  </div>

                  {/* Addons List Stack reorderable */}
                  {addOnsStack.length > 0 && (
                    <div className="space-y-1 bg-white border border-gray-200 rounded-xl max-h-40 overflow-y-auto p-2">
                      {addOnsStack.map((add, addIdx) => (
                        <div key={add.id} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between text-[11px] font-bold text-slate-800">
                          <div className="flex items-center gap-1 truncate">
                            {/* Sorting arrow controls inside add-on list */}
                            <div className="flex flex-col">
                              <button 
                                disabled={addIdx === 0} 
                                onClick={() => handleMoveAddOnOrder(addIdx, "up")} 
                                className="text-gray-300 hover:text-gray-600 disabled:opacity-30"
                              >
                                ▲
                              </button>
                              <button 
                                disabled={addIdx === addOnsStack.length - 1} 
                                onClick={() => handleMoveAddOnOrder(addIdx, "down")} 
                                className="text-gray-300 hover:text-gray-600 disabled:opacity-30"
                              >
                                ▼
                              </button>
                            </div>
                            <span className="truncate">{add.name}</span>
                            <span className="text-gray-400 font-normal">({add.required ? "Required" : "Optional"}, Max: {add.maxQty})</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span>+ ₹{add.price}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveLocalAddOn(add.id)}
                              className="text-red-500 hover:text-red-700 font-bold"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section E: Live Availability defaults */}
                <div className="space-y-2 text-left">
                  <label className="block text-gray-500 font-bold">Standard Availability Configuration *</label>
                  <select
                    value={itemForm.availability}
                    onChange={(e) => setItemForm(prev => ({ ...prev, availability: e.target.value as any }))}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs bg-white font-bold cursor-pointer"
                  >
                    <option value="Available">Available (Visible & orderable instantly)</option>
                    <option value="Out of Stock">Out of Stock (Visible, but locked from orders)</option>
                    <option value="Hidden">Hidden (Completely Privatized from consumer index)</option>
                  </select>
                </div>

              </form>
            </div>

            {/* Form Footer Action Controllers */}
            <div className="mt-8 pt-4 border-t border-gray-100 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAddItemModal(false)}
                className="px-4 py-2 hover:bg-gray-100 text-stone-700 rounded-xl font-bold cursor-pointer"
              >
                Close Editor
              </button>
              
              <button
                type="button"
                onClick={handleSaveItem}
                className="px-5 py-2.5 bg-[#E23744] hover:bg-red-600 text-white rounded-xl font-black shadow-md shadow-[#E23744]/10 cursor-pointer"
              >
                {editingItem ? "Refine Product Bounds" : "Publish to Delivery Tree"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT CATEGORY TAXONOMY MODAL --- */}
      {showAddCatModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-55 p-4">
          <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scale-up border-t-8 border-[#E23744] ${
            themeMode === "dark" ? "bg-[#1E1E22] text-gray-100" : "bg-white text-gray-800"
          }`}>
            <div className="text-left space-y-1 pb-3 border-b">
              <span className="text-[9px] text-[#E23744] font-black uppercase tracking-widest block">Taxonomy Config Node</span>
              <h3 className="text-sm font-black text-gray-900">{editingCategory ? "Alter Category Config" : "Deploy Taxonomy Node"}</h3>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 pt-3.5 text-left text-xs font-semibold text-gray-700">
              <div>
                <label className="block text-gray-500 mb-1 font-bold">Category Name ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Starters / Beverages / Deserts"
                  value={catForm.name}
                  onChange={(e) => {
                    setCatForm(prev => ({ ...prev, name: e.target.value }));
                    if (catFormErrors.name) setCatFormErrors(prev => ({ ...prev, name: "" }));
                  }}
                  className={`w-full border rounded-xl p-2.5 text-xs font-bold ${
                    catFormErrors.name ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {catFormErrors.name && <p className="text-[10px] text-red-500 mt-0.5">{catFormErrors.name}</p>}
              </div>

              <div>
                <label className="block text-gray-500 mb-1 font-bold">Category Description Tag</label>
                <input
                  type="text"
                  placeholder="e.g. Gourmet soft drinks and compound mocktails."
                  value={catForm.description}
                  onChange={(e) => setCatForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 mb-1 font-bold">Visual Image URL</label>
                  <input
                    type="text"
                    placeholder="https://unsplash..."
                    value={catForm.image}
                    onChange={(e) => setCatForm(prev => ({ ...prev, image: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 mb-1 font-bold">Display Sort Priority *</label>
                  <input
                    type="number"
                    required
                    value={catForm.priority}
                    onChange={(e) => {
                      setCatForm(prev => ({ ...prev, priority: e.target.value }));
                      if (catFormErrors.priority) setCatFormErrors(prev => ({ ...prev, priority: "" }));
                    }}
                    className={`w-full border rounded-xl p-2.5 text-xs font-bold ${
                      catFormErrors.priority ? "border-red-500" : "border-gray-200"
                    }`}
                  />
                  {catFormErrors.priority && <p className="text-[10px] text-red-500 mt-0.5">{catFormErrors.priority}</p>}
                </div>
              </div>

              <div>
                <label className="block text-gray-500 mb-1 font-bold">Status (Active / Inactive) *</label>
                <select
                  value={catForm.active}
                  onChange={(e) => setCatForm(prev => ({ ...prev, active: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs bg-white font-bold cursor-pointer"
                >
                  <option value="true">Active (Visible inside menu tree)</option>
                  <option value="false">Inactive (Privatize all items recursively)</option>
                </select>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="flex-grow py-2.5 bg-gray-100 hover:bg-gray-200 text-stone-700 font-bold rounded-xl text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-grow py-2.5 bg-[#E23744] hover:bg-red-700 text-white font-extrabold rounded-xl text-center shadow-md cursor-pointer"
                >
                  Save Category
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- IMAGE CRAPPING SIMULATION MODAL --- */}
      {showCropModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-55 p-4">
          <div className="bg-[#1C1C1E] text-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-5 text-center">
            <div className="text-left border-b border-gray-800 pb-3">
              <span className="text-[8px] uppercase font-black text-[#E23744]">Smart Media Cropping Engine</span>
              <h3 className="text-sm font-black">Crop & Rotate Asset</h3>
            </div>

            {/* Interactive Image box */}
            <div className="w-56 h-56 rounded-2xl mx-auto border-2 border-dashed border-gray-700 overflow-hidden relative flex items-center justify-center bg-black/40">
              <div 
                className="w-40 h-40 border-4 border-emerald-400 rounded-xl overflow-hidden relative shadow-lg"
                style={{
                  transform: `scale(${cropScale}) rotate(${cropRotate}deg)`,
                  transition: "transform 0.15s ease-out"
                }}
              >
                <img 
                  src={itemForm.image || "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80"} 
                  alt="Crop Target"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Slider triggers */}
            <div className="space-y-3.5 text-xs text-gray-400">
              <div className="space-y-1">
                <div className="flex justify-between"><span>Zoom scale factor</span><span>{cropScale.toFixed(2)}x</span></div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={cropScale}
                  onChange={(e) => setCropScale(parseFloat(e.target.value))}
                  className="w-full accent-[#E23744]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between"><span>Compass angle rotation</span><span>{cropRotate}°</span></div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={cropRotate}
                  onChange={(e) => setCropRotate(parseInt(e.target.value))}
                  className="w-full accent-[#E23744]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setCropScale(1);
                  setCropRotate(0);
                  setShowCropModal(false);
                }}
                className="flex-grow py-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg"
              >
                Discard Adjusts
              </button>
              <button
                onClick={() => {
                  triggerToast("Crop applied", "Generated dynamic mock crop matrices. Visual frame registered.", "success");
                  setShowCropModal(false);
                }}
                className="flex-grow py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-lg"
              >
                Bind Crop bounds
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ITEM DETAILS SLIDE-OVER DRAWER --- */}
      {viewingItemDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-end z-55 p-0 antialiased font-sans">
          <div 
            className="absolute inset-0 cursor-pointer"
            onClick={() => setViewingItemDetail(null)}
          ></div>

          <div className="w-full max-w-sm h-full bg-white text-gray-800 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto rounded-l-3xl animate-slide-in-right relative">
            <div className="space-y-6">
              
              {/* Header Cover Banner */}
              <div className="h-44 bg-gray-100 rounded-2xl relative overflow-hidden shrink-0 border border-gray-200">
                <img 
                  src={viewingItemDetail.image || "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80"} 
                  alt={viewingItemDetail.name} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={() => setViewingItemDetail(null)}
                  className="absolute top-3 right-3 p-1.5 bg-black/40 text-white hover:bg-black/65 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute top-3 left-3 bg-white p-1 rounded-md">
                  <span className={`w-3 h-3 rounded-full block border ${
                    (viewingItemDetail as any).foodType === "Egg" 
                      ? "bg-amber-400 border-amber-600"
                      : viewingItemDetail.isVeg 
                        ? "bg-green-500 border-green-700" 
                        : "bg-red-500 border-red-700"
                  }`}></span>
                </div>
              </div>

              {/* Title & tags */}
              <div className="text-left space-y-1.5">
                <div className="flex gap-2.5 flex-wrap items-center">
                  <span className="text-[9px] bg-red-100 text-[#E23744] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm">
                    {viewingItemDetail.category}
                  </span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm ${
                    ((viewingItemDetail as any).availability || "Available") === "Available" 
                      ? "bg-emerald-100 text-emerald-800" 
                      : "bg-red-100 text-red-900"
                  }`}>
                    {(viewingItemDetail as any).availability || "Available"}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">{viewingItemDetail.name}</h3>
                <p className="text-[10px] font-bold text-gray-400 font-mono">REGISTRY SKU ID: {(viewingItemDetail as any).sku || `PRD-F0${viewingItemDetail.id.slice(-4)}`}</p>
              </div>

              {/* Details card info */}
              <div className="space-y-4 text-xs text-left">
                
                {/* Brand description text */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Culinary Specification</span>
                  <p className="text-stone-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {viewingItemDetail.description}
                  </p>
                </div>

                {/* Pricing section info */}
                <div className="border border-gray-200 rounded-2xl p-4 bg-white/60 space-y-2.5">
                  <span className="font-bold text-slate-800 block border-b pb-1.5 flex items-center gap-1">
                    💰 Financial Breakdown Analysis
                  </span>
                  <div className="space-y-1.5 text-slate-700 font-medium">
                    <div className="flex justify-between"><span>Base Listing Price:</span><strong className="text-gray-900">₹{viewingItemDetail.price}</strong></div>
                    {(viewingItemDetail as any).discountPrice && (
                      <div className="flex justify-between text-[#E23744]"><span>Provisional Dispatched Discount:</span><strong>₹{(viewingItemDetail as any).discountPrice}</strong></div>
                    )}
                    <div className="flex justify-between"><span>Tax Rate Bind (GST):</span><strong className="text-gray-900">{(viewingItemDetail as any).taxPercent || "@5"}% inclusive</strong></div>
                    <div className="flex justify-between"><span>Packaging Levy charges:</span><strong className="text-gray-900">₹{(viewingItemDetail as any).packagingCharge || "15"}</strong></div>
                  </div>
                </div>

                {/* Add-ons list details */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Linked Addon Extra Bundles ({(viewingItemDetail as any).addOnsConfig?.length || 0})</span>
                  
                  {((viewingItemDetail as any).addOnsConfig && (viewingItemDetail as any).addOnsConfig.length > 0) ? (
                    <div className="divide-y divide-gray-100 border rounded-xl overflow-hidden bg-white">
                      {(viewingItemDetail as any).addOnsConfig.map((add: MenuItemAddon) => (
                        <div key={add.id} className="p-2.5 flex items-center justify-between font-bold text-[10px]">
                          <div>
                            <span className="text-slate-800 block">{add.name}</span>
                            <span className="text-gray-400 font-normal">{add.required ? "Required" : "Optional"} • Allowed: 1-{add.maxQty}</span>
                          </div>
                          <span className="text-[#E23744] font-mono">+ ₹{add.price}</span>
                        </div>
                      ))}
                    </div>
                  ) : viewingItemDetail.addOns && viewingItemDetail.addOns.length > 0 ? (
                    /* Legacy list map backup */
                    <div className="flex flex-wrap gap-1">
                      {viewingItemDetail.addOns.map((add, i) => (
                        <span key={i} className="text-[10px] bg-slate-50 text-stone-600 border border-gray-100 p-1 px-2 rounded-lg font-bold">
                          + {add}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-gray-400 font-medium">No custom extra add-ons binded to this food card item.</div>
                  )}
                </div>

                {/* Audit date statistics */}
                <div className="grid grid-cols-2 gap-2 text-center text-[10px] text-gray-400 font-semibold bg-gray-50/50 p-2.5 rounded-xl border border-dashed">
                  <div>Creation Date: <strong className="text-stone-700 block font-mono font-bold">{(viewingItemDetail as any).createdAt || "2026-05-10"}</strong></div>
                  <div>Record Last Checked: <strong className="text-stone-800 text-stone-700 block font-mono font-bold">{(viewingItemDetail as any).lastUpdated || "2026-06-12"}</strong></div>
                </div>

              </div>

            </div>

            {/* Quick action footer */}
            <div className="mt-8 pt-4 border-t border-gray-100 shrink-0 space-y-2.5">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    openItemModal(viewingItemDetail);
                    setViewingItemDetail(null);
                  }}
                  className="flex-1 py-2.5 bg-slate-10 hover:bg-gray-100 text-stone-700 rounded-xl border border-gray-200. flex items-center justify-center gap-1 text-xs font-bold transition-all cursor-pointer border border-gray-200"
                >
                  <Edit className="w-3.5 h-3.5 text-[#E23744]" /> Edit Record
                </button>
                <button
                  onClick={() => {
                    handleDuplicateItem(viewingItemDetail);
                    setViewingItemDetail(null);
                  }}
                  className="flex-1 py-2.5 bg-[#E23744]/10 hover:bg-[#E23744]/20 text-[#E23744] rounded-xl flex items-center justify-center gap-1 text-xs font-bold transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Clone Asset
                </button>
              </div>

              <button
                onClick={() => {
                  setItemToDelete(viewingItemDetail);
                  setViewingItemDetail(null);
                }}
                className="w-full py-2.5 bg-[#1C1C1C] hover:bg-black text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4 text-red-500" /> Purge Permanently
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- CONFIRM BULK ACTION CHOSE POPUP DIALOGS --- */}
      {showBulkConfirmAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-55 p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 border-t-8 border-[#E23744]">
            
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 bg-red-50 text-[#E23744] rounded-full flex items-center justify-center mx-auto text-xl animate-bounce">
                ⚠
              </div>
              <h3 className="text-sm font-black text-gray-800">Confirm Bulk Command Execution?</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-semibold">
                You are about to affect <strong className="text-[#E23744]">{selectedItems.length} menu items</strong> through bulk administrative override. 
                {showBulkConfirmAction === "delete" && " Purged records cannot be restored to the active indices."}
                {showBulkConfirmAction === "move" && ` Selected cards will relocate to "${bulkMoveCatValue}".`}
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowBulkConfirmAction(null);
                  if (showBulkConfirmAction === "move") setBulkMoveCatValue("");
                }}
                className="flex-grow py-2 bg-gray-200 bg-gray-100 hover:bg-gray-200 text-stone-600 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel Override
              </button>
              <button
                type="button"
                onClick={() => handleExecuteBulkAction(showBulkConfirmAction)}
                className="flex-grow py-2 bg-[#E23744] hover:bg-red-700 text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-md"
              >
                Yes, Commit Bounds!
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- CONFIRM ITEM DELETION MODAL --- */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center z-55 p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 border-t-8 border-red-700 border-red-700 border-red-600">
            <div className="text-center space-y-2">
              <span className="text-3xl">☣</span>
              <h3 className="text-sm font-black text-stone-900">Purge menu item?</h3>
              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                You are about to permanently erase <strong className="text-gray-900">"{itemToDelete.name}"</strong> from restaurant menu card index. This compliance purge operation is irreversible.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="flex-grow py-2.5 bg-gray-100 hover:bg-gray-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                No, Keep Card
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuItems(prev => prev.filter(mi => mi.id !== itemToDelete.id));
                  triggerToast("Compliance Profile Erased", `Purged "${itemToDelete.name}" completely from taxonomic indexing.`, "success");
                  setSelectedItems(prev => prev.filter(id => id !== itemToDelete.id));
                  setItemToDelete(null);
                }}
                className="flex-grow py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm"
              >
                Yes, Purge permanently!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM CATEGORY DELETION MODAL --- */}
      {catToDelete && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center z-55 p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 border-t-8 border-red-600">
            <div className="text-center space-y-2">
              <span className="text-3xl">☣</span>
              <h3 className="text-sm font-black text-stone-900">Purge category block?</h3>
              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                Deleing Category <strong className="text-gray-900">"{catToDelete.name}"</strong> will remove the sorting node. Menu items in this category will remains but will lose category classification and become uncategorized.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCatToDelete(null)}
                className="flex-grow py-2.5 bg-gray-100 hover:bg-gray-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel Purge
              </button>
              <button
                type="button"
                onClick={() => {
                  setCategories(prev => prev.filter(c => c.id !== catToDelete.id));
                  triggerToast("Category Node Erased", `Purged category folder "${catToDelete.name}".`, "success");
                  setCatToDelete(null);
                }}
                className="flex-grow py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black cursor-pointer"
              >
                Confirm Erase Node
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
