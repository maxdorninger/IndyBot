-- Add columns returned by the IndY API that were missing from the initial schema.

-- teachers: store area of expertise alongside the teacher record
ALTER TABLE private.teachers
  ADD COLUMN IF NOT EXISTS area_of_expertise text,
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS email text;

-- subjects: store the long display name returned by /subject/active
ALTER TABLE private.subjects
  ADD COLUMN IF NOT EXISTS longname text;

-- special_indy: store the additional fields returned by /specialindy/
ALTER TABLE private.special_indy
  ADD COLUMN IF NOT EXISTS area_of_expertise text,
  ADD COLUMN IF NOT EXISTS slimit bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS room text,
  ADD COLUMN IF NOT EXISTS fullname text;
