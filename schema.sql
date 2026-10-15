CREATE TABLE IF NOT EXISTS licenses (id TEXT PRIMARY KEY, code_hash TEXT NOT NULL UNIQUE, label TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, revoked INTEGER NOT NULL DEFAULT 0, activated_at TEXT);
CREATE TABLE IF NOT EXISTS public_dashboards (license_id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(license_id) REFERENCES licenses(id));

-- Setiap instalasi browser memakai satu slot (maksimal 3 per lisensi).
CREATE TABLE IF NOT EXISTS license_devices (license_id TEXT NOT NULL, device_id_hash TEXT NOT NULL, device_name TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, last_seen TEXT NOT NULL, PRIMARY KEY(license_id,device_id_hash), FOREIGN KEY(license_id) REFERENCES licenses(id));
CREATE INDEX IF NOT EXISTS idx_license_devices_license ON license_devices(license_id);
