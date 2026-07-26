/**
 * Utility functions for parsing and adjusting grocery item quantities with a minimum of zero.
 */

export function getNumericQuantity(quantityStr: string | undefined | null): number {
  if (!quantityStr) return 0;
  const str = String(quantityStr).trim();
  const match = str.match(/(\d+(?:\.\d+)?)/);
  if (match) {
    return parseFloat(match[1]);
  }
  return 0;
}

export function adjustQuantity(quantityStr: string | undefined | null, delta: number): string {
  if (!quantityStr || String(quantityStr).trim() === '') {
    const newNum = Math.max(0, delta > 0 ? delta : 0);
    return String(newNum);
  }

  const str = String(quantityStr).trim();

  // Match leading number e.g. "2", "2 bottles", "500g", "1.5"
  const leadingMatch = str.match(/^(\d+(?:\.\d+)?)(.*)$/);
  if (leadingMatch) {
    const num = parseFloat(leadingMatch[1]);
    const unit = leadingMatch[2];
    const newNum = Math.max(0, Math.round((num + delta) * 100) / 100);
    return `${newNum}${unit}`;
  }

  // Match any number inside string e.g. "pack of 2"
  const anyNumMatch = str.match(/(\d+(?:\.\d+)?)/);
  if (anyNumMatch) {
    const num = parseFloat(anyNumMatch[1]);
    const newNum = Math.max(0, Math.round((num + delta) * 100) / 100);
    return str.replace(anyNumMatch[1], String(newNum));
  }

  // If no number found in string at all (e.g. "a bunch"):
  if (delta > 0) {
    return `2 ${str}`;
  } else {
    return `0 ${str}`;
  }
}
