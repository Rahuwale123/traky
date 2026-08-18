import type { users } from "../db/schema/index";

type UserRow = typeof users.$inferSelect;

export function toSafeUser<T extends UserRow>(user: T) {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

export function toSafeUsers<T extends UserRow>(list: T[]) {
  return list.map(toSafeUser);
}
