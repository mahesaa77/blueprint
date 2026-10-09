const API_BASE_URL = process.env['NEXT_PUBLIC_API_BASE_URL'] ?? 'http://localhost:3000/api/v1';

export default function HomePage() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Toko Pakaian</h1>
      <p>Scaffolding siap. API base URL: {API_BASE_URL}</p>
      <p>
        Route group <code>(customer)</code>, <code>(kasir)</code>, dan <code>(admin)</code> akan
        ditambahkan mengikuti roadmap di PLAN.md.
      </p>
    </main>
  );
}
