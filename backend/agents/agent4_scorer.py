from typing import Dict, Any


class OpportunityScorer:
    """Agent 4: Score opportunities using weighted deterministic formula"""

    def __init__(self, api_key: str = None):
        pass

    def calculate_market_potential(
        self,
        pain_frequency: int,
        personas_count: int,
        competitors_addressing: int,
        total_competitors: int,
    ) -> float:
        """
        Market Potential = freq_score*0.4 + personas_score*0.2 + competitive_intensity*0.4
        """
        frequency_score = min((pain_frequency / 300) * 40, 40)
        personas_score = min(personas_count * 4, 20)

        if total_competitors > 0:
            competitive_intensity_score = (1 - (competitors_addressing / total_competitors)) * 40
        else:
            competitive_intensity_score = 40

        market_potential = (
            frequency_score * 0.4 +
            personas_score * 0.2 +
            competitive_intensity_score * 0.4
        )
        return round(min(market_potential, 100), 2)

    def calculate_execution_ease(
        self,
        technical_complexity: str,
        regulatory_risk: str,
        operational_complexity: str = 'medium'
    ) -> float:
        """
        Execution Ease = 100 - weighted complexity penalties
        """
        complexity_map = {'low': 20, 'medium': 50, 'high': 80, 'none': 5}
        tech_score = complexity_map.get(technical_complexity.lower(), 50)
        reg_score = complexity_map.get(regulatory_risk.lower(), 30)
        ops_score = complexity_map.get(operational_complexity.lower(), 40)

        execution_ease = 100 - (tech_score * 0.4 + reg_score * 0.4 + ops_score * 0.2)
        return round(max(0, min(execution_ease, 100)), 2)

    def calculate_defensibility(
        self,
        patentable: bool = False,
        data_moat_potential: float = 0.5,
        switching_costs: str = 'medium'
    ) -> float:
        """
        Defensibility = patent_score + data_moat + switching_costs
        """
        patent_score = 30 if patentable else 10
        data_score = data_moat_potential * 30
        switching_map = {'low': 10, 'medium': 25, 'high': 40}
        switching_score = switching_map.get(switching_costs.lower(), 25)

        return round(min(patent_score + data_score + switching_score, 100), 2)

    def calculate_timing(
        self,
        market_growth_rate: float,
        competitor_momentum: float = 0.5,
        regulatory_tailwind: bool = False
    ) -> float:
        """
        Timing = growth_trend + competitor_momentum_inverse + regulatory_tailwind
        """
        growth_score = min(market_growth_rate * 2, 50)
        momentum_score = (1 - competitor_momentum) * 30
        regulatory_score = 20 if regulatory_tailwind else 0

        return round(min(growth_score + momentum_score + regulatory_score, 100), 2)

    def calculate_overall_score(
        self,
        market_potential: float,
        execution_ease: float,
        defensibility: float,
        timing: float
    ) -> float:
        """
        Overall = market*0.4 + execution*0.3 + defensibility*0.2 + timing*0.1
        """
        overall = (
            market_potential * 0.4 +
            execution_ease * 0.3 +
            defensibility * 0.2 +
            timing * 0.1
        )
        return round(min(overall, 100), 2)

    def estimate_implementation_effort(self, technical_complexity: str) -> Dict[str, int]:
        effort_map = {
            'low': {'months': 2, 'team_size': 2, 'cost_usd': 50000},
            'medium': {'months': 4, 'team_size': 4, 'cost_usd': 150000},
            'high': {'months': 8, 'team_size': 6, 'cost_usd': 300000},
        }
        return effort_map.get(technical_complexity.lower(), effort_map['medium'])

    def estimate_tam(self, market_frequency: int, industry_market_billions: float = 50) -> str:
        if market_frequency >= 300:
            tam_pct = 0.25
        elif market_frequency >= 100:
            tam_pct = 0.10
        else:
            tam_pct = 0.03

        tam_b = industry_market_billions * tam_pct
        if tam_b >= 1:
            return f"${tam_b:.1f}B"
        return f"${tam_b * 1000:.0f}M"

    def _estimate_year3_arr(self, tam_str: str) -> str:
        try:
            if 'B' in tam_str:
                market = float(tam_str.replace('$', '').replace('B', '')) * 1_000_000_000
            else:
                market = float(tam_str.replace('$', '').replace('M', '')) * 1_000_000
        except Exception:
            return "$5M"

        arr = market * 0.05
        if arr >= 1_000_000_000:
            return f"${arr / 1_000_000_000:.1f}B"
        elif arr >= 1_000_000:
            return f"${arr / 1_000_000:.0f}M"
        return f"${arr / 1_000:.0f}K"

    def score_opportunity(
        self,
        pain_frequency: int,
        personas_count: int,
        competitors_addressing: int,
        total_competitors: int = 5,
        technical_complexity: str = 'medium',
        regulatory_risk: str = 'low',
        market_growth_rate: float = 12,
        gap_name: str = "Market Gap",
        gap_description: str = ""
    ) -> Dict[str, Any]:
        """Main scoring function — returns all sub-scores and metadata"""
        market_potential = self.calculate_market_potential(
            pain_frequency, personas_count, competitors_addressing, total_competitors
        )
        execution_ease = self.calculate_execution_ease(technical_complexity, regulatory_risk)
        defensibility = self.calculate_defensibility()
        timing = self.calculate_timing(market_growth_rate)
        overall_score = self.calculate_overall_score(market_potential, execution_ease, defensibility, timing)

        effort = self.estimate_implementation_effort(technical_complexity)
        tam = self.estimate_tam(pain_frequency)

        if competitors_addressing == 0:
            threat_level = "Low"
        elif competitors_addressing >= 3:
            threat_level = "High"
        else:
            threat_level = "Medium"

        return {
            "overall_score": overall_score,
            "market_potential_score": market_potential,
            "execution_ease_score": execution_ease,
            "defensibility_score": defensibility,
            "timing_score": timing,
            "tam_estimate": tam,
            "direct_competitors_count": competitors_addressing,
            "threat_level": threat_level,
            "estimated_effort_months": effort['months'],
            "estimated_team_size": effort['team_size'],
            "estimated_cost_usd": effort['cost_usd'],
            "year3_arr_estimate": self._estimate_year3_arr(tam),
            "risk_summary": (
                f"Technical complexity: {technical_complexity}. "
                f"Regulatory risk: {regulatory_risk}. "
                f"Direct competitors addressing this gap: {competitors_addressing}."
            )
        }
