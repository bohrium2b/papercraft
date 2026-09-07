# Infrastructure & Performance Plan

## Feature Intent

The infrastructure plan exists to guarantee that Papercraft feels instant for 20 teachers working simultaneously, never exceeds 2 GB RAM, and never exceeds 13 GB disk — all on a single modest VPS. Every architectural choice below (serialized LaTeX, streamed PDFs, Redis-bounded caches, lazy-loaded frontend chunks) serves that constraint.

Users should never wait more than a few seconds for item saves, PDF compilations should complete in under a minute, and the system should remain stable even when a teacher accidentally triggers a runaway TikZ compilation. The backup and monitoring plan keeps institutional data safe without requiring a dedicated ops team.

## Deployment Architecture
Single VPS or container host. No horizontal scaling required for 20 concurrent users.

### Hardware Profile
- **vCPU:** 2 cores
- **RAM:** 2 GB
- **Disk:** 15 GB SSD (13 GB usable after OS)

### OS & Base
- Ubuntu 24.04 LTS or equivalent
- Docker + Docker Compose for service isolation
- Nginx as reverse proxy with gzip/brotli
- Let's Encrypt TLS termination

## Application Runtime

### Rails Configuration
```yaml
# config/puma.rb
workers 2
threads 2, 4
preload_app!
on_worker_boot { ActiveRecord::Base.establish_connection }
```

### PostgreSQL Tuning
```conf
shared_buffers = 128MB
work_mem = 4MB
maintenance_work_mem = 32MB
effective_cache_size = 512MB
max_connections = 40
```

### Redis Configuration
```conf
maxmemory 64mb
maxmemory-policy allkeys-lru
save ""
appendonly no
```

Redis logical database split:
- **DB 0:** Rails sessions + Sidekiq job state
- **DB 1:** SVG cache (LRU evicted independently)

### Sidekiq
- 1 concurrency process
- Dead set: 1 day retention
- Retry: 3 attempts with exponential backoff
- LaTeX compilation queue is serialized (1 job at a time) to prevent OOM

## Frontend Build Strategy
- **Vite** for bundling (tree-shaking, smaller bundles than Webpack)
- **MUI** emotion styling
- Route-based code splitting
- Lazy load diagram editor, PDF preview, analytics charts
- Service Worker for offline editor caching (optional)
- In-browser AI (transformer.js 0.6B model) loaded lazily on autosave panel mount

## PDF / LaTeX Compilation Service
- **Isolated worker process** (single Sidekiq job)
- **Memory limit:** 512 MB per compilation job via Sidekiq job limits
- **Queue:** Serialized (1 job at a time) to prevent OOM
- **Timeout:** 45 seconds per compilation
- **Fallback:** Pre-compiled placeholder if compilation fails

```ruby
class LatexCompilationJob < ApplicationJob
  queue_as :latex
  sidekiq_options lock: :until_executed, lock_timeout: 60

  def perform(diagram_id)
    # Run inside a timeout guard
    # Use temporary directory with cleanup
    # Restrict pdflatex memory via cgroup or process limits
  end
end
```

## Asset Storage
- Local filesystem for uploads (S3-compatible local service like MinIO is overkill for 13GB)
- Nginx `expires` headers for static assets
- React bundle hashed filenames for cache busting
- SVG cache stored in Redis DB 1 (64MB cap) + disk fallback

## Database Strategy

### Connection Pooling
- Rails pool: 5 per worker × 2 workers = 10
- Sidekiq pool: 5
- Total: 15 of 40 max connections

### Indexing Strategy
- B-tree on `department_id` for every table (filtering, not security)
- Composite indexes on `(department_id, status)`, `(department_id, created_at)`
- Partial index on `items WHERE status = 'approved'`
- Full-text search via `pg_trgm` for item bank search (lightweight)
- Index on `items.content_hash` for duplication detection
- Index on `locks.lock_key` for fast lock acquisition

### Query Optimization
- N+1 eliminated via `includes` / `preload`
- Pagination: offset-based for item banks (data scale doesn't warrant cursor)
- Item usage counts cached in a denormalised counter column, refreshed by background job

## Caching Layers
1. **HTTP Cache:** Rails fragment caching + `stale-while-revalidate`
2. **Redis DB 1:** SVG cache (64MB cap, LRU)
3. **Database:** Denormalised counters for item usage (no materialized views)

## Monitoring (within budget)
- Rails logs → rotated daily, 7 days retention
- PostgreSQL `pg_stat_statements` for slow query detection
- Sidekiq Web UI (protected, internal only)
- Custom health check endpoint: `/up` (Puma + DB + Redis)

## Backup Strategy
- **Database:** Daily `pg_dump` compressed (expected ~500MB max)
- **Assets:** Daily rsync to `/var/backups/papercraft`
- **Retention:** 7 days
- **Restore test:** Monthly dry run

## Scaling Triggers
- RAM > 1.8 GB for 5+ minutes → investigate leak
- Disk > 11 GB → purge old PDF caches (> 30 days)
- P99 latency > 2s → add DB index or reduce eager load
- Sidekiq queue depth > 50 → add concurrency or optimise jobs
