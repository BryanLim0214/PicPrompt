import React, { useState } from 'react';
import { LucideUsers, LucideCrown } from 'lucide-react';
import { AVATAR_ICONS } from './AvatarPicker';

export default function PlayerList({ players, prompterId, isHost, onKickPlayer }) {
    const [kickConfirm, setKickConfirm] = useState(null);
    const handleKick = (e, player) => {
        e.stopPropagation();
        if (kickConfirm === player.id) {
            onKickPlayer(player.id);
            setKickConfirm(null);
        } else {
            setKickConfirm(player.id);
        }
    };
    return (
        <div className="bg-[#13233f] p-4 rounded-lg shadow-lg border border-cyan-900/50 h-full flex flex-col">
            <h2 className="text-xl font-bold text-cyan-300 flex items-center mb-4 flex-shrink-0"><LucideUsers className="mr-2"/> Players</h2>
            <ul className="space-y-2 overflow-y-auto">
                {players.map(p => {
                    const Icon = AVATAR_ICONS[p.avatar.iconIndex];
                    return (
                        <li key={p.id} className={`flex items-center p-2 rounded-md transition-all duration-300 relative ${p.id === prompterId ? 'bg-cyan-500/20 ring-2 ring-cyan-400' : 'bg-[#0d1a2e]'} ${isHost && !p.isHost ? 'cursor-pointer hover:bg-red-900/50' : ''}`} onClick={() => isHost && !p.isHost && setKickConfirm(p.id)}>
                            {p.isHost && <LucideCrown className="absolute -top-2 -left-2 text-yellow-400" size={20} />}
                            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0" style={{ backgroundColor: p.avatar.color }}><Icon size={24} color="white" /></div>
                            <span className="font-semibold text-lg truncate flex-grow text-left">{p.name}</span>
                            <span className="font-bold text-xl text-yellow-400 flex-shrink-0 ml-2">{p.score}</span>
                            {isHost && !p.isHost && kickConfirm === p.id && <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center gap-4 rounded-md"><button className="text-white font-bold" onClick={(e) => handleKick(e, p)}>Kick?</button><button className="text-gray-300" onClick={(e) => { e.stopPropagation(); setKickConfirm(null); }}>Cancel</button></div>}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};