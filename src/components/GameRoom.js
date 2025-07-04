import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { LucideHome, LucideVolume2, LucideVolumeX, LucideLoader2 } from 'lucide-react';
import PlayerList from './PlayerList';
import Chat from './Chat';
import {
    GameContentWrapper, SetupScreen, CountdownScreen, TurnTransitionScreen, PrompterScreen, WaitingScreen,
    ImageRevealScreen, ApiErrorScreen, VoteTransitionScreen, GuesserScreen, VotingScreen, RevealScreen,
    AwardsScreen, FinalScoreScreen, getRoundOptions
} from './GameScreens';
import { soundManager } from '../lib/soundManager';

export default function GameRoom({ roomId, user, goHome }) {
    const [gameData, setGameData] = useState(null);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [timer, setTimer] = useState(0);
    const gameRef = doc(db, "games", roomId);
    const prevGameState = useRef(null);

    const resizeImage = (base64Str, maxWidth = 512, maxHeight = 512) => new Promise((resolve) => {
        let img = new Image(); img.src = base64Str;
        img.onload = () => {
            let canvas = document.createElement('canvas'); let width = img.width, height = img.height;
            if (width > height) { if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; } } else { if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; } }
            canvas.width = width; canvas.height = height; canvas.getContext('2d').drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        img.onerror = () => resolve(null);
    });

    useEffect(() => {
        if (!gameData) return;
        if (prevGameState.current !== gameData.gameState) {
            if (soundEnabled) {
                const stateSounds = { GAME_START_COUNTDOWN: 'start', TURN_TRANSITION: 'start', VOTE_TRANSITION: 'start', SCORE: 'win', API_ERROR: 'error', AWARDS: 'award' };
                if (stateSounds[gameData.gameState]) soundManager.playSound(stateSounds[gameData.gameState], 'C4');
            }
            prevGameState.current = gameData.gameState;
        }
        if (!gameData.timerEndTime) { setTimer(0); return; }
        const updateTimer = () => {
            const remaining = Math.max(0, Math.round((gameData.timerEndTime - Date.now()) / 1000));
            setTimer(remaining);
            if (soundEnabled && remaining > 0 && remaining <= 10) soundManager.playSound('tick');
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [gameData, soundEnabled]);
    
    useEffect(() => {
        if (!gameData || !gameData.players.find(p => p.id === user.uid)?.isHost || timer > 0) return;
        const { gameState, prompter, guesses, players } = gameData;
        const guessers = players.filter(p => p.id !== prompter?.id);

        switch (gameState) {
            case 'GAME_START_COUNTDOWN': handleNextRound(true); break;
            case 'TURN_TRANSITION': setTimerForState(60, 'PROMPTING'); break;
            case 'PROMPTING': advanceToState('TURN_TRANSITION', { prompter: { ...prompter, timedOut: true } }); break;
            case 'GUESSING': if (guesses.length < guessers.length) { setTimerForState(5, 'VOTE_TRANSITION'); } break;
            case 'SHOWING_IMAGE': setTimerForState(45, 'GUESSING'); break;
            case 'VOTE_TRANSITION': setTimerForState(40, 'VOTING'); break;
            default: break;
        }
    }, [timer, gameData, user.uid]);

    useEffect(() => {
        if (!gameData || gameData.players.length === 0) return;
        const host = gameData.players.find(p => p.isHost);
        if (!host) {
            const newHost = gameData.players[0];
            if (newHost && newHost.id === user.uid) {
                const updatedPlayers = gameData.players.map((p, i) => ({ ...p, isHost: i === 0 }));
                updateDoc(gameRef, { players: updatedPlayers });
            }
        }
    }, [gameData?.players, user.uid]);

    useEffect(() => {
        const unsubscribe = onSnapshot(gameRef, (doc) => doc.exists() ? setGameData(doc.data()) : goHome());
        return () => unsubscribe();
    }, [roomId, goHome]);

    const setTimerForState = (durationSeconds, nextState, extraUpdates = {}) => {
        const timerMultiplier = gameData?.settings?.timerMultiplier ?? 1;
        updateDoc(gameRef, { timerEndTime: Date.now() + (durationSeconds * 1000 * timerMultiplier), gameState: nextState, ...extraUpdates });
    };
    const advanceToState = (nextState, extraUpdates = {}) => updateDoc(gameRef, { gameState: nextState, timerEndTime: null, ...extraUpdates });

    const handleStartGame = async () => {
        if (gameData.players.length < 2) return;
        setTimerForState(5, 'GAME_START_COUNTDOWN', { round: 1 });
    };

    const handleNextRound = async (isFirstRound = false) => {
        const { players, round, currentPlayerIndex, settings } = gameData;
        const numRounds = getRoundOptions(players.length)[settings.numRounds].value;
        const nextPlayerIndex = isFirstRound ? 0 : (currentPlayerIndex + 1) % players.length;
        const nextRoundNumber = (nextPlayerIndex === 0 && !isFirstRound) ? round + 1 : round;
        if (nextRoundNumber > numRounds) return advanceToState('AWARDS');
        
        const nextPrompter = players[nextPlayerIndex];
        setTimerForState(5, 'TURN_TRANSITION', {
            round: nextRoundNumber, currentPlayerIndex: nextPlayerIndex, prompter: nextPrompter,
            guesses: [], votes: {}, readyPlayers: [], originalPrompt: '', generatedImage: null, apiError: null, failedPrompt: null,
            roundPoints: players.map(p => ({ id: p.id, points: 0 })),
        });
    };

    const handlePlayAgain = async () => {
        advanceToState('SETUP', { round: 0, players: gameData.players.map(p => ({ ...p, score: 0 })), stats: { deceptionVotes: {}, correctGuesses: {}, promptLengths: {}, submissionTimes: {} } });
    };

    const handlePromptSubmit = async (prompt) => {
        const submissionTime = Date.now();
        advanceToState('GENERATING_IMAGE', { originalPrompt: prompt, [`stats.submissionTimes.${user.uid}`]: [...(gameData.stats.submissionTimes?.[user.uid] || []), submissionTime], [`stats.promptLengths.${user.uid}`]: [...(gameData.stats.promptLengths?.[user.uid] || []), prompt.length] });
        try {
            const apiKey = import.meta.env.VITE_IMAGE_API_KEY; // SECURE: Use environment variable
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ instances: [{ prompt }], parameters: { "sampleCount": 1 } }) });
            if (!response.ok) throw new Error(`API request failed: ${response.status}`);
            const result = await response.json();
            if (result.predictions && result.predictions[0].bytesBase64Encoded) {
                const resizedImageUrl = await resizeImage(`data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`);
                if (!resizedImageUrl) throw new Error("Image processing failed.");
                await updateDoc(gameRef, { generatedImage: resizedImageUrl });
                setTimerForState(5, 'SHOWING_IMAGE');
            } else { throw new Error("Image generation failed."); }
        } catch (error) { console.error(error); advanceToState('API_ERROR', { apiError: error.message, failedPrompt: prompt }); }
    };
    
    const handleGuessSubmit = async (guess, player) => {
        soundManager.playSound('click', 'E4');
        const submissionTime = Date.now();
        const newGuess = { guess, player, id: player.id };
        const updatedGuesses = [...(gameData.guesses || []), newGuess];
        await updateDoc(gameRef, { guesses: updatedGuesses, [`stats.submissionTimes.${user.uid}`]: [...(gameData.stats.submissionTimes?.[user.uid] || []), submissionTime], [`stats.promptLengths.${user.uid}`]: [...(gameData.stats.promptLengths?.[user.uid] || []), guess.length] });
        const guessers = gameData.players.filter(p => p.id !== gameData.prompter.id);
        if(updatedGuesses.length === guessers.length) {
            setTimerForState(5, 'VOTE_TRANSITION');
        }
    };

    const handleVote = async (votedForPrompt, voterId) => {
        soundManager.playSound('correct', 'G4');
        const updatedVotes = { ...gameData.votes, [voterId]: votedForPrompt };
        await updateDoc(gameRef, { votes: updatedVotes });
        
        const voters = gameData.players.filter(p => p.id !== gameData.prompter.id);
        if (Object.keys(updatedVotes).length === voters.length) {
            const { players, prompter } = gameData;
            let roundPoints = players.map(p => ({ id: p.id, name: p.name, points: 0, reason: '' }));
            let statsUpdates = {};
            const findPoints = (playerId) => roundPoints.find(p => p.id === playerId);

            for (const [voterId, votedPrompt] of Object.entries(updatedVotes)) {
                if (votedPrompt.isOriginal) {
                    findPoints(voterId).points += 200; findPoints(voterId).reason = 'Found the real prompt!';
                    findPoints(prompter.id).points += 75; findPoints(prompter.id).reason = 'Your prompt was found!';
                    statsUpdates[`stats.correctGuesses.${voterId}`] = (gameData.stats.correctGuesses?.[voterId] || 0) + 1;
                } else {
                    findPoints(votedPrompt.player.id).points += 100; findPoints(votedPrompt.player.id).reason = 'Fooled a player!';
                    statsUpdates[`stats.deceptionVotes.${votedPrompt.player.id}`] = (gameData.stats.deceptionVotes?.[votedPrompt.player.id] || 0) + 1;
                }
            }
            const newPlayers = players.map(p => ({ ...p, score: p.score + (findPoints(p.id)?.points || 0) }));
            await updateDoc(gameRef, { players: newPlayers, roundPoints, ...statsUpdates });
            setTimerForState(15, 'REVEAL');
        }
    };
    
    const handleReadyUp = async () => {
        const { readyPlayers = [] } = gameData;
        if (readyPlayers.includes(user.uid)) return;
        await updateDoc(gameRef, { readyPlayers: [...readyPlayers, user.uid] });
    };

    useEffect(() => {
        if (!gameData || gameData.gameState !== 'REVEAL' || !gameData.players.find(p => p.id === user.uid)?.isHost) return;
        const { readyPlayers = [], players } = gameData;
        if (readyPlayers.length === players.length) {
            handleNextRound();
        }
    }, [gameData?.readyPlayers, gameData?.gameState, user.uid]);

    if (!gameData) return <div className="min-h-screen bg-[#0d1a2e] flex items-center justify-center text-white"><LucideLoader2 className="animate-spin h-12 w-12" /></div>;
    const me = gameData.players.find(p => p.id === user.uid);
    if (!me) return <div className="min-h-screen bg-[#0d1a2e] flex items-center justify-center text-white">Joining room...</div>;

    const renderGameContent = () => {
        const { gameState, prompter } = gameData;
        const isPrompter = me.id === prompter?.id;
        const screenMap = {
            'SETUP': <SetupScreen gameData={gameData} isHost={me.isHost} onStartGame={handleStartGame} roomId={roomId} onSettingsChange={(settings) => updateDoc(gameRef, { settings })} />,
            'GAME_START_COUNTDOWN': <CountdownScreen title="Game Starting!" />,
            'TURN_TRANSITION': <TurnTransitionScreen prompter={prompter} />,
            'PROMPTING': isPrompter ? <PrompterScreen prompter={prompter} onSubmit={handlePromptSubmit} onSkip={() => handleNextRound()} isHost={me.isHost} /> : <WaitingScreen message={`Waiting for ${prompter?.name} to write a prompt...`} timedOut={prompter?.timedOut} onSkip={() => handleNextRound()} isHost={me.isHost} />,
            'GENERATING_IMAGE': <WaitingScreen message="Generating image..." />,
            'SHOWING_IMAGE': <ImageRevealScreen image={gameData.generatedImage} />,
            'API_ERROR': <ApiErrorScreen error={gameData.apiError} onRetry={() => advanceToState('PROMPTING')} onContinue={() => handleNextRound()} isHost={me.isHost} />,
            'VOTE_TRANSITION': <VoteTransitionScreen />,
            'GUESSING': !isPrompter && !gameData.guesses?.some(g => g.id === me.id) ? <GuesserScreen image={gameData.generatedImage} onGuess={(guess) => handleGuessSubmit(guess, me)} /> : <WaitingScreen message="Waiting for other players to guess..." image={gameData.generatedImage} />,
            'VOTING': !isPrompter && !(gameData.votes && gameData.votes[me.id]) ? <VotingScreen gameData={gameData} onVote={(prompt) => handleVote(prompt, me.id)} me={me} /> : <WaitingScreen message={isPrompter ? "Players are voting..." : "Waiting for other players to vote..."} image={gameData.generatedImage} />,
            'REVEAL': <RevealScreen gameData={gameData} onReadyUp={handleReadyUp} me={me} />,
            'AWARDS': <AwardsScreen gameData={gameData} onContinue={() => advanceToState('SCORE')} isHost={me.isHost} />,
            'SCORE': <FinalScoreScreen players={gameData.players} onPlayAgain={handlePlayAgain} isHost={me.isHost} />,
        };
        return <GameContentWrapper timer={timer} gameData={gameData}>{screenMap[gameState] || <div className="text-white">Loading...</div>}</GameContentWrapper>;
    };

    return (
        <div className="min-h-screen bg-[#0d1a2e] text-white font-sans p-4 sm:p-6 lg:p-8 flex flex-col">
            <header className="w-full flex justify-between items-center mb-4 flex-shrink-0">
                <button onClick={goHome} className="p-2 text-gray-400 hover:text-white"><LucideHome /></button>
                <h1 className="text-4xl font-extrabold text-white tracking-tighter">Pic<span className="text-cyan-400">Prompt</span></h1>
                <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 text-gray-400 hover:text-white">{soundEnabled ? <LucideVolume2 /> : <LucideVolumeX />}</button>
            </header>
            <main className="flex-grow grid grid-cols-1 lg:grid-cols-5 gap-6 w-full max-w-screen-2xl mx-auto min-h-0">
                <PlayerList players={gameData.players} prompterId={gameData.prompter?.id} isHost={me.isHost} onKickPlayer={(playerId) => updateDoc(gameRef, { players: gameData.players.filter(p => p.id !== playerId) })} />
                <div className="lg:col-span-3 min-h-0">{renderGameContent()}</div>
                <Chat roomId={roomId} user={me} />
            </main>
        </div>
    );
}