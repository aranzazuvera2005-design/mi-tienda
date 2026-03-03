export default function TestPage() {
  return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#2563eb' }}>¡El enrutamiento funciona!</h1>
      <p>Si estás viendo esta página, significa que Vercel está sirviendo correctamente las rutas bajo /admin.</p>
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '10px' }}>
        Ruta actual: <code>/admin/test</code>
      </div>
    </div>
  );
}
