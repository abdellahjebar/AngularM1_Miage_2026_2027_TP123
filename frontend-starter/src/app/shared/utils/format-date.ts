const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

/** Readable French date and time, e.g. "20 sept. 2026, 14:30". */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}
