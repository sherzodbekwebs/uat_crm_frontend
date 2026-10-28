const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function mergeLead(base, mine, latest) {
  const merged = { ...latest };
  const conflicts = [];
  for (const key of Object.keys(mine)) {
    if (equal(mine[key], base[key])) continue;
    if (!equal(latest[key], base[key]) && !equal(mine[key], latest[key])) {
      conflicts.push(key);
    }
    merged[key] = mine[key];
  }
  return { merged, conflicts };
}

export async function saveWithMerge({ base, data, put, refresh, resolve }) {
  let snapshot = base;
  let draft = data;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await put(draft, snapshot.version);
    } catch (error) {
      if (error.status !== 409) throw error;
      const latest = await refresh();
      if (!latest) throw new Error('Karta topilmadi. Kiritilgan ma’lumotlar oynada saqlanib turibdi.');
      const { id, version, createdAt, updatedAt, ...remote } = latest;
      const result = mergeLead(snapshot, draft, remote);
      draft = result.conflicts.length
        ? await resolve(result.conflicts, result.merged, remote)
        : result.merged;
      snapshot = latest;
    }
  }
  throw new Error('Karta yana o‘zgardi. Ma’lumotlaringiz saqlanib turibdi, qayta saqlashni bosing.');
}
