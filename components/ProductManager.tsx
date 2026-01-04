import React, { useState, useRef } from 'react';
import { Product } from '../types';
import { Upload, Trash2, Plus, FileSpreadsheet, Loader2, Save, FileType } from 'lucide-react';
import { parseExcelFile } from '../services/excelService';

interface ProductManagerProps {
  products: Product[];
  setProducts: (products: Product[]) => void;
  apiKey: string; 
}

const ProductManager: React.FC<ProductManagerProps> = ({ products, setProducts }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const newProducts = await parseExcelFile(file);
      
      if (newProducts.length === 0) {
        alert("未找到有效商品数据，请检查表格格式。");
        return;
      }

      const confirmOverwrite = confirm(
        `解析成功！共找到 ${newProducts.length} 个商品。\n\n` +
        `【确定】：清空原有数据，仅保留此次导入的数据。\n` +
        `【取消】：合并模式 (同名商品更新价格，新商品追加到末尾)。`
      );

      if (confirmOverwrite) {
        setProducts(newProducts);
      } else {
        // Intelligent Merge Logic
        // Normalize keys by removing all whitespace to match the new strict "no spaces" rule
        const productMap = new Map<string, Product>(
          products.map(p => [p.name.replace(/\s+/g, ''), p] as [string, Product])
        );
        let updatedCount = 0;
        let addedCount = 0;

        newProducts.forEach(newP => {
          // newP.name already has spaces removed by parseExcelFile
          const nameKey = newP.name;
          if (productMap.has(nameKey)) {
            // Update existing: Keep ID, update prices
            const existing = productMap.get(nameKey)!;
            productMap.set(nameKey, {
              ...existing,
              prices: newP.prices
            });
            updatedCount++;
          } else {
            // Add new
            productMap.set(nameKey, newP);
            addedCount++;
          }
        });

        setProducts(Array.from(productMap.values()));
        alert(`合并完成：更新了 ${updatedCount} 个商品，新增了 ${addedCount} 个商品。`);
      }
    } catch (error: any) {
      console.error(error);
      alert(`导入失败: ${error.message || "请检查文件格式"}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const addProduct = () => {
    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: "新商品",
      prices: {
        purchase: { box: 0, item: 0 },
        wholesale: { box: 0, item: 0 },
        retail_floor: { box: 0, item: 0 },
        retail: { box: 0, item: 0 }
      }
    };
    setProducts([newProduct, ...products]);
  };

  const updateProduct = (id: string, field: string, value: any, subField?: 'box' | 'item') => {
    setProducts(products.map(p => {
      if (p.id !== id) return p;
      // Immediately strip spaces from name input
      if (field === 'name') return { ...p, name: value.replace(/\s+/g, '') };
      
      // Update nested price
      if (subField) {
        return {
          ...p,
          prices: {
            ...p.prices,
            [field]: {
              ...(p.prices as any)[field],
              [subField]: Number(value)
            }
          }
        };
      }
      return p;
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 flex-shrink-0">
        <div>
           <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FileSpreadsheet className="text-emerald-600" />
            商品数据库
          </h2>
          <p className="text-sm text-gray-500">管理商品及四个档位的价格 (支持箱/个)，支持 Excel 导入</p>
        </div>
       
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={addProduct}
            className="flex-1 sm:flex-none px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <Plus size={16} />
            手动添加
          </button>
          
          <div className="relative flex-1 sm:flex-none">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".xlsx, .xls"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-sm whitespace-nowrap"
            >
              {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              {isUploading ? '解析中...' : '导入表格'}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-auto flex-1">
        <table className="w-full text-sm text-left border-collapse min-w-[900px]">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg min-w-[150px] bg-gray-100 z-20 sticky left-0 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">名称</th>
              
              <th className="px-2 py-3 text-center bg-blue-50/80 text-blue-800 border-l border-blue-100" colSpan={2}>进货价</th>
              <th className="px-2 py-3 text-center bg-yellow-50/80 text-yellow-800 border-l border-yellow-100" colSpan={2}>批发价</th>
              <th className="px-2 py-3 text-center bg-green-50/80 text-green-800 border-l border-green-100" colSpan={2}>零售底价</th>
              <th className="px-2 py-3 text-center bg-red-50/80 text-red-800 border-l border-red-100" colSpan={2}>零售价</th>
              
              <th className="px-4 py-3 text-center w-16 bg-gray-100 sticky right-0 z-20 border-l border-gray-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">操作</th>
            </tr>
            <tr className="text-[10px] text-gray-500">
              <th className="px-4 py-1 bg-gray-100 sticky left-0 border-r border-gray-200 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"></th>
              
              <th className="px-1 py-1 text-center bg-blue-50/50 min-w-[60px]">箱</th>
              <th className="px-1 py-1 text-center bg-blue-50/50 min-w-[60px]">个</th>
              
              <th className="px-1 py-1 text-center bg-yellow-50/50 min-w-[60px]">箱</th>
              <th className="px-1 py-1 text-center bg-yellow-50/50 min-w-[60px]">个</th>
              
              <th className="px-1 py-1 text-center bg-green-50/50 min-w-[60px]">箱</th>
              <th className="px-1 py-1 text-center bg-green-50/50 min-w-[60px]">个</th>
              
              <th className="px-1 py-1 text-center bg-red-50/50 min-w-[60px]">箱</th>
              <th className="px-1 py-1 text-center bg-red-50/50 min-w-[60px]">个</th>
              
              <th className="px-4 py-1 bg-gray-100 sticky right-0 z-20 border-l border-gray-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <FileType size={48} className="text-gray-200" />
                    <p>暂无商品数据</p>
                    <p className="text-xs text-gray-400">请上传 .xlsx 格式的价格表，需包含“名称”及“价格/箱”、“售价/个”列</p>
                  </div>
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 group transition-colors">
                  <td className="px-4 py-2 sticky left-0 bg-white group-hover:bg-gray-50 border-r border-gray-100 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    <input 
                      className="w-full bg-transparent border-b border-transparent focus:border-blue-500 outline-none font-medium text-gray-900"
                      value={product.name}
                      onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                    />
                  </td>
                  
                  {/* Purchase */}
                  <td className="px-1 py-2 text-center bg-blue-50/10">
                    <input type="number" className="w-16 text-center bg-transparent border-b border-gray-100 focus:border-blue-500 outline-none text-gray-600 text-xs"
                      value={product.prices.purchase.box} onChange={(e) => updateProduct(product.id, 'purchase', e.target.value, 'box')} />
                  </td>
                  <td className="px-1 py-2 text-center bg-blue-50/10 border-r border-gray-100">
                    <input type="number" className="w-16 text-center bg-transparent border-b border-gray-100 focus:border-blue-500 outline-none text-gray-600 text-xs"
                      value={product.prices.purchase.item} onChange={(e) => updateProduct(product.id, 'purchase', e.target.value, 'item')} />
                  </td>

                  {/* Wholesale */}
                  <td className="px-1 py-2 text-center bg-yellow-50/10">
                    <input type="number" className="w-16 text-center bg-transparent border-b border-gray-100 focus:border-yellow-500 outline-none text-gray-800 font-medium text-xs"
                      value={product.prices.wholesale.box} onChange={(e) => updateProduct(product.id, 'wholesale', e.target.value, 'box')} />
                  </td>
                  <td className="px-1 py-2 text-center bg-yellow-50/10 border-r border-gray-100">
                    <input type="number" className="w-16 text-center bg-transparent border-b border-gray-100 focus:border-yellow-500 outline-none text-gray-800 font-medium text-xs"
                      value={product.prices.wholesale.item} onChange={(e) => updateProduct(product.id, 'wholesale', e.target.value, 'item')} />
                  </td>

                  {/* Floor */}
                  <td className="px-1 py-2 text-center bg-green-50/10">
                    <input type="number" className="w-16 text-center bg-transparent border-b border-gray-100 focus:border-green-500 outline-none text-gray-600 text-xs"
                      value={product.prices.retail_floor.box} onChange={(e) => updateProduct(product.id, 'retail_floor', e.target.value, 'box')} />
                  </td>
                  <td className="px-1 py-2 text-center bg-green-50/10 border-r border-gray-100">
                    <input type="number" className="w-16 text-center bg-transparent border-b border-gray-100 focus:border-green-500 outline-none text-gray-600 text-xs"
                      value={product.prices.retail_floor.item} onChange={(e) => updateProduct(product.id, 'retail_floor', e.target.value, 'item')} />
                  </td>

                   {/* Retail */}
                   <td className="px-1 py-2 text-center bg-red-50/10">
                    <input type="number" className="w-16 text-center bg-transparent border-b border-gray-100 focus:border-red-500 outline-none text-red-700 font-bold text-xs"
                      value={product.prices.retail.box} onChange={(e) => updateProduct(product.id, 'retail', e.target.value, 'box')} />
                  </td>
                  <td className="px-1 py-2 text-center bg-red-50/10 border-r border-gray-100">
                    <input type="number" className="w-16 text-center bg-transparent border-b border-gray-100 focus:border-red-500 outline-none text-red-700 font-bold text-xs"
                      value={product.prices.retail.item} onChange={(e) => updateProduct(product.id, 'retail', e.target.value, 'item')} />
                  </td>

                  <td className="px-4 py-2 text-center sticky right-0 bg-white group-hover:bg-gray-50 border-l border-gray-100 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100" // Always visible on mobile
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
       <div className="p-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 text-center flex-shrink-0">
        共 {products.length} 个商品。水平滚动查看更多价格。
      </div>
    </div>
  );
};

export default ProductManager;