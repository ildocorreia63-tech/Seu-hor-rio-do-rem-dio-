import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import { X, Sparkles, Camera, Send, Stethoscope, Bot, AlertTriangle, FileText, Check } from 'lucide-react';

interface AiAssistantModalProps {
  onClose: () => void;
  onApplyScheduleSuggestion?: (med: any) => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; image?: string }>>([
    {
      sender: 'ai',
      text: 'Olá! Sou o seu Assistente Farmacêutico & Médico de IA. 🩺\n\nVocê pode me enviar uma foto da sua receita médica, foto da caixa do remédio ou tirar dúvidas sobre horários, interações e como tomar cada medicação.',
    }
  ]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const reply = await api.askAi(textToSend || 'Analise esta imagem de receita médica e descreva os medicamentos, posologia e horários recomendados.', currentImg || undefined, currentMime);
      setMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: `Desculpe, ocorreu um erro ao analisar: ${err.message || 'Tente novamente mais tarde.'}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-white flex flex-col h-[85vh] max-h-[700px]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-teal-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center text-teal-200">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">Assistente IA de Saúde</h2>
              <p className="text-[11px] text-teal-200">Leitor de Receitas, Bulas & Dúvidas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-teal-700 transition text-teal-200 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Message Scroll */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-sm">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] p-3.5 rounded-2xl whitespace-pre-wrap leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-teal-600 text-white rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                }`}
              >
                {m.image && (
                  <img
                    src={m.image}
                    alt="Anexo enviado"
                    className="w-full max-h-48 object-cover rounded-xl mb-2 border border-white/20"
                  />
                )}
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5 items-center text-slate-400 text-xs">
              <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              </div>
              <span className="animate-pulse">Analisando dados com inteligência médica...</span>
            </div>
          )}
        </div>

        {/* Quick prompt suggestions */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-[11px]">
          <button
            onClick={() => handleSend('Como devo tomar antibiótico para não agredir o estômago?')}
            className="px-2.5 py-1 bg-white dark:bg-slate-800 border rounded-full text-slate-600 dark:text-slate-300 shrink-0 hover:bg-teal-50 hover:text-teal-700 transition"
          >
            💊 Tomar com refeição?
          </button>
          <button
            onClick={() => handleSend('O que fazer se eu esquecer de tomar uma dose no horário certo?')}
            className="px-2.5 py-1 bg-white dark:bg-slate-800 border rounded-full text-slate-600 dark:text-slate-300 shrink-0 hover:bg-teal-50 hover:text-teal-700 transition"
          >
            ⏰ Esqueci a dose, e agora?
          </button>
        </div>

        {/* Selected image preview */}
        {imageBase64 && (
          <div className="px-4 py-2 bg-teal-50 dark:bg-teal-950/40 flex items-center justify-between border-t border-teal-200 dark:border-teal-800 shrink-0">
            <div className="flex items-center gap-2 text-xs text-teal-800 dark:text-teal-200">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Foto de receita pronta para envio</span>
            </div>
            <button
              onClick={() => setImageBase64(null)}
              className="text-xs text-red-500 font-bold hover:underline"
            >
              Remover
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0">
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
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
            title="Enviar Foto de Receita Médica"
          >
            <Camera className="w-4 h-4 text-teal-600" />
          </button>

          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite sua dúvida ou envie foto da receita..."
            className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
          />

          <button
            onClick={() => handleSend()}
            disabled={loading || (!prompt.trim() && !imageBase64)}
            className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white transition shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
