import { useState } from 'react'

function AuthScreen({ configured, onSignIn, onSignUp, authLoading, authError }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      setLocalError('Preencha e-mail e senha.')
      return
    }

    setLocalError('')

    if (mode === 'signin') {
      await onSignIn(email, password)
      return
    }

    await onSignUp(email, password)
  }

  return (
    <main style={styles.page} className="auth-shell">
      <div style={styles.glowA} />
      <div style={styles.glowB} />

      <section style={styles.card} className="auth-card premium-card fade-up">
        <div style={styles.content}>
          <span style={styles.eyebrow}>Supabase Finance</span>
          <h1 style={styles.title}>Entre para sincronizar suas transacoes</h1>
          <p style={styles.subtitle}>
            Login, cadastro, persistencia no banco e isolamento por usuario ja
            estao preparados no app.
          </p>

          {!configured ? (
            <div style={styles.notice}>
              <strong style={styles.noticeTitle}>
                Configure o Supabase para continuar
              </strong>
              <p style={styles.noticeText}>
                Defina `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no seu `.env`
                e rode o SQL incluido no projeto para criar a tabela com RLS.
              </p>
            </div>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} style={styles.form} className="premium-subcard">
          <div style={styles.modeSwitch}>
            <button
              type="button"
              onClick={() => setMode('signin')}
              style={styles.modeButton(mode === 'signin')}
              className="interactive-button"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              style={styles.modeButton(mode === 'signup')}
              className="interactive-button"
            >
              Cadastro
            </button>
          </div>

          <label style={styles.field}>
            <span style={styles.label}>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@email.com"
              style={styles.input}
              disabled={!configured || authLoading}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Senha</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Sua senha"
              style={styles.input}
              disabled={!configured || authLoading}
            />
          </label>

          {localError || authError ? (
            <div style={styles.errorBox}>{localError || authError}</div>
          ) : null}

          <button
            type="submit"
            disabled={!configured || authLoading}
            style={styles.submitButton(!configured || authLoading)}
            className="interactive-button"
          >
            {authLoading
              ? 'Processando...'
              : mode === 'signin'
                ? 'Entrar'
                : 'Criar conta'}
          </button>

          <p style={styles.helper}>
            {mode === 'signin'
              ? 'Use seu login para acessar suas transacoes salvas.'
              : 'No cadastro, pode ser necessario confirmar o e-mail no Supabase.'}
          </p>
        </form>
      </section>
    </main>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: '24px',
    background:
      'radial-gradient(circle at top, rgba(56, 189, 248, 0.18), transparent 28%), radial-gradient(circle at bottom right, rgba(52, 211, 153, 0.16), transparent 30%), #07111f',
    position: 'relative',
    overflow: 'hidden',
  },
  glowA: {
    position: 'absolute',
    inset: 'auto auto 15% 8%',
    width: '280px',
    height: '280px',
    borderRadius: '999px',
    background: 'rgba(37, 99, 235, 0.18)',
    filter: 'blur(60px)',
  },
  glowB: {
    position: 'absolute',
    inset: '8% 6% auto auto',
    width: '240px',
    height: '240px',
    borderRadius: '999px',
    background: 'rgba(20, 184, 166, 0.16)',
    filter: 'blur(60px)',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '980px',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.1fr) minmax(320px, 420px)',
    gap: '22px',
    padding: '26px',
    borderRadius: '30px',
    background: 'rgba(9, 18, 33, 0.9)',
    border: '1px solid rgba(148, 163, 184, 0.16)',
    boxShadow: '0 30px 90px rgba(2, 6, 23, 0.5)',
    backdropFilter: 'blur(18px)',
  },
  content: {
    display: 'grid',
    alignContent: 'center',
    gap: '14px',
    padding: '12px',
  },
  eyebrow: {
    display: 'inline-block',
    color: '#7dd3fc',
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    fontSize: '12px',
    fontWeight: 700,
  },
  title: {
    margin: 0,
    color: '#f8fafc',
    fontSize: 'clamp(2.1rem, 5vw, 4rem)',
    lineHeight: 1,
  },
  subtitle: {
    margin: 0,
    color: '#94a3b8',
    fontSize: '1rem',
    lineHeight: 1.7,
  },
  notice: {
    marginTop: '10px',
    padding: '18px',
    borderRadius: '20px',
    background: 'rgba(127, 29, 29, 0.18)',
    border: '1px solid rgba(248, 113, 113, 0.16)',
    display: 'grid',
    gap: '8px',
  },
  noticeTitle: {
    color: '#fecaca',
  },
  noticeText: {
    margin: 0,
    color: '#fca5a5',
    lineHeight: 1.6,
  },
  form: {
    display: 'grid',
    gap: '16px',
    padding: '22px',
    borderRadius: '24px',
    background: 'rgba(15, 23, 42, 0.78)',
    border: '1px solid rgba(148, 163, 184, 0.14)',
    alignContent: 'start',
  },
  modeSwitch: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    padding: '6px',
    borderRadius: '16px',
    background: 'rgba(2, 6, 23, 0.65)',
  },
  modeButton: (active) => ({
    border: 'none',
    borderRadius: '12px',
    padding: '12px',
    background: active ? 'linear-gradient(135deg, #2563eb, #0891b2)' : 'transparent',
    color: active ? '#eff6ff' : '#94a3b8',
    fontWeight: 700,
    cursor: 'pointer',
  }),
  field: {
    display: 'grid',
    gap: '8px',
  },
  label: {
    color: '#cbd5e1',
    fontSize: '0.92rem',
    fontWeight: 600,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '14px',
    padding: '14px',
    fontSize: '1rem',
    color: '#f8fafc',
    background: 'rgba(9, 18, 33, 0.88)',
    outline: 'none',
  },
  errorBox: {
    borderRadius: '14px',
    padding: '12px 14px',
    background: 'rgba(127, 29, 29, 0.18)',
    border: '1px solid rgba(248, 113, 113, 0.18)',
    color: '#fca5a5',
  },
  submitButton: (disabled) => ({
    border: 'none',
    borderRadius: '16px',
    padding: '14px 18px',
    background: disabled
      ? 'rgba(51, 65, 85, 0.9)'
      : 'linear-gradient(135deg, #2563eb, #0f766e)',
    color: '#eff6ff',
    fontSize: '0.95rem',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.75 : 1,
  }),
  helper: {
    margin: 0,
    color: '#64748b',
    lineHeight: 1.6,
    fontSize: '0.92rem',
  },
}

export default AuthScreen
