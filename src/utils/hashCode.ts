/**
 * Returns an integer hashCode for the given string.
 * Implementation is taken from Java's `String#hashCode`.
 */
export function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}
