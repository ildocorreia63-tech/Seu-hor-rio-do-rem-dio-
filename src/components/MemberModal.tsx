import React, { useState } from 'react';
import { FamilyMember } from '../types';
import { X, Users, Trash2 } from 'lucide-react';

interface MemberModalProps {
  initialData?: FamilyMember | null;
  onClose: () => void;
  onSave: (data: Partial<FamilyMember>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const EMOJIS = ['👩', '👨', '👵', '👴', '👧', '👦', '👶', '🐱', '🐶', '👤'];
const COLORS = [
  '#0f766e', // Teal
  '#2563eb', // Blue
  '#7c3aed', // Purple
  '#db2777', // Pink
  '#ea580c', // Orange
  '#16a34a', // Green
  '#475569', // Slate
];

export const MemberModal: React.FC<MemberModalProps> = ({
  initialData,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [emoji, setEmoji] = useState(initialData?.emoji || '👤');
  const [color, setColor] = useState(initialData?.color || '#0f766e');
  const [relation, setRelation] = useState(initialData?.relation || 'Familiar');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('O nome do membro é obrigatório.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onSave({
        name: name.trim(),
        emoji,
        color,
        relation: relation.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao salvar membro');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="px-5 py-4 bg-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-200" />
            <h2 className="font-bold text-base">
              {initialData ? 'Editar Familiar' : 'Novo Familiar'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-teal-700 transition text-teal-200 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 font-semibold">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nome do membro ou dependente *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Maria, Vovô João, Enzo..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Parentesco / Relação
            </label>
            <select
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none"
            >
              <option value="Titular">Titular (Eu mesmo)</option>
              <option value="Mãe">Mãe</option>
              <option value="Pai">Pai</option>
              <option value="Filho(a)">Filho(a)</option>
              <option value="Esposo(a)">Esposo(a)</option>
              <option value="Avô / Avó">Avô / Avó</option>
              <option value="Pet / Animal">Pet / Animal de Estimação</option>
              <option value="Outro">Outro Familiar</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Avatar / Emoji
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition ${
                    emoji === em
                      ? 'bg-teal-600 text-white ring-2 ring-teal-400 scale-110 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Cor de identificação
            </label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full transition ${
                    color === c ? 'ring-3 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            {initialData && onDelete ? (
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Deseja remover ${initialData.name}?`)) {
                    await onDelete(initialData.id);
                    onClose();
                  }
                }}
                className="text-red-500 font-bold hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold shadow-md transition disabled:opacity-50"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
