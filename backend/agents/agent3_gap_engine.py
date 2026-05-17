from groq import Groq
from models import GapCreate, PainPointResponse
from prompts import format_pain_to_gap_prompt
from typing import Dict, Any
import json

class GapCrossReferenceEngine:
    """Agent 3: Identify gaps using Groq semantic matching"""

    def __init__(self, api_key: str = None):
        self.client = Groq(api_key=api_key)

    def identify_gaps(
        self,
        pain_point: PainPointResponse,
        competitors_with_features: list,
        min_confidence: float = 0.6
    ) -> Dict[str, Any]:
        prompt = format_pain_to_gap_prompt(pain_point, competitors_with_features)

        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": prompt}]
        )

        raw_text = response.choices[0].message.content.strip()

        try:
            gap_analysis = json.loads(raw_text)
        except json.JSONDecodeError:
            if "```json" in raw_text:
                raw_text = raw_text.split("```json")[1].split("```")[0]
                gap_analysis = json.loads(raw_text)
            else:
                return {
                    "gap_identified": False, "gap_data": None,
                    "error": "Failed to parse Groq response",
                    "raw_response": raw_text, "confidence": 0
                }

        if gap_analysis.get("gap_identified", False):
            gap_data = GapCreate(
                name=gap_analysis.get("gap_name", "Unknown Gap"),
                description=gap_analysis.get("gap_description", ""),
                gap_type=gap_analysis.get("gap_type", "Partial gap"),
                severity_score=pain_point.severity_score,
                coverage_percentage=gap_analysis.get("coverage_percentage", 50),
                market_frequency=pain_point.frequency,
                related_pain_point_id=str(pain_point.id)
            )
            return {
                "gap_identified": True,
                "gap_data": gap_data,
                "raw_response": raw_text,
                "confidence": gap_analysis.get("confidence_score", 0.8),
                "unmet_needs": gap_analysis.get("unmet_needs", [])
            }

        return {"gap_identified": False, "gap_data": None,
                "raw_response": raw_text, "confidence": 0}
