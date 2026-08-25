import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { aiCache, AiCacheStats } from '../services/aiCache';
import { X, Sparkles, Camera, Send, Stethoscope, Bot, FileText, Zap, Type, RefreshCw } from 'lucide-react';

interface AiAssistantModalProps {
  onClose: () => void;
  onApplyScheduleSuggestion?: (med: any) => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [cacheStats, setCacheStats] = useState<AiCacheStats>(() => aiCache.getStats());
  const [chatFontSize, setChatFontSize] = useState<'medium' | 'large' | 'extra'>(() => {
    try {
      return (localStorage.getItem('shdr_ai_fontsize') as any) || 'large';
    } catch {
      return 'large';
    }
  });

  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; image?: string; fromCache?: boolean }>>([
    {
      sender: 'ai',
      text: 'Olá! Sou o seu Assistente Farmacêutico & Médico de IA. 🩺\n\nEstou aqui para te ajudar a entender suas receitas, tirar dúvidas sobre remédios, horários corretos, interações com alimentos ou o que fazer se esquecer uma dose.',
    }
  ]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleFontSize = () => {
    const next = chatFontSize === 'medium' ? 'large' : chatFontSize === 'large' ? 'extra' : 'medium';
    setChatFontSize(next);
    try {
      localStorage.setItem('shdr_ai_fontsize', next);
    } catch {}
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setCacheStats(aiCache.getStats());
  }, [messages, loading]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      const fullBase64 = reader.result as string;
      const base64Data = fullBase64.split(',')[1];
      setImageBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim() && !imageBase64) return;

    const userMsg = {
      sender: 'user' as const,
      text: textToSend || 'Analise esta receita ou foto do medicamento.',
      image: imageBase64 ? `data:${imageMimeType};base64,${imageBase64}` : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);

    const currentImg = imageBase64;
    const currentMime = imageMimeType;
    setImageBase64(null);

    try {
      const result = await api.askAi(
        textToSend || 'Analise esta imagem de receita médica e descreva os medicamentos, posologia e horários recomendados.',
        currentImg || undefined,
        currentMime
      );
      setMessages((prev) => [...prev, { sender: 'ai', text: result.answer, fromCache: result.fromCache }]);
      setCacheStats(aiCache.getStats());
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: `Desculpe, ocorreu um erro ao analisar: ${err.message || 'Tente novamente mais tarde.'}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = () => {
    aiCache.clear();
    setCacheStats(aiCache.getStats());
  };

  const getTextClass = () => {
    switch (chatFontSize) {
      case 'extra':
        return 'text-lg sm:text-xl leading-relaxed';
      case 'large':
        return 'text-base sm:text-lg leading-relaxed';
      default:
        return 'text-sm sm:text-base leading-normal';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-teal-600/30 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-white flex flex-col h-[90vh] max-h-[800px]">
        
        {/* Header with Senior Accessible Controls & Cache Performance Status */}
        <div className="px-4 sm:px-5 py-3.5 bg-teal-800 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 border border-teal-400/40 flex items-center justify-center text-teal-100 shadow-inner shrink-0">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg leading-tight truncate">
                  Assistente IA de Saúde
                </h2>
                {cacheStats.totalEntries > 0 && (
                  <span
                    className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-[11px] font-bold text-emerald-200"
                    title={`Cache Local Ativo: ${cacheStats.totalEntries} respostas memorizadas, economizando tokens.`}
                  >
                    <Zap className="w-3 h-3 text-emerald-300" />
                    <span>Cache Ativo</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-teal-200 font-medium truncate">
                Respostas rápidas, bulas & receitas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Font Size Toggle Button */}
            <button
              onClick={toggleFontSize}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-teal-700/90 hover:bg-teal-600 border border-teal-400/40 rounded-xl text-xs sm:text-sm font-bold text-teal-100 transition active:scale-95 shadow-sm"
              title="Aumentar / Diminuir tamanho da letra para idosos"
            >
              <Type className="w-4 h-4" />
              <span>Letra: {chatFontSize === 'extra' ? 'G+' : chatFontSize === 'large' ? 'G' : 'M'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-teal-700 transition text-teal-100 hover:text-white"
              title="Fechar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Cache Performance Bar Banner */}
        {cacheStats.totalHits > 0 && (
          <div className="px-4 py-1.5 bg-emerald-900/40 border-b border-emerald-700/30 flex items-center justify-between text-xs text-emerald-200">
            <div className="flex items-center gap-1.5 font-bold">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>⚡ Economia de Tokens: ~{cacheStats.estimatedTokensSaved.toLocaleString()} tokens poupados ({cacheStats.totalHits} acessos instantâneos)</span>
            </div>
            <button
              onClick={handleClearCache}
              className="text-[11px] text-emerald-300 hover:text-white underline font-semibold flex items-center gap-1"
              title="Limpar memória cache de respostas"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Limpar Cache</span>
            </button>
          </div>
        )}

        {/* Chat Message Scroll */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-9 h-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 font-bold shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div
                className={`max-w-[90%] sm:max-w-[85%] p-4 sm:p-5 rounded-3xl whitespace-pre-wrap ${getTextClass()} shadow-sm ${
                  m.sender === 'user'
                    ? 'bg-teal-700 text-white rounded-tr-none font-medium'
                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-2 border-slate-200 dark:border-slate-700 rounded-tl-none font-normal'
                }`}
              >
                {m.image && (
                  <img
                    src={m.image}
                    alt="Foto enviada"
                    className="w-full max-h-60 object-cover rounded-2xl mb-3 border-2 border-slate-300 dark:border-slate-700 shadow-md"
                  />
                )}
                {m.text}

                {/* Instant Cache Indicator Badge */}
                {m.fromCache && (
                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>⚡ Resposta instantânea carregada do Cache Local (0ms • 0 tokens)</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-teal-700 dark:text-teal-400 font-bold text-base sm:text-lg p-3 bg-teal-50 dark:bg-teal-950/30 rounded-2xl border border-teal-200 dark:border-teal-800">
              <div className="w-9 h-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 animate-spin" />
              </div>
              <span className="animate-pulse">Consultando informações médicas com carinho...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt suggestions (Large, Easy Click for Seniors) */}
        <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => handleSend('Como devo tomar antibiótico para não agredir o estômago?')}
            className="px-4 py-2.5 bg-white dark:bg-slate-700 border-2 border-teal-600/30 hover:border-teal-500 rounded-2xl text-slate-800 dark:text-slate-100 font-bold text-sm sm:text-base shrink-0 hover:bg-teal-50 dark:hover:bg-teal-900/40 shadow-sm transition active:scale-95 flex items-center gap-2"
          >
            <span>💊</span>
            <span>Tomar com comida?</span>
          </button>
          
          <button
            onClick={() => handleSend('O que fazer se eu esquecer de tomar uma dose no horário certo?')}
            className="px-4 py-2.5 bg-white dark:bg-slate-700 border-2 border-teal-600/30 hover:border-teal-500 rounded-2xl text-slate-800 dark:text-slate-100 font-bold text-sm sm:text-base shrink-0 hover:bg-teal-50 dark:hover:bg-teal-900/40 shadow-sm transition active:scale-95 flex items-center gap-2"
          >
            <span>⏰</span>
            <span>Esqueci a dose, e agora?</span>
          </button>

          <button
            onClick={() => handleSend('Posso tomar meus remédios com leite, café ou suco?')}
            className="px-4 py-2.5 bg-white dark:bg-slate-700 border-2 border-teal-600/30 hover:border-teal-500 rounded-2xl text-slate-800 dark:text-slate-100 font-bold text-sm sm:text-base shrink-0 hover:bg-teal-50 dark:hover:bg-teal-900/40 shadow-sm transition active:scale-95 flex items-center gap-2"
          >
            <span>🥛</span>
            <span>Tomar com leite ou suco?</span>
          </button>
        </div>

        {/* Selected image preview */}
        {imageBase64 && (
          <div className="px-5 py-3 bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-between border-t-2 border-emerald-300 dark:border-emerald-800 shrink-0">
            <div className="flex items-center gap-3 text-sm sm:text-base font-bold text-emerald-900 dark:text-emerald-200">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>Foto anexada pronta para ser analisada!</span>
            </div>
            <button
              onClick={() => setImageBase64(null)}
              className="px-3 py-1 bg-red-100 text-red-700 font-black text-xs sm:text-sm rounded-xl hover:bg-red-200"
            >
              Cancelar Foto
            </button>
          </div>
        )}

        {/* Big Input Bar for Elderly Comfort */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-800 flex items-center gap-3 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 sm:p-3.5 rounded-2xl bg-teal-50 hover:bg-teal-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-teal-600/30 text-teal-800 dark:text-teal-200 font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Tirar foto de receita ou caixa do remédio"
          >
            <Camera className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            <span className="hidden sm:inline text-sm">Foto</span>
          </button>

          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite sua dúvida ou clique na câmera..."
            className="flex-1 px-4 py-3 sm:py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-base sm:text-lg outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500 font-medium"
          />

          <button
            onClick={() => handleSend()}
            disabled={loading || (!prompt.trim() && !imageBase64)}
            className="p-3 sm:p-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-extrabold transition shadow-md active:scale-95 flex items-center gap-1.5"
            title="Enviar mensagem"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};


