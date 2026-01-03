import React, { useState, useEffect, useRef } from 'react';
import { Settings, Calculator as CalculatorIcon, List, Box, Save, FolderOpen, Download } from 'lucide-react';
import ProductManager from './components/ProductManager';
import Calculator from './components/Calculator';
import SettingsModal from './components/SettingsModal';
import { Product, AppSettings, DEFAULT_SETTINGS } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'products'>('calculator');
  const [showSettings, setShowSettings] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedProducts = localStorage.getItem('products');
    const savedSettings = localStorage.getItem('settings');

    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
      } catch (e) {
        console.error("Failed to parse products", e);
      }
    }
    
    if (savedSettings) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('products', JSON.stringify(products));
    }
  }, [products, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('settings', JSON.stringify(settings));
    }
  }, [settings, isLoaded]);

  const handleSaveToFile = () => {
    const data = {
      version: 1,
      timestamp: Date.now(),
      products,
      settings
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-price-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const data = JSON.parse(result);
        
        if (data.products && Array.isArray(data.products)) {
          if (confirm(`读取到 ${data.products.length} 个商品配置。是否加载？(当前数据将被覆盖)`)) {
            setProducts(data.products);
            if (data.settings) {
              setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
            }
            alert('数据加载成功！');
          }
        } else {
           alert('文件格式不正确：未找到商品数据');
        }
      } catch (err) {
        console.error(err);
        alert('读取文件失败，请检查是否为有效的 JSON 备份文件');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans h-[100dvh] overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm flex-none z-30 relative">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Box size={20} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 hidden sm:block">
              Smart Price AI
            </h1>
          </div>

          <nav className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-lg mx-2 flex-1 justify-center sm:flex-none sm:mx-0">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'calculator'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalculatorIcon size={18} />
              <span className="inline">报价计算</span>
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'products'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List size={18} />
              <span className="inline">商品管理</span>
            </button>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleLoadFromFile}
              className="hidden"
              accept=".json"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
              title="读取存档"
            >
              <FolderOpen size={20} />
            </button>
             <button
              onClick={handleSaveToFile}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
              title="保存存档"
            >
              <Download size={20} />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
              title="设置"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-2 sm:p-4 lg:p-6 overflow-hidden flex flex-col">
        {activeTab === 'calculator' ? (
          <Calculator 
            products={products} 
            settings={settings} 
            onSettingsChange={setSettings}
          />
        ) : (
          <ProductManager 
            products={products} 
            setProducts={setProducts} 
            apiKey={settings.geminiApiKey} 
          />
        )}
      </main>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={setSettings}
      />
    </div>
  );
}

export default App;