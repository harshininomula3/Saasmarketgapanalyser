-- ============================================
-- TABLE 0: analysis_sessions  [NEW]
-- Tracks domain context for each analysis run
-- ============================================
CREATE TABLE IF NOT EXISTS analysis_sessions (
    id TEXT PRIMARY KEY,
    domain TEXT NOT NULL,
    product_category TEXT NOT NULL,
    target_market TEXT NOT NULL,
    company_description TEXT,
    industry_tam_billions REAL NOT NULL DEFAULT 50,
    market_growth_rate REAL NOT NULL DEFAULT 12,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'fetching', 'analyzing', 'scoring', 'complete', 'error')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

-- ============================================
-- TABLE 1: pain_points
-- ============================================
CREATE TABLE IF NOT EXISTS pain_points (
    id TEXT PRIMARY KEY,
    theme TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    frequency INTEGER NOT NULL CHECK (frequency > 0),
    severity_score REAL NOT NULL CHECK (severity_score >= 0 AND severity_score <= 10),
    affected_personas TEXT NOT NULL, -- Stored as JSON string
    related_keywords TEXT NOT NULL,  -- Stored as JSON string
    source TEXT NOT NULL DEFAULT 'ai_generated',
    session_id TEXT REFERENCES analysis_sessions(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_theme CHECK (length(theme) > 0 AND length(theme) <= 200)
);

CREATE INDEX IF NOT EXISTS idx_pain_points_severity ON pain_points(severity_score DESC);
CREATE INDEX IF NOT EXISTS idx_pain_points_frequency ON pain_points(frequency DESC);
CREATE INDEX IF NOT EXISTS idx_pain_points_session ON pain_points(session_id);

-- ============================================
-- TABLE 2: competitors
-- ============================================
CREATE TABLE IF NOT EXISTS competitors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    website TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'expense_management',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_name CHECK (length(name) > 0)
);

CREATE INDEX IF NOT EXISTS idx_competitors_name ON competitors(name);

-- SEED DATA FOR MVP:
INSERT OR IGNORE INTO competitors (id, name, website, description, category) VALUES
    ('comp-1', 'Expensify', 'https://expensify.com', 'Receipt scanning and expense management', 'expense_management'),
    ('comp-2', 'Brex', 'https://brex.com', 'Corporate card and spend management', 'expense_management'),
    ('comp-3', 'Divvy', 'https://divvy.co', 'Virtual card and expense automation', 'expense_management'),
    ('comp-4', 'Bill.com', 'https://bill.com', 'Accounts payable and payment automation', 'ap_automation'),
    ('comp-5', 'Stripe Billing', 'https://stripe.com/billing', 'Billing and subscription management', 'billing');

-- ============================================
-- TABLE 3: competitor_features
-- ============================================
CREATE TABLE IF NOT EXISTS competitor_features (
    id TEXT PRIMARY KEY,
    competitor_id TEXT NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    tier TEXT NOT NULL DEFAULT 'Standard',
    confidence REAL NOT NULL DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
    CONSTRAINT valid_feature CHECK (length(feature_name) > 0),
    CONSTRAINT unique_feature_per_competitor UNIQUE(competitor_id, feature_name)
);

CREATE INDEX IF NOT EXISTS idx_features_competitor ON competitor_features(competitor_id);
CREATE INDEX IF NOT EXISTS idx_features_category ON competitor_features(category);

-- SEED DATA FOR MVP:
INSERT OR IGNORE INTO competitor_features (id, competitor_id, feature_name, category, description, tier, confidence)
SELECT 'feat-1', c.id, 'Receipt OCR', 'Core', 'Automated receipt scanning from images and PDFs', 'Premium', 0.95
FROM competitors c WHERE c.name = 'Expensify'
UNION ALL SELECT 'feat-2', c.id, 'Multi-currency support', 'Advanced', 'Auto exchange rate conversion', 'Enterprise', 0.90
FROM competitors c WHERE c.name = 'Expensify'
UNION ALL SELECT 'feat-3', c.id, 'Real-time expense approval', 'Core', 'Mobile approval workflow', 'Standard', 1.0
FROM competitors c WHERE c.name = 'Expensify'
UNION ALL SELECT 'feat-4', c.id, 'Virtual card issuance', 'Advanced', 'Single-use and recurring virtual cards', 'Standard', 0.95
FROM competitors c WHERE c.name = 'Brex'
UNION ALL SELECT 'feat-5', c.id, 'Spend analytics', 'Analytics', 'Budget tracking and forecasting', 'Standard', 0.90
FROM competitors c WHERE c.name = 'Brex'
UNION ALL SELECT 'feat-6', c.id, 'Automated categorization', 'Core', 'AI-powered expense category assignment', 'Premium', 0.85
FROM competitors c WHERE c.name = 'Divvy'
UNION ALL SELECT 'feat-7', c.id, 'Multi-currency reconciliation', 'Advanced', 'Reconcile expenses across currencies', 'Enterprise', 0.70
FROM competitors c WHERE c.name = 'Brex'
UNION ALL SELECT 'feat-8', c.id, 'AP automation', 'Core', 'Automated vendor bill processing', 'Standard', 0.95
FROM competitors c WHERE c.name = 'Bill.com'
UNION ALL SELECT 'feat-9', c.id, 'Invoice management', 'Core', 'Centralized invoice tracking', 'Standard', 0.95
FROM competitors c WHERE c.name = 'Bill.com'
UNION ALL SELECT 'feat-10', c.id, 'Subscription billing', 'Billing', 'Recurring billing and invoicing', 'Standard', 1.0
FROM competitors c WHERE c.name = 'Stripe Billing';

-- ============================================
-- TABLE 4: gaps
-- ============================================
CREATE TABLE IF NOT EXISTS gaps (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    gap_type TEXT NOT NULL,
    severity_score REAL NOT NULL CHECK (severity_score >= 0 AND severity_score <= 10),
    coverage_percentage REAL NOT NULL CHECK (coverage_percentage >= 0 AND coverage_percentage <= 100),
    market_frequency INTEGER NOT NULL,
    related_pain_point_id TEXT NOT NULL REFERENCES pain_points(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_gap_type CHECK (gap_type IN ('Complete gap', 'Partial gap', 'Competitive gap'))
);

CREATE INDEX IF NOT EXISTS idx_gaps_severity ON gaps(severity_score DESC);
CREATE INDEX IF NOT EXISTS idx_gaps_coverage ON gaps(coverage_percentage ASC);

-- ============================================
-- TABLE 5: gap_competitor_coverage
-- ============================================
CREATE TABLE IF NOT EXISTS gap_competitor_coverage (
    id TEXT PRIMARY KEY,
    gap_id TEXT NOT NULL REFERENCES gaps(id) ON DELETE CASCADE,
    competitor_id TEXT NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    feature_ids TEXT, -- Stored as JSON string
    coverage_score REAL NOT NULL CHECK (coverage_score >= 0 AND coverage_score <= 100),
    CONSTRAINT unique_gap_competitor UNIQUE(gap_id, competitor_id)
);

-- ============================================
-- TABLE 6: opportunities
-- ============================================
CREATE TABLE IF NOT EXISTS opportunities (
    id TEXT PRIMARY KEY,
    gap_id TEXT NOT NULL REFERENCES gaps(id),
    name TEXT NOT NULL,
    overall_score REAL NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),

    market_potential_score REAL NOT NULL,
    execution_ease_score REAL NOT NULL,
    defensibility_score REAL NOT NULL,
    timing_score REAL NOT NULL,

    tam_estimate TEXT NOT NULL,
    addressable_companies INTEGER,
    target_personas TEXT NOT NULL, -- Stored as JSON string

    direct_competitors_count INTEGER NOT NULL DEFAULT 0,
    threat_level TEXT NOT NULL CHECK (threat_level IN ('Low', 'Medium', 'High')),

    estimated_effort_months INTEGER,
    estimated_team_size INTEGER,
    estimated_cost_usd INTEGER,

    year3_arr_estimate TEXT,
    risk_summary TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_name CHECK (length(name) > 0)
);

CREATE INDEX IF NOT EXISTS idx_opportunities_score ON opportunities(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_gap ON opportunities(gap_id);
