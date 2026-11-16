export const metadata = {
  title: "Setup & Run — Amphi Docs",
  description: "How to set up, configure, run, and test the Amphi project.",
};

export default function SetupPage() {
  return (
    <>
      <h1>Setup &amp; Run</h1>
      <p className="lead">
        How to install dependencies, configure environments, run the monorepo locally, create an admin user,
        access API docs, and build/test the project.
      </p>

      <div className="doc-toc">
        <h2>On this page</h2>
        <ul>
          <li><a href="#prerequisites">Prerequisites</a></li>
          <li><a href="#install">Install</a></li>
          <li><a href="#configure">Configuration</a></li>
          <li><a href="#run">Run (development)</a></li>
          <li><a href="#admin">Create an admin user</a></li>
          <li><a href="#swagger">API docs (Swagger)</a></li>
          <li><a href="#build-test">Build, test, checks</a></li>
          <li><a href="#structure">Project structure</a></li>
          <li><a href="#troubleshooting">Notes &amp; troubleshooting</a></li>
        </ul>
      </div>

      <h2 id="prerequisites">Prerequisites</h2>
      <ul>
        <li><strong>Node.js</strong> <code>&gt;= 24</code> and <strong>pnpm</strong> <code>11.x</code> (repo pins <code>packageManager: pnpm@11.25.0</code>)</li>
        <li><strong>JDK 27</strong> (required by <code>apps/api</code> Gradle toolchain; Gradle wrapper included)</li>
        <li>macOS/Linux shell recommended (Windows: WSL or adapt commands)</li>
      </ul>
      <div className="doc-callout">
        <strong>Database:</strong> no separate DB server needed. The API uses a local SQLite file at{" "}
        <code>apps/api/data/amphi.db</code> (created/updated automatically via Hibernate <code>ddl-auto=update</code>).
      </div>

      <h2 id="install">Install</h2>
      <p>From the repository root:</p>
      <pre><code>pnpm install</code></pre>

      <h2 id="configure">Configuration</h2>
      <h3>API (<code>apps/api</code>)</h3>
      <p>
        Defaults live in <code>apps/api/src/main/resources/application.properties</code>:
      </p>
      <ul>
        <li>Server: <code>http://localhost:8080</code></li>
        <li>SQLite: <code>jdbc:sqlite:./data/amphi.db</code> (relative to <code>apps/api</code> working dir)</li>
        <li>JPA: Hibernate community SQLite dialect, <code>ddl-auto=update</code>, foreign keys enforced</li>
        <li>Dev JWT secret/expiry are set by default — <strong>override <code>app.jwt.secret</code> for any non-local use</strong></li>
      </ul>

      <h3>Web (<code>apps/web</code>)</h3>
      <pre><code>{`cp apps/web/.env.example apps/web/.env.local`}</code></pre>
      <p><code>apps/web/.env.local</code>:</p>
      <pre><code>{`NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`}</code></pre>

      <h3>Admin bootstrap (root <code>.env</code>)</h3>
      <p>Optional, for creating the first/admin user (see below):</p>
      <pre><code>{`cp .env.example .env
# edit APP_ADMIN_EMAIL / APP_ADMIN_PASSWORD`}</code></pre>

      <h2 id="run">Run (development)</h2>
      <p>From the repository root:</p>
      <pre><code>pnpm dev</code></pre>
      <p>
        Runs <code>turbo run dev</code> across workspace apps with a <code>dev</code> task, including:
      </p>
      <table>
        <thead>
          <tr><th>App</th><th>Command</th><th>URL</th></tr>
        </thead>
        <tbody>
          <tr><td><code>web</code></td><td><code>next dev --port 3000</code></td><td><code>http://localhost:3000</code></td></tr>
          <tr><td><code>api</code></td><td><code>./gradlew bootRun</code></td><td><code>http://localhost:8080</code></td></tr>
          <tr><td><code>docs</code></td><td><code>next dev --port 3001</code></td><td><code>http://localhost:3001</code> (this site)</td></tr>
        </tbody>
      </table>
      <blockquote>
        <code>api#dev</code> is long-running/persistent in Turbo. Filter if you only need specific apps.
      </blockquote>
      <p>Run a single app:</p>
      <pre><code>{`pnpm exec turbo run dev --filter=web
pnpm exec turbo run dev --filter=api

# or from within the app directory:
# cd apps/api && ./gradlew bootRun
# cd apps/web && pnpm dev`}</code></pre>

      <h2 id="admin">Create an admin user</h2>
      <p>
        Public registration creates <code>STUDENT</code> accounts by default. The bootstrap command <strong>creates</strong> an{" "}
        <code>ADMIN</code> user or, if the user exists (by email), <strong>updates the password and ensures role <code>ADMIN</code></strong>.
        It runs without starting the web server.
      </p>
      <h3>From repo root (recommended, uses root <code>.env</code>)</h3>
      <pre><code>{`# .env must define APP_ADMIN_EMAIL and APP_ADMIN_PASSWORD (see .env.example)
pnpm create-admin`}</code></pre>
      <p>Supported keys (aliases accepted):</p>
      <ul>
        <li><code>APP_ADMIN_EMAIL</code> or <code>APP_ADMIN_USERNAME</code> (also <code>ADMIN_EMAIL</code>, <code>ADMIN_USERNAME</code>) — <strong>required</strong>, login identifier (email)</li>
        <li><code>APP_ADMIN_PASSWORD</code> (also <code>ADMIN_PASSWORD</code>) — <strong>required</strong></li>
        <li>Optional: <code>APP_ADMIN_FIRST_NAME</code>, <code>APP_ADMIN_LAST_NAME</code> (and aliases)</li>
      </ul>
      <h3>Alternatives</h3>
      <pre><code>{`# API-local config
cp apps/api/admin.properties.example apps/api/admin.properties
cd apps/api && ./gradlew createAdmin

# Pass directly via Gradle properties
cd apps/api && ./gradlew createAdmin -PadminEmail=admin@example.com -PadminPassword='strong-password'`}</code></pre>
      <p>
        The API also imports optional config from <code>apps/api/admin.properties</code>, <code>apps/api/.env</code>, and{" "}
        <code>../../.env</code> (see <code>application.properties</code> <code>spring.config.import</code>).
      </p>

      <h2 id="swagger">API docs (Swagger / OpenAPI)</h2>
      <p>With the API running:</p>
      <ul>
        <li><strong>Swagger UI:</strong> <code>http://localhost:8080/swagger-ui/index.html</code> (also <code>/swagger-ui.html</code>)</li>
        <li><strong>OpenAPI JSON:</strong> <code>http://localhost:8080/v3/api-docs</code></li>
      </ul>
      <p>
        To call protected endpoints: obtain a JWT via <code>POST /api/auth/login</code> or <code>POST /api/auth/register</code>, click{" "}
        <strong>Authorize</strong>, and provide the bearer token (<code>bearerAuth</code>).
      </p>

      <h2 id="build-test">Build, test, and checks</h2>
      <p>From the repository root (Turbo):</p>
      <pre><code>{`pnpm build        # turbo run build
pnpm lint         # turbo run lint
pnpm check-types  # turbo run check-types
pnpm format       # prettier --write "**/*.{ts,tsx,md}"`}</code></pre>
      <p>Per app:</p>
      <pre><code>{`# API (Gradle)
cd apps/api
./gradlew build
./gradlew test
./gradlew compileJava

# Web (Next.js)
pnpm --filter web build
pnpm --filter web lint
pnpm --filter web check-types   # next typegen && tsc --noEmit`}</code></pre>

      <h2 id="structure">Project structure (high level)</h2>
      <pre><code>{`.
├─ apps/
│  ├─ api/                 # Spring Boot REST API (Gradle, SQLite)
│  │  └─ src/main/java/me/matta/amphi/
│  │     ├─ auth/ community/ membership/ invitation/
│  │     ├─ post/ comment/ reaction/ studyresource/ user/
│  │     └─ common/        # security/JWT, OpenAPI, exceptions, bootstrap
│  ├─ web/                 # Next.js client (App Router, shadcn/ui)
│  │  ├─ app/ components/ lib/
│  └─ docs/                # This documentation site (Next.js)
├─ packages/               # shared eslint/tsconfig/ui
├─ docs/                   # project documentation (e.g. ARCHITECTURE.md)
├─ turbo.json              # pipeline (dev/build/lint/check-types/create-admin)
└─ .env.example            # root env template (admin bootstrap)`}</code></pre>

      <h2 id="troubleshooting">Notes &amp; troubleshooting</h2>
      <ul>
        <li><strong>CORS:</strong> API allows <code>http://localhost:3000</code> and <code>http://localhost:3001</code> (see <code>SecurityConfig</code>); update for different origins.</li>
        <li><strong>DB location:</strong> <code>apps/api/data/amphi.db</code> (gitignored). Deleting it resets local data (schema recreated on next run).</li>
        <li><strong>JWT secret:</strong> default in <code>application.properties</code> is for development only; override via configuration/env for real deployments.</li>
        <li><strong>Monorepo tasks:</strong> <code>pnpm dev</code> runs all packages that define <code>dev</code> (including <code>apps/docs</code>). Filter with Turbo if you only need API+web.</li>
        <li><strong>Ports:</strong> web <code>:3000</code>, api <code>:8080</code>, docs <code>:3001</code> by default.</li>
      </ul>
    </>
  );
}
