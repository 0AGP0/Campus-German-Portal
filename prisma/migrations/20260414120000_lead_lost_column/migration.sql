-- Lead.kayip — şemada vardı, ilk init migration'da eksikti
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lost" BOOLEAN NOT NULL DEFAULT false;
