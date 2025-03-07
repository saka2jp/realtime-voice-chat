import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

type ProcessAudioChunkResponse = {
  audio: string;
  text: string;
};

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);
  private readonly openai: OpenAI;
  private readonly activeStreams = new Map<string, { status: string }>();

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async processAudioChunk(
    audioBase64: string,
    mimeType: string = 'audio/webm',
  ): Promise<ProcessAudioChunkResponse> {
    try {
      // Decode base64 string to binary buffer
      const audioBuffer = Buffer.from(audioBase64, 'base64');

      // Check if audio buffer is too small (to avoid "Audio file is too short" error)
      if (audioBuffer.length < 4000) {
        // Approximate size check for ~0.1s of audio
        this.logger.warn(
          `Audio buffer too small: ${audioBuffer.length} bytes. Skipping processing.`,
        );
        return {
          audio: '',
          text: 'Audio chunk too short, please speak longer or check your microphone.',
        };
      }

      // Map MIME type to file extension (matching OpenAI Whisper supported formats)
      const extensionMap: Record<string, string> = {
        'audio/wav': 'wav',
        'audio/x-wav': 'wav',
        'audio/mp3': 'mp3',
        'audio/mpeg': 'mp3',
        'audio/mpga': 'mpga',
        'audio/m4a': 'm4a',
        'audio/ogg': 'ogg',
        'audio/oga': 'oga',
        'audio/webm': 'webm',
        'audio/webm;codecs=opus': 'webm',
        'audio/flac': 'flac',
        'audio/mp4': 'mp4',
        'audio/mp4;codecs=opus': 'mp4',
      };

      const extension = extensionMap[mimeType] || 'webm';
      if (!extension) {
        throw new Error(`Unsupported MIME type: ${mimeType}`);
      }
      this.logger.log(
        `Using file extension: ${extension} for MIME type: ${mimeType}`,
      );

      const tempFilePath = path.join(
        os.tmpdir(),
        `audio-${Date.now()}.${extension}`,
      );
      fs.writeFileSync(tempFilePath, audioBuffer);

      // Verify if file format is supported by OpenAI
      const supportedFormats = [
        'flac',
        'm4a',
        'mp3',
        'mp4',
        'mpeg',
        'mpga',
        'oga',
        'ogg',
        'wav',
        'webm',
      ];
      if (!supportedFormats.includes(extension)) {
        throw new Error(
          `Unsupported file format: ${extension}. Supported formats: ${JSON.stringify(supportedFormats)}`,
        );
      }

      // Call OpenAI audio API to transcribe the audio
      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
      });

      // Clean up temporary file
      fs.unlinkSync(tempFilePath);

      const userText = transcription.text;
      this.logger.log(`Transcribed text: ${userText}`);

      // Send the transcribed text to OpenAI chat API
      const chatCompletion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: userText },
        ],
      });

      const assistantText = chatCompletion.choices[0].message.content;
      this.logger.log(`Assistant response: ${assistantText}`);

      // Convert the response to speech
      const speechResponse = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: assistantText ?? '申し訳ありません。聞き取れませんでした。',
      });

      // Get audio response as buffer
      const audioData = await speechResponse.arrayBuffer();

      // Convert to base64 for sending over WebSocket
      const responseBase64 = Buffer.from(audioData).toString('base64');

      return {
        audio: responseBase64,
        text: assistantText ?? '',
      };
    } catch (error) {
      this.logger.error(`Error processing audio chunk: ${error}`);
      throw error;
    }
  }

  endStream(clientId: string) {
    if (this.activeStreams.has(clientId)) {
      this.activeStreams.delete(clientId);
      this.logger.log(`Stream ended for client: ${clientId}`);
    }
  }
}
