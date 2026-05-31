import { useState } from 'react';
import { useExpenseStore, selectExpenseStats, EXPENSE_CATEGORIES, type ExpenseCategory } from '@/store/expenseStore';
import { localDayKey } from '@/utils/dateHelpers';
import {
  IoWalletOutline,
  IoAddCircleOutline,
  IoTrashOutline,
  IoConstructOutline,
  IoPieChartOutline,
  IoReceiptOutline,
} from 'react-icons/io5';

export function ExpensesPage() {
  const store = useExpenseStore();
  const stats = useExpenseStore(selectExpenseStats);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('otros');
  const [date, setDate] = useState(localDayKey());
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;
    try {
      await store.addExpense({
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        date,
        notes: notes.trim() || undefined,
      });
      // Solo limpiar/cerrar si se guardó correctamente.
      setTitle('');
      setAmount('');
      setCategory('otros');
      setNotes('');
      setShowForm(false);
    } catch {
      alert('No se pudo guardar el gasto. Revisa tu conexión e inténtalo de nuevo.');
    }
  };

  const topCategory = Object.entries(stats.byCategory)
    .sort(([, a], [, b]) => b - a)[0];

  return (
    <>
      <div className="page-header">
        <h2>Gastos</h2>
        <div className="subtitle">
          <IoConstructOutline size={13} style={{ verticalAlign: 'middle' }} /> Módulo en construcción
        </div>
      </div>

      {/* Stats overview */}
      <div className="stats-row">
        <div className="stat-card accent">
          <div className="stat-icon" style={{ background: 'var(--primary)' }}>
            <IoWalletOutline size={20} color="var(--bg)" />
          </div>
          <div className="number">S/. {stats.totalMonth.toFixed(2)}</div>
          <div className="label">Este mes</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning)' }}>
            <IoReceiptOutline size={20} color="var(--bg)" />
          </div>
          <div className="number">{stats.monthExpenses.length}</div>
          <div className="label">Transacciones</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success)' }}>
            <IoPieChartOutline size={20} color="var(--bg)" />
          </div>
          <div className="number" style={{ fontSize: '16px' }}>
            {topCategory
              ? EXPENSE_CATEGORIES.find(c => c.key === topCategory[0])?.emoji ?? '📦'
              : '—'}
          </div>
          <div className="label">
            {topCategory
              ? EXPENSE_CATEGORIES.find(c => c.key === topCategory[0])?.label ?? 'Top'
              : 'Sin datos'}
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      {Object.keys(stats.byCategory).length > 0 && (
        <section className="dashboard-section">
          <h3 className="section-title">
            <IoPieChartOutline size={18} />
            Desglose por categoría
          </h3>
          <div className="expense-categories-grid">
            {Object.entries(stats.byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, total]) => {
                const info = EXPENSE_CATEGORIES.find(c => c.key === cat);
                const pct = stats.totalMonth > 0 ? Math.round((total / stats.totalMonth) * 100) : 0;
                return (
                  <div key={cat} className="expense-category-card">
                    <div className="expense-category-header">
                      <span className="expense-category-emoji">{info?.emoji ?? '📦'}</span>
                      <span className="expense-category-name">{info?.label ?? cat}</span>
                      <span className="expense-category-pct">{pct}%</span>
                    </div>
                    <div className="progress-bar-container small">
                      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="expense-category-amount">S/. {total.toFixed(2)}</span>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* Add expense form */}
      <button
        className="btn btn-primary"
        onClick={() => setShowForm(!showForm)}
        style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <IoAddCircleOutline size={18} />
        {showForm ? 'Cerrar formulario' : 'Registrar gasto'}
      </button>

      {showForm && (
        <form className="create-task-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Descripción del gasto..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <div className="form-row">
            <input
              type="number"
              step="0.01"
              placeholder="Monto (S/.)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
              {EXPENSE_CATEGORIES.map(c => (
                <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <input
              type="text"
              placeholder="Notas (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="actions">
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={!title.trim() || !amount}>
              Agregar gasto
            </button>
          </div>
        </form>
      )}

      {/* Recent expenses */}
      <section className="dashboard-section">
        <h3 className="section-title">
          <IoReceiptOutline size={18} />
          Gastos recientes
        </h3>
        {store.expenses.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px' }}>
            <IoWalletOutline size={36} color="var(--text-muted)" />
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
              No hay gastos registrados.
            </p>
          </div>
        ) : (
          <div className="expense-list">
            {store.expenses.slice(0, 20).map((expense) => {
              const catInfo = EXPENSE_CATEGORIES.find(c => c.key === expense.category);
              return (
                <div key={expense.id} className="expense-item">
                  <span className="expense-emoji">{catInfo?.emoji ?? '📦'}</span>
                  <div className="expense-info">
                    <span className="expense-title">{expense.title}</span>
                    <span className="expense-date">
                      {new Date(expense.date).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {expense.notes && ` · ${expense.notes}`}
                    </span>
                  </div>
                  <span className="expense-amount">S/. {expense.amount.toFixed(2)}</span>
                  <button
                    className="expense-delete-btn"
                    onClick={() => store.deleteExpense(expense.id)}
                    title="Eliminar"
                  >
                    <IoTrashOutline size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
