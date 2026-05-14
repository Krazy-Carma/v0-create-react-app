export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      color: '#eff0ff',
      fontFamily: "'IBM Plex Mono', monospace",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: 24,
      textAlign: 'center',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@900&family=IBM+Plex+Mono:wght@400&display=swap');`}</style>
      <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 64, fontWeight: 900, background: 'linear-gradient(135deg, #00e5ff, #39FF14)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>404</div>
      <div style={{ fontSize: 14, color: 'rgba(220,222,255,0.6)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Page Not Found</div>
      <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(220,222,255,0.4)', maxWidth: 320 }}>
        Looking for the store, merch, or your account? Head back to the main site.
      </div>
      <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <a href="https://krazycarma.com" style={{ padding: '10px 24px', border: '1px solid #00e5ff', borderRadius: 6, color: '#00e5ff', textDecoration: 'none', fontSize: 11, letterSpacing: '0.15em', background: 'rgba(0,229,255,0.06)' }}>
          MAIN STORE
        </a>
        <a href="/master" style={{ padding: '10px 24px', border: '1px solid rgba(57,255,20,0.4)', borderRadius: 6, color: '#39FF14', textDecoration: 'none', fontSize: 11, letterSpacing: '0.15em', background: 'rgba(57,255,20,0.06)' }}>
          MASTERING TOOL
        </a>
      </div>
    </div>
  );
}
