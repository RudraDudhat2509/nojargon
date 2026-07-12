export function wordCount(text: string): number {
  return (text.match(/[A-Za-z][A-Za-z'-]*/g) ?? []).length;
}

// Each regex captures one class of concrete signal. Count total matches.
const SIGNALS: RegExp[] = [
  /\b\d[\d,.]*\b/g, // numbers
  /[$₹€£]\s?\d/g, // currency
  /\b\d+\s?(ms|kb|mb|gb|tb)\b/gi, // byte/time units
  /\b\d+\s?[%x]/gi, // percentages and multipliers (no trailing \b — % and x aren't word chars)
  /\b(19|20)\d{2}\b/g, // years
  /\b(REST|API|SDK|SLA|OAuth|webhook|integration|integrations)\b/gi, // tech specifics
  /\b[A-Z][a-z]+ (?:Inc|Ltd|LLC|Corp|GmbH|Co)\b/g, // named orgs
];

export function concreteCount(text: string): number {
  return SIGNALS.reduce((n, re) => n + (text.match(re)?.length ?? 0), 0);
}
