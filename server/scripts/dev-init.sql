-- Runs once when the dev database volume is first created.
-- Integration tests (npm run test:local) use their own database.
CREATE DATABASE habitflower_test OWNER habitflower;
