import React from 'react';
import { FamilyMember } from '../types';
import { Plus, Users } from 'lucide-react';

interface MemberBarProps {
  members: FamilyMember[];
  selectedMemberId: string;
  onSelectMember: (id: string) => void;
  onAddMember: () => void;
}

export const MemberBar: React.FC<MemberBarProps> = ({
  members,
  selectedMemberId,
  onSelectMember,
  onAddMember,
}) => {
  return (
    <div className="bg-teal-950/40 border-b border-teal-900/50 px-3 sm:px-4 py-2 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-[11px] font-bold text-teal-200/75 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-0.5">
          <Users className="w-3.5 h-3.5 text-teal-400" />
          <span className="hidden xs:inline">Filtro:</span>
        </span>

        {/* All members chip */}
        <button
          onClick={() => onSelectMember('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition flex items-center gap-1.5 active:scale-95 ${
            selectedMemberId === 'all'
              ? 'bg-teal-500 text-white shadow-sm ring-2 ring-teal-300/40'
              : 'bg-teal-900/80 text-teal-100/90 hover:bg-teal-800 border border-teal-700/60'
          }`}
        >
          <span>👨‍👩‍👧‍👦</span>
          <span>Todos</span>
          <span className="bg-teal-950/50 px-1.5 py-0.5 rounded-full text-[10px] ml-0.5 font-extrabold">
            {members.length}
          </span>
        </button>

        {/* Member chips */}
        {members.map((member) => {
          const isSelected = selectedMemberId === member.id;
          return (
            <button
              key={member.id}
              onClick={() => onSelectMember(member.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition flex items-center gap-1.5 active:scale-95 ${
                isSelected
                  ? 'bg-white text-teal-950 shadow-md ring-2 ring-teal-400'
                  : 'bg-teal-900/80 text-teal-100 hover:bg-teal-800 border border-teal-700/60'
              }`}
            >
              <span>{member.emoji || '👤'}</span>
              <span className="truncate max-w-[120px]">{member.name}</span>
            </button>
          );
        })}

        {/* Add member button */}
        <button
          onClick={onAddMember}
          className="px-3 py-1.5 rounded-full text-xs font-bold shrink-0 bg-teal-900/40 hover:bg-teal-800 text-teal-200 border border-dashed border-teal-600/80 flex items-center gap-1 transition active:scale-95"
          title="Adicionar Membro da Família"
        >
          <Plus className="w-3.5 h-3.5 text-teal-400" />
          <span>Familiar</span>
        </button>
      </div>
    </div>
  );
};

