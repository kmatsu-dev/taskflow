import { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  background: '#12141A',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  color: '#E5E7EB',
  fontSize: 14,
  outline: 'none',
  fontFamily: "'Noto Sans JP','Outfit',sans-serif",
  boxSizing: 'border-box',
};
const labelStyle = {
  display: 'block',
  fontSize: 12,
  color: '#9CA3AF',
  marginBottom: 6,
  fontWeight: 500,
};

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const fn = mode === 'login' ? signIn : signUp;
      const { data, error } = await fn(email, password);
      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else if (mode === 'signup' && !data.session) {
        setMessage({
          type: 'info',
          text: '確認メールを送ったぞ。メールのリンクをクリックしてからログインせよ♡',
        });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0F1117',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: "'Noto Sans JP','Outfit',sans-serif",
        color: '#E5E7EB',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
      `}</style>
      <form
        onSubmit={submit}
        style={{
          background: '#1A1D23',
          borderRadius: 16,
          padding: '32px 36px',
          width: 'min(400px, 92vw)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 32,
            fontFamily: "'Outfit',sans-serif",
            fontWeight: 700,
            background: 'linear-gradient(135deg, #F3F4F6, #9CA3AF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center',
            letterSpacing: '-0.5px',
          }}
        >
          TaskFlow
        </h1>
        <p
          style={{
            margin: '8px 0 24px',
            textAlign: 'center',
            color: '#6B7280',
            fontSize: 12,
          }}
        >
          {mode === 'login' ? 'ログインして続けるのじゃ' : '新規登録'}
        </p>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>メールアドレス</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            autoComplete="email"
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>パスワード</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </div>

        {message && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              marginBottom: 14,
              fontSize: 12,
              lineHeight: 1.6,
              background:
                message.type === 'error'
                  ? 'rgba(239,68,68,0.1)'
                  : 'rgba(59,130,246,0.1)',
              color: message.type === 'error' ? '#FCA5A5' : '#93C5FD',
              border: `1px solid ${
                message.type === 'error'
                  ? 'rgba(239,68,68,0.3)'
                  : 'rgba(59,130,246,0.3)'
              }`,
            }}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: busy ? 'wait' : 'pointer',
            fontFamily: "'Outfit',sans-serif",
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? '...' : mode === 'login' ? 'ログイン' : '新規登録'}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setMessage(null);
          }}
          style={{
            width: '100%',
            marginTop: 12,
            padding: 8,
            borderRadius: 8,
            border: 'none',
            background: 'none',
            color: '#6B7280',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          {mode === 'login'
            ? '初めて？ 新規登録はこちら'
            : '既にアカウント有り？ ログインへ'}
        </button>
      </form>
    </div>
  );
}
