"""
Agent 1 (v2): Domain-Driven Pain Point Fetcher
------------------------------------------------
Instead of parsing a user-uploaded CSV, this agent calls Claude to GENERATE
a realistic set of customer survey pain points based on the user's described
product domain and target market. This eliminates the CSV upload step entirely.
"""
from groq import Groq
from typing import List
from models import PainPointCreate, DomainConfigRequest
from prompts import format_domain_prompt
import json

class DomainPainPointFetcher:
    """
    Agent 1 (v2): Accepts domain context -> calls Claude -> returns pain points list.

    No file I/O. No CSV parsing. No multipart form uploads.
    """

    def __init__(self, api_key: str = None):
        self.client = Groq(api_key=api_key)

    def fetch_pain_points(
        self,
        domain_config: DomainConfigRequest
    ) -> List[PainPointCreate]:
        """
        Call Claude to generate domain-specific survey pain points.

        Args:
            domain_config: DomainConfigRequest with domain, product_category,
                           target_market, company_description, pain_points_count

        Returns:
            List[PainPointCreate] - validated pain points ready for DB storage
        """
        prompt = format_domain_prompt(domain_config)

        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        raw_text = response.choices[0].message.content.strip()

        # Strip accidental markdown fences
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_text:
            raw_text = raw_text.split("```")[1].split("```")[0].strip()

        try:
            raw_list = json.loads(raw_text)
        except json.JSONDecodeError as e:
            raise ValueError(f"Groq returned invalid JSON for pain points: {e}\nRaw: {raw_text[:300]}")

        if not isinstance(raw_list, list):
            raise ValueError("Groq response was not a JSON array of pain points")

        pain_points = []
        for item in raw_list:
            try:
                pp = PainPointCreate(
                    theme=str(item.get("theme", "")).strip(),
                    description=str(item.get("description", "")).strip(),
                    frequency=int(item.get("frequency", 1)),
                    severity_score=float(item.get("severity_score", 5.0)),
                    affected_personas=[
                        p.strip() for p in item.get("affected_personas", ["User"])
                        if p.strip()
                    ],
                    related_keywords=[
                        k.strip() for k in item.get("related_keywords", ["general"])
                        if k.strip()
                    ],
                    source="ai_generated",
                    session_id=domain_config.__dict__.get("_session_id")
                )
                pain_points.append(pp)
            except Exception as e:
                print(f"Warning: Skipping malformed pain point item: {e}")
                continue

        if not pain_points:
            raise ValueError("Groq returned no valid pain points for the given domain")

        return pain_points

    @staticmethod
    def deduplicate(pain_points: List[PainPointCreate]) -> List[PainPointCreate]:
        """Remove duplicate themes (keep highest severity)"""
        seen = {}
        for pp in pain_points:
            key = pp.theme.lower()
            if key not in seen or pp.severity_score > seen[key].severity_score:
                seen[key] = pp
        return list(seen.values())

    @staticmethod
    def validate_pain_point(pain_point: PainPointCreate) -> bool:
        """Validate pain point data quality"""
        if not pain_point.theme or len(pain_point.theme.strip()) == 0:
            return False
        if not pain_point.description or len(pain_point.description.strip()) < 10:
            return False
        if pain_point.frequency <= 0:
            return False
        if pain_point.severity_score < 0 or pain_point.severity_score > 10:
            return False
        if not pain_point.affected_personas or len(pain_point.affected_personas) == 0:
            return False
        return True
