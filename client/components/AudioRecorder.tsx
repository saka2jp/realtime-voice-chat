"use client";

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Mic, Square } from 'lucide-react';

export default function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [responseText, setResponseText] = useState<string>('');
  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Setup socket connection
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');
    
    socket.on('connect', () => {
      console.log('Socket connected!');
      setIsConnected(true);
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });
    
    socket.on('voiceResponse', (data: { text?: string; audio?: string }) => {
      console.log('Received voice response');
      if (data.text) {
        setResponseText(data.text);
      }
      
      if (data.audio) {
        playAudioResponse(data.audio);
      }
    });
    
    socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
    });
    
    socketRef.current = socket;
    
    return () => {
      socket.disconnect();
    };
  }, []);
  
  const startRecording = async () => {
    try {
      if (!isConnected) {
        console.error('Not connected to server');
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialize AudioContext
      audioContextRef.current = new AudioContext();
      
      // Check for supported MIME types (prioritizing OpenAI Whisper supported formats)
      const mimeTypes = [
        'audio/mp3',
        'audio/mpeg',
        'audio/m4a',
        'audio/wav', 
        'audio/ogg',
        'audio/flac',
        'audio/mp4',
        'audio/mp4;codecs=opus',
        'audio/webm;codecs=opus',
        'audio/webm'
      ];
      
      let mimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType || 'audio/webm'
      });
      console.log('Using MIME type:', mediaRecorder.mimeType);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up recording interval (e.g., send data every 2000ms to ensure enough audio data)
      const recordingInterval = 2000; // 録音間隔を2秒に延長して十分な音声データを確保
      
      // Tell server we're starting a voice stream
      socketRef.current?.emit('startVoiceStream');
      
      // Handle data available from recorder
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && socketRef.current) {
          // Convert blob to base64
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = (reader.result as string).split(',')[1];
            // Send audio chunk to server with MIME type
            socketRef.current?.emit('voiceChunk', { 
              audio: base64data,
              mimeType: mediaRecorder.mimeType
            });
          };
          reader.readAsDataURL(event.data);
        }
      };
      
      // Start recording with longer interval to ensure audio chunks are long enough
      mediaRecorder.start(recordingInterval);
      console.log(`Recording started with interval: ${recordingInterval}ms`);
      setIsRecording(true);
      
    } catch (error: unknown) {
      console.error('Error starting recording:', error instanceof Error ? error.message : error);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      // Tell server we're ending the voice stream
      socketRef.current?.emit('endVoiceStream');
      
      setIsRecording(false);
    }
  };
  
  const playAudioResponse = async (base64Audio: string) => {
    try {
      // Create audio context if not exists
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      // Convert base64 to array buffer
      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Decode audio data
      const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
      
      // Create audio source
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start(0);
    } catch (error: unknown) {
      console.error('Error playing audio response:', error instanceof Error ? error.message : error);
    }
  };

  return (
    <div className="flex flex-col items-center p-6 border rounded-lg shadow-md w-full max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Real-time Voice Chat</h2>
      
      <div className="flex items-center justify-center space-x-4 mb-6">
        <Button
          variant={isRecording ? "destructive" : "default"}
          size="lg"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={!isConnected}
          className="h-16 w-16 rounded-full"
        >
          {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>
      </div>
      
      <div className="bg-slate-100 p-4 rounded-lg w-full min-h-[100px] mb-4">
        <p className="text-sm text-gray-500 mb-2">Response:</p>
        <p>{responseText || 'Waiting for response...'}</p>
      </div>
      
      <div className="text-sm text-gray-500">
        Status: {isConnected ? 'Connected to server' : 'Disconnected'}
      </div>
    </div>
  );
}
