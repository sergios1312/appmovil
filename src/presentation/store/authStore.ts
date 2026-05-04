import { create } from 'zustand';

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthState {
  accessToken: string | null;
  user: GoogleUser | null;
  setSession: (params: { accessToken: string; user: GoogleUser }) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setSession: ({ accessToken, user }) => {
    set({
      accessToken,
      user,
    });
  },
  clearSession: () => {
    set({
      accessToken: null,
      user: null,
    });
  },
}));

