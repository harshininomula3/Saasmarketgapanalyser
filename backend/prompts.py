# ============================================
# [NEW] PROMPT: Generate domain-specific pain points
# ============================================

DOMAIN_PAIN_POINTS_PROMPT = """
You are a market research analyst specializing in B2B SaaS pain point synthesis.

Based on the product domain and target market described below, generate a realistic set of
customer survey pain points that buyers and users in this space consistently report.

These pain points should reflect the kind of data that would appear in:
- G2 / Capterra user reviews
- Gartner survey reports
- Customer discovery interviews
- NPS verbatim comments

DOMAIN CONTEXT:
- Product Domain: {domain}
- Product Category: {product_category}
- Target Market: {target_market}
- Company Description: {company_description}

INSTRUCTIONS:
- Generate exactly {count} distinct, realistic pain points
- Each pain point should be grounded in real patterns for this domain
- Frequency should realistically reflect survey mention counts (range: 30–500)
- Severity should be 0–10 float (most real pains are 5.5–9.5)
- Personas should be realistic job titles for the target market
- Keywords should be search/tagging terms relevant to the pain

OUTPUT FORMAT (JSON ARRAY ONLY, NO MARKDOWN, NO PREAMBLE):
[
  {{
    "theme": "Short, marketable pain point label (max 60 chars)",
    "description": "2-3 sentence description of the specific pain, grounded in real workflow issues",
    "frequency": 200,
    "severity_score": 8.2,
    "affected_personas": ["CFO", "Finance Manager", "Accountant"],
    "related_keywords": ["keyword1", "keyword2", "keyword3"],
    "source": "ai_generated"
  }}
]

CRITICAL: Return ONLY the JSON array. No explanatory text before or after.
"""

# ============================================
# EXISTING PROMPTS (unchanged from v1)
# ============================================

PAIN_TO_GAP_ANALYSIS_PROMPT = """
You are a market gap analyst. Given a customer pain point and a list of competitor features, determine:

1. **Gap Identification**: What specific needs are NOT addressed by current competitors?
2. **Coverage Analysis**: What percentage of the pain point is covered by existing solutions (0-100)?
3. **Gap Classification**: Is this a 'Complete gap' (0% coverage), 'Partial gap' (1-60% coverage), or 'Competitive gap' (61%+ coverage)?

INPUT:
Pain Point Theme: {pain_theme}
Pain Point Description: {pain_description}
Pain Point Severity: {severity}/10
Affected Personas: {personas}

Current Competitor Solutions:
{competitor_features}

OUTPUT FORMAT (JSON ONLY, NO MARKDOWN):
{{
    "gap_identified": true/false,
    "gap_name": "Clear, marketable name of the gap",
    "gap_description": "2-3 sentence description of unmet need",
    "gap_type": "Complete gap|Partial gap|Competitive gap",
    "coverage_percentage": 0-100,
    "unmet_needs": ["need1", "need2", "need3"],
    "differentiation_opportunity": "How could a new product differentiate?",
    "confidence_score": 0-1
}}

Be PRECISE. If no gap exists, set "gap_identified" to false.
"""

OPPORTUNITY_SCORING_PROMPT = """
You are a venture capital analyst. Score this market opportunity on the following dimensions.

GAP DETAILS:
Name: {gap_name}
Description: {gap_description}
Pain Point Frequency: {frequency} mentions
Market Personas: {personas}

COMPETITIVE CONTEXT:
Number of direct competitors addressing this: {competitors_count}
Threat level: {threat_level}

MARKET CONTEXT:
Industry market size: {industry_tam}
Growth rate: {growth_rate}%/year

TECHNICAL REQUIREMENTS:
Complexity level: {complexity}
Regulatory risk: {regulatory_risk}

Provide the following scores (0-100 scale):

1. **Market Potential** (0-100):
   - Frequency of pain point mentions (0-40 points)
   - Number of addressable personas (0-20 points)
   - Competitive intensity (inverse, 0-40 points)

2. **Execution Ease** (0-100):
   - Technical feasibility (higher is easier)
   - Regulatory burden (inverse)
   - Go-to-market complexity (inverse)

3. **Defensibility** (0-100):
   - Data moat potential
   - Patent-ability
   - Customer switching costs

4. **Timing** (0-100):
   - Market growth trend
   - Competitor momentum (inverse)
   - Regulatory tailwinds

OUTPUT FORMAT (JSON ONLY):
{{
    "market_potential_score": 0-100,
    "execution_ease_score": 0-100,
    "defensibility_score": 0-100,
    "timing_score": 0-100,
    "reasoning": "Brief explanation of scoring",
    "key_risks": ["risk1", "risk2"],
    "key_opportunities": ["opp1", "opp2"]
}}
"""

def format_domain_prompt(domain_config) -> str:
    """Format domain configuration into pain point generation prompt"""
    return DOMAIN_PAIN_POINTS_PROMPT.format(
        domain=domain_config.domain,
        product_category=domain_config.product_category,
        target_market=domain_config.target_market,
        company_description=domain_config.company_description or "Not specified",
        count=domain_config.pain_points_count
    )

def format_pain_to_gap_prompt(pain_point, competitors_features_list):
    """Format pain point + features into prompt"""
    features_text = "\n".join([
        f"- {comp['name']}: {', '.join([f['feature_name'] for f in comp['features']])}"
        for comp in competitors_features_list
    ])
    return PAIN_TO_GAP_ANALYSIS_PROMPT.format(
        pain_theme=pain_point.theme,
        pain_description=pain_point.description,
        severity=pain_point.severity_score,
        personas=", ".join(pain_point.affected_personas),
        competitor_features=features_text
    )

def format_scoring_prompt(gap, pain_point, market_context):
    """Format gap data for opportunity scoring"""
    return OPPORTUNITY_SCORING_PROMPT.format(
        gap_name=gap.name,
        gap_description=gap.description,
        frequency=gap.market_frequency,
        personas=", ".join(gap.affected_personas if hasattr(gap, 'affected_personas') else []),
        competitors_count=market_context.get('competitors_count', 0),
        threat_level=market_context.get('threat_level', 'Medium'),
        industry_tam=market_context.get('industry_tam', '$50B'),
        growth_rate=market_context.get('growth_rate', 12),
        complexity=market_context.get('complexity', 'medium'),
        regulatory_risk=market_context.get('regulatory_risk', 'medium')
    )
