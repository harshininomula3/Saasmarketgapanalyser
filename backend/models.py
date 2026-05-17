from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

# ============================================
# [NEW] Domain Configuration Models
# ============================================

class DomainConfigRequest(BaseModel):
    """User submits this form instead of uploading a CSV"""
    domain: str = Field(..., min_length=3, max_length=200,
                        description="e.g. 'Expense Management SaaS', 'HR Tech', 'Legal Tech'")
    product_category: str = Field(..., min_length=3, max_length=200,
                                  description="e.g. 'B2B expense tracking for mid-market'")
    target_market: str = Field(..., min_length=3, max_length=300,
                               description="e.g. 'Finance teams at 100-2000 employee companies in North America'")
    company_description: Optional[str] = Field(None, max_length=500,
                                               description="Optional: brief description of your product/company")
    industry_tam_billions: float = Field(default=50, ge=1, le=10000)
    market_growth_rate: float = Field(default=12, ge=0, le=100)
    pain_points_count: int = Field(default=8, ge=3, le=20,
                                   description="How many pain points to generate (3-20)")
    _session_id: Optional[str] = None

class DomainConfigResponse(BaseModel):
    session_id: str
    domain: str
    product_category: str
    status: str
    message: str

# ============================================
# Pain Point Models (source changed to ai_generated)
# ============================================

class PainPointCreate(BaseModel):
    theme: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    frequency: int = Field(..., gt=0)
    severity_score: float = Field(..., ge=0, le=10)
    affected_personas: List[str]
    related_keywords: List[str]
    source: str = Field(default='ai_generated')
    session_id: Optional[str] = None

    @validator('theme')
    def theme_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Theme cannot be empty')
        return v

class PainPointResponse(PainPointCreate):
    id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ============================================
# Competitor / Feature / Gap / Opportunity models (unchanged from v1)
# ============================================

class CompetitorFeatureCreate(BaseModel):
    competitor_id: str
    feature_name: str = Field(..., min_length=1)
    category: str
    description: str = Field(..., min_length=10)
    tier: str = 'Standard'
    confidence: float = Field(default=1.0, ge=0, le=1)

class CompetitorFeatureResponse(CompetitorFeatureCreate):
    id: str

    class Config:
        from_attributes = True

class GapCreate(BaseModel):
    name: str
    description: str
    gap_type: str  # 'Complete gap' | 'Partial gap' | 'Competitive gap'
    severity_score: float = Field(..., ge=0, le=10)
    coverage_percentage: float = Field(..., ge=0, le=100)
    market_frequency: int
    related_pain_point_id: str

class GapResponse(GapCreate):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class OpportunityScoringInput(BaseModel):
    pain_frequency: int
    personas_count: int
    competitors_addressing: int
    total_competitors_in_market: int
    technical_complexity: str  # 'low' | 'medium' | 'high'
    regulatory_risk: str       # 'none' | 'low' | 'medium' | 'high'
    market_growth_trend: float # 0-100

class OpportunityResponse(BaseModel):
    id: str
    gap_id: str
    name: str
    overall_score: float
    market_potential_score: float
    execution_ease_score: float
    defensibility_score: float
    timing_score: float
    tam_estimate: str
    addressable_companies: Optional[int]
    target_personas: List[str]
    direct_competitors_count: int
    threat_level: str
    estimated_effort_months: Optional[int]
    estimated_team_size: Optional[int]
    estimated_cost_usd: Optional[int]
    year3_arr_estimate: str
    risk_summary: str
    created_at: datetime

    class Config:
        from_attributes = True

class DashboardSummary(BaseModel):
    total_pain_points: int
    total_competitors: int
    total_gaps_identified: int
    top_opportunities: List[OpportunityResponse]
    highest_tam_estimate: str
    average_opportunity_score: float
    session_domain: Optional[str] = None
