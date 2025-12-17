# 📋 Arquitectura de Aplicación: MTG Tournament Manager

## 1. Visión General

**Nombre del Proyecto**: MTG Tournament Manager  
**Descripción**: Aplicación móvil/web para conteo de vida de Magic: The Gathering con gestión integral de torneos y ligas, permitiendo invitaciones, estadísticas y competencia organizada.  
**Versión del Documento**: 1.0  
**Última Actualización**: Noviembre 2025

---

## 2. Objetivos y Requisitos

### 2.1 Objetivos Principales
- Contador de vida digital para partidas de MTG (1v1, Commander, Two-Headed Giant)
- Creación y gestión de torneos con múltiples formatos (Swiss, Single Elimination, Round Robin)
- Sistema de ligas con clasificaciones persistentes
- Invitación y gestión de usuarios en tiempo real
- Sincronización multi-plataforma

### 2.2 Requisitos Funcionales
[Usuarios]
├─ Registro/Login (email, Google, Apple)
├─ Perfil de jugador (estadísticas, mazos favoritos)
├─ Sistema de amigos
└─ Notificaciones push
[Contador de Vida]
├─ Soportar 2-6 jugadores por partida
├─ Cálculo automático de daño, veneno, comandante damage
├─ Historial de cambios (undo/redo)
├─ Customización de backgrounds y temas
└─ Modo offline con sincronización posterior
[Torneos]
├─ Crear torneos públicos/privados
├─ Múltiples formatos (Swiss, Elimination, League)
├─ Generador de parejas automático
├─ Cálculo de standings y tiebreakers
├─ Timer de ronda
├─ Registro de resultados (código QR, ID de partida)
└─ Exportación de resultados (Wizards Event Reporter)
[Ligas]
├─ Ligas privadas y públicas
├─ Sistema de puntuación personalizable
├─ Clasificaciones en tiempo real
├─ Temporadas con fechas definidas
├─ Recompensas y logros
└─ Estadísticas históricas
Copy

### 2.3 Requisitos No Funcionales

| Requisito | Especificación |
|-----------|----------------|
| **Disponibilidad** | 99.9% uptime (8.77 horas/año downtime máximo) |
| **Latency** | < 200ms para operaciones de contador en tiempo real |
| **Concurrent Users** | Soporte para 10,000+ torneos simultáneos |
| **Seguridad** | OWASP Top 10 compliance, GDPR/CCPA ready |
| **Performance** | < 3s tiempo de carga inicial en 3G |
| **Offline** | Funcionalidad completa sin conexión |
| **Plataformas** | iOS 14+, Android 8+, Web modern browsers |

---

## 3. Arquitectura Técnica

### 3.1 Stack Recomendado

```mermaid
graph TB
    subgraph "Frontend"
        A[React Native 0.73+]
        B[React Native Web]
        C[Redux Toolkit]
        D[Socket.io Client]
    end
    
    subgraph "Backend"
        E[Node.js 20+ LTS]
        F[NestJS Framework]
        G[PostgreSQL 15+]
        H[Redis 7+]
        I[Socket.io Server]
    end
    
    subgraph "Infraestructura"
        J[Docker & Kubernetes]
        K[AWS/GCP]
        L[Cloudflare CDN]
        M[GitHub Actions]
    end
    
    A --> D
    B --> D
    D --> I
    A --> C
    C --> E
    E --> F
    F --> G
    F --> H
    F --> I
    E --> J
    J --> K
    K --> L
    M --> J
Justificación:
React Native: Codebase único para iOS/Android/Web
NestJS: TypeScript, arquitectura modular, dependencia injection
PostgreSQL: ACID compliance, JSONB para datos de partida
Redis: Pub/sub en tiempo real, rate limiting, cache
3.2 Componentes del Sistema
Mermaid
Copy
Code
Preview
graph LR
    subgraph "Capa de Presentación"
        UI1[Mobile App iOS]
        UI2[Mobile App Android]
        UI3[Web Dashboard]
    end
    
    subgraph "API Gateway"
        GW[Kong/AWS API Gateway]
        Auth[Auth Service JWT/OAuth2]
        Rate[Rate Limiter]
    end
    
    subgraph "Microservicios"
        MS1[User Service]
        MS2[Game Service]
        MS3[Tournament Service]
        MS4[League Service]
        MS5[Notification Service]
        MS6[Analytics Service]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL)]
        Cache[(Redis Cluster)]
        Search[Elasticsearch]
        Storage[S3/Cloud Storage]
    end
    
    UI1 --> GW
    UI2 --> GW
    UI3 --> GW
    GW --> Auth
    GW --> Rate
    Auth --> MS1
    Rate --> MS1
    Rate --> MS2
    Rate --> MS3
    Rate --> MS4
    MS1 --> DB
    MS2 --> DB
    MS3 --> DB
    MS4 --> DB
    MS1 --> Cache
    MS2 --> Cache
    MS3 --> Cache
    MS4 --> Cache
    MS5 --> Cache
    MS6 --> Search
    MS6 --> Storage
4. Modelo de Datos
4.1 Entidades Principales (PostgreSQL)
sql
Copy
-- Usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- NULL para OAuth
    profile_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT email_valid CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

-- Torneos
CREATE TABLE tournaments (
    id UUID PRIMARY KEY,
    created_by UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    format VARCHAR(50) NOT NULL, -- 'swiss', 'single_elimination', 'round_robin'
    status VARCHAR(20) DEFAULT 'upcoming', -- upcoming, active, completed, cancelled
    max_participants INTEGER,
    current_round INTEGER DEFAULT 0,
    settings JSONB, -- Configuraciones específicas
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Participantes de Torneo
CREATE TABLE tournament_participants (
    id UUID PRIMARY KEY,
    tournament_id UUID REFERENCES tournaments(id),
    user_id UUID REFERENCES users(id),
    decklist JSONB,
    status VARCHAR(20) DEFAULT 'registered', -- registered, dropped, eliminated
    match_points INTEGER DEFAULT 0,
    game_win_percentage DECIMAL(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, user_id)
);

-- Partidas (Games)
CREATE TABLE games (
    id UUID PRIMARY KEY,
    tournament_id UUID REFERENCES tournaments(id),
    round INTEGER NOT NULL,
    table_number INTEGER,
    status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, completed, reported
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB -- Life totals history, damage sources, etc.
);

-- Jugadores en Partida
CREATE TABLE game_players (
    id UUID PRIMARY KEY,
    game_id UUID REFERENCES games(id),
    user_id UUID REFERENCES users(id),
    starting_life_total INTEGER DEFAULT 20,
    current_life_total INTEGER DEFAULT 20,
    poison_counters INTEGER DEFAULT 0,
    commander_damage JSONB, -- {player_id: damage}
    is_winner BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ligas
CREATE TABLE leagues (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES users(id),
    scoring_system JSONB NOT NULL,
    season_start DATE NOT NULL,
    season_end DATE NOT NULL,
    is_public BOOLEAN DEFAULT false,
    max_participants INTEGER,
    status VARCHAR(20) DEFAULT 'active', -- active, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
4.2 Índices Críticos
sql
Copy
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_created_by ON tournaments(created_by);
CREATE INDEX idx_games_tournament_round ON games(tournament_id, round);
CREATE INDEX idx_game_players_game_id ON game_players(game_id);
CREATE INDEX idx_tournament_participants_points ON tournament_participants(tournament_id, match_points DESC);
CREATE INDEX idx_leagues_owner ON leagues(owner_id);
5. API Design
5.1 Convenciones
Base URL: https://api.mtgtournament.com/v1
Formato: JSON
Auth: Bearer JWT Token
Rate Limiting: 100 req/min por usuario, 1000 req/min por IP
Idempotencia: Header X-Idempotency-Key para operaciones críticas
5.2 Endpoints Principales
yaml
Copy
# Autenticación
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
POST /auth/oauth/{provider}

# Usuarios
GET /users/me
PUT /users/me
GET /users/{userId}/profile
GET /users/search?q={query}

# Torneos
GET /tournaments
POST /tournaments
GET /tournaments/{tournamentId}
PUT /tournaments/{tournamentId}
POST /tournaments/{tournamentId}/join
POST /tournaments/{tournamentId}/start
GET /tournaments/{tournamentId}/pairings
POST /tournaments/{tournamentId}/report

# Partidas (Tiempo Real)
GET /games/{gameId}
PUT /games/{gameId}/life-total
PUT /games/{gameId}/poison
POST /games/{gameId}/undo
POST /games/{gameId}/end

# Ligas
GET /leagues
POST /leagues
GET /leagues/{leagueId}
POST /leagues/{leagueId}/join
GET /leagues/{leagueId}/standings
POST /leagues/{leagueId}/report-match

# WebSocket Events (Socket.io)
connect: /socket.io
events:
  - game:lifeTotalChanged
  - game:playerJoined
  - tournament:pairingsUpdated
  - tournament:roundStarted
  - notification:invitation
5.3 Ejemplo de Respuesta Estándar
JSON
Copy
{
  "success": true,
  "data": { /* payload */ },
  "meta": {
    "timestamp": "2025-11-25T10:30:00Z",
    "requestId": "req_123456",
    "version": "1.0"
  },
  "errors": []
}
6. Seguridad
6.1 OWASP Top 10 Mitigations
Table
Copy
Riesgo	Mitigación	Implementación
A01: Broken Access Control	RBAC, ABAC, Ownership checks	NestJS Guards, CASL.js
A02: Cryptographic Failures	AES-256, TLS 1.3, Argon2id	node:crypto, bcrypt
A03: Injection	Parameterized queries, ORM	TypeORM, pg-promise
A04: Insecure Design	Threat modeling, Secure by design	OWASP ASVS 4.0
A05: Security Misconfig	Hardened Docker, CIS Benchmarks	kubernetes security policies
A06: Vulnerable Components	SCA, Dependabot, npm audit	Snyk, npm audit
A07: Auth Failures	JWT+Refresh, 2FA, OAuth 2.1	Passport.js, otpauth
A08: SW/Data Integrity	SLSA, signed containers	Sigstore, Notary
A09: Logging Failures	SIEM, audit trail	Winston, ELK Stack
A10: SSRF	Ingress whitelisting, no metadata access	Network policies
6.2 Políticas de Seguridad Específicas
yaml
Copy
# Rate Limiting
login: 5 attempts / 15 min
game_actions: 100 / min
tournament_creation: 10 / day

# Validación de Inputs
- Sanitización: DOMPurify
- Esquemas: Joi/Zod
- Max size: 10KB por request
- File uploads: Solo imágenes, max 5MB, escaneo con ClamAV

# Password Policy
- Min length: 12 chars
- Min entropy: 50 bits
- Breached password check: HaveIBeenPwned API

# Token Security
- Access Token: 15 min TTL
- Refresh Token: 7 days, rotación
- Stored securely: Keychain/Keystore
6.3 Compliance
GDPR: Right to erasure, data portability, consent management
CCPA: Do Not Sell, opt-out
COPPA: No recolección de datos de menores de 13 años
PCI DSS: No almacenar datos de pago (usar Stripe/Braintree)
7. Performance & Escalabilidad
7.1 Estrategias de Caching
Mermaid
Copy
Code
Preview
graph TD
    Client[Client App]
    CDN[Cloudflare CDN]
    RL1[Redis L1 Cache]
    RL2[Redis L2 Cache]
    DB[(PostgreSQL)]
    
    Client --> CDN
    CDN --> RL1
    RL1 --> RL2
    RL2 --> DB
    
    subgraph "Cache Layers"
        RL1
        RL2
    end
Nivel 1: Cache en dispositivo (Redux Persist, SQLite)
Nivel 2: Redis L1 (TTL 5 min) - Datos de sesión
Nivel 3: Redis L2 (TTL 1 hora) - Resultados de queries
Nivel 4: PostgreSQL materialized views (diarias)
7.2 Escalabilidad Horizontal
yaml
Copy
# Kubernetes HPA
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: game-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: game-service
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 30
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
7.3 Optimizaciones de Base de Datos
sql
Copy
-- Connection Pooling (PgBouncer)
max_connections: 100
pool_mode: transaction
default_pool_size: 20

-- Partitioning de tablas grandes
CREATE TABLE games_y2025m01 PARTITION OF games
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Query Optimization
EXPLAIN ANALYZE for all slow queries (>100ms)
Use of covering indexes for queries frecuentes
8. Infraestructura & DevOps
8.1 CI/CD Pipeline
yaml
Copy
# .github/workflows/main.yml
name: MTG Tournament CI/CD

on:
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      # Security Scanning
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      
      # Unit Tests
      - name: Run Tests
        run: |
          npm ci
          npm run test:coverage
      
      # Integration Tests
      - name: Integration Tests
        run: npm run test:integration
      
      # Build Docker Image
      - name: Build & Push
        uses: docker/build-push-action@v5
        with:
          push: true
          tags: mtgapp/api:${{ github.sha }}
          cache-from: type=registry,ref=mtgapp/api:latest
          cache-to: type=inline
8.2 Monitoreo & Observabilidad
yaml
Copy
# Prometheus Metrics
metrics:
  - http_requests_total
  - http_request_duration_seconds
  - socket_connections_active
  - redis_cache_hits_total
  - postgres_query_duration_seconds
  - custom: tournament_creation_rate
  - custom: game_rollback_events

# Grafana Dashboards
dashboards:
  - API Performance
  - Real-time Games
  - Tournament Health
  - User Activity
  - Security Events

# Alerting (PagerDuty/Opsgenie)
alerts:
  - High error rate (>1%)
  - Response time p99 > 500ms
  - Redis down
  - PostgreSQL replication lag > 5s
  - Socket.io disconnect rate > 10%
8.3 Logging Estratégico
TypeScript
Copy
// Estructura de log
{
  "timestamp": "2025-11-25T10:30:00.123Z",
  "level": "INFO",
  "service": "game-service",
  "traceId": "trace_123",
  "spanId": "span_456",
  "userId": "user_789",
  "action": "life_total_changed",
  "data": {
    "gameId": "game_abc",
    "oldValue": 20,
    "newValue": 15,
    "source": "player_1"
  },
  "responseTime": 45
}
9. Plan de Desarrollo por Fases
Fase 1: MVP (3-4 meses)
Objetivo: Contador de vida básico + torneos simples
[ ] Setup de infraestructura (Docker, CI/CD)
[ ] Auth básico (email/password)
[ ] Contador de vida 1v1 y Commander
[ ] Creación de torneos Swiss (manual)
[ ] WebSocket para tiempo real
[ ] Deploy en TEST
Metric: 100 usuarios beta
Fase 2: Core Features (2-3 meses)
Objetivo: Sistema de torneos completo
[ ] Generador de parejas automático (Swiss)
[ ] Sistema de reporte de resultados
[ ] Timer de ronda
[ ] Exportación de resultados
[ ] Invitaciones por email/código
[ ] Offline mode
[ ] Testing de seguridad
Metric: 1000+ usuarios
Fase 3: Ligas & Escalabilidad (2-3 meses)
Objetivo: Sistema de ligas y performance
[ ] CRUD de ligas
[ ] Sistema de puntuación
[ ] Clasificaciones y estadísticas
[ ] Optimización de DB (indexing, partitioning)
[ ] Rate limiting avanzado
[ ] Load testing (k6)
Metric: 10,000+ usuarios concurrentes
Fase 4: Madurez (2 meses)
Objetivo: Producción estable
[ ] Monitoreo completo (Grafana)
[ ] Sistema de pagos (premium features)
[ ] Moderación de contenido
[ ] Documentación API (Swagger)
[ ] App Store deployment
Metric: 50,000+ usuarios
10. Estándares de Código
10.1 JavaScript/TypeScript
JSON
Copy
// .eslintrc.js
module.exports = {
  "extends": [
    "@nestjs/eslint-config",
    "plugin:security/recommended"
  ],
  "rules": {
    "no-console": "error",
    "security/detect-object-injection": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
10.2 Git Flow
bash
Copy
main        # Producción (protegida)
├── develop # Integración
│   ├── feature/auth-system
│   ├── feature/game-engine
│   └── bugfix/counter-sync
└── release/v1.0.0
10.3 Code Review Checklist
[ ] Unit tests > 80% coverage
[ ] Integration tests para endpoints
[ ] No secrets en código
[ ] SQL injection prevención verificada
[ ] RBAC implementado donde corresponda
[ ] Performance impact evaluado
[ ] Documentación actualizada
11. Presupuesto Estimado
Table
Copy
Concepto	Costo Mensual (USD)
Infraestructura (AWS)	$500 - $2,000
PostgreSQL RDS	$200 - $500
Redis ElastiCache	$100 - $300
Kubernetes EKS	$300 - $600
Cloudflare	$0 - $200
Monitoring (Grafana Cloud)	$0 - $100
CI/CD (GitHub Actions)	$0 - $50
Total (Escalado)	$1,100 - $3,750
12. Riesgos y Mitigaciones
Table
Copy
Riesgo	Probabilidad	Impacto	Mitigación
Sincronización offline fallida	Media	Alto	Conflict resolution UUID + timestamp
Cheating en reporte	Media	Alto	Requiere ambos jugadores confirmar
Socket.io caída	Media	Alto	Fallback HTTP polling
Data corruption en torneo	Baja	Crítico	Backups cada 5 min + point-in-time recovery
Escalabilidad no alcanzada	Media	Alto	Load testing en cada sprint
13. Adjuntos
[ ] Diagrama de Arquitectura Detallado (draw.io)
[ ] Modelo ER Completo (dbdiagram.io)
[ ] Postman Collection de API
[ ] Threat Model (OWASP Threat Dragon)
[ ] Performance Benchmarks
14. Aprobaciones
Table
Copy
