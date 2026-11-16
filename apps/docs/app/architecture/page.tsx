import { Mermaid } from "../components/mermaid";

export const metadata = {
  title: "Architecture — Amphi Docs",
  description: "Components, backend/frontend architecture, data model, and key flows for Amphi.",
};

const systemDiagram = `flowchart LR
    subgraph Client["Clients"]
      Browser["👤 Browser\\nNext.js Web (apps/web)\\n:3000"]
    end

    subgraph API["Backend (apps/api)\\nSpring Boot :8080"]
      Sec["🔐 Security Filter Chain\\nJWT + CORS + Stateless"]
      Ctl["🌐 REST Controllers\\n/auth /users /communities ..."]
      Svc["⚙️ Services\\nbusiness rules & permissions"]
      Repo["🗄️ JPA Repositories"]
      Sec --> Ctl --> Svc --> Repo
    end

    subgraph Data["Persistence"]
      DB[(💾 SQLite\\napps/api/data/amphi.db)]
    end

    subgraph Docs["API Docs"]
      OAS["📄 Springdoc OpenAPI\\n/v3/api-docs\\n/swagger-ui"]
    end

    Browser -->|"HTTP JSON\\nAuthorization: Bearer JWT"| Sec
    Repo --> DB
    API --- OAS`;

const monorepoDiagram = `flowchart TB
    subgraph Root["Repo root (pnpm + turbo)"]
      Dev["pnpm dev\\n(turbo run dev)"]
      CA["pnpm create-admin\\n(dotenv + turbo -> api)"]
    end

    subgraph Apps["apps/*"]
      API["api\\nGradle bootRun :8080"]
      WEB["web\\nNext.js dev :3000"]
      DOCS["docs\\nNext.js docs :3001"]
    end

    subgraph Pkgs["packages/*"]
      UI["@repo/ui"]
      ESL["@repo/eslint-config"]
      TSC["@repo/typescript-config"]
    end

    Dev --> API
    Dev --> WEB
    Dev --> DOCS
    WEB -. uses .-> UI
    WEB -. uses .-> ESL
    WEB -. uses .-> TSC
    CA --> API`;

const backendLayerDiagram = `flowchart TB
    Req([HTTP Request]) --> F["JwtAuthenticationFilter\\n(extract/validate Bearer token)"]
    F --> SC["SecurityFilterChain\\npermit public routes, else authenticated\\n@EnableMethodSecurity"]
    SC --> C["Controller\\n@RequestMapping /api/...\\nDTO in/out, validation"]
    C --> S["Service\\nbusiness & permission rules\\ntransactions"]
    S --> R["Repository\\nSpring Data JPA"]
    R --> E[(Entities / SQLite)]
    C -. errors .-> GEH["GlobalExceptionHandler\\nexceptions -> ErrorResponse"]`;

const erDiagram = `erDiagram
    USER ||--o{ COMMUNITY : owns
    USER ||--o{ MEMBERSHIP : has
    COMMUNITY ||--o{ MEMBERSHIP : includes
    COMMUNITY ||--o{ POST : contains
    COMMUNITY ||--o{ STUDY_RESOURCE : scopes
    COMMUNITY ||--o| INVITATION_CODE : "active code"
    USER ||--o{ POST : authors
    POST ||--o{ COMMENT : has
    COMMENT ||--o{ COMMENT : "replies (parentId)"
    USER ||--o{ COMMENT : authors
    USER ||--o{ POST_LIKE : likes
    POST ||--o{ POST_LIKE : receives
    USER ||--o{ COMMENT_LIKE : likes
    COMMENT ||--o{ COMMENT_LIKE : receives
    USER ||--o{ STUDY_RESOURCE : authors

    USER {
      Long id
      string email
      string passwordHash
      string firstName
      string lastName
      enum role
      instant createdAt
    }
    COMMUNITY {
      Long id
      string name
      string description
      enum type
      int maxMembers
    }
    POST {
      Long id
      string title
      string content
    }
    COMMENT {
      Long id
      string content
      Long parentId
    }
    STUDY_RESOURCE {
      Long id
      string title
      string moduleName
      string attachmentReference
      Long communityId_nullable
    }`;

const authSequence = `sequenceDiagram
    autonumber
    actor U as 👤 User
    participant W as Next.js Web
    participant A as Spring API (/api/auth)
    participant S as Security/JWT
    participant D as SQLite

    U->>W: Submit email/password
    W->>A: POST /api/auth/login
    A->>S: Authenticate credentials
    S->>D: Load user / verify BCrypt
    D-->>S: User record
    S-->>A: Principal ok
    A->>S: Generate JWT
    A-->>W: 200 { token, user }
    W->>W: Store token + user
    W->>A: GET /api/users/me (Bearer token)
    A-->>W: Current user profile`;

const joinFlow = `flowchart TD
    U[👤 Authenticated user] --> J[POST /api/communities/:id/members/join]
    J --> T{Community type?}
    T -->|PUBLIC| M[Validate capacity/duplicates]
    T -->|PRIVATE| I[Validate invitation code]
    I --> M
    M --> OK[(Persist Membership)]
    OK --> R[200/201 response]`;

const frontendDiagram = `flowchart TB
    subgraph App["Next.js App Router (apps/web)"]
      L[layout.tsx] --> P[AuthProvider]
      P --> N[Navbar]
      P --> R["Route Pages\\n/ /login /register /communities /resources /admin ..."]
      R --> UI[components/ui + feature components]
      R --> C["lib/api.ts\\nfetch + Bearer"]
      R --> T[lib/types.ts]
    end
    C -->|JSON over HTTP| API[(Spring Boot API :8080)]`;

export default function ArchitecturePage() {
  return (
    <>
      <h1>Components &amp; Architecture</h1>
      <p className="lead">
        How Amphi is structured and how its parts work together: monorepo layout, backend modules, frontend
        composition, data model, and key runtime flows.
      </p>
      <blockquote>
        Snapshot based on the current repository state (Spring Boot 4.1.2 / Gradle, Next.js 16 / React 19, SQLite, JWT auth, Turborepo + pnpm).
      </blockquote>

      <div className="doc-toc">
        <h2>On this page</h2>
        <ul>
          <li><a href="#overview">System overview</a></li>
          <li><a href="#monorepo">Monorepo &amp; build/run</a></li>
          <li><a href="#backend">Backend architecture</a></li>
          <li><a href="#security">Security &amp; access</a></li>
          <li><a href="#api">REST API surface</a></li>
          <li><a href="#data-model">Domain &amp; data model</a></li>
          <li><a href="#flows">Key runtime flows</a></li>
          <li><a href="#frontend">Frontend architecture</a></li>
          <li><a href="#config">Config, storage, ops</a></li>
          <li><a href="#extension">Extension points</a></li>
        </ul>
      </div>

      <h2 id="overview">1. System overview</h2>
      <p>
        Amphi provides <strong>communities</strong>, <strong>posts/comments/reactions</strong>, and{" "}
        <strong>study resources</strong> with role-based access (<code>STUDENT</code>, <code>PROFESSOR</code>,{" "}
        <code>ADMIN</code>). The monorepo contains:
      </p>
      <ul>
        <li><strong><code>apps/api</code></strong>: stateless REST/JSON backend (authn/authz, business rules, persistence)</li>
        <li><strong><code>apps/web</code></strong>: Next.js App Router client consuming the API with JWT bearer tokens</li>
        <li><strong><code>apps/docs</code></strong>: documentation site (this app)</li>
        <li><strong><code>packages/*</code></strong>: shared UI/ESLint/TypeScript configs</li>
      </ul>
      <div className="mermaid-wrap"><Mermaid chart={systemDiagram} /></div>

      <h2 id="monorepo">2. Monorepo &amp; build/run architecture</h2>
      <ul>
        <li><strong>Workspace:</strong> pnpm workspaces (<code>apps/*</code>, <code>packages/*</code>) orchestrated by Turborepo (<code>turbo.json</code>).</li>
        <li><strong>Tasks:</strong> <code>dev</code> (persistent, no cache), <code>build</code> (depends on <code>^build</code>), <code>lint</code>, <code>check-types</code>, <code>create-admin</code> (cache off, passes <code>APP_ADMIN_*</code>/<code>ADMIN_*</code> env vars).</li>
        <li><strong><code>pnpm dev</code>:</strong> runs packages with a <code>dev</code> script (<code>api</code> → <code>./gradlew bootRun</code>, <code>web</code> → Next <code>:3000</code>, <code>docs</code> → Next <code>:3001</code>).</li>
        <li><strong><code>pnpm create-admin</code>:</strong> loads root <code>.env</code> then runs <code>turbo run create-admin --filter=api</code> (no web server).</li>
      </ul>
      <div className="mermaid-wrap"><Mermaid chart={monorepoDiagram} /></div>

      <h2 id="backend">3. Backend architecture (<code>apps/api</code>)</h2>
      <p>
        <strong>Stack:</strong> Spring Boot 4.1.2, Spring Web/Data JPA/Security/Validation, SQLite (Hibernate community dialect,{" "}
        <code>ddl-auto=update</code>, FK pragma), JJWT, Springdoc OpenAPI. Base package <code>me.matta.amphi</code>.
      </p>

      <h3>3.1 Package-by-feature organization</h3>
      <p>Features are organized as <code>entity/repository/service/controller/dto</code> (as applicable); shared concerns in <code>common</code>.</p>
      <table>
        <thead><tr><th>Package</th><th>Responsibility</th></tr></thead>
        <tbody>
          <tr><td><code>auth</code></td><td>Register/login, DTOs, JWT issuance</td></tr>
          <tr><td><code>user</code></td><td><code>User</code>/<code>Role</code>, profile, admin list/update-role</td></tr>
          <tr><td><code>community</code></td><td>Community CRUD, public/private rules, ownership/moderation checks</td></tr>
          <tr><td><code>membership</code></td><td>Join/leave, member listing/removal, constraints</td></tr>
          <tr><td><code>invitation</code></td><td>Active invitation code per private community, join validation</td></tr>
          <tr><td><code>post</code></td><td>Community posts CRUD and access checks</td></tr>
          <tr><td><code>comment</code></td><td>Comments &amp; replies (self-ref <code>parentId</code>, flat responses), edit/delete rules</td></tr>
          <tr><td><code>reaction</code></td><td>Like/unlike posts and comments (unique per user/target)</td></tr>
          <tr><td><code>studyresource</code></td><td>Study materials, optional community scope, attachment reference</td></tr>
          <tr><td><code>common.security</code></td><td>Security filter chain, JWT filter/service, CORS, stateless auth, method security</td></tr>
          <tr><td><code>common.config</code></td><td>OpenAPI/Swagger config (bearer auth scheme)</td></tr>
          <tr><td><code>common.bootstrap</code></td><td><code>AdminBootstrapRunner</code> for <code>createAdmin</code></td></tr>
          <tr><td><code>common.exception</code>/<code>dto</code></td><td>Typed exceptions, global handler, error shapes</td></tr>
        </tbody>
      </table>
      <div className="mermaid-wrap"><Mermaid chart={backendLayerDiagram} /></div>

      <h2 id="security">3.2 Security &amp; API access (summary)</h2>
      <ul>
        <li><strong>Stateless JWT</strong> auth; acting user resolved from <code>SecurityContext</code>.</li>
        <li><strong>Public:</strong> <code>/api/auth/**</code>, Swagger/OpenAPI endpoints, and selected <strong>GET</strong> routes (communities, posts/comments, study resources) as configured.</li>
        <li><strong>Authenticated:</strong> all other routes; <strong>ADMIN-only</strong> operations (e.g. user listing/role update) enforced via <code>@PreAuthorize(&quot;hasRole(&apos;ADMIN&apos;)&quot;)</code> / service checks.</li>
        <li><strong>CORS:</strong> allows <code>http://localhost:3000</code> and <code>http://localhost:3001</code>.</li>
        <li><strong>Registration:</strong> defaults to <code>STUDENT</code> role.</li>
      </ul>

      <h2 id="api">3.3 REST API surface (controllers)</h2>
      <table>
        <thead><tr><th>Controller</th><th>Endpoints (summary)</th></tr></thead>
        <tbody>
          <tr><td><code>AuthController</code> <code>/api/auth</code></td><td><code>POST /register</code>, <code>POST /login</code></td></tr>
          <tr><td><code>UserController</code> <code>/api/users</code></td><td><code>GET /me</code>, <code>GET /</code> (ADMIN), <code>GET /&#123;id&#125;</code>, <code>PATCH /&#123;id&#125;/role</code> (ADMIN)</td></tr>
          <tr><td><code>CommunityController</code> <code>/api/communities</code></td><td>CRUD; members join/leave/list/remove; invitation generate/get</td></tr>
          <tr><td><code>PostController</code></td><td>List/create by community; get/update/delete post</td></tr>
          <tr><td><code>CommentController</code></td><td>List/create by post; reply; update/delete comment</td></tr>
          <tr><td><code>ReactionController</code> <code>/api</code></td><td>Like/unlike posts and comments</td></tr>
          <tr><td><code>StudyResourceController</code> <code>/api/study-resources</code></td><td>CRUD (optional community scope/filter)</td></tr>
        </tbody>
      </table>
      <p>Exact schemas/validation/auth: see Swagger UI/OpenAPI when running.</p>

      <h2 id="data-model">4. Domain &amp; data model</h2>
      <p>
        Core entities: <code>User</code>, <code>Community</code>, <code>Membership</code>, <code>InvitationCode</code>,{" "}
        <code>Post</code>, <code>Comment</code>, <code>PostLike</code>, <code>CommentLike</code>, <code>StudyResource</code> (plus <code>Role</code>/<code>CommunityType</code>).
      </p>
      <div className="mermaid-wrap"><Mermaid chart={erDiagram} /></div>
      <ul>
        <li><strong>Comments:</strong> self-referencing (<code>parentId</code>), exposed flat; client builds threads. Delete blocked when replies exist.</li>
        <li><strong>Likes:</strong> separate per-target entities with uniqueness per user/target.</li>
        <li><strong>Invitations:</strong> active/regeneratable code for private communities.</li>
        <li><strong>Study resources:</strong> may be global or scoped to a community, with an attachment reference.</li>
      </ul>

      <h2 id="flows">5. Key runtime flows</h2>
      <h3>5.1 Authentication (login)</h3>
      <div className="mermaid-wrap"><Mermaid chart={authSequence} /></div>
      <h3>5.2 Private community join (invitation)</h3>
      <div className="mermaid-wrap"><Mermaid chart={joinFlow} /></div>

      <h2 id="frontend">6. Frontend architecture (<code>apps/web</code>)</h2>
      <p>
        <strong>Stack:</strong> Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui + Radix,{" "}
        <code>lucide-react</code>. API base URL via <code>NEXT_PUBLIC_API_BASE_URL</code> (default <code>http://localhost:8080</code>).
      </p>
      <h3>6.1 Composition</h3>
      <ul>
        <li><code>app/layout.tsx</code>: root layout, <code>AuthProvider</code>, <code>Navbar</code>, shell/footer.</li>
        <li><code>components/auth-provider.tsx</code>: client session/token persistence and validation via <code>/api/users/me</code>.</li>
        <li><code>lib/api.ts</code>: typed fetch wrapper (bearer auth, error normalization) + <code>lib/auth.ts</code>/<code>lib/types.ts</code>.</li>
        <li><code>components/ui/*</code> and route pages in <code>app/**/page.tsx</code>.</li>
      </ul>
      <div className="mermaid-wrap"><Mermaid chart={frontendDiagram} /></div>

      <h3>6.2 Route map</h3>
      <table>
        <thead><tr><th>Route</th><th>Purpose</th></tr></thead>
        <tbody>
          <tr><td><code>/</code></td><td>Landing/home</td></tr>
          <tr><td><code>/login</code>, <code>/register</code></td><td>Authentication</td></tr>
          <tr><td><code>/communities</code></td><td>Browse/list/create communities</td></tr>
          <tr><td><code>/communities/[id]</code></td><td>Community detail, membership, posts, members, invitations/management</td></tr>
          <tr><td><code>/communities/[id]/posts/[postId]</code></td><td>Post detail, threaded comments/replies, reactions</td></tr>
          <tr><td><code>/resources</code></td><td>Study resources</td></tr>
          <tr><td><code>/admin</code></td><td>Admin-only user/role management</td></tr>
        </tbody>
      </table>

      <h2 id="config">7. Configuration, storage, and operations</h2>
      <ul>
        <li><strong>Persistence:</strong> SQLite <code>apps/api/data/amphi.db</code>, schema auto-managed, FKs enforced.</li>
        <li><strong>Config/secrets:</strong> dev defaults in <code>application.properties</code>; override for non-local use. Admin bootstrap reads <code>app.admin.*</code>/env aliases with optional imports (<code>../../.env</code>, <code>./admin.properties</code>, <code>./.env</code>).</li>
        <li><strong>Docs/contract:</strong> Swagger UI &amp; OpenAPI; SQL logging in dev config.</li>
        <li><strong>Constraints:</strong> flat comment API (client tree), some delete/cascade constraints, no realtime transport.</li>
      </ul>

      <h2 id="extension">8. Extension points</h2>
      <ul>
        <li><strong>New feature:</strong> add <code>me.matta.amphi.&lt;feature&gt;</code> (entity/repository/service/controller/dto), enforce authz, expose endpoint, update client/types/UI.</li>
        <li><strong>Admin/protected actions:</strong> use <code>@PreAuthorize</code> and service-level checks; web guards are UX only, server is authority.</li>
        <li><strong>Cross-cutting:</strong> centralize in <code>common</code> (security, exceptions, config).</li>
      </ul>

      <hr />
      <p>
        See also: root <code>README.md</code>, <code>docs/ARCHITECTURE.md</code>, and Swagger UI for the live API contract.
      </p>
    </>
  );
}
