import { useState, useEffect } from 'react';
import { IoTimeOutline, IoCalendarOutline } from 'react-icons/io5';

export function DailyTimer() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const diffMs = endOfDay.getTime() - now.getTime();
  const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
  const minutesLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const secondsLeft = Math.floor((diffMs % (1000 * 60)) / 1000);

  const formattedDate = now.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const formattedTime = now.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Gamification: cambiar color si queda poco tiempo
  const isUrgent = hoursLeft < 3;

  return (
    <div className="daily-timer" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '12px 16px',
      background: isUrgent ? 'rgba(255, 69, 58, 0.1)' : 'var(--bg-secondary)',
      borderRadius: '12px',
      border: `1px solid ${isUrgent ? 'rgba(255, 69, 58, 0.3)' : 'var(--border)'}`,
      marginBottom: '16px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* ProgressBar Background */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '3px',
        width: `${(diffMs / (24 * 60 * 60 * 1000)) * 100}%`,
        background: isUrgent ? '#FF453A' : 'var(--primary)',
        transition: 'width 1s linear'
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <IoCalendarOutline size={16} />
          <span style={{ textTransform: 'capitalize' }}>{formattedDate}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text)' }}>
          <IoTimeOutline size={16} />
          {formattedTime}
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: isUrgent ? '#FF453A' : 'var(--text-secondary)', fontWeight: 500 }}>
          Tiempo restante hoy:
        </span>
        <span style={{ 
          fontSize: '1.2rem', 
          fontWeight: 700, 
          color: isUrgent ? '#FF453A' : 'var(--primary)',
          fontVariantNumeric: 'tabular-nums'
        }}>
          {hoursLeft.toString().padStart(2, '0')}:
          {minutesLeft.toString().padStart(2, '0')}:
          {secondsLeft.toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
