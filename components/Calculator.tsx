import React, { useState } from 'react';
import { Product, PriceType, PRICE_LABELS, OrderItem, AppSettings, UNIT_LABELS } from '../types';
import { parseOrderText } from '../services/deepseekService';
import { Calculator as CalcIcon, Send, Eraser, Loader2, DollarSign, Copy, Check, User, ChevronDown, ChevronUp } from 'lucide-react';

interface CalculatorProps {
  products: Product[];
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

const Calculator: React.FC<CalculatorProps> = ({ products, settings, onSettingsChange }) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedPriceTier, setSelectedPriceTier] = useState<PriceType>('wholesale');
  const [copied, setCopied] = useState(false);
  const [isInputCollapsed, setIsInputCollapsed] = useState(false);

  const handleParse = async () => {
    if (!inputText.trim()) return;
    if (!settings.deepseekApiKey) {
      alert("请先设置 DeepSeek API Key");
      return;
    }

    setIsProcessing(true);
    try {
      const items = await parseOrderText(
        inputText, 
        products, 
        settings.deepseekApiKey,
        settings.deepseekBaseUrl
      );
      setOrderItems(items);
      // Auto-collapse on mobile if items found
      if (items.length > 0) {
        setIsInputCollapsed(true);
      }
    } catch (error) {
      console.error(error);
      alert("解析失败，请检查网络或 API 设置");
    } finally {
      setIsProcessing(false);
    }
  };

  const updateQuantity = (index: number, type: 'box' | 'item', value: string) => {
    const newItems = [...orderItems];
    const num = parseInt(value) || 0;
    if (type === 'box') {
      newItems[index].quantityBox = num;
    } else {
      newItems[index].quantityItem = num;
    }
    setOrderItems(newItems);
  };

  const calculateItemTotal = (item: OrderItem, product: Product | undefined) => {
    if (!product) return 0;
    const boxPrice = product.prices[selectedPriceTier].box;
    const itemPrice = product.prices[selectedPriceTier].item;
    return (boxPrice * item.quantityBox) + (itemPrice * item.quantityItem);
  };

  const totalAmount = orderItems.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    return sum + calculateItemTotal(item, product);
  }, 0);

  const handleCopy = () => {
    if (orderItems.length === 0) return;

    const date = new Date().toLocaleDateString();
    const cashierPart = settings.cashierName ? `(${settings.cashierName})` : '';
    
    // Simplified Header
    let text = `📅 ${date} ${cashierPart}\n`;
    
    orderItems.forEach((item, index) => {
      const product = products.find(p => p.id === item.productId);
      const subtotal = calculateItemTotal(item, product);
      const name = product ? product.name : item.productName;
      
      const parts = [];
      if (item.quantityBox > 0) {
         const price = product ? product.prices[selectedPriceTier].box : 0;
         // Format: 5箱(￥100)
         parts.push(`${item.quantityBox}箱(￥${price})`);
      }
      if (item.quantityItem > 0) {
         const price = product ? product.prices[selectedPriceTier].item : 0;
         // Format: 2个(￥10)
         parts.push(`${item.quantityItem}个(￥${price})`);
      }
      
      const details = parts.join('+');

      // Compact Line: 1. Name: 5箱(￥100)+2个(￥10) = ￥520
      text += `${index + 1}. ${name}: ${details} = ￥${subtotal.toLocaleString()}\n`;
    });
    
    text += `💰 总计: ￥${totalAmount.toLocaleString()}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      alert('复制失败，请手动复制');
    });
  };

  const getTierColor = (tier: PriceType) => {
    switch (tier) {
      case 'purchase': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'wholesale': return 'text-yellow-700 bg-yellow-50 border-yellow-100';
      case 'retail_floor': return 'text-green-700 bg-green-50 border-green-100';
      case 'retail': return 'text-red-700 bg-red-50 border-red-100';
    }
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6 h-full">
      {/* Input Section - Optimized for Mobile with Auto-Collapse */}
      <div className={`${isInputCollapsed ? 'h-auto' : 'h-[45%] min-h-[340px]'} lg:h-auto lg:col-span-4 flex flex-col gap-4 flex-shrink-0 transition-all duration-300 ease-in-out`}>
        <div 
          className={`bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden ${isInputCollapsed ? 'cursor-pointer hover:bg-gray-50' : ''}`}
          onClick={() => isInputCollapsed && setIsInputCollapsed(false)}
        >
          <div className="flex justify-between items-center flex-shrink-0">
             <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <CalcIcon className="text-blue-600" />
              快速开单
            </h2>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsInputCollapsed(!isInputCollapsed);
              }}
              className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
            >
              {isInputCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </button>
          </div>

          <div className={`${isInputCollapsed ? 'hidden lg:flex' : 'flex'} flex-col flex-1 min-h-0 mt-3 space-y-3`}>
            {/* Cashier Name Input */}
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200 flex-shrink-0">
               <User size={16} className="text-gray-400" />
               <input 
                  type="text"
                  value={settings.cashierName}
                  onChange={(e) => onSettingsChange({...settings, cashierName: e.target.value})}
                  placeholder="在此输入出单人姓名 (自动保存)"
                  className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder:text-gray-400"
               />
            </div>
            
            <div className="flex-1 relative min-h-0">
              <textarea
                className="w-full h-full p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 text-gray-700 text-sm sm:text-base"
                placeholder="请输入需求，例如：&#10;5箱加特林&#10;5箱3个大神兽&#10;20个飞毛腿..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button 
                onClick={() => setInputText('')}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1 bg-white rounded-md shadow-sm border border-gray-100"
                title="清空"
              >
                <Eraser size={14} />
              </button>
            </div>

            <button
              onClick={handleParse}
              disabled={isProcessing || !inputText.trim()}
              className="w-full py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" /> <span className="text-sm">DeepSeek 思考中...</span>
                </>
              ) : (
                <>
                  <Send size={18} /> 生成报价单
                </>
              )}
            </button>
          </div>

          {/* Mobile Collapsed Hint */}
          {isInputCollapsed && (
            <div className="lg:hidden mt-2 text-xs text-gray-500 flex items-center gap-1 animate-fadeIn">
              <Check size={12} className="text-green-500" /> 
              <span className="truncate">已生成 {orderItems.length} 条报价。点击此处展开编辑。</span>
            </div>
          )}
        </div>
      </div>

      {/* Result Section */}
      <div className="flex-1 lg:h-full lg:col-span-8 flex flex-col gap-4 overflow-hidden min-h-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
          {/* Toolbar */}
          <div className="p-3 sm:p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between bg-gray-50 flex-shrink-0">
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
              <span className="text-sm font-medium text-gray-600 hidden sm:inline whitespace-nowrap">价格:</span>
              <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm flex-nowrap min-w-max">
                {(Object.keys(PRICE_LABELS) as PriceType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedPriceTier(type)}
                    className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-all font-medium whitespace-nowrap ${
                      selectedPriceTier === type
                        ? 'bg-gray-800 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {PRICE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between sm:justify-end items-center gap-3 w-full sm:w-auto border-t sm:border-t-0 border-gray-200 pt-2 sm:pt-0">
               <button
                onClick={handleCopy}
                disabled={orderItems.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm whitespace-nowrap"
              >
                {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                {copied ? '已复制' : '复制结果'}
              </button>

              <div className="text-right flex items-center gap-2 sm:block">
                <span className="text-xs text-gray-500 uppercase tracking-wider sm:block">总计</span>
                <span className={`text-xl sm:text-2xl font-bold font-mono ${
                    selectedPriceTier === 'retail' ? 'text-red-600' : 'text-gray-800'
                }`}>
                  ￥{totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-auto flex-1 bg-white">
            <table className="w-full text-sm text-left table-fixed lg:table-auto">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                <tr>
                  <th className="pl-2 pr-1 py-3 font-semibold w-auto">商品名称</th>
                  <th className="px-0.5 py-3 font-semibold text-center w-12 sm:w-16">箱</th>
                  <th className="px-0.5 py-3 font-semibold text-center w-12 sm:w-16">个</th>
                  <th className="px-2 py-3 font-semibold text-right whitespace-nowrap hidden sm:table-cell sm:w-20">
                    单价
                  </th>
                  <th className="pl-1 pr-2 py-3 font-semibold text-right whitespace-nowrap w-[4.5rem] sm:w-24">小计</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orderItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 sm:py-20 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <DollarSign size={48} className="text-gray-200" />
                        <p className="text-sm sm:text-base">左侧输入内容并点击生成，在此处查看报价单</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orderItems.map((item, idx) => {
                    const product = products.find(p => p.id === item.productId);
                    const boxPrice = product ? product.prices[selectedPriceTier].box : 0;
                    const itemPrice = product ? product.prices[selectedPriceTier].item : 0;
                    const subtotal = calculateItemTotal(item, product);

                    return (
                      <tr key={item.productId + idx} className="hover:bg-gray-50 transition-colors">
                        <td className="pl-2 pr-1 py-2 font-medium text-gray-900 text-xs sm:text-sm break-words whitespace-normal align-middle">
                          <div>
                            {product ? product.name : item.productName}
                            {!product && <span className="text-red-500 ml-1 text-[10px]">(已删除)</span>}
                          </div>
                          {/* Mobile Price display inline */}
                          <div className="mt-0.5 sm:hidden flex flex-wrap gap-1 opacity-80 scale-90 origin-left">
                             <span className="text-[10px] text-gray-500 whitespace-nowrap">箱:￥{boxPrice}</span>
                             <span className="text-[10px] text-gray-500 whitespace-nowrap">个:￥{itemPrice}</span>
                          </div>
                        </td>
                        
                        <td className="px-0.5 py-2 text-center align-middle">
                          <div className="relative flex items-center justify-center">
                            <input
                              type="number"
                              min="0"
                              value={item.quantityBox === 0 ? '' : item.quantityBox}
                              onChange={(e) => updateQuantity(idx, 'box', e.target.value)}
                              placeholder="0"
                              className="w-full p-1 text-center border border-gray-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-gray-700 bg-gray-50/50 text-xs sm:text-sm h-9"
                            />
                          </div>
                        </td>

                        <td className="px-0.5 py-2 text-center align-middle">
                          <div className="relative flex items-center justify-center">
                            <input
                              type="number"
                              min="0"
                              value={item.quantityItem === 0 ? '' : item.quantityItem}
                              onChange={(e) => updateQuantity(idx, 'item', e.target.value)}
                              placeholder="0"
                              className="w-full p-1 text-center border border-gray-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-gray-700 bg-gray-50/50 text-xs sm:text-sm h-9"
                            />
                          </div>
                        </td>

                        <td className="px-2 py-2 text-right hidden sm:table-cell align-middle">
                          <div className="flex flex-col items-end gap-1">
                             <span className={`px-1 py-0.5 rounded text-[10px] sm:text-xs font-mono border ${getTierColor(selectedPriceTier)}`}>
                               ￥{boxPrice}
                             </span>
                             <span className={`px-1 py-0.5 rounded text-[10px] sm:text-xs font-mono border ${getTierColor(selectedPriceTier)}`}>
                               ￥{itemPrice}
                             </span>
                          </div>
                        </td>
                        <td className="pl-1 pr-2 py-2 text-right font-bold text-gray-900 font-mono text-xs sm:text-sm align-middle whitespace-nowrap">
                          ￥{subtotal.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {orderItems.length > 0 && (
                <tfoot className="bg-gray-50 font-bold text-gray-900 sticky bottom-0 border-t border-gray-200">
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-right text-xs sm:text-sm sm:hidden">总计</td>
                    <td colSpan={4} className="px-4 py-4 text-right text-xs sm:text-sm hidden sm:table-cell">总计</td>
                    <td className="px-2 py-4 text-right font-mono text-base sm:text-lg">￥{totalAmount.toLocaleString()}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;