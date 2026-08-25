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
    <div className="bg-teal-950/60 border-b border-teal-900/60 px-3 sm:px-4 py-2.5 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-xs sm:text-sm font-black text-teal-200 uppercase tracking-wider shrink-0 flex items-center gap-1.5 mr-1">
          <Users className="w-4 h-4 text-teal-300" />
          <span>Familiar:</span>
        </span>

        {/* All members chip */}
        <button
          onClick={() => onSelectMember('all')}
          className={`px-3.5 py-2 rounded-full text-sm font-extrabold shrink-0 transition flex items-center gap-2 active:scale-95 shadow-sm ${
            selectedMemberId === 'all'
              ? 'bg-teal-400 text-teal-950 shadow-md ring-2 ring-white/60'
              : 'bg-teal-900/90 text-teal-100 hover:bg-teal-800 border border-teal-700/80'
          }`}
        >
          <span className="text-base">👨‍👩‍👧‍👦</span>
          <span>Todos</span>
          <span className="bg-teal-950/60 text-white px-2 py-0.5 rounded-full text-xs font-black">
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
              className={`px-3.5 py-2 rounded-full text-sm font-extrabold shrink-0 transition flex items-center gap-2 active:scale-95 ${
                isSelected
                  ? 'bg-white text-teal-950 shadow-md ring-2 ring-teal-400'
                  : 'bg-teal-900/90 text-teal-100 hover:bg-teal-800 border border-teal-700/80'
              }`}
            >
              <span className="text-base">{member.emoji || '👤'}</span>
              <span className="truncate max-w-[140px]">{member.name}</span>
            </button>
          );
        })}

        {/* Add member button */}
        <button
          onClick={onAddMember}
          className="px-3.5 py-2 rounded-full text-sm font-extrabold shrink-0 bg-teal-900/50 hover:bg-teal-800 text-teal-200 border-2 border-dashed border-teal-500/60 flex items-center gap-1.5 transition active:scale-95"
          title="Adicionar Membro da Família"
        >
          <Plus className="w-4 h-4 text-teal-300" />
          <span>+ Familiar</span>
        </button>
      </div>
    </div>
  );
};


