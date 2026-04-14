"""EU AI Act risk classification engine."""
from __future__ import annotations
import yaml
from pathlib import Path
from typing import Tuple

_RULES: dict | None = None


def _load_rules() -> dict:
    global _RULES
    if _RULES is None:
        rules_file = Path(__file__).parent.parent / "rules" / "eu_ai_act.yml"
        with open(rules_file) as f:
            _RULES = yaml.safe_load(f)
    return _RULES


# Survey questions used in the wizard
SURVEY_QUESTIONS = [
    {
        "id": "q_purpose",
        "text": "Describe the primary purpose of this AI system.",
        "type": "textarea",
    },
    {
        "id": "q_sector",
        "text": "In which sector is this AI system deployed?",
        "type": "select",
        "options": [
            "Healthcare",
            "Finance & Banking",
            "Employment & HR",
            "Education",
            "Critical Infrastructure",
            "Law Enforcement",
            "Migration & Border Control",
            "Justice & Democracy",
            "Other",
        ],
    },
    {
        "id": "q_biometric",
        "text": "Does the system use biometric identification (face, fingerprint, iris)?",
        "type": "yesno",
    },
    {
        "id": "q_social_scoring",
        "text": "Does the system evaluate or score individuals based on social behaviour?",
        "type": "yesno",
    },
    {
        "id": "q_emotion",
        "text": "Does the system detect, infer, or analyse emotions of individuals?",
        "type": "yesno",
    },
    {
        "id": "q_deepfake",
        "text": "Does the system generate synthetic media (deepfakes, AI-generated images/video)?",
        "type": "yesno",
    },
    {
        "id": "q_employment",
        "text": "Is the system used in recruitment, hiring, or employment evaluation?",
        "type": "yesno",
    },
    {
        "id": "q_credit",
        "text": "Does the system perform credit scoring, loan approval, or financial eligibility assessment?",
        "type": "yesno",
    },
    {
        "id": "q_critical_infra",
        "text": "Is the system used to manage or operate critical infrastructure (power grids, water, transport)?",
        "type": "yesno",
    },
    {
        "id": "q_law_enforcement",
        "text": "Is the system used by law enforcement, judiciary, or border control?",
        "type": "yesno",
    },
    {
        "id": "q_human_oversight",
        "text": "Does the system have meaningful human oversight before consequential decisions?",
        "type": "yesno",
    },
]


def classify_risk(answers: dict) -> Tuple[str, str]:
    """
    Returns (risk_level, rationale) based on survey answers.
    Risk levels: prohibited > high > limited > minimal
    """
    rules = _load_rules()
    reasons: list[str] = []

    # ── Prohibited check ──────────────────────────────────────────────────
    if answers.get("q_social_scoring") == "yes":
        return (
            "prohibited",
            "The system performs social scoring of individuals, which is prohibited under Article 5 of the EU AI Act.",
        )

    purpose_text = (answers.get("q_purpose") or "").lower()
    for term in rules.get("prohibited", []):
        if term.lower() in purpose_text:
            return (
                "prohibited",
                f"The system description contains '{term}', which falls under prohibited AI practices (Article 5).",
            )

    # ── High-risk check ───────────────────────────────────────────────────
    high_risk_flags: list[str] = []

    if answers.get("q_biometric") == "yes":
        high_risk_flags.append("biometric identification (Annex III, point 1)")

    if answers.get("q_employment") == "yes":
        high_risk_flags.append("employment and HR decisions (Annex III, point 4)")

    if answers.get("q_credit") == "yes":
        high_risk_flags.append("creditworthiness / financial eligibility (Annex III, point 5)")

    if answers.get("q_critical_infra") == "yes":
        high_risk_flags.append("critical infrastructure management (Annex III, point 2)")

    if answers.get("q_law_enforcement") == "yes":
        high_risk_flags.append("law enforcement / border control (Annex III, points 6–7)")

    # Keyword scan on purpose
    for rule_group in rules.get("high_risk", []):
        for kw in rule_group.get("keywords", []):
            if kw.lower() in purpose_text:
                high_risk_flags.append(f"keyword match: '{kw}' (Annex III)")
                break

    if high_risk_flags:
        rationale = (
            "This system is classified as HIGH RISK under the EU AI Act (Article 6 and Annex III) "
            "due to: " + "; ".join(high_risk_flags) + ". "
            "Mandatory requirements include conformity assessment, technical documentation, "
            "transparency, human oversight, and registration in the EU database."
        )
        return ("high", rationale)

    # ── Limited-risk check ────────────────────────────────────────────────
    limited_flags: list[str] = []

    if answers.get("q_emotion") == "yes":
        limited_flags.append("emotion recognition system")

    if answers.get("q_deepfake") == "yes":
        limited_flags.append("synthetic media / deepfake generation")

    for rule_group in rules.get("limited", []):
        for kw in rule_group.get("keywords", []):
            if kw.lower() in purpose_text:
                limited_flags.append(f"keyword match: '{kw}'")
                break

    if limited_flags:
        rationale = (
            "This system is classified as LIMITED RISK under the EU AI Act (Article 50) "
            "due to: " + "; ".join(limited_flags) + ". "
            "Transparency obligations apply: users must be informed they are interacting with an AI."
        )
        return ("limited", rationale)

    # ── Minimal risk (default) ────────────────────────────────────────────
    return (
        "minimal",
        "This system does not fall into prohibited, high-risk, or limited-risk categories. "
        "It is classified as MINIMAL RISK. No mandatory obligations apply, but voluntary "
        "adherence to the AI Act Code of Practice is recommended.",
    )
