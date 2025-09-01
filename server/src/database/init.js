const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');

let db = null;

function initializeDatabase() {
    const dbPath = path.join(__dirname, 'drone_control.db');
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            logger.error('Error opening database:', err);
        } else {
            logger.info('Connected to SQLite database');
            createTables();
        }
    });
}

function createTables() {
    // Enhanced missions table for AI missions
    db.run(`CREATE TABLE IF NOT EXISTS missions (
        id TEXT PRIMARY KEY,
        farm_id TEXT,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        started_at TEXT,
        completed_at TEXT,
        flight_config TEXT,
        data_collection TEXT,
        ai_instructions TEXT,
        safety_params TEXT,
        post_mission_tasks TEXT,
        ai_generated BOOLEAN DEFAULT FALSE,
        learning_data TEXT
    )`, (err) => {
        if (err) {
            logger.error('Error creating missions table:', err);
        } else {
            logger.info('Missions table ready');
        }
    });

    // AI Mission Learning Data
    db.run(`CREATE TABLE IF NOT EXISTS ai_learning_data (
        id TEXT PRIMARY KEY,
        mission_id TEXT,
        decision_point TEXT,
        input_data TEXT,
        decision_made TEXT,
        outcome TEXT,
        accuracy_score REAL,
        learning_timestamp TEXT,
        FOREIGN KEY (mission_id) REFERENCES missions (id)
    )`, (err) => {
        if (err) {
            logger.error('Error creating ai_learning_data table:', err);
        } else {
            logger.info('AI Learning Data table ready');
        }
    });

    // AI Model Performance Tracking
    db.run(`CREATE TABLE IF NOT EXISTS ai_model_performance (
        id TEXT PRIMARY KEY,
        model_name TEXT NOT NULL,
        accuracy_score REAL,
        response_time REAL,
        last_updated TEXT,
        total_decisions INTEGER DEFAULT 0,
        successful_decisions INTEGER DEFAULT 0
    )`, (err) => {
        if (err) {
            logger.error('Error creating ai_model_performance table:', err);
        } else {
            logger.info('AI Model Performance table ready');
        }
    });

    // Farm Context Data
    db.run(`CREATE TABLE IF NOT EXISTS farm_context (
        id TEXT PRIMARY KEY,
        farm_id TEXT NOT NULL,
        weather_data TEXT,
        crop_health_data TEXT,
        terrain_data TEXT,
        infrastructure_data TEXT,
        last_updated TEXT,
        data_source TEXT
    )`, (err) => {
        if (err) {
            logger.error('Error creating farm_context table:', err);
        } else {
            logger.info('Farm Context table ready');
        }
    });

    // Existing tables (keeping for compatibility)
    db.run(`CREATE TABLE IF NOT EXISTS drone_commands (
        id TEXT PRIMARY KEY,
        command TEXT NOT NULL,
        parameters TEXT,
        timestamp TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        result TEXT,
        execution_time REAL
    )`, (err) => {
        if (err) {
            logger.error('Error creating drone_commands table:', err);
        } else {
            logger.info('Drone Commands table ready');
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS drone_photos (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        location TEXT,
        mission_id TEXT,
        metadata TEXT
    )`, (err) => {
        if (err) {
            logger.error('Error creating drone_photos table:', err);
        } else {
            logger.info('Drone Photos table ready');
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS drone_recordings (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT,
        duration REAL,
        mission_id TEXT,
        metadata TEXT
    )`, (err) => {
        if (err) {
            logger.error('Error creating drone_recordings table:', err);
        } else {
            logger.info('Drone Recordings table ready');
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS flight_logs (
        id TEXT PRIMARY KEY,
        mission_id TEXT,
        timestamp TEXT NOT NULL,
        event_type TEXT NOT NULL,
        description TEXT,
        data TEXT
    )`, (err) => {
        if (err) {
            logger.error('Error creating flight_logs table:', err);
        } else {
            logger.info('Flight Logs table ready');
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS telemetry_data (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        battery_level REAL,
        altitude REAL,
        speed REAL,
        position TEXT,
        temperature REAL,
        mission_id TEXT
    )`, (err) => {
        if (err) {
            logger.error('Error creating telemetry_data table:', err);
        } else {
            logger.info('Telemetry Data table ready');
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS safety_events (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        event_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        description TEXT,
        action_taken TEXT,
        mission_id TEXT
    )`, (err) => {
        if (err) {
            logger.error('Error creating safety_events table:', err);
        } else {
            logger.info('Safety Events table ready');
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS geofence_zones (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        boundaries TEXT NOT NULL,
        restrictions TEXT,
        created_at TEXT NOT NULL,
        active BOOLEAN DEFAULT TRUE
    )`, (err) => {
        if (err) {
            logger.error('Error creating geofence_zones table:', err);
        } else {
            logger.info('Geofence Zones table ready');
        }
    });

    // Insert default geofence zone
    db.run(`INSERT OR IGNORE INTO geofence_zones (id, name, boundaries, restrictions, created_at) VALUES 
        ('default-zone', 'Default Farm Boundary', '[]', '[]', datetime('now'))`, (err) => {
        if (err) {
            logger.error('Error inserting default geofence:', err);
        } else {
            logger.info('Default geofence zone created');
        }
    });

    // Insert default AI model performance data
    db.run(`INSERT OR IGNORE INTO ai_model_performance (id, model_name, accuracy_score, response_time, last_updated, total_decisions, successful_decisions) VALUES 
        ('crop-analysis-001', 'CropHealthAI', 0.85, 0.5, datetime('now'), 0, 0),
        ('weather-predictor-001', 'WeatherAI', 0.92, 0.3, datetime('now'), 0, 0),
        ('terrain-analyzer-001', 'TerrainAI', 0.78, 0.8, datetime('now'), 0, 0),
        ('decision-engine-001', 'DecisionAI', 0.88, 0.4, datetime('now'), 0, 0),
        ('vision-processor-001', 'ComputerVisionAI', 0.82, 0.6, datetime('now'), 0, 0)`, (err) => {
        if (err) {
            logger.error('Error inserting AI model performance data:', err);
        } else {
            logger.info('AI Model Performance data initialized');
        }
    });

    // Create indexes for better performance
    db.run(`CREATE INDEX IF NOT EXISTS idx_missions_farm_id ON missions (farm_id)`, (err) => {
        if (err) logger.error('Error creating missions index:', err);
    });

    db.run(`CREATE INDEX IF NOT EXISTS idx_missions_status ON missions (status)`, (err) => {
        if (err) logger.error('Error creating missions status index:', err);
    });

    db.run(`CREATE INDEX IF NOT EXISTS idx_missions_ai_generated ON missions (ai_generated)`, (err) => {
        if (err) logger.error('Error creating AI missions index:', err);
    });

    db.run(`CREATE INDEX IF NOT EXISTS idx_ai_learning_mission_id ON ai_learning_data (mission_id)`, (err) => {
        if (err) logger.error('Error creating AI learning index:', err);
    });

    db.run(`CREATE INDEX IF NOT EXISTS idx_farm_context_farm_id ON farm_context (farm_id)`, (err) => {
        if (err) logger.error('Error creating farm context index:', err);
    });

    logger.info('Database initialization complete');
}

function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return db;
}

function closeDatabase() {
    if (db) {
        db.close((err) => {
            if (err) {
                logger.error('Error closing database:', err);
            } else {
                logger.info('Database connection closed');
            }
        });
    }
}

module.exports = { initializeDatabase, getDatabase, closeDatabase };
