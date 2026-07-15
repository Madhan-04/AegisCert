import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage and sessionStorage globally for database test environment
const mockStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; }
  };
});

globalThis.localStorage = mockStorage() as any;
globalThis.sessionStorage = mockStorage() as any;

// Mock window.fetch globally to prevent actual server request attempts
globalThis.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, users: [] })
  })
) as any;

// Import db after setting up mocks
import { db } from '../services/db';

describe('Database cache state management', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('loads default settings when empty', () => {
    const settings = db.getSettings();
    expect(settings).toBeDefined();
    expect(settings.biometricSimulationMode).toBe(false); // standard real hardware defaults
    expect(settings.killSwitchActive).toBe(false);
  });

  it('saves and loads active user session', () => {
    expect(db.getCurrentUser()).toBeNull();
    
    const mockUser = {
      id: 'usr-student1',
      username: 'student1',
      password: 'password_hash',
      role: 'student' as const,
      name: 'John Student',
      email: 'student1@test.com'
    };

    db.setCurrentUser(mockUser);
    expect(db.getCurrentUser()).toEqual(mockUser);
  });
});
