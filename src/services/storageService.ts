
import { User, PlanTier } from '../types';
import { generateId } from '../utils';

interface StoredUser extends User {
  password?: string;
}

const SEED_USER: any = {
  id: 'user_pavel_hopson_admin',
  name: 'PavelHopson',
  email: 'garaa11@mail.ru',
  password: 'Zeref1997',
  plan: PlanTier.FREE,
  xp: 1250,
  level: 3,
  theme: 'blue',
  hasSeenOnboarding: false,
  geminiApiKey: '',
  createdAt: Date.now()
};

class ApiService {
  private DB_USERS_KEY = 'lumina_users_db';
  private ACTIVE_SESSION_KEY = 'lumina_active_session';

  constructor() {
    this.initializeDB();
  }

  private initializeDB() {
    try {
        const usersStr = localStorage.getItem(this.DB_USERS_KEY);
        let users: any[] = usersStr ? JSON.parse(usersStr) : [];

        const exists = users.find(u => u.email === SEED_USER.email);
        if (!exists) {
        users.push(SEED_USER);
        localStorage.setItem(this.DB_USERS_KEY, JSON.stringify(users));
        console.log('API: Seeded User PavelHopson');
        }
    } catch (e) {
        console.error("API Init Error:", e);
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

  public login(email: string, password: string): User | null {
    const users = this.getAllUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      const { password, ...safeUser } = user;
      this.updateActiveSession(safeUser as User);
      return safeUser as User;
    }
    return null;
  }

  public getUserById(id: string): User | null {
    const users = this.getAllUsers();
    const user = users.find(u => u.id === id);
    if (user) {
        const { password, ...safeUser } = user;
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

            const { password, ...safeUser } = users[index];
            this.updateActiveSession(safeUser as User);
            return safeUser as User;
        }
    } catch (e) {
        console.error("Update User Error:", e);
    }
    return null;
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
