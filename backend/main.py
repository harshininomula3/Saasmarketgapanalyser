from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
import os
import uuid
from datetime import datetime

from database import get_db, engine, SessionLocal
from models import (
    DomainConfigRequest, DomainConfigResponse,
    PainPointCreate, PainPointResponse,
    GapResponse, OpportunityResponse, DashboardSummary
)
from agents.agent1_domain_fetcher import DomainPainPointFetcher
from agents.agent3_gap_engine import GapCrossReferenceEngine
from agents.agent4_scorer import OpportunityScorer
from report_generator import generate_analysis_report
import database

# SQLAlchemy ORM imports
from sqlalchemy import Table, Column, String, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class AnalysisSessionORM(Base):
    __tablename__ = "analysis_sessions"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    domain = Column(String, nullable=False)
    product_category = Column(String, nullable=False)
    target_market = Column(String, nullable=False)
    company_description = Column(String)
    industry_tam_billions = Column(Float, default=50)
    market_growth_rate = Column(Float, default=12)
    status = Column(String, default='pending')
    created_at = Column(DateTime, default=lambda: datetime.utcnow())
    completed_at = Column(DateTime)

class PainPointORM(Base):
    __tablename__ = "pain_points"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    theme = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=False)
    frequency = Column(Integer, nullable=False)
    severity_score = Column(Float, nullable=False)
    affected_personas = Column(JSON)
    related_keywords = Column(JSON)
    source = Column(String, default='ai_generated')
    session_id = Column(String, ForeignKey("analysis_sessions.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.utcnow())

class CompetitorORM(Base):
    __tablename__ = "competitors"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, nullable=False)
    website = Column(String, nullable=False)
    description = Column(String)
    category = Column(String, default='expense_management')
    created_at = Column(DateTime, default=lambda: datetime.utcnow())

class CompetitorFeatureORM(Base):
    __tablename__ = "competitor_features"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    competitor_id = Column(String, ForeignKey("competitors.id"), nullable=False)
    feature_name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(String, nullable=False)
    tier = Column(String, default='Standard')
    confidence = Column(Float, default=1.0)

class GapORM(Base):
    __tablename__ = "gaps"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    gap_type = Column(String, nullable=False)
    severity_score = Column(Float, nullable=False)
    coverage_percentage = Column(Float, nullable=False)
    market_frequency = Column(Integer, nullable=False)
    related_pain_point_id = Column(String, ForeignKey("pain_points.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.utcnow())

class OpportunityORM(Base):
    __tablename__ = "opportunities"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    gap_id = Column(String, ForeignKey("gaps.id"), nullable=False)
    name = Column(String, nullable=False)
    overall_score = Column(Float, nullable=False)
    market_potential_score = Column(Float, nullable=False)
    execution_ease_score = Column(Float, nullable=False)
    defensibility_score = Column(Float, nullable=False)
    timing_score = Column(Float, nullable=False)
    tam_estimate = Column(String, nullable=False)
    addressable_companies = Column(Integer)
    target_personas = Column(JSON)
    direct_competitors_count = Column(Integer, default=0)
    threat_level = Column(String, nullable=False)
    estimated_effort_months = Column(Integer)
    estimated_team_size = Column(Integer)
    estimated_cost_usd = Column(Integer)
    year3_arr_estimate = Column(String)
    risk_summary = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.utcnow())

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    database.init_db()
    yield

# FastAPI app
app = FastAPI(title="SaaS Market Gap Analyzer MVP v2", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Agents
api_key = os.getenv("GROQ_API_KEY")
gap_engine = GapCrossReferenceEngine(api_key)
scorer = OpportunityScorer(api_key)
fetcher = DomainPainPointFetcher(api_key)

# ============================================
# [NEW] AGENT 1: DOMAIN CONFIGURATION + FETCH
# ============================================

@app.post("/agents/pain-points/fetch", response_model=dict)
async def fetch_pain_points_from_domain(
    config: DomainConfigRequest,
    db: Session = Depends(get_db)
):
    try:
        # Clear all previous analysis data to start fresh
        db.query(OpportunityORM).delete()
        db.query(GapORM).delete()
        db.query(PainPointORM).delete()
        db.query(AnalysisSessionORM).delete()
        db.commit()

        # Create session record
        session_orm = AnalysisSessionORM(
            id=str(uuid.uuid4()),
            domain=config.domain,
            product_category=config.product_category,
            target_market=config.target_market,
            company_description=config.company_description,
            industry_tam_billions=config.industry_tam_billions,
            market_growth_rate=config.market_growth_rate,
            status='fetching'
        )
        db.add(session_orm)
        db.flush()
        session_id = session_orm.id

        # Fetch pain points from Groq AI
        pain_points = fetcher.fetch_pain_points(config)
        pain_points = fetcher.deduplicate(pain_points)

        stored_count = 0
        for pp in pain_points:
            if fetcher.validate_pain_point(pp):
                pp_orm = PainPointORM(
                    id=str(uuid.uuid4()),
                    theme=pp.theme,
                    description=pp.description,
                    frequency=pp.frequency,
                    severity_score=pp.severity_score,
                    affected_personas=pp.affected_personas,
                    related_keywords=pp.related_keywords,
                    source=pp.source,
                    session_id=session_id
                )
                db.add(pp_orm)
                stored_count += 1

        session_orm.status = 'analyzing'
        db.commit()

        return {
            "status": "success",
            "session_id": str(session_id),
            "domain": config.domain,
            "fetched_count": len(pain_points),
            "stored_count": stored_count,
            "message": f"Generated and stored {stored_count} pain points for domain: {config.domain}"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/pain-points")
async def get_pain_points(db: Session = Depends(get_db), limit: int = 20, sort_by: str = "severity"):
    query = db.query(PainPointORM)
    if sort_by == "severity":
        query = query.order_by(PainPointORM.severity_score.desc())
    elif sort_by == "frequency":
        query = query.order_by(PainPointORM.frequency.desc())
    rows = query.limit(limit).all()
    return [{c.name: getattr(r, c.name) for c in r.__table__.columns} for r in rows]

# ============================================
# AGENT 2: COMPETITOR FEATURES (Manual, unchanged)
# ============================================

@app.get("/api/competitors", response_model=list)
async def get_competitors(db: Session = Depends(get_db)):
    competitors = db.query(CompetitorORM).all()
    result = []
    for comp in competitors:
        features = db.query(CompetitorFeatureORM).filter(
            CompetitorFeatureORM.competitor_id == comp.id
        ).all()
        result.append({
            "id": str(comp.id),
            "name": comp.name,
            "website": comp.website,
            "features": [{"id": str(f.id), "name": f.feature_name,
                          "category": f.category, "tier": f.tier} for f in features]
        })
    return result

# ============================================
# AGENT 3: GAP IDENTIFICATION (unchanged logic)
# ============================================

@app.post("/agents/gaps/identify")
async def identify_gaps(db: Session = Depends(get_db)):
    pain_points = db.query(PainPointORM).all()
    if not pain_points:
        raise HTTPException(status_code=400, detail="No pain points found. Fetch domain data first.")

    # Clear old gaps and opportunities
    db.query(OpportunityORM).delete()
    db.query(GapORM).delete()
    db.commit()

    competitors = db.query(CompetitorORM).all()
    competitors_with_features = []
    for comp in competitors:
        features = db.query(CompetitorFeatureORM).filter(
            CompetitorFeatureORM.competitor_id == comp.id
        ).all()
        competitors_with_features.append({
            "name": comp.name,
            "features": [{"feature_name": f.feature_name, "category": f.category, "tier": f.tier}
                         for f in features]
        })

    # If no competitors in DB, use generic fallback competitors
    if not competitors_with_features:
        competitors_with_features = [
            {"name": "Competitor A", "features": [{"feature_name": "Basic reporting", "category": "Core", "tier": "Standard"}, {"feature_name": "User management", "category": "Core", "tier": "Standard"}]},
            {"name": "Competitor B", "features": [{"feature_name": "API integration", "category": "Advanced", "tier": "Premium"}, {"feature_name": "Dashboard analytics", "category": "Analytics", "tier": "Standard"}]},
            {"name": "Competitor C", "features": [{"feature_name": "Mobile app", "category": "Core", "tier": "Standard"}, {"feature_name": "Notifications", "category": "Core", "tier": "Standard"}]},
        ]

    gaps_created = 0
    gaps_data = []
    for pain_point in pain_points:
        pain_point_response = PainPointResponse(
            id=pain_point.id,
            theme=pain_point.theme,
            description=pain_point.description,
            frequency=pain_point.frequency,
            severity_score=pain_point.severity_score,
            affected_personas=pain_point.affected_personas or [],
            related_keywords=pain_point.related_keywords or [],
            source=pain_point.source or 'ai_generated',
            created_at=pain_point.created_at
        )
        gap_result = gap_engine.identify_gaps(pain_point_response, competitors_with_features)
        if gap_result["gap_identified"]:
            gap_data = gap_result["gap_data"]
            gap_orm = GapORM(
                id=str(uuid.uuid4()),
                name=gap_data.name,
                description=gap_data.description,
                gap_type=gap_data.gap_type,
                severity_score=gap_data.severity_score,
                coverage_percentage=gap_data.coverage_percentage,
                market_frequency=gap_data.market_frequency,
                related_pain_point_id=pain_point.id
            )
            db.add(gap_orm)
            gaps_created += 1
            gaps_data.append({
                "gap_name": gap_data.name,
                "gap_type": gap_data.gap_type,
                "confidence": gap_result["confidence"],
                "unmet_needs": gap_result.get("unmet_needs", [])
            })

    db.commit()
    return {
        "status": "success",
        "gaps_identified": gaps_created,
        "total_pain_points_analyzed": len(pain_points),
        "gaps": gaps_data
    }

@app.get("/api/gaps")
async def get_gaps(db: Session = Depends(get_db), gap_type: str = None, limit: int = 20):
    query = db.query(GapORM)
    if gap_type:
        query = query.filter(GapORM.gap_type == gap_type)
    rows = query.order_by(GapORM.severity_score.desc()).limit(limit).all()
    return [{c.name: getattr(r, c.name) for c in r.__table__.columns} for r in rows]

# ============================================
# AGENT 4: OPPORTUNITY SCORER (unchanged logic)
# ============================================

@app.post("/agents/opportunities/score")
async def score_opportunities(db: Session = Depends(get_db)):
    gaps = db.query(GapORM).all()
    if not gaps:
        raise HTTPException(status_code=400, detail="No gaps found. Run gap identification first.")

    # Clear old opportunities
    db.query(OpportunityORM).delete()
    db.commit()

    opportunities_created = 0
    opportunities_data = []
    for gap in gaps:
        pain_point = db.query(PainPointORM).filter(
            PainPointORM.id == gap.related_pain_point_id
        ).first()
        competitors_count = db.query(CompetitorORM).count()
        if competitors_count == 0:
            competitors_count = 5
        score_result = scorer.score_opportunity(
            pain_frequency=gap.market_frequency,
            personas_count=len(pain_point.affected_personas) if pain_point and pain_point.affected_personas else 2,
            competitors_addressing=int(gap.coverage_percentage / 50),
            total_competitors=competitors_count,
            technical_complexity='medium',
            regulatory_risk='low',
            market_growth_rate=12,
            gap_name=gap.name,
            gap_description=gap.description
        )
        opportunity_orm = OpportunityORM(
            id=str(uuid.uuid4()),
            gap_id=gap.id,
            name=gap.name,
            overall_score=score_result["overall_score"],
            market_potential_score=score_result["market_potential_score"],
            execution_ease_score=score_result["execution_ease_score"],
            defensibility_score=score_result["defensibility_score"],
            timing_score=score_result["timing_score"],
            tam_estimate=score_result["tam_estimate"],
            addressable_companies=None,
            target_personas=pain_point.affected_personas if pain_point and pain_point.affected_personas else ["Unknown"],
            direct_competitors_count=score_result["direct_competitors_count"],
            threat_level=score_result["threat_level"],
            estimated_effort_months=score_result["estimated_effort_months"],
            estimated_team_size=score_result["estimated_team_size"],
            estimated_cost_usd=score_result["estimated_cost_usd"],
            year3_arr_estimate=score_result["year3_arr_estimate"],
            risk_summary=score_result["risk_summary"]
        )
        db.add(opportunity_orm)
        opportunities_created += 1
        opportunities_data.append({
            "opportunity_name": gap.name,
            "overall_score": score_result["overall_score"],
            "tam": score_result["tam_estimate"],
            "threat_level": score_result["threat_level"]
        })

    db.commit()
    return {
        "status": "success",
        "opportunities_created": opportunities_created,
        "opportunities": sorted(opportunities_data, key=lambda x: x["overall_score"], reverse=True)
    }

@app.get("/api/opportunities/ranked")
async def get_ranked_opportunities(db: Session = Depends(get_db), limit: int = 10):
    rows = db.query(OpportunityORM).order_by(
        OpportunityORM.overall_score.desc()
    ).limit(limit).all()
    return [{c.name: getattr(r, c.name) for c in r.__table__.columns} for r in rows]

@app.get("/api/opportunities/{opportunity_id}")
async def get_opportunity(opportunity_id: str, db: Session = Depends(get_db)):
    opp = db.query(OpportunityORM).filter(
        OpportunityORM.id == opportunity_id
    ).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return {c.name: getattr(opp, c.name) for c in opp.__table__.columns}

# ============================================
# DASHBOARD
# ============================================

@app.get("/api/dashboard/summary")
async def get_dashboard_summary(db: Session = Depends(get_db)):
    total_pain_points = db.query(func.count(PainPointORM.id)).scalar() or 0
    total_competitors = db.query(func.count(CompetitorORM.id)).scalar() or 0
    total_gaps = db.query(func.count(GapORM.id)).scalar() or 0
    top_opportunities = db.query(OpportunityORM).order_by(
        OpportunityORM.overall_score.desc()
    ).limit(5).all()
    avg_score = db.query(func.avg(OpportunityORM.overall_score)).scalar() or 0
    latest_session = db.query(AnalysisSessionORM).order_by(
        AnalysisSessionORM.created_at.desc()
    ).first()
    return {
        "total_pain_points": total_pain_points,
        "total_competitors": total_competitors,
        "total_gaps_identified": total_gaps,
        "top_opportunities": top_opportunities,
        "highest_tam_estimate": "TBD",
        "average_opportunity_score": float(avg_score),
        "session_domain": latest_session.domain if latest_session else None
    }

# ============================================
# [NEW] REPORT GENERATION ENDPOINT
# ============================================

@app.get("/api/reports/generate")
async def generate_report(db: Session = Depends(get_db)):
    """
    Generate and return a complete PDF analysis report as a file download.

    Returns:
        PDF binary as application/pdf with Content-Disposition: attachment
    """
    # Fetch all data
    pain_points = db.query(PainPointORM).order_by(PainPointORM.severity_score.desc()).all()
    gaps = db.query(GapORM).order_by(GapORM.severity_score.desc()).all()
    opportunities = db.query(OpportunityORM).order_by(OpportunityORM.overall_score.desc()).all()
    session = db.query(AnalysisSessionORM).order_by(AnalysisSessionORM.created_at.desc()).first()

    if not opportunities:
        raise HTTPException(status_code=400, detail="No opportunities found. Complete the full analysis first.")

    avg_score = sum(o.overall_score for o in opportunities) / len(opportunities) if opportunities else 0

    domain_config = {
        "domain": session.domain if session else "Unknown Domain",
        "product_category": session.product_category if session else "—",
        "target_market": session.target_market if session else "—",
        "company_description": session.company_description if session else "—",
        "industry_tam_billions": session.industry_tam_billions if session else 50,
        "market_growth_rate": session.market_growth_rate if session else 12,
    }

    summary = {"average_opportunity_score": avg_score}

    # Serialize ORM objects to dicts
    def orm_to_dict(obj):
        return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}

    pdf_bytes = generate_analysis_report(
        domain_config=domain_config,
        pain_points=[orm_to_dict(p) for p in pain_points],
        gaps=[orm_to_dict(g) for g in gaps],
        opportunities=[orm_to_dict(o) for o in opportunities],
        summary=summary
    )

    domain_slug = (session.domain if session else "analysis").lower().replace(" ", "_")[:30]
    filename = f"gap_analysis_{domain_slug}_{datetime.utcnow().strftime('%Y%m%d')}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

# ============================================
# HEALTH & RESET (unchanged)
# ============================================

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}

@app.post("/api/reset")
async def reset_database(db: Session = Depends(get_db)):
    db.query(OpportunityORM).delete()
    db.query(GapORM).delete()
    db.query(PainPointORM).delete()
    db.query(CompetitorFeatureORM).delete()
    db.query(CompetitorORM).delete()
    db.query(AnalysisSessionORM).delete()
    db.commit()
    return {"status": "success", "message": "Database reset"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
