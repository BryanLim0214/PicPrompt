import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { LucideMessageSquare, LucideSend } from 'lucide-react';

export default function Chat({ roomId, user }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const q = query(collection(db, "games", roomId, "messages"), orderBy("timestamp", "asc"));
        const unsub = onSnapshot(q, (snap) => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => unsub();
    }, [roomId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;
        await addDoc(collection(db, "games", roomId, "messages"), { text: newMessage, timestamp: serverTimestamp(), uid: user.id, name: user.name });
        setNewMessage('');
    };

    return (
        <div className="bg-[#13233f] p-4 rounded-lg shadow-lg border border-cyan-900/50 h-full flex flex-col">
            <h2 className="text-xl font-bold text-cyan-300 flex items-center mb-4 flex-shrink-0"><LucideMessageSquare className="mr-2"/> Chat</h2>
            <div className="flex-grow bg-[#0d1a2e] rounded p-2 mb-3 overflow-y-auto min-h-0">
                {messages.map(msg => (
                    <div key={msg.id} className={`mb-2 flex flex-col ${msg.uid === user.id ? 'items-end' : 'items-start'}`}>
                        <span className={`text-xs px-2 ${msg.uid === user.id ? 'text-gray-500' : 'text-cyan-400'}`}>{msg.name}</span>
                        <p className={`inline-block p-2 rounded-lg max-w-xs break-words ${msg.uid === user.id ? 'bg-cyan-800' : 'bg-gray-700'}`}>{msg.text}</p>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2 flex-shrink-0">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="w-full bg-[#0d1a2e] border border-gray-600 rounded-md p-2 focus:outline-none" />
                <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 rounded-md p-2"><LucideSend /></button>
            </form>
        </div>
    );
};
