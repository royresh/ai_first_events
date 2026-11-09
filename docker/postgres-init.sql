-- Runs once, on first start of an empty postgres volume.
-- The app database (aifirst) is created by POSTGRES_DB; this adds the integration-test database.
CREATE DATABASE aifirst_test;
