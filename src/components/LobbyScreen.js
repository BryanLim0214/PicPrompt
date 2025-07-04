import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { soundManager } from '../lib/soundManager';
import { LucidePlusCircle, LucideLogIn, LucideLoader2 } from 'lucide-react';
import AvatarPicker from './AvatarPicker';

export default function LobbyScreen({ user, setRoomId }) {
    const [playerName, setPlayerName] = useState('');
    const [joinRoomId, setJoinRoomId] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState('');
    const [avatar, setAvatar] = useState({ color: '#38bdf8', iconIndex: 0 });

    const handleInteraction = (action) => { soundManager.initialize(); soundManager.playSound('click', 'C4'); action(); };

    const handleCreateRoom = async () => {
        if (!playerName.trim()) return setError('Please enter your name.');
        setIsCreating(true);
        setError('');
        const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const newPlayer = { id: user.uid, name: playerName.trim(), score: 0, isHost: true, avatar };
        const newGameData = {
            gameState: 'SETUP', players: [newPlayer], round: 0,
            settings: { numRounds: 1, timerMultiplier: 1 },
            stats: { deceptionVotes: {}, correctGuesses: {}, promptLengths: {}, submissionTimes: {} }
        };
        try { await setDoc(doc(db, "games", newRoomId), newGameData); setRoomId(newRoomId); }
        catch (err) { console.error(err); setError('Could not create room.'); setIsCreating(false); }
    };

    const handleJoinRoom = async () => {
        if (!playerName.trim()) return setError('Please enter your name.');
        if (!joinRoomId.trim()) return setError('Please enter a room code.');
        setIsJoining(true);
        setError('');
        const roomRef = doc(db, "games", joinRoomId.toUpperCase());
        const roomSnap = await getDoc(roomRef);
        if (roomSnap.exists()) {
            const gameData = roomSnap.data();
            if (gameData.players.find(p => p.id === user.uid)) return setRoomId(joinRoomId.toUpperCase());
            if (gameData.gameState !== 'SETUP') { setError('Game has already started.'); setIsJoining(false); return; }
            if (gameData.players.some(p => p.name.toLowerCase() === playerName.trim().toLowerCase())) { setError('Name is already taken.'); setIsJoining(false); return; }
            const newPlayer = { id: user.uid, name: playerName.trim(), score: 0, isHost: false, avatar };
            await updateDoc(roomRef, { players: [...gameData.players, newPlayer] });
            setRoomId(joinRoomId.toUpperCase());
        } else { setError('Room not found.'); setIsJoining(false); }
    };

    return (
        <div className="min-h-screen bg-[#0d1a2e] text-white font-sans p-4 flex flex-col items-center justify-center">
            <header className="w-full text-center mb-8"><h1 className="text-6xl font-extrabold text-white tracking-tighter">Pic<span className="text-cyan-400">Prompt</span></h1><p className="text-gray-400 mt-2">The AI-powered drawing and guessing game!</p></header>
            <div className="w-full max-w-md bg-[#13233f] p-8 rounded-lg shadow-2xl border border-cyan-900/50">
                <AvatarPicker avatar={avatar} setAvatar={setAvatar} />
                <input type="text" placeholder="Enter your name" value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="w-full bg-[#0d1a2e] border border-gray-600 rounded-md p-3 mt-6 mb-6 text-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none transition" />
                <div className="space-y-4">
                    <button onClick={() => handleInteraction(handleCreateRoom)} disabled={isCreating || isJoining} className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 rounded-md py-3 px-8 text-lg font-bold transition-transform transform hover:scale-105 shadow-lg disabled:bg-gray-500 disabled:cursor-not-allowed">{isCreating ? <LucideLoader2 className="animate-spin" /> : <LucidePlusCircle />} Create New Game</button>
                    <div className="flex items-center text-gray-400"><hr className="flex-grow border-gray-600" /><span className="px-4">OR</span><hr className="flex-grow border-gray-600" /></div>
                    <div className="flex gap-2">
                        <input type="text" placeholder="Enter Room Code" value={joinRoomId} onChange={(e) => setJoinRoomId(e.target.value)} className="w-full bg-[#0d1a2e] border border-gray-600 rounded-md p-3 text-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none transition" />
                        <button onClick={() => handleInteraction(handleJoinRoom)} disabled={isJoining || isCreating} className="flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-md p-3 font-bold transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed">{isJoining ? <LucideLoader2 className="animate-spin" /> : <LucideLogIn />}</button>
                    </div>
                </div>
                {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
            </div>
        </div>
    );
}
