/** Display formatting shared by all features (Turkish, Europe/Istanbul). */

const DATE_TIME = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul",
});

export function formatDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso));
}
