PicPrompt - The AI Drawing & Guessing Game
Welcome to PicPrompt, a real-time, multiplayer party game where creativity and deception collide! One player writes a secret prompt, an AI generates an image based on it, and the other players must guess the original prompt. Can you fool your friends with a clever fake prompt, or can you deduce the real one from the AI's masterpiece?

This project was built with modern web technologies, providing a fast, responsive, and engaging experience for all players.

✨ Features
Real-time Multiplayer: Play with friends from anywhere, with game state synchronized instantly using Firebase.

AI Image Generation: Watch as text prompts are turned into unique, often hilarious, images using Google's generative AI.

Deception-Based Gameplay: It's not just about being right! Earn points by tricking other players into voting for your fake prompt.

Player Avatars: Customize your identity with a unique color and icon combination.

Custom Game Settings: The host can control the number of rounds and the timer speed for a tailored experience.

End-of-Game Awards: Celebrate fun moments with special titles like "Most Deceptive" and "Master Detective" at the end of the game.

Host Controls: The host can kick inactive players to keep the game moving.

Robust & Resilient: Features automatic host migration if the original host disconnects, ensuring the game never gets stuck.

🛠️ Tech Stack
Frontend: React, Vite

Backend & Database: Firebase (Firestore for real-time data, Firebase Authentication)

Styling: Tailwind CSS

AI Image Generation: Google AI Platform (Imagen)

Audio: Tone.js

🚀 Getting Started
Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

Prerequisites
Node.js (v18 or later recommended)

npm (comes with Node.js)

A Firebase project with Firestore and Anonymous Authentication enabled.

A Google AI Platform API key with the Imagen model enabled.
