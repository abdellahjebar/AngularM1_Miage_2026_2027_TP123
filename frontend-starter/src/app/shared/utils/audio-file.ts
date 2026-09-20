/** Same limit and accepted types as the API (backend/src/app.js). */
export const MAX_AUDIO_SIZE = 25 * 1024 * 1024;

const ALLOWED_AUDIO_TYPES = new Set([
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/mp4',
  'audio/x-m4a',
]);

const AUDIO_FORMATS: Record<string, string> = {
  'audio/mpeg': 'MP3',
  'audio/wav': 'WAV',
  'audio/x-wav': 'WAV',
  'audio/ogg': 'OGG',
  'audio/mp4': 'M4A',
  'audio/x-m4a': 'M4A',
};

/** Short format label for a MIME type: MP3, WAV, OGG, M4A. */
export function audioFormat(mimeType: string): string {
  return AUDIO_FORMATS[mimeType] ?? mimeType.replace(/^audio\//, '').toUpperCase();
}

/** Human-readable size: 512 o, 12,5 Ko, 6,1 Mo. */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;

  const [value, unit] = bytes < 1024 * 1024 ? [bytes / 1024, 'Ko'] : [bytes / (1024 * 1024), 'Mo'];
  return `${value.toFixed(1).replace('.', ',')} ${unit}`;
}

/** Understandable message for an <audio> element error (MediaError.code). */
export function mediaErrorMessage(code?: number): string {
  switch (code) {
    case 1:
      return 'La lecture a été interrompue.';
    case 2:
      return 'Une erreur réseau a interrompu la lecture.';
    case 3:
      return 'Le fichier est corrompu ou ne peut pas être décodé.';
    case 4:
      return 'Ce format audio n’est pas pris en charge par votre navigateur.';
    default:
      return 'Le lecteur n’a pas pu lire ce fichier.';
  }
}

/** Returns a message if the API would refuse this file, otherwise null. */
export function audioFileError(file: File): string | null {
  if (!ALLOWED_AUDIO_TYPES.has(file.type)) {
    return 'Format non accepté. Formats acceptés : MP3, WAV, OGG et M4A.';
  }

  if (file.size > MAX_AUDIO_SIZE) {
    return `Fichier trop volumineux (${formatSize(file.size)}). Taille maximale : 25 Mo.`;
  }

  return null;
}
