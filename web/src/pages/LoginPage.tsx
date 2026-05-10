import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { signInWithGoogleWeb, fetchGoogleUserInfo } from '@/services/googleAuth';
import type { User } from '@/core/entities/User';
import { IoSync, IoCheckmarkDone, IoPhonePortrait, IoGitBranch, IoLogoGoogle } from 'react-icons/io5';
import type { IconType } from 'react-icons';

interface Feature {
  Icon: IconType;
  text: string;
}

const FEATURES: Feature[] = [
  { Icon: IoSync, text: 'Sincronización en tiempo real' },
  { Icon: IoPhonePortrait, text: 'Disponible en web y móvil' },
  { Icon: IoCheckmarkDone, text: 'Gestión de tareas con gamificación' },
  { Icon: IoGitBranch, text: 'Subtareas organizadas jerárquicamente' },
];

const SCOPES = [
  'openid', 'profile', 'email',
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
          Al continuar, tus datos se sincronizan de forma segura en la nube.
        </p>
      </div>
    </div>
  );
}
