export default function Login() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      background: '#0f172a',
      color: '#fff'
    }}>
      <h1>ChronosTech CRM</h1>

      <input
        placeholder="Email"
        style={{ margin: 8, padding: 10, width: 260 }}
      />

      <input
        placeholder="Senha"
        type="password"
        style={{ margin: 8, padding: 10, width: 260 }}
      />

      <button style={{ marginTop: 12, padding: 10, width: 260 }}>
        Entrar
      </button>
    </div>
  );
}
