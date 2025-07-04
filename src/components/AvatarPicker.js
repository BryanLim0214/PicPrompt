import React from 'react';
import { LucideSmile, LucideGhost, LucideFeather, LucideHeart, LucideStar, LucideSparkles, LucideRocket, LucideBrainCircuit } from 'lucide-react';

const AVATAR_COLORS = ["#38bdf8", "#fbbf24", "#34d399", "#f472b6", "#a78bfa", "#f87171"];
export const AVATAR_ICONS = [LucideSmile, LucideGhost, LucideFeather, LucideHeart, LucideStar, LucideSparkles, LucideRocket, LucideBrainCircuit];

export default function AvatarPicker({ avatar, setAvatar }) {
    const CurrentIcon = AVATAR_ICONS[avatar.iconIndex];
    const nextIcon = () => setAvatar(a => ({ ...a, iconIndex: (a.iconIndex + 1) % AVATAR_ICONS.length }));
    
    return (
        <div className="flex items-center justify-center gap-4">
            <button onClick={nextIcon} className="p-4 rounded-full transition-transform transform hover:scale-110" style={{ backgroundColor: avatar.color, color: 'white' }}>
                <CurrentIcon size={40} />
            </button>
            <div className="flex flex-wrap gap-2 justify-center">
                {AVATAR_COLORS.map(color => (
                    <button key={color} onClick={() => setAvatar(a => ({ ...a, color }))} className={`w-8 h-8 rounded-full transition-transform transform hover:scale-110 ${avatar.color === color ? 'ring-2 ring-offset-2 ring-offset-[#13233f] ring-white' : ''}`} style={{ backgroundColor: color }} />
                ))}
            </div>
        </div>
    );
}
