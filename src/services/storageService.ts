
import { User, PlanTier } from '../types';
import { generateId } from '../utils';
import { hashPassword, verifyPassword } from './cryptoService';

interface StoredUser extends User {
  passwordHash?: string;
  passwordSalt?: string;
  /** @deprecated — plain passwords no longer stored */
  password?: string;
}

class ApiService {
  private DB_USERS_KEY = 'lumina_users_db';
  private ACTIVE_SESSION_KEY = 'lumina_active_session';

  constructor() {
    this.migrateLegacyPasswords();
  }

  /**
   * One-time migration: hash any plaintext passwords left from old versions.
   */
  private async migrateLegacyPasswords() {
    try {
      const usersStr = localStorage.getItem(this.DB_USERS_KEY);
      if (!usersStr) return;

      const users: StoredUser[] = JSON.parse(usersStr);
      let changed = false;

      for (const user of users) {
        if (user.password && !user.passwordHash) {
          const { hash, salt } = await hashPassword(user.password);
          user.passwordHash = hash;
          user.passwordSalt = salt;
          delete user.password;
          changed = true;
        }
      }

      if (changed) {
        localStorage.setItem(this.DB_USERS_KEY, JSON.stringify(users));
      }
    } catch (e) {
      console.error('Migration error:', e);
    }
  }

  public getAllUsers(): StoredUser[] {
    try {
        const usersStr = localStorage.getItem(this.DB_USERS_KEY);
        return usersStr ? JSON.parse(usersStr) : [];
    } catch (e) {
        return [];
    }
  }

  public async login(email: string, password: string): Promise<User | null> {
    const users = this.getAllUsers();

    for (const user of users) {
      if (user.email !== email) continue;

      // Check hashed password
      if (user.passwordHash && user.passwordSalt) {
        const valid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
        if (valid) {
          const { passwordHash, passwordSalt, password: _p, ...safeUser } = user;
          this.updateActiveSession(safeUser as User);
          return safeUser as User;
        }
      }
    }

    return null;
  }

  public getUserById(id: string): User | null {
    const users = this.getAllUsers();
    const user = users.find(u => u.id === id);
    if (user) {
        const { passwordHash, passwordSalt, password: _p, ...safeUser } = user as StoredUser;
        return safeUser as User;
    }
    return null;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    try {
        const users = this.getAllUsers();
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            localStorage.setItem(this.DB_USERS_KEY, JSON.stringify(users));

            const { passwordHash, passwordSalt, password: _p, ...safeUser } = users[index] as StoredUser;
            this.updateActiveSession(safeUser as User);
            return safeUser as User;
        }
    } catch (e) {
        console.error("Update User Error:", e);
    }
    return null;
  }

  public async register(name: string, email: string, password: string): Promise<User | null> {
    try {
      const users = this.getAllUsers();
      if (users.find(u => u.email === email)) return null;

      const { hash, salt } = await hashPassword(password);

      const newUser: StoredUser = {
        id: generateId(),
        name,
        email,
        passwordHash: hash,
        passwordSalt: salt,
        plan: PlanTier.FREE,
        xp: 0,
        level: 1,
        theme: 'blue',
        hasSeenOnboarding: false,
      };

      users.push(newUser);
      localStorage.setItem(this.DB_USERS_KEY, JSON.stringify(users));

      const { passwordHash, passwordSalt, ...safeUser } = newUser;
      this.updateActiveSession(safeUser as User);
      return safeUser as User;
    } catch (e) {
      console.error("Register Error:", e);
      return null;
    }
  }

  private updateActiveSession(user: User) {
      localStorage.setItem(this.ACTIVE_SESSION_KEY, JSON.stringify(user));
  }

  public getData<T>(key: string, userId: string): T {
    try {
        const val = localStorage.getItem(`${key}_${userId}`);
        return val ? JSON.parse(val) : ([] as any);
    } catch (e) {
        console.error(`Get Data Error (${key}):`, e);
        return [] as any;
    }
  }

  public saveData<T>(key: string, userId: string, data: T) {
    try {
        localStorage.setItem(`${key}_${userId}`, JSON.stringify(data));
    } catch (e) {
        console.error(`Save Data Error (${key}):`, e);
    }
  }
}

export const api = new ApiService();
