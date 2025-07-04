import React, { useState, useMemo } from 'react';
import { AVATAR_ICONS } from './AvatarPicker';
import { LucideImage, LucideCrown, LucideSend, LucideLoader2, LucideTrophy, LucidePartyPopper, LucideCheckCircle, LucideAlertTriangle, LucideUserCheck, LucideClipboardCopy, LucideSettings, LucideVote, LucideSwords, LucideBrainCircuit, LucideFeather, LucideRabbit, LucideRefreshCw } from 'lucide-react';

export const GameContentWrapper = ({ timer, gameData, children }) => {
    const { round, settings, players } = gameData || {};
    const getNumRounds = () => {
        if (!settings || !players || players.length === 0) return 0;
        return getRoundOptions(players.length)[settings.numRounds]?.value || 0;
    };
    const numRounds = getNumRounds();

    return (
        <div className="w-full h-full bg-[#13233f] p-4 sm:p-6 rounded-lg shadow-2xl border border-cyan-900/50 text-center flex flex-col">
            <div className="relative w-full flex justify-center items-center mb-4 h-10">
                {round > 0 && numRounds > 0 && <div className="absolute left-0 text-lg font-bold text-gray-400">Round {round} of {numRounds}</div>}
                {timer > 0 && <div className="text-3xl font-extrabold text-cyan-300 bg-[#0d1a2e] px-4 py-1 rounded-full z-10">{Math.floor(timer/60).toString().padStart(2,'0')}:{(timer%60).toString().padStart(2,'0')}</div>}
            </div>
            <div className="flex-grow flex flex-col justify-center">{children}</div>
        </div>
    );
};

const CenteredMessageScreen = ({ title, subtitle, icon: Icon }) => <div><h2 className="text-3xl font-bold">{title}</h2>{subtitle && <p className="text-gray-400 mt-2">{subtitle}</p>}{Icon && <Icon className="h-24 w-24 text-cyan-400 mx-auto mt-6" />}</div>;
export const CountdownScreen = ({ title }) => <CenteredMessageScreen title={title} />;
export const TurnTransitionScreen = ({ prompter }) => <CenteredMessageScreen title={<>Next up: <span className="text-cyan-400">{prompter?.name || "..."}!</span></>} subtitle="Get ready to write a prompt!" icon={LucideUserCheck} />;
export const VoteTransitionScreen = () => <CenteredMessageScreen title="All guesses are in!" subtitle="Get ready to vote!" icon={LucideVote} />;
export const WaitingScreen = ({ message, image, timedOut, onSkip, isHost }) => (
    <div>
        <h2 className="text-3xl font-bold">{message}</h2>
        {timedOut && <p className="text-yellow-400 mt-2">The prompter ran out of time!</p>}
        {image && <div className="w-full aspect-square max-w-md mx-auto bg-black rounded-lg flex items-center justify-center my-6 overflow-hidden"><img src={image} alt="Generated art" className="w-full h-full object-contain" /></div>}
        <LucideLoader2 className="animate-spin h-12 w-12 text-cyan-400 mx-auto mt-6" />
        {timedOut && isHost && <button onClick={onSkip} className="w-full max-w-md mx-auto mt-4 bg-gray-600 hover:bg-gray-700 rounded-md py-3 px-6 text-lg font-bold">Skip Turn</button>}
    </div>
);
export const ImageRevealScreen = ({ image }) => <div><h2 className="text-3xl font-bold">Behold the masterpiece!</h2><div className="w-full aspect-square max-w-md mx-auto bg-black rounded-lg flex items-center justify-center my-6 overflow-hidden">{image ? <img src={image} alt="Generated art" className="w-full h-full object-contain" /> : <LucideLoader2 className="animate-spin h-10 w-10 text-gray-400"/>}</div></div>;

export const getRoundOptions = (playerCount) => {
    if (playerCount < 2) return [{ label: "3 Rounds", value: 3 }];
    const options = [
        { label: `Short Game (${Math.ceil(playerCount / 2)})`, value: Math.ceil(playerCount / 2) },
        { label: `Full Cycle (${playerCount})`, value: playerCount },
    ];
    if (playerCount > 2) {
        options.push({ label: `Double Cycle (${playerCount * 2})`, value: playerCount * 2 });
    }
    return options;
};

export function SetupScreen({ gameData, isHost, onStartGame, roomId, onSettingsChange }) {
    const [copied, setCopied] = useState(false);
    const copyRoomId = () => { const ta = document.createElement('textarea'); ta.value = roomId; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (err) { console.error('Failed to copy', err); } document.body.removeChild(ta); };
    return (
        <div className="flex flex-col justify-center items-center h-full">
            <h2 className="text-3xl font-bold">Game Lobby</h2><p className="text-gray-400 mt-2 mb-6">Waiting for players to join...</p>
            <div className="my-4"><p className="text-gray-400">Share this code:</p><div className="flex items-center justify-center gap-2 mt-2 bg-[#0d1a2e] p-3 rounded-lg cursor-pointer" onClick={copyRoomId}><span className="text-3xl font-bold tracking-widest text-yellow-300">{roomId}</span><button className="p-2 text-gray-300 hover:text-white">{copied ? <LucideCheckCircle className="text-green-400" /> : <LucideClipboardCopy />}</button></div>{copied && <p className="text-green-400 text-sm mt-2">Copied!</p>}</div>
            {isHost && <GameSettings settings={gameData.settings} playerCount={gameData.players.length} onSettingsChange={onSettingsChange} />}
            {isHost && <button onClick={onStartGame} disabled={gameData.players.length < 2} className="w-full max-w-md mx-auto mt-8 bg-cyan-600 hover:bg-cyan-700 rounded-md py-3 px-8 text-lg font-bold transition-transform transform hover:scale-105 shadow-lg disabled:bg-gray-600 disabled:cursor-not-allowed">{gameData.players.length < 2 ? "Need at least 2 players" : "Start Game"}</button>}
        </div>
    );
}

export function GameSettings({ settings, playerCount, onSettingsChange }) {
    const handleSettingChange = (key, value) => onSettingsChange({ ...settings, [key]: parseInt(value) });
    const roundOptions = getRoundOptions(playerCount);
    const timerOptions = [{label: "Fast", value: 0}, {label: "Normal", value: 1}, {label: "Slow", value: 2}];
    
    if (settings.numRounds >= roundOptions.length) {
        onSettingsChange({ ...settings, numRounds: roundOptions.length - 1 });
    }

    return (
        <div className="w-full max-w-md mx-auto mt-6 p-4 bg-[#0d1a2e] rounded-lg">
            <h3 className="text-lg font-bold text-cyan-300 flex items-center justify-center gap-2 mb-4"><LucideSettings /> Game Settings</h3>
            <div className="space-y-3">
                <div className="flex justify-between items-center"><label className="font-semibold">Rounds</label><select value={settings.numRounds} onChange={e => handleSettingChange('numRounds', e.target.value)} className="bg-[#13233f] border border-gray-600 rounded p-1">{roundOptions.map((o, i) => <option key={i} value={i}>{o.label}</option>)}</select></div>
                <div className="flex justify-between items-center"><label className="font-semibold">Timer Speed</label><select value={settings.timerMultiplier} onChange={e => handleSettingChange('timerMultiplier', e.target.value)} className="bg-[#13233f] border border-gray-600 rounded p-1">{timerOptions.map((o, i) => <option key={i} value={i}>{o.label}</option>)}</select></div>
            </div>
        </div>
    );
}

export function PrompterScreen({ prompter, onSubmit, onSkip, isHost }) {
    const [prompt, setPrompt] = useState('');
    if (prompter?.timedOut) {
        return (
            <div>
                <h2 className="text-3xl font-bold text-red-500">{prompter.name} ran out of time!</h2>
                {isHost ? 
                    <button onClick={onSkip} className="w-full max-w-md mx-auto mt-4 bg-gray-600 hover:bg-gray-700 rounded-md py-3 px-6 text-lg font-bold">Skip Turn</button>
                    : <p className="text-gray-400 mt-2 mb-6">Waiting for the host to continue...</p>
                }
            </div>
        );
    }
    return (
        <div>
            <h2 className="text-3xl font-bold">Your turn, <span className="text-cyan-400">{prompter?.name}</span>!</h2><p className="text-gray-400 mt-2 mb-6">Write a prompt to generate an image.</p>
            <div className="w-full aspect-square max-w-md mx-auto bg-gray-900/50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600 mb-6"><LucideImage className="h-24 w-24 text-gray-600" /></div>
            <div className="space-y-4"><textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="e.g., A majestic lion wearing a crown..." className="w-full h-24 bg-[#0d1a2e] border border-gray-600 rounded-md p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition resize-none" /><button onClick={() => onSubmit(prompt)} disabled={!prompt} className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md py-3 px-6 text-lg font-bold flex items-center justify-center"><LucideImage className="mr-2"/> Generate Image</button></div>
        </div>
    );
}

export function GuesserScreen({ image, onGuess }) {
    const [currentGuess, setCurrentGuess] = useState('');
    const handleSubmit = (e) => { e.preventDefault(); if (!currentGuess.trim()) return; onGuess(currentGuess); };
    return (
        <div>
            <h2 className="text-3xl font-bold">GUESS THE PROMPT</h2>
            <div className="w-full aspect-square max-w-md mx-auto bg-black rounded-lg flex items-center justify-center my-6 overflow-hidden">{image ? <img src={image} alt="Generated by prompter" className="w-full h-full object-contain" /> : <LucideLoader2 className="animate-spin h-10 w-10 text-gray-400"/>}</div>
            <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-md mx-auto"><input value={currentGuess} onChange={e => setCurrentGuess(e.target.value)} placeholder="What prompt created this image?" className="w-full bg-[#0d1a2e] border border-gray-600 rounded-md p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition" /><button type="submit" className="bg-cyan-600 hover:bg-cyan-700 rounded-md p-3 font-bold disabled:bg-gray-500" disabled={!currentGuess.trim()}><LucideSend/></button></form>
        </div>
    );
}

export function VotingScreen({ gameData, onVote, me }) {
    const { generatedImage, guesses, originalPrompt } = gameData;
    const votingOptions = useMemo(() => [...guesses.map(g => ({ ...g, isOriginal: false })), { guess: originalPrompt, isOriginal: true, id: 'original' }].sort(() => Math.random() - 0.5), [guesses, originalPrompt]);
    return (
        <div className="w-full"><h2 className="text-3xl font-bold">Vote for the Real Prompt!</h2><div className="w-full aspect-square max-w-md mx-auto bg-black rounded-lg flex items-center justify-center my-6 overflow-hidden"><img src={generatedImage} alt="Generated art" className="w-full h-full object-contain" /></div><div className="w-full max-w-xl mx-auto space-y-3">{votingOptions.map((option) => (<button key={option.id} onClick={() => onVote(option)} disabled={option.player?.id === me.id} className="w-full p-4 rounded-lg text-center transition-all duration-200 transform hover:-translate-y-1 bg-[#0d1a2e] hover:bg-cyan-900/50 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-transparent hover:border-cyan-400"><p className="text-white text-lg">{option.guess}</p></button>))}</div></div>
    );
}

export function RevealScreen({ gameData, onReadyUp, me }) {
    const { originalPrompt, prompter, roundPoints, readyPlayers = [], players } = gameData;
    const hasReadied = readyPlayers.includes(me.id);
    return (
        <div className="w-full"><h2 className="text-3xl font-bold">Round Over!</h2><div className="bg-green-900/70 border border-green-500 p-4 rounded-lg my-6 w-full max-w-2xl mx-auto"><h3 className="text-lg font-semibold text-green-300">The Real Prompt by {prompter.name}:</h3><p className="text-xl mt-1 text-white">"{originalPrompt}"</p></div><div className="space-y-3 w-full max-w-2xl mx-auto">{roundPoints?.map(p => (<div key={p.id} className="bg-[#0d1a2e] p-4 rounded-lg text-left transition-all duration-500 animate-fade-in"><div className="flex justify-between items-center"><p className="font-semibold text-cyan-300 text-lg">{p.name}</p>{p.points > 0 && <p className="font-bold text-yellow-400 text-lg whitespace-nowrap pl-4">+{p.points} point(s)</p>}</div>{p.points > 0 && <p className="text-gray-400 text-sm">{p.reason}</p>}</div>))}</div>
        <div className="mt-8">
            <button onClick={onReadyUp} disabled={hasReadied} className="w-full max-w-md mx-auto bg-cyan-600 hover:bg-cyan-700 rounded-md py-3 px-6 text-lg font-bold disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {hasReadied ? <LucideCheckCircle/> : <LucideRefreshCw />}
                {hasReadied ? "Waiting for others..." : "Ready for Next Round"}
            </button>
            <p className="text-gray-400 mt-2">{readyPlayers.length} of {players.length} players ready</p>
        </div>
        </div>
    );
}

export function AwardsScreen({ gameData, onContinue, isHost }) {
    const awards = useMemo(() => {
        const { players, stats } = gameData;
        if (!stats) return [];
        let awardsList = [];
        
        const getTopPlayer = (stat, reverse = false) => {
            let topPlayerId = null; let topScore = reverse ? Infinity : -Infinity;
            for (const p of players) {
                const p_stat = stat(p);
                if ((p_stat ?? (reverse ? Infinity : -Infinity)) !== (reverse ? Infinity : -Infinity) && (reverse ? p_stat < topScore : p_stat > topScore)) {
                    topScore = p_stat;
                    topPlayerId = p.id;
                }
            }
            return players.find(p => p.id === topPlayerId);
        };
        
        const mostDeceptive = getTopPlayer(p => stats.deceptionVotes?.[p.id] || 0);
        if (mostDeceptive && (stats.deceptionVotes?.[mostDeceptive.id] || 0) > 0) awardsList.push({ title: "Most Deceptive", player: mostDeceptive, icon: LucideSwords });
        
        const masterDetective = getTopPlayer(p => stats.correctGuesses?.[p.id] || 0);
        if (masterDetective && (stats.correctGuesses?.[masterDetective.id] || 0) > 0) awardsList.push({ title: "Master Detective", player: masterDetective, icon: LucideBrainCircuit });

        const wordWizard = getTopPlayer(p => Math.max(...(stats.promptLengths?.[p.id] || [0])));
        if (wordWizard && Math.max(...(stats.promptLengths?.[wordWizard.id] || [0])) > 0) awardsList.push({ title: "Word Wizard", player: wordWizard, icon: LucideFeather });
        
        const quickDraw = getTopPlayer(p => { const times = stats.submissionTimes?.[p.id] || []; return times.length > 0 ? (times.reduce((a,b) => a+b, 0) / times.length) : Infinity }, true);
        if (quickDraw) awardsList.push({ title: "Quick Draw", player: quickDraw, icon: LucideRabbit });

        return [...new Map(awardsList.map(item => [item.player.id, item])).values()];
    }, [gameData]);

    return (
         <div className="w-full"><h2 className="text-3xl font-bold">Awards Ceremony!</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 w-full max-w-3xl mx-auto">{awards.map((award, i) => <AwardCard key={i} award={award} />)}</div>{isHost && <button onClick={onContinue} className="w-full max-w-md mx-auto mt-8 bg-cyan-600 hover:bg-cyan-700 rounded-md py-3 px-6 text-lg font-bold">Final Scores</button>}</div>
    );
}

const AwardCard = ({ award }) => {
    const { title, player, icon: Icon } = award;
    const PlayerIcon = AVATAR_ICONS[player.avatar.iconIndex];
    return (
        <div className="bg-[#0d1a2e] p-4 rounded-lg flex flex-col items-center justify-center text-center border-2 border-yellow-400/50">
            <div className="flex items-center gap-2 text-yellow-300"><Icon /><h3 className="text-xl font-bold">{title}</h3></div>
            <div className="w-16 h-16 rounded-full flex items-center justify-center my-3" style={{ backgroundColor: player.avatar.color }}><PlayerIcon size={32} color="white" /></div>
            <p className="text-2xl font-semibold text-white">{player.name}</p>
        </div>
    );
};

export function FinalScoreScreen({ players, onPlayAgain, isHost }) {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    return (
        <div><h2 className="text-3xl font-bold">Final Scores!</h2><LucideTrophy className="mx-auto h-16 w-16 text-yellow-400 my-4" /><h3 className="text-2xl text-cyan-300 mb-6">Congratulations, <span className="font-bold text-yellow-300">{sortedPlayers[0]?.name || 'Nobody'}</span>!</h3><div className="space-y-3 max-w-md mx-auto w-full">{sortedPlayers.map((player, index) => (<div key={player.id} className={`p-4 rounded-lg flex justify-between items-center text-lg ${index === 0 ? 'bg-yellow-500/20 border-2 border-yellow-400' : 'bg-[#0d1a2e]'}`}><span className="font-bold flex items-center">{index === 0 && <LucideCrown className="mr-2 text-yellow-400"/>}{index > 0 && <span className="mr-2 text-gray-500 font-normal w-8 text-right">{index + 1}th</span>}{player.name}</span><span className="font-extrabold">{player.score} Points</span></div>))}</div>{isHost && <button onClick={onPlayAgain} className="w-full max-w-md mx-auto mt-8 bg-cyan-600 hover:bg-cyan-700 rounded-md py-3 px-6 text-lg font-bold flex items-center justify-center gap-2"><LucidePartyPopper /> Play Again</button>}</div>
    );
}

export function FirebaseConfigErrorScreen({ error }) {
    const isAuthError = error && error.code?.includes('auth');
    return (<div className="min-h-screen bg-[#0d1a2e] text-white font-sans p-4 flex flex-col items-center justify-center"><div className="w-full max-w-3xl bg-[#13233f] p-8 rounded-lg shadow-2xl border-2 border-red-500 text-center"><LucideAlertTriangle className="mx-auto h-16 w-16 text-red-400 mb-4" /><h1 className="text-3xl font-extrabold text-red-400 mb-4">{isAuthError ? "Auth Disabled" : "Firebase Error"}</h1><p className="text-lg text-gray-300 mb-6">{isAuthError ? "Anonymous Sign-In is disabled in your Firebase project." : "Could not connect to the backend."}</p></div></div>);
}

export function ApiErrorScreen({ error, onRetry, onContinue, isHost }) {
    return (<div><h2 className="text-3xl font-bold text-red-500 flex items-center justify-center"><LucideAlertTriangle className="mr-3"/> Image Failed</h2><div className="bg-red-900/20 border border-red-700/50 text-red-300 p-4 rounded-md text-center my-6 max-w-lg mx-auto"><p className="font-semibold">Image could not be created.</p><p className="text-sm mt-2">{error}</p></div>{isHost && <div className="flex gap-4 justify-center"><button onClick={onRetry} className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 rounded-md py-3 px-6 text-lg font-bold">Try Again</button><button onClick={onContinue} className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 rounded-md py-3 px-6 text-lg font-bold">Skip Turn</button></div>}</div>);
}