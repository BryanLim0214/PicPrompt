import React, { useState, useEffect } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import LobbyScreen from './components/LobbyScreen';
import GameRoom from './components/GameRoom';
import { LucideLoader2 } from 'lucide-react';
import { FirebaseConfigErrorScreen } from './components/GameScreens';

export default function App() {
    const [user, setUser] = useState(null);
    const [roomId, setRoomId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [configError, setConfigError] = useState(null);

    useEffect(() => {
        if (!auth) { 
            setConfigError({ code: 'initialization-failed' }); 
            setIsLoading(false); 
            return; 
        }
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) { 
                setUser(currentUser); 
                setIsLoading(false); 
            } else { 
                signInAnonymously(auth).catch(err => { 
                    console.error(err); 
                    setConfigError(err); 
                    setIsLoading(false); 
                }); 
            }
        });
        return () => unsubscribe();
    }, []);
    
    if (configError) return <FirebaseConfigErrorScreen error={configError} />;
    if (isLoading) return <div className="min-h-screen bg-[#0d1a2e] flex items-center justify-center text-white"><LucideLoader2 className="animate-spin h-12 w-12" /></div>;
    if (!user) return <div className="min-h-screen bg-[#0d1a2e] flex items-center justify-center text-white">Authenticating...</div>;
    
    if (roomId) {
        return <GameRoom roomId={roomId} user={user} goHome={() => setRoomId(null)} />;
    } else {
        return <LobbyScreen user={user} setRoomId={setRoomId} />;
    }
}
