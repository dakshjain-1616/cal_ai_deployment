CREATE TABLE users (
    user_id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    daily_calorie_target INTEGER DEFAULT 2000,
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    session_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE meals (
    meal_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    source TEXT NOT NULL,
    original_input TEXT,
    total_calories REAL,
    total_macros_protein_g REAL,
    total_macros_carbs_g REAL,
    total_macros_fat_g REAL,
    confidence_score REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE food_items (
    food_item_id TEXT PRIMARY KEY,
    meal_id TEXT NOT NULL,
    name TEXT NOT NULL,
    grams REAL,
    calories REAL,
    protein_g REAL,
    carbs_g REAL,
    fat_g REAL,
    model_label TEXT,
    confidence REAL,
    FOREIGN KEY (meal_id) REFERENCES meals(meal_id)
);

CREATE TABLE water_logs (
    water_log_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount_ml INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE exercise_logs (
    exercise_log_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    calories_burned INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE weight_logs (
    weight_log_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    weight_kg REAL NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE INDEX idx_meals_user_timestamp ON meals(user_id, timestamp);
CREATE INDEX idx_meals_user ON meals(user_id);
CREATE INDEX idx_food_items_meal ON food_items(meal_id);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_water_logs_user_timestamp ON water_logs(user_id, timestamp);
CREATE INDEX idx_exercise_logs_user_timestamp ON exercise_logs(user_id, timestamp);
CREATE INDEX idx_weight_logs_user_timestamp ON weight_logs(user_id, timestamp);
