import { VideoProvider, VideoRequest, VideoResponse, ProviderContext } from '../interfaces.js';

export class ReplicateVideoProvider implements VideoProvider {
  readonly name: string;
  generateVideo(request: VideoRequest, ctx?: ProviderContext): Promise<VideoResponse>;
  runModel<T>(model: string, input: any): Promise<T>;
}

export function getReplicateVideoProvider(): ReplicateVideoProvider;
