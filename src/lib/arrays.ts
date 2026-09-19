/** The list with the item at `from` moved to `to`. Out-of-range moves return it unchanged. */
export function move<T>(rows: T[], from: number, to: number): T[] {
    if (to < 0 || to >= rows.length) return rows;
    const next = [...rows];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    return next;
}
