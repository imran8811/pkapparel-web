/**
 * A list's items in groups, each shown under a heading (the admin's stock and shop lists by category, owner request
 * 2026-11-18). The groups are sorted by `compare` applied to their first items (groups it ranks the same keep the order
 * they come in), and each group's items keep their order (the newest first).
 */
export function inGroups<T>(items: readonly T[], keyOf: (item: T) => string, compare: (a: T, b: T) => number): { key: string; items: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  return [...groups].map(([key, members]) => ({ key, items: members })).sort((a, b) => compare(a.items[0], b.items[0]));
}

/** Where a value is in a list in staff or menu order (a department's slug among all of them…): one not in it comes last. */
export function placeIn(list: readonly string[], value: string): number {
  const index = list.indexOf(value);
  return index === -1 ? list.length : index;
}
