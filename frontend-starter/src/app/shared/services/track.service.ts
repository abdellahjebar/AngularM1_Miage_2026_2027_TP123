import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { filter, map, Observable } from 'rxjs';
import { Page } from '../models/page.model';
import { Track } from '../models/track.model';

/**
 * What an upload emits: progress updates, then the created track.
 * `percent` is null when the browser does not know the total size (never NaN).
 */
export type UploadEvent =
  | { type: 'progress'; percent: number | null }
  | { type: 'done'; track: Track };

/** Encapsulates all HTTP operations for backing tracks. */
@Injectable({ providedIn: 'root' })
export class TrackService {
  private readonly http = inject(HttpClient);

  list(page = 1, limit = 5) {
    return this.http.get<Page<Track>>('/api/tracks', {
      params: { page, limit },
    });
  }

  /**
   * Uploads a track. With `observe: 'events'` the request emits many HttpEvents (sent, upload progress,
   * response) instead of one final body, so we keep the useful ones and map them to UploadEvent.
   */
  upload(file: File, title: string): Observable<UploadEvent> {
    const body = new FormData();
    body.append('audio', file);
    body.append('title', title);
    return this.http
      .post<Track>('/api/tracks', body, { reportProgress: true, observe: 'events' })
      .pipe(
        map((event): UploadEvent | null => {
          if (event.type === HttpEventType.UploadProgress) {
            const percent = event.total ? Math.round((100 * event.loaded) / event.total) : null;
            return { type: 'progress', percent };
          }
          if (event.type === HttpEventType.Response && event.body) {
            return { type: 'done', track: event.body };
          }
          return null;
        }),
        filter((event): event is UploadEvent => event !== null),
      );
  }

  /** Deletes a track. The backend checks the token and the owner, and answers 204 without a body. */
  delete(id: string) {
    return this.http.delete<void>(`/api/tracks/${id}`);
  }

  audio(id: string) {
    return this.http.get(`/api/tracks/${id}/audio`, {
      responseType: 'blob',
    });
  }
}
