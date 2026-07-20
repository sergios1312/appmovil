import { useTaskStore } from '@/store/taskStore';
import { IoAlertCircle, IoClose } from 'react-icons/io5';

/**
 * Banner global de errores. Muestra el último error del taskStore (que antes se
 * seteaba pero nunca se mostraba, dejando fallos de guardado invisibles).
 */
export function ErrorBanner() {
  const error = useTaskStore((s) => s.error);
  const clearError = useTaskStore((s) => s.clearError);

  if (!error) return null;

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 16px',
        marginBottom: '16px',
        borderRadius: '12px',
        background: 'rgba(255, 59, 59, 0.12)',
        border: '1px solid rgba(255, 59, 59, 0.35)',
        color: 'var(--danger)',
        fontSize: '13px',
      }}
    >
      <IoAlertCircle size={18} />
      <span style={{ flex: 1 }}>{error}</span>
      <button
        onClick={clearError}
        aria-label="Cerrar"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--danger)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <IoClose size={16} />
      </button>
    </div>
  );
}
