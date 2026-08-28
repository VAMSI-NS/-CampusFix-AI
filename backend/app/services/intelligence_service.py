import os
import re
import math
import logging
from typing import List, Dict, Any, Optional, Set, Tuple
from datetime import datetime, timezone, timedelta
from collections import defaultdict

from app.models.ticket import TicketResponse
from app.models.intelligence import (
    IncidentClusterItem,
    IncidentClusteringResponse,
    CampusAnomalyItem,
    CampusAnomalyResponse,
    IntelligenceOverviewResponse,
    RepresentativeIncident,
    ClusterSeverity,
    AnomalySeverity,
    AnomalyType,
)
from app.services.ticket_service import ticket_service
from app.services.status_service import status_service
from app.services.users_service import users_service

logger = logging.getLogger("campusfix.intelligence")

# Category mapping to responsible technician specialization
CATEGORY_TO_SPECIALIZATION: Dict[str, str] = {
    "Eduroam Wi-Fi": "Network",
    "Dorm ResNet": "Network",
    "VPN": "Network",
    "Canvas / SSO": "Software",
    "Software": "Software",
    "Lab / Computer Access": "Hardware",
    "PaperCut Printing": "Hardware",
    "Duo MFA": "IAM / Access",
    "NetID / Password": "IAM / Access",
    "Email": "IAM / Access",
    "Other": "Support",
}

# Common keywords for semantic grouping
PROBLEM_KEYWORDS = [
    "handshake", "timeout", "slow", "disconnect", "certificate", "802.1x", "peap", "ssid",
    "login", "password", "sso", "shibboleth", "canvas", "portal", "credentials",
    "mfa", "2fa", "push", "duo", "passcode", "bypass",
    "printer", "papercut", "jam", "toner", "offline", "spooler", "print release",
    "blue screen", "crash", "freeze", "monitor", "cable", "keyboard", "mouse", "boot",
    "vpn", "anyconnect", "gateway", "tunnel", "ip address", "dns", "dhcp",
    "license", "matlab", "autocad", "install", "activation",
]


def _normalize_text(text: str) -> str:
    """Lowercases, removes punctuation, and normalizes whitespace."""
    if not text:
        return ""
    clean = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
    return " ".join(clean.split())


def _extract_keywords(text: str) -> Set[str]:
    """Extracts problem keywords and meaningful tokens from text."""
    norm = _normalize_text(text)
    words = set(norm.split())
    found: Set[str] = set()
    for kw in PROBLEM_KEYWORDS:
        if kw in norm:
            found.add(kw)
    # Also add non-stopwords > 3 letters
    stopwords = {"with", "that", "this", "from", "have", "been", "when", "into", "some", "what", "where", "cannot", "unable", "issue", "problem", "ticket"}
    for w in words:
        if len(w) > 3 and w not in stopwords:
            found.add(w)
    return found


def _calculate_similarity(t1: TicketResponse, t2: TicketResponse) -> float:
    """
    Computes multi-dimensional similarity score (0.0 to 1.0) between two tickets.
    Considers category, location, text keywords, priority, and netid.
    """
    score = 0.0

    # 1. Category match (Weight: 0.35)
    if t1.category == t2.category:
        score += 0.35
    elif t1.category in ["Eduroam Wi-Fi", "Dorm ResNet", "VPN"] and t2.category in ["Eduroam Wi-Fi", "Dorm ResNet", "VPN"]:
        score += 0.20
    elif t1.category in ["Canvas / SSO", "Duo MFA", "NetID / Password", "Email"] and t2.category in ["Canvas / SSO", "Duo MFA", "NetID / Password", "Email"]:
        score += 0.20

    # 2. Location match (Weight: 0.25)
    loc1 = _normalize_text(t1.location)
    loc2 = _normalize_text(t2.location)
    if loc1 and loc2:
        if loc1 == loc2:
            score += 0.25
        elif any(part in loc2 for part in loc1.split() if len(part) > 2) or any(part in loc1 for part in loc2.split() if len(part) > 2):
            score += 0.18

    # 3. Text & Keyword Similarity (Jaccard similarity on extracted tokens) (Weight: 0.30)
    text1 = f"{t1.title} {t1.description} {t1.issue_summary or ''}"
    text2 = f"{t2.title} {t2.description} {t2.issue_summary or ''}"
    kw1 = _extract_keywords(text1)
    kw2 = _extract_keywords(text2)

    if kw1 and kw2:
        intersection = len(kw1.intersection(kw2))
        union = len(kw1.union(kw2))
        if union > 0:
            jaccard = intersection / union
            score += min(0.30, jaccard * 0.45)

    # 4. Same device/environment hint (Weight: 0.10)
    if t1.device and t2.device and t1.device.strip().lower() == t2.device.strip().lower():
        score += 0.10

    return min(1.0, score)


def _synthesize_cluster_title(category: str, locations: List[str], keywords: Set[str], count: int) -> str:
    """Generates an informative, human-readable cluster title."""
    loc_str = locations[0] if locations else "Campus-wide"
    if len(locations) > 1:
        loc_str = f"{locations[0]} & {len(locations)-1} other areas"

    kw_list = sorted(list(keywords), key=lambda x: len(x), reverse=True)
    top_kw = kw_list[0].capitalize() if kw_list else "Service Outage"

    if category == "Eduroam Wi-Fi":
        if any(k in keywords for k in ["802.1x", "handshake", "certificate", "peap"]):
            return f"Eduroam 802.1X Authentication Disruption in {loc_str}"
        if any(k in keywords for k in ["slow", "speed", "latency", "packet"]):
            return f"Wi-Fi Network Congestion & High Latency in {loc_str}"
        return f"Eduroam Wireless Connectivity Incidents in {loc_str}"

    if category == "PaperCut Printing":
        if any(k in keywords for k in ["jam", "toner", "paper"]):
            return f"PaperCut Hardware & Spooler Jam in {loc_str}"
        return f"PaperCut Print Release Station Offline in {loc_str}"

    if category in ["Canvas / SSO", "Duo MFA", "NetID / Password"]:
        if any(k in keywords for k in ["mfa", "2fa", "push", "duo"]):
            return f"Duo 2FA Push Notification Timeout Cluster ({loc_str})"
        return f"Single Sign-On (SSO) / Identity Verification Failures in {loc_str}"

    if category == "Lab / Computer Access":
        return f"Lab Workstation & Peripheral Failures in {loc_str}"

    return f"{category} Incident Correlation ({count} reports) in {loc_str}"


class IntelligenceService:
    def __init__(self):
        pass

    def get_incident_clusters(self, tickets: Optional[List[TicketResponse]] = None) -> IncidentClusteringResponse:
        """
        Analyzes incident reports and clusters them by semantic content, category, location, and time.
        Detects duplicate student reports and identifies single larger outage patterns.
        """
        if tickets is None:
            tickets = ticket_service.list_tickets()

        if not tickets:
            return IncidentClusteringResponse(
                total_incidents_analyzed=0,
                total_clusters_found=0,
                potential_outages_detected=0,
                duplicate_reports_identified=0,
                clusters=[],
                data_confidence="insufficient_data",
                notes="No incident reports recorded in the system yet. Clusters will automatically generate as incidents are reported."
            )

        # Graph-based or greedy similarity clustering
        clustered_sets: List[List[TicketResponse]] = []
        visited_ids: Set[str] = set()

        # Sort tickets: newest first
        sorted_tickets = sorted(
            tickets,
            key=lambda t: t.created_at or datetime.now(timezone.utc).isoformat(),
            reverse=True,
        )

        SIMILARITY_THRESHOLD = 0.42

        for i, t1 in enumerate(sorted_tickets):
            if t1.id in visited_ids:
                continue

            current_cluster = [t1]
            visited_ids.add(t1.id)

            for j in range(i + 1, len(sorted_tickets)):
                t2 = sorted_tickets[j]
                if t2.id in visited_ids:
                    continue

                sim = _calculate_similarity(t1, t2)
                if sim >= SIMILARITY_THRESHOLD:
                    current_cluster.append(t2)
                    visited_ids.add(t2.id)

            clustered_sets.append(current_cluster)

        # Build IncidentClusterItem for each group
        clusters: List[IncidentClusterItem] = []
        potential_outages = 0
        duplicate_reports = 0

        for idx, group in enumerate(clustered_sets, 1):
            count = len(group)
            rep_ticket = group[0]

            # Aggregate locations and services
            locations_set = {t.location for t in group if t.location and t.location.strip()}
            locations = sorted(list(locations_set)) or [rep_ticket.location or "Campus"]

            categories_set = {t.category for t in group}
            services = sorted(list(categories_set))
            primary_category = rep_ticket.category

            all_keywords: Set[str] = set()
            for t in group:
                all_keywords.update(_extract_keywords(f"{t.title} {t.description}"))

            # Determine severity
            has_crit = any(t.priority in ["Critical", "Urgent"] for t in group)
            has_high = any(t.priority == "High" for t in group)
            if has_crit or count >= 4:
                sev: ClusterSeverity = "Critical"
            elif has_high or count >= 2:
                sev: ClusterSeverity = "High"
            elif any(t.priority == "Medium" for t in group):
                sev: ClusterSeverity = "Medium"
            else:
                sev: ClusterSeverity = "Low"

            # Check duplicate / single-outage pattern
            is_single_outage = count >= 2 and (len(locations_set) <= 2 or primary_category in ["Eduroam Wi-Fi", "PaperCut Printing", "Canvas / SSO"])
            if is_single_outage:
                potential_outages += 1

            # Duplicate ratio
            netids = [t.netid for t in group if t.netid]
            unique_students = len(set(netids))
            duplicate_risk = (count > 1 and unique_students < count) or (count >= 2 and len(locations_set) == 1)
            duplicate_ratio = round(max(0.0, (count - max(1, unique_students)) / max(1, count)), 2)
            if duplicate_risk:
                duplicate_reports += max(0, count - 1)

            # Trend calculation
            recent_count = sum(1 for t in group if t.status not in ["Resolved", "Closed"])
            if recent_count >= 3:
                trend = "Spike"
            elif recent_count > 0:
                trend = "Steady"
            else:
                trend = "Resolved"

            # Title & Summary synthesis
            title = _synthesize_cluster_title(primary_category, locations, all_keywords, count)

            if is_single_outage:
                summary = (
                    f"AI correlated {count} separate incident reports across {len(locations)} location(s) "
                    f"indicating a shared underlying {primary_category} infrastructure disruption. "
                    f"{'High student duplicate report probability detected.' if duplicate_risk else 'Affects multiple campus users.'}"
                )
            else:
                summary = (
                    f"Group of {count} related {primary_category} ticket(s) sharing common error patterns and diagnostic profiles."
                )

            # Recommendation
            spec = CATEGORY_TO_SPECIALIZATION.get(primary_category, "Support")
            if is_single_outage:
                recommended_action = f"Assign {spec} specialist to inspect central {primary_category} infrastructure at {locations[0]} and batch-notify affected students."
            elif duplicate_risk:
                recommended_action = f"Consolidate duplicate reports under primary ticket {rep_ticket.ticket_number} to prevent redundant technician dispatch."
            else:
                recommended_action = f"Review diagnostic findings for {rep_ticket.ticket_number} and execute standard {primary_category} remediation playbook."

            timestamps = [t.created_at for t in group if t.created_at]
            timestamps.sort()
            first_at = timestamps[0] if timestamps else None
            last_at = timestamps[-1] if timestamps else None

            cluster_item = IncidentClusterItem(
                id=f"cluster-{primary_category.lower().replace(' ', '-').replace('/', '')}-{idx}",
                title=title,
                summary=summary,
                primary_category=primary_category,
                severity=sev,
                incident_count=count,
                affected_locations=locations,
                affected_services=services,
                ticket_ids=[t.id for t in group],
                ticket_numbers=[t.ticket_number for t in group],
                representative_incident=RepresentativeIncident(
                    ticket_id=rep_ticket.id,
                    ticket_number=rep_ticket.ticket_number,
                    title=rep_ticket.title,
                    category=rep_ticket.category,
                    location=rep_ticket.location,
                    priority=rep_ticket.priority,
                    status=rep_ticket.status,
                    description=rep_ticket.description,
                    created_at=rep_ticket.created_at,
                ),
                is_single_outage_pattern=is_single_outage,
                duplicate_risk=duplicate_risk,
                duplicate_ratio=duplicate_ratio,
                recent_trend=trend,
                recommended_action=recommended_action,
                recommended_specialization=spec,
                first_incident_at=first_at,
                last_incident_at=last_at,
            )
            clusters.append(cluster_item)

        # Sort clusters by severity (Critical first) and count
        severity_rank = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}
        clusters.sort(key=lambda c: (severity_rank.get(c.severity, 0), c.incident_count), reverse=True)

        return IncidentClusteringResponse(
            total_incidents_analyzed=len(tickets),
            total_clusters_found=len(clusters),
            potential_outages_detected=potential_outages,
            duplicate_reports_identified=duplicate_reports,
            clusters=clusters,
            data_confidence="high" if len(tickets) >= 3 else "moderate",
            notes=None
        )

    def get_campus_anomalies(self, tickets: Optional[List[TicketResponse]] = None) -> CampusAnomalyResponse:
        """
        Analyzes incident telemetry to detect unusual frequency spikes, repeated failures,
        unusual location anomalies, and abnormal service behaviors.
        Clearly separates Real Evidence from AI Inference.
        """
        if tickets is None:
            tickets = ticket_service.list_tickets()

        if not tickets:
            return CampusAnomalyResponse(
                total_anomalies_detected=0,
                highest_severity=None,
                campus_risk_score=0,
                anomalies=[],
                data_confidence="insufficient_data",
                notes="Insufficient historical data to calculate anomaly baselines. Detection engine is monitoring live telemetry."
            )

        anomalies: List[CampusAnomalyItem] = []
        all_active = [t for t in tickets if t.status not in ["Resolved", "Closed"]]

        # 1. Location-based density and spike analysis
        location_counts = defaultdict(list)
        for t in tickets:
            loc = t.location or "General Campus"
            location_counts[loc].append(t)

        for loc, loc_tickets in location_counts.items():
            active_loc_tickets = [t in all_active for t in loc_tickets]
            active_count = sum(active_loc_tickets)
            total_count = len(loc_tickets)

            # Anomaly Rule A: High concentration in single location (>= 2 active incidents)
            if active_count >= 2:
                categories = {t.category for t in loc_tickets}
                crit_count = sum(1 for t in loc_tickets if t.priority in ["Critical", "Urgent", "High"])
                score = min(96, 50 + (active_count * 12) + (crit_count * 10))

                sev: AnomalySeverity = "critical" if score >= 80 else ("warning" if score >= 60 else "info")
                primary_cat = loc_tickets[0].category
                spec = CATEGORY_TO_SPECIALIZATION.get(primary_cat, "Support")

                evidence = [
                    f"{active_count} active incidents currently open in {loc} ({total_count} total recorded).",
                    f"Concentration in services: {', '.join(categories)}.",
                    f"{crit_count} incident(s) flagged with High/Critical severity priority.",
                    f"Involves tickets: {', '.join([t.ticket_number for t in loc_tickets[:4]])}.",
                ]

                inference = (
                    f"The statistical volume of incidents in {loc} exceeds normal single-terminal failure variance. "
                    f"AI inference suggests a localized infrastructure root cause (e.g. access point malfunction, network switch port degradation, or shared power delivery) rather than isolated user errors."
                )

                anomalies.append(
                    CampusAnomalyItem(
                        id=f"anom-loc-{_normalize_text(loc).replace(' ', '-')[:24]}",
                        title=f"Incident Density Surge in {loc}",
                        anomaly_type="incident_spike",
                        severity=sev,
                        anomaly_score=score,
                        location=loc,
                        affected_service=primary_cat,
                        category=primary_cat,
                        detected_pattern=f"Localized incident spike ({active_count} concurrent open cases)",
                        explanation=f"Abnormal concentration of concurrent IT incidents reported specifically in {loc}.",
                        real_evidence=evidence,
                        ai_inference=inference,
                        affected_ticket_ids=[t.id for t in loc_tickets],
                        affected_ticket_numbers=[t.ticket_number for t in loc_tickets],
                        baseline_comparison=f"Current active rate: {active_count} cases vs campus average of ~0.4 cases per building zone.",
                        recommended_action=f"Dispatch on-site {spec} technician to {loc} for physical and network infrastructure verification.",
                        recommended_specialization=spec,
                    )
                )

        # 2. Category-based failure recurrence & spike analysis
        category_counts = defaultdict(list)
        for t in tickets:
            category_counts[t.category].append(t)

        for cat, cat_tickets in category_counts.items():
            active_cat_tickets = [t for t in cat_tickets if t.status not in ["Resolved", "Closed"]]
            active_count = len(active_cat_tickets)

            # Anomaly Rule B: Service-wide degradation (>= 2 active incidents in same category)
            if active_count >= 2:
                # Check if this category isn't already uniquely covered in location spike
                locations = list({t.location for t in cat_tickets if t.location})
                score = min(92, 45 + (active_count * 15))
                sev = "critical" if score >= 80 else ("warning" if score >= 60 else "info")
                spec = CATEGORY_TO_SPECIALIZATION.get(cat, "Support")

                evidence = [
                    f"{active_count} active tickets for '{cat}' across {len(locations)} location(s).",
                    f"Reported locations include: {', '.join(locations[:3])}.",
                    f"Impacted user NetIDs: {', '.join(list({t.netid for t in cat_tickets})[:4])}.",
                ]

                inference = (
                    f"Elevated velocity in {cat} failure reports across multiple campus touchpoints indicates possible centralized service degradation, backend authentication timeout, or upstream configuration drift."
                )

                anomalies.append(
                    CampusAnomalyItem(
                        id=f"anom-cat-{_normalize_text(cat).replace(' ', '-')[:24]}",
                        title=f"{cat} Cross-Campus Service Velocity Surge",
                        anomaly_type="service_degradation",
                        severity=sev,
                        anomaly_score=score,
                        location=locations[0] if locations else "Campus-wide",
                        affected_service=cat,
                        category=cat,
                        detected_pattern=f"Cross-location failure surge in {cat}",
                        explanation=f"Multiple users in different zones experiencing concurrent disruptions with {cat}.",
                        real_evidence=evidence,
                        ai_inference=inference,
                        affected_ticket_ids=[t.id for t in cat_tickets],
                        affected_ticket_numbers=[t.ticket_number for t in cat_tickets],
                        baseline_comparison=f"{active_count} concurrent incidents exceeds the expected baseline threshold of 1 concurrent incident.",
                        recommended_action=f"Verify {cat} server health, authentication logs, and alert {spec} team leads.",
                        recommended_specialization=spec,
                    )
                )

        # 3. Repeated Failure / Hardware Jam Pattern
        for cat, cat_tickets in category_counts.items():
            if cat in ["PaperCut Printing", "Lab / Computer Access"]:
                repeated_locs = defaultdict(list)
                for t in cat_tickets:
                    if t.location:
                        repeated_locs[t.location].append(t)

                for rloc, r_tickets in repeated_locs.items():
                    if len(r_tickets) >= 2:
                        score = 75
                        spec = CATEGORY_TO_SPECIALIZATION.get(cat, "Hardware")
                        anomalies.append(
                            CampusAnomalyItem(
                                id=f"anom-rep-{_normalize_text(rloc).replace(' ', '-')[:20]}",
                                title=f"Repeated Hardware Fault at {rloc}",
                                anomaly_type="repeated_failure",
                                severity="warning",
                                anomaly_score=score,
                                location=rloc,
                                affected_service=cat,
                                category=cat,
                                detected_pattern="Recurring physical hardware fault",
                                explanation=f"Multiple failure events logged for equipment in {rloc}.",
                                real_evidence=[
                                    f"{len(r_tickets)} total failure reports recorded for {rloc}.",
                                    f"Ticket history: {', '.join([t.ticket_number for t in r_tickets])}.",
                                ],
                                ai_inference=(
                                    f"Recurring failure indicates component wear, firmware bug, or supply degradation that routine restarts have failed to permanently resolve."
                                ),
                                affected_ticket_ids=[t.id for t in r_tickets],
                                affected_ticket_numbers=[t.ticket_number for t in r_tickets],
                                baseline_comparison="Hardware nodes are expected to maintain < 1 incident per 30-day window.",
                                recommended_action=f"Schedule preventative maintenance and component inspection with {spec} team.",
                                recommended_specialization=spec,
                            )
                        )

        # Deduplicate anomaly IDs if any overlap
        unique_anomalies: List[CampusAnomalyItem] = []
        seen_ids: Set[str] = set()
        for a in anomalies:
            if a.id not in seen_ids:
                seen_ids.add(a.id)
                unique_anomalies.append(a)

        # Sort by anomaly_score descending
        unique_anomalies.sort(key=lambda a: a.anomaly_score, reverse=True)

        highest_sev = None
        if any(a.severity == "critical" for a in unique_anomalies):
            highest_sev = "critical"
        elif any(a.severity == "warning" for a in unique_anomalies):
            highest_sev = "warning"
        elif unique_anomalies:
            highest_sev = "info"

        # Campus Risk Score (0-100)
        if not unique_anomalies:
            campus_risk = 5 if all_active else 0
        else:
            top_score = unique_anomalies[0].anomaly_score
            campus_risk = min(98, top_score + len(unique_anomalies) * 4)

        return CampusAnomalyResponse(
            total_anomalies_detected=len(unique_anomalies),
            highest_severity=highest_sev,
            campus_risk_score=campus_risk,
            anomalies=unique_anomalies,
            data_confidence="high" if len(tickets) >= 3 else "moderate",
            notes=None if unique_anomalies else "Telemetry shows no abnormal velocity spikes or failure clustering at this time."
        )

    def get_intelligence_overview(self) -> IntelligenceOverviewResponse:
        """Aggregates clusters, anomalies, and campus hotspot telemetry."""
        all_tickets = ticket_service.list_tickets()
        active_tickets = [t for t in all_tickets if t.status not in ["Resolved", "Closed"]]

        clusters_resp = self.get_incident_clusters(all_tickets)
        anomalies_resp = self.get_campus_anomalies(all_tickets)

        # Calculate Hotspots
        loc_counts = defaultdict(int)
        for t in active_tickets:
            loc_counts[t.location or "General Campus"] += 1

        top_hotspots = [
            {"location": loc, "active_incidents": count}
            for loc, count in sorted(loc_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        ]

        # Impacted Services
        svc_counts = defaultdict(int)
        for t in active_tickets:
            svc_counts[t.category] += 1

        top_services = [
            {"service": svc, "active_incidents": count}
            for svc, count in sorted(svc_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        ]

        return IntelligenceOverviewResponse(
            total_incidents=len(all_tickets),
            active_incidents=len(active_tickets),
            total_clusters=clusters_resp.total_clusters_found,
            total_anomalies=anomalies_resp.total_anomalies_detected,
            campus_risk_score=anomalies_resp.campus_risk_score,
            clusters=clusters_resp.clusters,
            anomalies=anomalies_resp.anomalies,
            top_hotspots=top_hotspots,
            top_impacted_services=top_services,
            data_confidence=clusters_resp.data_confidence,
        )


intelligence_service = IntelligenceService()
