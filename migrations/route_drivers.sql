-- Route Drivers table: parsed from Route/Driver Report PDF
-- Stores individual route assignments grouped by transfer driver
CREATE TABLE IF NOT EXISTS route_drivers (
  id SERIAL PRIMARY KEY,
  region TEXT NOT NULL,          -- 'FDL', 'GREENBAY', 'WAUSAU', 'MKE', 'EC'
  route_number TEXT NOT NULL,    -- '1501', '2504', etc.
  route_name TEXT,               -- 'KIEL', 'SHAWANO', etc.
  driver_name TEXT,              -- Route driver: 'Max Martin'
  driver_phone TEXT,             -- '(920)960-7290'
  truck_number TEXT,             -- '195', '161', etc.
  helper_name TEXT,              -- Helper if listed
  cases_expected INT DEFAULT 0,
  stops INT DEFAULT 0,
  weight NUMERIC DEFAULT 0,
  start_time TEXT,               -- '5:00 AM', '6:00 AM'
  transfer_driver TEXT,          -- Transfer driver name: 'Jennifer Wilcox'
  transfer_truck TEXT,           -- Transfer truck: '231', '224', etc.
  notes TEXT,
  upload_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE route_drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON route_drivers FOR ALL USING (true) WITH CHECK (true);

-- Index for quick lookups
CREATE INDEX idx_route_drivers_region ON route_drivers(region);
CREATE INDEX idx_route_drivers_transfer ON route_drivers(transfer_driver);
CREATE INDEX idx_route_drivers_date ON route_drivers(upload_date);
