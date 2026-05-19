-- =====================================================================
-- 0005 — Project: extra geographic fields + amenities catalog
-- =====================================================================
-- Adds province/city/sector breakdown and a free-form amenities array
-- so the project detail can show "Características" (Doc 1 §8.2).
-- =====================================================================

ALTER TABLE "Project"
  ADD COLUMN IF NOT EXISTS "province"  TEXT,
  ADD COLUMN IF NOT EXISTS "city"      TEXT,
  ADD COLUMN IF NOT EXISTS "sector"    TEXT,
  ADD COLUMN IF NOT EXISTS "amenities" TEXT[] NOT NULL DEFAULT '{}'::text[];
