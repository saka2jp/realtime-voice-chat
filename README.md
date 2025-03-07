# Realtime Voice Chat with OpenAI

This application enables real-time voice conversations with AI using OpenAI's APIs. It includes both a client-side Next.js application and a server-side NestJS application.

## Features

- Real-time voice recording and playback
- Voice transcription using OpenAI Whisper
- AI responses using GPT-3.5 Turbo
- Text-to-speech conversion using OpenAI TTS

## Prerequisites

- Node.js 18+
- An OpenAI API key

## Setup

1. Clone the repository:
```
git clone https://github.com/yourusername/realtime-voice-chat.git
cd realtime-voice-chat
```

2. Install dependencies:
```
npm install
```

3. Set up environment variables:

**For the server:**
```
cp server/.env.example server/.env
```
Edit `server/.env` and add your OpenAI API key.

**For the client:**
```
cp client/.env.example client/.env
```

## Running the Application

Start both the client and server:

```
npm run dev
```

Or run them separately:

- Server: `npm run dev:server`
- Client: `npm run dev:client`

## How to Use

1. Open your browser and navigate to `http://localhost:3000`
2. Click the microphone button to start recording
3. Speak into your microphone
4. Click the stop button when finished
5. Wait for the AI to process your speech and respond

## Tech Stack

- **Client**: Next.js, React, Socket.io-client, Web Audio API
- **Server**: NestJS, Socket.io, OpenAI API

## License

MIT