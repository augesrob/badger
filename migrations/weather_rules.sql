-- Weather Rules table: configurable thresholds for door open/close decisions
CREATE TABLE IF NOT EXISTS weather_rules (
  id SERIAL PRIMARY KEY,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL,          -- 'dew_point_max', 'dew_point_min', 'temp_min', 'temp_max'
  threshold NUMERIC NOT NULL,       -- the value to compare against
  door_action TEXT NOT NULL,        -- 'open' or 'close'
  priority INT DEFAULT 0,           -- higher priority rules override lower
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE weather_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON weather_rules FOR ALL USING (true) WITH CHECK (true);

-- Weather config (zip code, units, etc)
CREATE TABLE IF NOT EXISTS weather_config (
  id INT PRIMARY KEY DEFAULT 1,
  zip_code TEXT DEFAULT '54935',
  location_name TEXT DEFAULT 'Fond du Lac, WI',
  temp_unit TEXT DEFAULT 'F',       -- 'F' or 'C'
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE weather_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON weather_config FOR ALL USING (true) WITH CHECK (true);

-- Insert default config
INSERT INTO weather_config (id, zip_code, location_name) VALUES (1, '54935', 'Fond du Lac, WI')
ON CONFLICT (id) DO NOTHING;

-- Insert default rules
INSERT INTO weather_rules (rule_name, rule_type, threshold, door_action, priority, description) VALUES
  ('High Dew Point', 'dew_point_min', 51, 'close', 10, 'Dew point ≥ 51° — doors must be closed'),
  ('Low Dew Point', 'dew_point_max', 50, 'open', 5, 'Dew point ≤ 50° — doors can be open'),
  ('Temp Too Cold', 'temp_max', 66, 'close', 8, 'Temperature < 67° — doors should be closed'),
  ('Temp Comfortable', 'temp_min', 67, 'open', 3, 'Temperature ≥ 67° — doors can be open'),
  ('Temp Comfortable Max', 'temp_max', 75, 'open', 3, 'Temperature ≤ 75° — doors can be open'),
  ('Temp Too Hot', 'temp_min', 76, 'close', 8, 'Temperature > 75° — doors should be closed');
