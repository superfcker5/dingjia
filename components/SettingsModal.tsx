import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { X, Save, KeyRound } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-blue-600" />
            系统设置
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DeepSeek API Key (语义解析)
            </label>
            <input
              type="password"
              value={localSettings.deepseekApiKey}
              onChange={(e) => setLocalSettings({ ...localSettings, deepseekApiKey: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="sk-..."
            />
            <p className="text-xs text-gray-500 mt-1">用于解析自然语言订单。</p>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
              DeepSeek Base URL
            </label>
            <input
              type="text"
              value={localSettings.deepseekBaseUrl}
              onChange={(e) => setLocalSettings({ ...localSettings, deepseekBaseUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="https://api.deepseek.com"
            />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gemini API Key (图片识别)
            </label>
            <input
              type="password"
              value={localSettings.geminiApiKey}
              onChange={(e) => setLocalSettings({ ...localSettings, geminiApiKey: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              placeholder="AIza..."
            />
            <p className="text-xs text-gray-500 mt-1">用于识别上传的价格表图片。</p>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
          >
            <Save size={18} />
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;