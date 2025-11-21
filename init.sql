-- Database initialization script for EvoManager SaaS

-- Create tables for dashboard stats if they don't exist
CREATE TABLE IF NOT EXISTS dashboard_stats (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    total_instances INTEGER DEFAULT 0,
    active_connections INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    total_contacts INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tables for message metrics if they don't exist
CREATE TABLE IF NOT EXISTS message_metrics (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    date VARCHAR(10) NOT NULL, -- Format: 'Mon', 'Tue', etc. or 'YYYY-MM-DD'
    sent INTEGER DEFAULT 0,
    received INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dashboard_stats_user_id ON dashboard_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_message_metrics_user_id ON message_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_message_metrics_date ON message_metrics(date);