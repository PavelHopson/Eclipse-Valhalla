import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { api } from './storageService';
import { PlanTier } from '../types';

const USERS_KEY = 'lumina_users_db';
const SESSION_KEY = 'lumina_active_session';

function clearAll() {
  localStorage.clear();
}

describe('storageService.api.saveData + getData', () => {
  const userId = 'u_test';

  beforeEach(clearAll);
  afterEach(clearAll);

  it('round-trips arbitrary JSON data per user', () => {
    const payload = [{ id: '1', title: 'first' }, { id: '2', title: 'second' }];
    api.saveData('reminders', userId, payload);
    expect(api.getData('reminders', userId)).toEqual(payload);
  });

  it('returns an empty array when the key is missing', () => {
    expect(api.getData('reminders', userId)).toEqual([]);
  });

  it('scopes data by userId so different users do not leak state', () => {
    api.saveData('reminders', 'user_a', [{ id: 'a1' }]);
    api.saveData('reminders', 'user_b', [{ id: 'b1' }, { id: 'b2' }]);
    expect(api.getData('reminders', 'user_a')).toEqual([{ id: 'a1' }]);
    expect(api.getData('reminders', 'user_b')).toEqual([{ id: 'b1' }, { id: 'b2' }]);
  });

  it('supports overlapping keys across different namespaces', () => {
    api.saveData('reminders', userId, [{ kind: 'reminder' }]);
    api.saveData('notes', userId, [{ kind: 'note' }]);
    expect(api.getData('reminders', userId)).toEqual([{ kind: 'reminder' }]);
    expect(api.getData('notes', userId)).toEqual([{ kind: 'note' }]);
  });

  it('recovers from corrupted JSON by returning an empty array', () => {
    localStorage.setItem(`reminders_${userId}`, '{ this is not valid json');
    expect(api.getData('reminders', userId)).toEqual([]);
  });
});

describe('storageService.api.getAllUsers', () => {
  beforeEach(clearAll);
  afterEach(clearAll);

  it('returns an empty array when the users DB is empty', () => {
    expect(api.getAllUsers()).toEqual([]);
  });

  it('parses a valid users DB from localStorage', () => {
    const stored = [
      { id: '1', name: 'A', email: 'a@test.com', plan: PlanTier.FREE, xp: 0, level: 1 },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(stored));
    expect(api.getAllUsers()).toEqual(stored);
  });

  it('returns an empty array when the users DB JSON is corrupted', () => {
    localStorage.setItem(USERS_KEY, '{{{corrupt');
    expect(api.getAllUsers()).toEqual([]);
  });
});

describe('storageService.api.getUserById', () => {
  beforeEach(clearAll);
  afterEach(clearAll);

  it('returns null for unknown id', () => {
    expect(api.getUserById('missing')).toBeNull();
  });

  it('returns the user without passwordHash and passwordSalt', () => {
    localStorage.setItem(
      USERS_KEY,
      JSON.stringify([
        {
          id: '1',
          name: 'A',
          email: 'a@test.com',
          plan: PlanTier.FREE,
          xp: 0,
          level: 1,
          passwordHash: 'abcdef',
          passwordSalt: '123456',
        },
      ]),
    );

    const user = api.getUserById('1');
    expect(user).not.toBeNull();
    expect(user?.email).toBe('a@test.com');
    expect((user as unknown as { passwordHash?: string }).passwordHash).toBeUndefined();
    expect((user as unknown as { passwordSalt?: string }).passwordSalt).toBeUndefined();
  });
});

describe('storageService.api.updateUser', () => {
  beforeEach(clearAll);
  afterEach(clearAll);

  it('merges partial updates and persists them to the users DB', () => {
    localStorage.setItem(
      USERS_KEY,
      JSON.stringify([
        {
          id: '1',
          name: 'A',
          email: 'a@test.com',
          plan: PlanTier.FREE,
          xp: 10,
          level: 1,
        },
      ]),
    );

    const updated = api.updateUser('1', { xp: 120, level: 2 });
    expect(updated?.xp).toBe(120);
    expect(updated?.level).toBe(2);
    expect(updated?.email).toBe('a@test.com'); // preserved

    const dbRaw = localStorage.getItem(USERS_KEY);
    expect(dbRaw).toBeTruthy();
    const db = JSON.parse(dbRaw!);
    expect(db[0].xp).toBe(120);
    expect(db[0].level).toBe(2);
  });

  it('updates the active session with the merged user', () => {
    localStorage.setItem(
      USERS_KEY,
      JSON.stringify([
        { id: '1', name: 'A', email: 'a@test.com', plan: PlanTier.FREE, xp: 0, level: 1 },
      ]),
    );

    api.updateUser('1', { xp: 50 });
    const sessionRaw = localStorage.getItem(SESSION_KEY);
    expect(sessionRaw).toBeTruthy();
    const session = JSON.parse(sessionRaw!);
    expect(session.id).toBe('1');
    expect(session.xp).toBe(50);
  });

  it('returns null for an unknown user id', () => {
    localStorage.setItem(
      USERS_KEY,
      JSON.stringify([
        { id: '1', name: 'A', email: 'a@test.com', plan: PlanTier.FREE, xp: 0, level: 1 },
      ]),
    );
    expect(api.updateUser('missing', { xp: 9 })).toBeNull();
  });

  it('strips passwordHash and passwordSalt from the returned user', () => {
    localStorage.setItem(
      USERS_KEY,
      JSON.stringify([
        {
          id: '1',
          name: 'A',
          email: 'a@test.com',
          plan: PlanTier.FREE,
          xp: 0,
          level: 1,
          passwordHash: 'abc',
          passwordSalt: 'def',
        },
      ]),
    );

    const result = api.updateUser('1', { xp: 5 });
    expect(result).not.toBeNull();
    expect((result as unknown as { passwordHash?: string }).passwordHash).toBeUndefined();
    expect((result as unknown as { passwordSalt?: string }).passwordSalt).toBeUndefined();
  });
});

describe('storageService.api.register + login flow', () => {
  beforeEach(clearAll);
  afterEach(clearAll);

  it('creates a user, persists it, and logs the same credentials back in', async () => {
    const registered = await api.register('Alice', 'alice@test.com', 'hunter2');
    expect(registered).not.toBeNull();
    expect(registered?.name).toBe('Alice');
    expect(registered?.email).toBe('alice@test.com');
    expect(registered?.plan).toBe(PlanTier.FREE);

    // passwordHash/Salt should not be exposed on the returned user
    expect((registered as unknown as { passwordHash?: string }).passwordHash).toBeUndefined();
    expect((registered as unknown as { passwordSalt?: string }).passwordSalt).toBeUndefined();

    // But they must be persisted in the DB
    const db = JSON.parse(localStorage.getItem(USERS_KEY)!);
    expect(db[0].passwordHash).toBeTypeOf('string');
    expect(db[0].passwordSalt).toBeTypeOf('string');
    expect(db[0].passwordHash.length).toBeGreaterThan(0);

    const loggedIn = await api.login('alice@test.com', 'hunter2');
    expect(loggedIn).not.toBeNull();
    expect(loggedIn?.email).toBe('alice@test.com');
  });

  it('refuses duplicate email registration', async () => {
    await api.register('Alice', 'alice@test.com', 'hunter2');
    const duplicate = await api.register('Alice2', 'alice@test.com', 'other');
    expect(duplicate).toBeNull();
  });

  it('fails login with a wrong password', async () => {
    await api.register('Alice', 'alice@test.com', 'hunter2');
    const bad = await api.login('alice@test.com', 'wrong-password');
    expect(bad).toBeNull();
  });

  it('fails login for an unknown email', async () => {
    await api.register('Alice', 'alice@test.com', 'hunter2');
    const bad = await api.login('nobody@test.com', 'hunter2');
    expect(bad).toBeNull();
  });

  it('writes the active session on successful login', async () => {
    await api.register('Alice', 'alice@test.com', 'hunter2');
    localStorage.removeItem(SESSION_KEY);

    await api.login('alice@test.com', 'hunter2');
    const session = JSON.parse(localStorage.getItem(SESSION_KEY)!);
    expect(session.email).toBe('alice@test.com');
    expect(session.passwordHash).toBeUndefined();
  });
});
