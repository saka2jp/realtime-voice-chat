import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { VoiceService } from './voice.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class VoiceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(VoiceGateway.name);

  constructor(private readonly voiceService: VoiceService) {}

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('startVoiceStream')
  handleStartVoiceStream(client: Socket) {
    this.logger.log(`Start voice stream for client: ${client.id}`);
    return { event: 'streamStarted', data: { clientId: client.id } };
  }

  @SubscribeMessage('voiceChunk')
  async handleVoiceChunk(
    client: Socket,
    payload: { audio: string; mimeType?: string },
  ) {
    try {
      // Process the audio chunk and get a response
      const response = await this.voiceService.processAudioChunk(
        payload.audio,
        payload.mimeType || 'audio/webm',
      );

      // Send the response back to the client
      client.emit('voiceResponse', response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error processing voice chunk: ${errorMessage}`);
      client.emit('error', {
        message: `Error processing voice chunk: ${errorMessage}`,
      });
    }
  }

  @SubscribeMessage('endVoiceStream')
  handleEndVoiceStream(client: Socket) {
    this.logger.log(`End voice stream for client: ${client.id}`);
    this.voiceService.endStream(client.id);
    return { event: 'streamEnded', data: { clientId: client.id } };
  }
}
