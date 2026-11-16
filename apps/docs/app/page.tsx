import Link from "next/link";

export default function Home() {
  return (
    <>
      <h1>Amphi Documentation</h1>
      <p className="lead">
        Amphi is a university social platform (Turborepo monorepo) for communities, discussions, and study
        resources — built with a Spring Boot REST API and a Next.js web client.
      </p>

      <div className="doc-grid">
        <Link href="/setup" className="doc-card">
          <div className="doc-kbd">Guide</div>
          <h3>Setup &amp; Run</h3>
          <p>Prerequisites, environment configuration, running the stack, admin bootstrap, Swagger, and build/test commands.</p>
        </Link>
        <Link href="/architecture" className="doc-card">
          <div className="doc-kbd">Reference</div>
          <h3>Components &amp; Architecture</h3>
          <p>Monorepo layout, backend modules and API, data model, key flows, frontend structure, and extension points.</p>
        </Link>
      </div>

      <h2>At a glance</h2>
      <table>
        <thead>
          <tr>
            <th>Part</th>
            <th>Tech</th>
            <th>Local URL / notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>apps/web</code></td>
            <td>Next.js 16 (App Router), React 19, TypeScript, Tailwind/shadcn</td>
            <td><code>http://localhost:3000</code></td>
          </tr>
          <tr>
            <td><code>apps/api</code></td>
            <td>Spring Boot 4.1.2, Gradle, JPA/Hibernate, SQLite, JWT, Springdoc</td>
            <td><code>http://localhost:8080</code> · Swagger: <code>/swagger-ui/index.html</code></td>
          </tr>
          <tr>
            <td><code>apps/docs</code></td>
            <td>Next.js (this documentation site)</td>
            <td><code>http://localhost:3001</code> (<code>pnpm dev</code>)</td>
          </tr>
          <tr>
            <td><code>packages/*</code></td>
            <td><code>@repo/ui</code>, <code>@repo/eslint-config</code>, <code>@repo/typescript-config</code></td>
            <td>Shared workspace packages</td>
          </tr>
        </tbody>
      </table>

      <div className="doc-callout">
        <strong>Quick start:</strong> <code>pnpm install</code> → configure <code>apps/web/.env.local</code> (<code>NEXT_PUBLIC_API_BASE_URL=http://localhost:8080</code>) → <code>pnpm dev</code>. See <Link href="/setup">Setup &amp; Run</Link> for details and admin bootstrap.
      </div>

      <h2>Source of truth in the repo</h2>
      <ul>
        <li><code>README.md</code> — root setup/run summary</li>
        <li><code>docs/ARCHITECTURE.md</code> — architecture reference (Markdown + Mermaid)</li>
        <li>Live API contract — Swagger UI when the API is running</li>
      </ul>
    </>
  );
}
