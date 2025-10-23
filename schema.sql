-- ============================================================================
-- Coaching Assessment Application - Supabase PostgreSQL Schema
-- ============================================================================
-- This schema models a 360-degree feedback system for coaching programs
-- with hierarchical data: Dimensions > Competencies > Questions
-- ============================================================================

-- Enable UUID extension (should already be enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- DROP TABLES (for clean re-runs during development)
-- ============================================================================
DROP TABLE IF EXISTS calculated_scores CASCADE;
DROP TABLE IF EXISTS assessment_responses CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS assessment_templates CASCADE;
DROP TABLE IF EXISTS competencies CASCADE;
DROP TABLE IF EXISTS dimensions CASCADE;
DROP TABLE IF EXISTS nominations CASCADE;
DROP TABLE IF EXISTS nominees CASCADE;
DROP TABLE IF EXISTS coachees CASCADE;
DROP TABLE IF EXISTS programmes CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- ============================================================================
-- TABLE DEFINITIONS
-- ============================================================================

-- 1. CLIENTS
-- Stores the corporate clients who purchase coaching programs
CREATE TABLE clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamptz DEFAULT NOW()
);

-- 2. PROGRAMMES
-- An instance of a coaching programme sold to a client
CREATE TABLE programmes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamptz DEFAULT NOW()
);

-- 3. COACHEES
-- The individual leaders participating in a programme
CREATE TABLE coachees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    programme_id uuid NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    email text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT NOW()
);

-- 4. NOMINEES
-- Colleagues nominated to give feedback
CREATE TABLE nominees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name text NOT NULL,
    email text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT NOW()
);

-- 5. NOMINATIONS
-- Junction table linking coachees to their nominated feedback providers
CREATE TABLE nominations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    coachee_id uuid NOT NULL REFERENCES coachees(id) ON DELETE CASCADE,
    nominee_id uuid NOT NULL REFERENCES nominees(id) ON DELETE CASCADE,
    relationship_type text NOT NULL CHECK (relationship_type IN ('Peer', 'Direct Report', 'Senior Leader')),
    created_at timestamptz DEFAULT NOW(),
    UNIQUE(coachee_id, nominee_id)
);

-- 6. DIMENSIONS (NEW)
-- The highest-level grouping for competencies (e.g., Thinking, Relating, Executing)
CREATE TABLE dimensions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    display_order int,
    created_at timestamptz DEFAULT NOW()
);

-- 7. COMPETENCIES (MODIFIED)
-- A lookup table for the core leadership skills, now linked to a dimension
CREATE TABLE competencies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dimension_id uuid NOT NULL REFERENCES dimensions(id) ON DELETE CASCADE,
    name text NOT NULL UNIQUE,
    display_order int,
    created_at timestamptz DEFAULT NOW()
);

-- 8. ASSESSMENT_TEMPLATES
-- Stores the master configuration for each type of survey
CREATE TABLE assessment_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    survey_json jsonb NOT NULL,
    created_at timestamptz DEFAULT NOW()
);

-- 9. QUESTIONS
-- The mapping table that connects a question key to a competency and its scoring rules
CREATE TABLE questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_key text NOT NULL UNIQUE,
    competency_id uuid NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
    scoring_rules jsonb NOT NULL,
    created_at timestamptz DEFAULT NOW()
);

-- 10. ASSESSMENT_RESPONSES
-- Stores every raw submission from both coachees and nominees
CREATE TABLE assessment_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_template_id uuid NOT NULL REFERENCES assessment_templates(id) ON DELETE CASCADE,
    coachee_id uuid NOT NULL REFERENCES coachees(id) ON DELETE CASCADE,
    respondent_email text NOT NULL,
    raw_response_data jsonb NOT NULL,
    submitted_at timestamptz DEFAULT NOW()
);

-- 11. CALCULATED_SCORES
-- Stores the processed, numerical scores at the competency level
CREATE TABLE calculated_scores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    coachee_id uuid NOT NULL REFERENCES coachees(id) ON DELETE CASCADE,
    competency_id uuid NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
    relationship_type text NOT NULL CHECK (relationship_type IN ('Peer', 'Direct Report', 'Senior Leader', 'Self')),
    average_score numeric(4, 2) NOT NULL,
    calculation_date timestamptz DEFAULT NOW(),
    UNIQUE(coachee_id, competency_id, relationship_type)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_programmes_client_id ON programmes(client_id);
CREATE INDEX idx_coachees_programme_id ON coachees(programme_id);
CREATE INDEX idx_coachees_email ON coachees(email);
CREATE INDEX idx_nominees_email ON nominees(email);
CREATE INDEX idx_nominations_coachee_id ON nominations(coachee_id);
CREATE INDEX idx_nominations_nominee_id ON nominations(nominee_id);
CREATE INDEX idx_competencies_dimension_id ON competencies(dimension_id);
CREATE INDEX idx_questions_competency_id ON questions(competency_id);
CREATE INDEX idx_questions_question_key ON questions(question_key);
CREATE INDEX idx_assessment_responses_coachee_id ON assessment_responses(coachee_id);
CREATE INDEX idx_assessment_responses_template_id ON assessment_responses(assessment_template_id);
CREATE INDEX idx_assessment_responses_respondent_email ON assessment_responses(respondent_email);
CREATE INDEX idx_calculated_scores_coachee_id ON calculated_scores(coachee_id);
CREATE INDEX idx_calculated_scores_competency_id ON calculated_scores(competency_id);

-- ============================================================================
-- MOCK DATA INSERTS
-- ============================================================================

-- Insert Client
INSERT INTO clients (id, name) VALUES
    ('10000000-0000-0000-0000-000000000001', 'Acme Corporation');

-- Insert Programme
INSERT INTO programmes (id, client_id, name) VALUES
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Acme Corp Q4 2025 Leadership Development');

-- Insert Coachees
INSERT INTO coachees (id, programme_id, full_name, email) VALUES
    ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Sarah Johnson', 'sarah.johnson@acme.com'),
    ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Michael Chen', 'michael.chen@acme.com');

-- Insert Nominees
INSERT INTO nominees (id, full_name, email) VALUES
    ('40000000-0000-0000-0000-000000000001', 'Emma Thompson', 'emma.thompson@acme.com'),
    ('40000000-0000-0000-0000-000000000002', 'James Rodriguez', 'james.rodriguez@acme.com'),
    ('40000000-0000-0000-0000-000000000003', 'Lisa Park', 'lisa.park@acme.com'),
    ('40000000-0000-0000-0000-000000000004', 'David Kumar', 'david.kumar@acme.com');

-- Insert Nominations (Sarah's feedback providers)
INSERT INTO nominations (coachee_id, nominee_id, relationship_type) VALUES
    ('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Peer'),
    ('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'Direct Report'),
    ('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 'Senior Leader');

-- Insert Nominations (Michael's feedback providers)
INSERT INTO nominations (coachee_id, nominee_id, relationship_type) VALUES
    ('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'Peer'),
    ('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000004', 'Direct Report');

-- Insert Dimensions (based on typical leadership frameworks)
INSERT INTO dimensions (id, name, display_order) VALUES
    ('50000000-0000-0000-0000-000000000001', 'Think', 1),
    ('50000000-0000-0000-0000-000000000002', 'Relate', 2),
    ('50000000-0000-0000-0000-000000000003', 'Act', 3);

-- Insert Competencies (12 core leadership skills grouped by dimension)
-- Think Dimension
INSERT INTO competencies (id, dimension_id, name, display_order) VALUES
    ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'Strategic Thinking', 1),
    ('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'Problem Solving', 2),
    ('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000001', 'Innovation', 3),
    ('60000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000001', 'Decision Making', 4);

-- Relate Dimension
INSERT INTO competencies (id, dimension_id, name, display_order) VALUES
    ('60000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000002', 'Communication', 5),
    ('60000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000002', 'Collaboration', 6),
    ('60000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000002', 'Empathy', 7),
    ('60000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000002', 'Influence', 8);

-- Act Dimension
INSERT INTO competencies (id, dimension_id, name, display_order) VALUES
    ('60000000-0000-0000-0000-000000000009', '50000000-0000-0000-0000-000000000003', 'Results Orientation', 9),
    ('6000000a-0000-0000-0000-000000000000', '50000000-0000-0000-0000-000000000003', 'Accountability', 10),
    ('6000000b-0000-0000-0000-000000000000', '50000000-0000-0000-0000-000000000003', 'Adaptability', 11),
    ('6000000c-0000-0000-0000-000000000000', '50000000-0000-0000-0000-000000000003', 'Resilience', 12);

-- Insert Assessment Template (simplified SurveyJS configuration)
INSERT INTO assessment_templates (id, name, survey_json) VALUES
    ('70000000-0000-0000-0000-000000000001', 'Self-Assessment v1', 
    '{
        "title": "Leadership Self-Assessment",
        "pages": [
            {
                "name": "strategic_thinking",
                "elements": [
                    {
                        "type": "radiogroup",
                        "name": "strategic_thinking_q1",
                        "title": "I effectively analyze complex situations and develop long-term strategies",
                        "choices": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
                    },
                    {
                        "type": "radiogroup",
                        "name": "strategic_thinking_q2",
                        "title": "I anticipate future trends and their impact on the organization",
                        "choices": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
                    }
                ]
            },
            {
                "name": "communication",
                "elements": [
                    {
                        "type": "radiogroup",
                        "name": "communication_q1",
                        "title": "I communicate clearly and effectively with diverse audiences",
                        "choices": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
                    },
                    {
                        "type": "radiogroup",
                        "name": "communication_q2",
                        "title": "I actively listen and seek to understand others perspectives",
                        "choices": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
                    }
                ]
            }
        ]
    }'::jsonb);

-- Insert Questions (mapping question keys to competencies with scoring rules)
INSERT INTO questions (question_key, competency_id, scoring_rules) VALUES
    ('strategic_thinking_q1', '60000000-0000-0000-0000-000000000001', 
        '{"Strongly Disagree": 1, "Disagree": 2, "Neutral": 3, "Agree": 4, "Strongly Agree": 5}'::jsonb),
    ('strategic_thinking_q2', '60000000-0000-0000-0000-000000000001', 
        '{"Strongly Disagree": 1, "Disagree": 2, "Neutral": 3, "Agree": 4, "Strongly Agree": 5}'::jsonb),
    ('communication_q1', '60000000-0000-0000-0000-000000000005', 
        '{"Strongly Disagree": 1, "Disagree": 2, "Neutral": 3, "Agree": 4, "Strongly Agree": 5}'::jsonb),
    ('communication_q2', '60000000-0000-0000-0000-000000000005', 
        '{"Strongly Disagree": 1, "Disagree": 2, "Neutral": 3, "Agree": 4, "Strongly Agree": 5}'::jsonb);

-- Insert Assessment Responses (Sarah's self-assessment)
INSERT INTO assessment_responses (id, assessment_template_id, coachee_id, respondent_email, raw_response_data) VALUES
    ('80000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'sarah.johnson@acme.com',
    '{
        "strategic_thinking_q1": "Agree",
        "strategic_thinking_q2": "Strongly Agree",
        "communication_q1": "Strongly Agree",
        "communication_q2": "Agree"
    }'::jsonb);

-- Insert Assessment Responses (Emma's feedback about Sarah - Peer)
INSERT INTO assessment_responses (id, assessment_template_id, coachee_id, respondent_email, raw_response_data) VALUES
    ('80000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'emma.thompson@acme.com',
    '{
        "strategic_thinking_q1": "Agree",
        "strategic_thinking_q2": "Agree",
        "communication_q1": "Strongly Agree",
        "communication_q2": "Strongly Agree"
    }'::jsonb);

-- Insert Assessment Responses (James's feedback about Sarah - Direct Report)
INSERT INTO assessment_responses (id, assessment_template_id, coachee_id, respondent_email, raw_response_data) VALUES
    ('80000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'james.rodriguez@acme.com',
    '{
        "strategic_thinking_q1": "Neutral",
        "strategic_thinking_q2": "Agree",
        "communication_q1": "Agree",
        "communication_q2": "Agree"
    }'::jsonb);

-- Insert Calculated Scores (Sarah's scores by relationship type)
-- Strategic Thinking scores
INSERT INTO calculated_scores (coachee_id, competency_id, relationship_type, average_score) VALUES
    ('30000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'Self', 4.50),
    ('30000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'Peer', 4.00),
    ('30000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'Direct Report', 3.50);

-- Communication scores
INSERT INTO calculated_scores (coachee_id, competency_id, relationship_type, average_score) VALUES
    ('30000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000005', 'Self', 4.50),
    ('30000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000005', 'Peer', 5.00),
    ('30000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000005', 'Direct Report', 4.00);

-- ============================================================================
-- USEFUL VIEWS (OPTIONAL BUT RECOMMENDED)
-- ============================================================================

-- View to get dimension-level scores (aggregated from competencies)
CREATE OR REPLACE VIEW dimension_scores AS
SELECT 
    cs.coachee_id,
    d.id as dimension_id,
    d.name as dimension_name,
    cs.relationship_type,
    AVG(cs.average_score) as dimension_average_score,
    COUNT(cs.competency_id) as competencies_count
FROM calculated_scores cs
JOIN competencies c ON cs.competency_id = c.id
JOIN dimensions d ON c.dimension_id = d.id
GROUP BY cs.coachee_id, d.id, d.name, cs.relationship_type;

-- View to get complete coachee information with programme and client
CREATE OR REPLACE VIEW coachee_details AS
SELECT 
    co.id as coachee_id,
    co.full_name as coachee_name,
    co.email as coachee_email,
    p.id as programme_id,
    p.name as programme_name,
    cl.id as client_id,
    cl.name as client_name,
    co.created_at
FROM coachees co
JOIN programmes p ON co.programme_id = p.id
JOIN clients cl ON p.client_id = cl.id;

-- View to get nomination details
CREATE OR REPLACE VIEW nomination_details AS
SELECT 
    nom.id as nomination_id,
    co.id as coachee_id,
    co.full_name as coachee_name,
    co.email as coachee_email,
    n.id as nominee_id,
    n.full_name as nominee_name,
    n.email as nominee_email,
    nom.relationship_type,
    nom.created_at
FROM nominations nom
JOIN coachees co ON nom.coachee_id = co.id
JOIN nominees n ON nom.nominee_id = n.id;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE clients IS 'Corporate clients who purchase coaching programs';
COMMENT ON TABLE programmes IS 'Instances of coaching programmes sold to clients';
COMMENT ON TABLE coachees IS 'Individual leaders participating in programmes';
COMMENT ON TABLE nominees IS 'Colleagues nominated to provide 360-degree feedback';
COMMENT ON TABLE nominations IS 'Junction table linking coachees to their feedback providers';
COMMENT ON TABLE dimensions IS 'Highest-level grouping for competencies (e.g., Think, Relate, Act)';
COMMENT ON TABLE competencies IS 'Core leadership skills grouped by dimensions';
COMMENT ON TABLE assessment_templates IS 'Master survey configurations (SurveyJS JSON format)';
COMMENT ON TABLE questions IS 'Maps question keys to competencies with scoring rules';
COMMENT ON TABLE assessment_responses IS 'Raw survey submissions from coachees and nominees';
COMMENT ON TABLE calculated_scores IS 'Processed numerical scores at competency level';

-- ============================================================================
-- SAMPLE QUERIES FOR REFERENCE
-- ============================================================================

-- Get all scores for a specific coachee
-- SELECT * FROM calculated_scores WHERE coachee_id = 'c3333333-3333-3333-3333-333333333333';

-- Get dimension-level scores for a coachee
-- SELECT * FROM dimension_scores WHERE coachee_id = 'c3333333-3333-3333-3333-333333333333';

-- Get all nominations for a coachee
-- SELECT * FROM nomination_details WHERE coachee_id = 'c3333333-3333-3333-3333-333333333333';

-- Get all responses for a coachee
-- SELECT * FROM assessment_responses WHERE coachee_id = 'c3333333-3333-3333-3333-333333333333';

-- Get competencies grouped by dimension
-- SELECT d.name as dimension, c.name as competency 
-- FROM competencies c 
-- JOIN dimensions d ON c.dimension_id = d.id 
-- ORDER BY d.display_order, c.display_order;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

