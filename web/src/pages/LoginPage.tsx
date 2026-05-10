import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { signInWithGoogleWeb, fetchGoogleUserInfo } from '@/services/googleAuth';
import type { User } from '@/core/entities/User';
import { IoCalendar, IoCheckmarkDone, IoCloudOffline, IoGitBranch, IoLogoGoogle } from 'react-icons/io5';
import type { IconType } from 'react-icons';

interface Feature {
  Icon: IconType;
  text: string;
}

const FEATURES: Feature[] = [
  { Icon: IoCalendar, text: 'Sincronizado con Google Calendar' },
  { Icon: IoCheckmarkDone, text: 'Gestion de tareas con Google Tasks' },
  { Icon: IoCloudOffline, text: 'Funciona sin conexion a internet' },
  { Icon: IoGitBranch, text: 'Subtareas organizadas jerarquicamente' },
];

const SCOPES = [
  'openid', 'profile', 'email',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/tasks',
];

export function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore.getState().setUser;
  const setStatus = useAuthStore.getState().setStatus;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setStatus('loading');

    try {
      const result = await signInWithGoogleWeb();
      if (!result) {
        setStatus('unauthenticated');
        setLoading(false);
        return;
      }

      const profile = await fetchGoogleUserInfo(result.accessToken);
      const expiresAt = new Date(Date.now() + 3600000).toISOString();

      const newUser: User = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatar_url: profile.picture,
        access_token: result.accessToken,
        token_expires_at: expiresAt,
        granted_scopes: SCOPES,
      };

      setUser(newUser);
      navigate('/', { replace: true });
    } catch (err) {
      setError(`Error de autenticacion: ${String(err)}`);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <IoCheckmarkDone size={36} color="var(--primary)" />
        </div>
        <h1>TaskFlow</h1>
        <p className="tagline">Productividad sin limites</p>

        <div className="login-features">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature">
              <span className="icon"><f.Icon size={18} /></span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        {error && (
          <p style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>{error}</p>
        )}

        <button
          className="google-btn"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? (
            <span className="spinner" style={{ borderTopColor: 'var(--bg)' }} />
          ) : (
            <>
              <IoLogoGoogle size={18} />
              Continuar con Google
            </>
          )}
        </button>

        <p className="login-disclaimer">
          Al continuar, aceptas que la app acceda a tu Google Calendar y Google Tasks para sincronizacion.
        </p>
      </div>
    </div>
  );
}
