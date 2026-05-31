import { useState } from 'react';
import { useWeightStore, selectLatestWeight, type WeightLog } from '@/store/weightStore';
import {
  IoBarbellOutline,
  IoAdd,
  IoTrashOutline,
  IoCreateOutline,
  IoTrendingUpOutline,
} from 'react-icons/io5';

/** Date → "YYYY-MM-DDTHH:mm" en hora local (formato de <input type="datetime-local">). */
function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/** Limita el peso a 2 dígitos enteros y 1 decimal (ej. "78.5"). */
function sanitizeWeight(raw: string): string {
  let v = raw.replace(/[^\d.]/g, '');
  const dot = v.indexOf('.');
  if (dot !== -1) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '');
  const [intPart = '', decPart = ''] = v.split('.');
  let out = intPart.slice(0, 2);
  if (v.includes('.')) out += '.' + decPart.slice(0, 1);
  return out;
}

function formatLoggedAt(iso: string): string {
  return new Date(iso).toLocaleString('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function GymPage() {
  const store = useWeightStore();
  const latest = useWeightStore(selectLatestWeight);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [datetime, setDatetime] = useState(toLocalInput(new Date()));

  const openAdd = () => {
    setEditingId(null);
    setWeight('');
    setDatetime(toLocalInput(new Date()));
    setModalOpen(true);
  };

  const openEdit = (log: WeightLog) => {
    setEditingId(log.id);
    setWeight(String(log.weight_kg));
    setDatetime(toLocalInput(new Date(log.logged_at)));
    setModalOpen(true);
  };

  const parsedWeight = parseFloat(weight);
  const canSave = !Number.isNaN(parsedWeight) && parsedWeight > 0 && datetime !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    const loggedAtIso = new Date(datetime).toISOString();
    try {
      if (editingId) {
        await store.updateWeight(editingId, { weight_kg: parsedWeight, logged_at: loggedAtIso });
      } else {
        await store.addWeight({ weight_kg: parsedWeight, logged_at: loggedAtIso });
      }
      setModalOpen(false);
    } catch {
      alert('No se pudo guardar el registro. Revisa tu conexión e inténtalo de nuevo.');
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="label">Entrenamiento</div>
        <h2>Gym</h2>
        <div className="subtitle">Registro de peso corporal</div>
      </div>

      {/* Último registro */}
      <div className="weight-latest">
        <div className="weight-latest-icon">
          <IoTrendingUpOutline size={24} />
        </div>
        <div className="weight-latest-info">
          <span className="weight-latest-label">Último registro</span>
          {latest ? (
            <>
              <span className="weight-latest-value">
                {latest.weight_kg.toFixed(1)} <small>kg</small>
              </span>
              <span className="weight-latest-date">{formatLoggedAt(latest.logged_at)}</span>
            </>
          ) : (
            <span className="weight-latest-value muted">Sin registros</span>
          )}
        </div>
      </div>

      {/* Historial */}
      <section className="dashboard-section">
        <h3 className="section-title">
          <IoBarbellOutline size={18} />
          Historial de peso
        </h3>

        {store.weights.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px' }}>
            <IoBarbellOutline size={36} color="var(--text-muted)" />
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
              Aún no registraste tu peso. Pulsa el botón + para empezar.
            </p>
          </div>
        ) : (
          <div className="weight-list">
            {store.weights.map((log) => (
              <div key={log.id} className="weight-item" onClick={() => openEdit(log)}>
                <div className="weight-item-main">
                  <span className="weight-item-value">
                    {log.weight_kg.toFixed(1)}
                    <small>kg</small>
                  </span>
                  <span className="weight-item-date">{formatLoggedAt(log.logged_at)}</span>
                </div>
                <div className="weight-item-actions">
                  <button
                    className="weight-icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(log);
                    }}
                    title="Editar"
                  >
                    <IoCreateOutline size={16} />
                  </button>
                  <button
                    className="weight-icon-btn danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      store.deleteWeight(log.id);
                    }}
                    title="Eliminar"
                  >
                    <IoTrashOutline size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Botón + para registrar */}
      <button className="fab" onClick={openAdd} aria-label="Registrar peso">
        <IoAdd size={26} />
      </button>

      {/* Modal de alta / edición */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div
            className="modal-content weight-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{editingId ? 'Editar registro' : 'Registrar peso'}</h2>
            <form className="weight-form" onSubmit={handleSubmit}>
              <label className="weight-field">
                <span className="field-label">Peso (kg)</span>
                <input
                  className="weight-input"
                  inputMode="decimal"
                  placeholder="00.0"
                  value={weight}
                  onChange={(e) => setWeight(sanitizeWeight(e.target.value))}
                  autoFocus
                />
              </label>
              <label className="weight-field">
                <span className="field-label">Fecha y hora</span>
                <input
                  type="datetime-local"
                  value={datetime}
                  onChange={(e) => setDatetime(e.target.value)}
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={!canSave}>
                  {editingId ? 'Guardar cambios' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
