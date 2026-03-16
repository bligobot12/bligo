export default function Avatar({ src, name, size = 40, style = {} }) {
  const fallback = String(name || '?').trim().charAt(0).toUpperCase() || '?';

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'avatar'}
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          borderRadius: '999px',
          objectFit: 'cover',
          background: '#E4E6EB',
          ...style,
        }}
      />
    );
  }

  return (
    <div
      aria-label={name || 'avatar'}
      style={{
        width: size,
        height: size,
        borderRadius: '999px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#E4E6EB',
        color: '#d7ddff',
        fontWeight: 700,
        fontSize: Math.max(12, Math.floor(size * 0.4)),
        ...style,
      }}
    >
      {fallback}
    </div>
  );
}
