import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { fetchGoogleUserInfo } from '@/services/googleAuth';
import type { User } from '@/core/entities/User';

/**
 * OAuth callback page — handles the redirect from Google OAuth.
 * Extracts access_token from URL hash fragment.
 */
export function AuthCallback() {
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');

    if (accessToken) {
      fetchGoogleUserInfo(accessToken)
        .then((profile) => {
          const newUser: User = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            avatar_url: profile.picture,
            access_token: accessToken,
            token_expires_at: new Date(Date.now() + 3600000).toISOString(),
            granted_scopes: [],
          };
          setUser(newUser);
          navigate('/', { replace: true });
        })
        .catch(() => navigate('/login', { replace: true }));
    } else {
      navigate('/login', { replace: true });
    }
  }, []);

  return (
    <div className="loading-page">
      <div className="spinner" />
      <span style={{ color: 'var(--text-secondary)' }}>Autenticando...</span>
    </div>
  );
}
