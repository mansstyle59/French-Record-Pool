import * as mm from 'music-metadata-browser';

export interface ExtractedMetadata {
  title?: string;
  artist?: string;
  duration?: number;
  bpm?: number;
  genre?: string[];
  trackNumber?: number;
  year?: number;
  album?: string;
}

export async function extractMetadata(file: File): Promise<ExtractedMetadata> {
  const metadata = await mm.parseBlob(file);
  return {
    title: metadata.common.title,
    artist: metadata.common.artist,
    duration: metadata.format.duration,
    bpm: metadata.common.bpm,
    genre: metadata.common.genre,
    trackNumber: metadata.common.track.no || undefined,
    year: metadata.common.year,
    album: metadata.common.album,
  };
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
