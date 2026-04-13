-- TEK SEFER: campus_german_portal içindeki ESKİ portal tablolarını kaldırır; TÜM VERİ SİLİNİR.
-- Sonra: npx prisma migrate deploy
-- UYARI: Yedek almadan çalıştırmayın.

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
