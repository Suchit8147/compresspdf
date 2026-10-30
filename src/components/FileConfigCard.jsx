import React, { useState } from 'react';
import { 
  FileText, 
  Trash2, 
  Zap, 
  Check, 
  Target, 
  Loader2, 
  SlidersHorizontal,
  ArrowRight,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { formatBytes } from '../utils/pdfCompressor';

export default function FileConfigCard({
  file,
  fileInfo,
  thumbnailUrl,
  compressionOptions,
  setCompressionOptions,
  onCompress,
  onReset,
  isProcessing,
  progress,
}) {
  // Target size state: typeable value string, unit ('KB' | 'MB')
  const [targetValue, setTargetValue] = useState('100');
  const [targetUnit, setTargetUnit] = useState('KB');

  const fileKb = Math.max(50, Math.round(file.size / 1024));

  const compressionLevels = [
    {
      id: 'low',
      title: 'Low Compression',
      subtitle: 'Maximum Quality',
      description: 'Preserves sharp typography & vector details.',
      reductionEstimate: '~35% smaller',
      badgeColor: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
    },
    {
      id: 'recommended',
      title: 'Recommended',
      subtitle: 'Balanced Quality & Size',
      description: 'Ideal for email attachments, applications & sharing.',
      reductionEstimate: '~55% smaller',
      recommended: true,
      badgeColor: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800',
    },
    {
      id: 'high',
      title: 'High Compression',
      subtitle: 'Smallest File Size',
      description: 'Maximum reduction for strict upload caps.',
      reductionEstimate: '~75% smaller',
      badgeColor: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800',
    },
  ];

  // Quick target shortcut chips
  const quickTargetPresets = [
    { label: '40 KB', value: 40, unit: 'KB' },
    { label: '100 KB', value: 100, unit: 'KB' },
    { label: '200 KB', value: 200, unit: 'KB' },
    { label: '500 KB', value: 500, unit: 'KB' },
    { label: '1 MB', value: 1, unit: 'MB' },
    { label: '2 MB', value: 2, unit: 'MB' },
  ];

  const handleTargetChange = (val, unit) => {
    setTargetValue(val);
    setTargetUnit(unit);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      const kb = unit === 'MB' ? num * 1024 : num;
      setCompressionOptions({
        ...compressionOptions,
        level: 'custom_target',
        targetSizeKb: kb,
      });
    }
  };

  const handleSelectPresetChip = (preset) => {
    setTargetValue(preset.value.toString());
    setTargetUnit(preset.unit);
    const kb = preset.unit === 'MB' ? preset.value * 1024 : preset.value;
    setCompressionOptions({
      ...compressionOptions,
      level: 'custom_target',
      targetSizeKb: kb,
    });
  };

  const isCustomTarget = compressionOptions.level === 'custom_target';
  
  // Calculate estimated savings percentage for current target
  const currentTargetKb = targetUnit === 'MB' ? (parseFloat(targetValue) || 1) * 1024 : (parseFloat(targetValue) || 100);
  const targetSavingsPct = Math.max(0, Math.min(96, Math.round(((file.size - currentTargetKb * 1024) / file.size) * 100)));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 animate-slide-up">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-800">
        
        {/* Uploaded File Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-18 sm:w-16 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0 shadow-sm">
              {thumbnailUrl ? (
                <img 
                  src={thumbnailUrl} 
                  alt="Page 1 preview" 
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <FileText className="w-8 h-8 text-indigo-500" />
              )}
            </div>

            <div className="text-left space-y-1">
              <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg break-all line-clamp-1">
                {file.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                  Original: {formatBytes(file.size)}
                </span>
                {fileInfo?.pageCount && (
                  <>
                    <span>•</span>
                    <span>{fileInfo.pageCount} {fileInfo.pageCount === 1 ? 'Page' : 'Pages'}</span>
                  </>
                )}
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Ready</span>
              </div>
            </div>
          </div>

          <button
            onClick={onReset}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove File</span>
          </button>
        </div>

        {/* Compression Options */}
        <div className="py-6 space-y-6">
          
          {/* 1. TARGET FILE SIZE SECTION */}
          <div className={`p-5 rounded-2xl border-2 transition-all duration-200 text-left ${
            isCustomTarget
              ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 shadow-lg shadow-indigo-500/10'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700'
          }`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div 
                className="flex items-center gap-2.5 cursor-pointer flex-1"
                onClick={() => {
                  if (!isProcessing) {
                    const num = parseFloat(targetValue) || 100;
                    const kb = targetUnit === 'MB' ? num * 1024 : num;
                    setCompressionOptions({
                      ...compressionOptions,
                      level: 'custom_target',
                      targetSizeKb: kb,
                    });
                  }
                }}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                  isCustomTarget 
                    ? 'border-indigo-600 bg-indigo-600 text-white' 
                    : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {isCustomTarget && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Target Specific File Size (e.g. 40 KB, 100 KB, 1 MB)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Type your required file size limit. The engine will compress to fit under this target.
                  </p>
                </div>
              </div>

              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                Custom Size
              </span>
            </div>

            {/* Typeable Input + Unit Toggle */}
            <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-700/70 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1 flex rounded-xl shadow-sm border border-slate-300 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-indigo-500">
                  <div className="px-3.5 flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 select-none">
                    Reduce To:
                  </div>
                  
                  {/* Typeable Box */}
                  <input
                    type="number"
                    min="10"
                    max="50000"
                    step="1"
                    value={targetValue}
                    disabled={isProcessing}
                    placeholder="e.g. 40, 100, 1"
                    onChange={(e) => handleTargetChange(e.target.value, targetUnit)}
                    onFocus={() => {
                      if (!isCustomTarget) {
                        const num = parseFloat(targetValue) || 100;
                        const kb = targetUnit === 'MB' ? num * 1024 : num;
                        setCompressionOptions({
                          ...compressionOptions,
                          level: 'custom_target',
                          targetSizeKb: kb,
                        });
                      }
                    }}
                    className="flex-1 px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none"
                    aria-label="Target file size value in KB or MB"
                  />

                  {/* Unit Selector Toggle (KB / MB) */}
                  <div className="flex border-l border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleTargetChange(targetValue, 'KB')}
                      className={`px-3 py-2 text-xs font-bold transition ${
                        targetUnit === 'KB'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      KB
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleTargetChange(targetValue, 'MB')}
                      className={`px-3 py-2 text-xs font-bold transition ${
                        targetUnit === 'MB'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      MB
                    </button>
                  </div>
                </div>

                {/* Target badge */}
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 font-medium px-1">
                  <span>From <strong>{formatBytes(file.size)}</strong></span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-indigo-600 dark:text-indigo-400 font-extrabold bg-indigo-50 dark:bg-indigo-950/80 px-2 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    Target: ≤ {targetValue || '0'} {targetUnit}
                  </span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-400 font-medium">Quick Presets:</span>
                {quickTargetPresets.map((preset) => {
                  const isActive = isCustomTarget && targetValue === preset.value.toString() && targetUnit === preset.unit;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleSelectPresetChip(preset)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition border ${
                        isActive
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. STANDARD PRESETS (Low, Recommended, High) */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 text-left">
              Or Choose Compression Level
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {compressionLevels.map((lvl) => {
                const isSelected = compressionOptions.level === lvl.id;
                return (
                  <div
                    key={lvl.id}
                    onClick={() => !isProcessing && setCompressionOptions({ level: lvl.id, targetSizeKb: null })}
                    className={`relative p-4 rounded-2xl cursor-pointer text-left transition-all duration-200 border-2 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-md shadow-indigo-500/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                    } ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
                  >
                    {lvl.recommended && (
                      <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm">
                        Recommended
                      </span>
                    )}

                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {lvl.title}
                      </span>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                        isSelected 
                          ? 'border-indigo-600 bg-indigo-600 text-white' 
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                      {lvl.subtitle}
                    </p>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                      {lvl.description}
                    </p>

                    <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block border ${lvl.badgeColor}`}>
                      {lvl.reductionEstimate}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Processing Progress Status */}
        {isProcessing && (
          <div className="py-4 space-y-3 animate-fade-in text-left">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
                {progress.stage || 'Compressing document...'}
              </span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                {progress.percent}%
              </span>
            </div>
            
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Main Compress Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onCompress}
            disabled={isProcessing}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-base shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition duration-200 flex items-center justify-center gap-2.5"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Compressing PDF (Local Processing)...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>
                  {isCustomTarget
                    ? `Compress to Target ≤ ${targetValue} ${targetUnit}`
                    : 'Compress PDF Now'}
                </span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
