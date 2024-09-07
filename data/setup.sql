CREATE TABLE IF NOT EXISTS crons ( id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, cron_expression VARCHAR(255) NOT NULL, active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS cron_events ( id INT AUTO_INCREMENT PRIMARY KEY, cron_id INT NOT NULL, scheduled_time DATETIME NOT NULL, start_time DATETIME, end_time DATETIME, status DEFAULT 'SCHEDULED' CHECK(status IN ('SCHEDULED', 'STARTED', 'COMPLETED', 'MISSED')), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (cron_id) REFERENCES crons(id) );
CREATE INDEX IF NOT EXISTS idx_scheduled_time ON cron_events(scheduled_time);