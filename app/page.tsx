export default function Home() {
  return (
    <main style={{ padding: '2rem', maxWidth: '48rem', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Gamaliel Evals
      </h1>
      <p style={{ color: 'var(--foreground)', opacity: 0.9 }}>
        Open-source eval suite for the Gamaliel Public API. Run quality
        evaluations across theologies, profiles, and languages. Phase 2 will
        add a web UI to try questions and compare responses.
      </p>
      <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', opacity: 0.8 }}>
        Run evals locally: <code style={{ background: 'var(--foreground)', color: 'var(--background)', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>make eval</code>
      </p>
    </main>
  );
}
