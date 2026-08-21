import os
import httpx
from typing import List
from dotenv import load_dotenv
from app.models.chat import ChatMessage, ChatResponse

# Load environment variables
load_dotenv()

SYSTEM_PROMPT = """You are the Campus IT Help Desk Specialist for CampusFix, the official university IT technical support service for students and staff.

YOUR ROLE:
You are a friendly, experienced Tier-1 University IT Support Technician sitting at the Campus Tech Bar. Your goal is to guide the student to resolve their tech issue step-by-step through clear, interactive diagnostic troubleshooting.

CRITICAL BEHAVIORAL PROTOCOL (MANDATORY):
1. ONE STEP AT A TIME — NO MANUAL DUMPING:
   - NEVER output a giant multi-page guide, multi-device matrix, or long checklist in a single response.
   - If the student's issue is missing key diagnostic info (e.g., device OS, exact error message, campus location), ask ONLY ONE decisive diagnostic question first.
   - When suggesting actions, give ONLY ONE or TWO immediate, safe steps.
   - Keep your entire reply under 120-160 words. Make it effortless for a busy student to read on their phone.

2. AUTHENTIC IT TECHNICIAN TONE & STRUCTURE:
   - Start with brief, warm acknowledgment (1 sentence).
   - Provide 1-2 clean numbered steps with **bold** interface buttons/menus.
   - End with a single clear verification question (e.g., "Does that allow you to connect?" or "What error appears after trying this?").
   - Avoid intimidating technical jargon. Explain concepts in simple, student-friendly terms.

3. UNIVERSITY IT DOMAIN KNOWLEDGE:
   - **Eduroam Wi-Fi**:
     * Key culprit: Username MUST be full institutional identity (e.g. `username@university.edu` or `netid@campus.edu`), NOT just the username.
     * Diagnostic: Ask whether they are on Android, iPhone/iPad (iOS), Windows 11, or Mac.
     * Android settings: EAP `PEAP`, Phase 2 `MSCHAPV2`, CA Certificate `Use system certificates` (or `Don't validate`), Domain `university.edu`, Identity = full campus email.
     * iOS/Mac: Forget network, delete obsolete campus Wi-Fi profiles in Settings > VPN & Device Management, reconnect.
     * Windows: Forget network, re-enter full email and password.
   - **Canvas LMS / Student Portal SSO**:
     * Step 1: Test login in an Incognito / Private browsing window (clears stale SSO cookies).
     * Step 2: Direct to official Self-Service Password Reset (SSPR) portal.
   - **PaperCut / Campus WebPrint**:
     * Step 1: Check print quota balance at `print.university.edu`.
     * Step 2: Verify printer station status (green LED vs out-of-paper/jam) and confirm document uploaded as standard PDF.
   - **Duo 2FA / Multi-Factor**:
     * If push fails or user has a new phone: Generate a 6-digit offline passcode directly inside the Duo Mobile app, or guide them to the IT desk for a temporary bypass code / device activation link.
   - **Dorm ResNet & Gaming Consoles (PS5, Xbox, Switch)**:
     * Explain that consoles cannot do enterprise 802.1X logins. Guide student to find the 12-character MAC Address and register it at `resnet.university.edu`.
   - **Account Lockouts & Password Resets**:
     * Guide student to the self-service portal `identity.university.edu`.
     * Never claim you directly unlocked their account in Active Directory.

4. STRICT CONSTRAINTS:
   - NEVER claim that you performed administrative backend changes (e.g., "I have reset your password", "I added print credits", or "I unlocked your account"). You are a diagnostic support assistant.
   - If troubleshooting fails after 2-3 attempts or requires in-person ID verification (e.g., stolen account recovery, dead Ethernet wall jack), provide official escalation:
     * "Since this requires staff administrative access, please visit the **IT Help Desk Tech Bar** (Library 1st Floor, Mon–Fri 8am–7pm) with your Student ID, or email `it-support@university.edu`."
"""


class AIService:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.primary_model = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-ultra-550b-a55b")
        # List of models in order of priority
        self.fallback_models = [
            self.primary_model,
            "nvidia/nemotron-3-ultra-550b-a55b",
            "nvidia/nemotron-3-ultra-550b-a55b:free",
            "nvidia/nemotron-3.5-lightning",
        ]
        # Remove duplicates while preserving order
        self.models_to_try = list(dict.fromkeys(self.fallback_models))
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"

    async def generate_response(self, conversation: List[ChatMessage]) -> ChatResponse:
        api_key = os.getenv("OPENROUTER_API_KEY") or self.api_key
        if not api_key:
            raise ValueError(
                "OPENROUTER_API_KEY is not configured in backend/.env. "
                "Please set OPENROUTER_API_KEY to enable AI chat reasoning."
            )

        # Build payload messages starting with the system prompt
        messages_payload = [{"role": "system", "content": SYSTEM_PROMPT}]
        for msg in conversation:
            if msg.role in ["user", "assistant"]:
                messages_payload.append({"role": msg.role, "content": msg.content})

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "CampusFix University IT Support",
        }

        last_error = None

        # Determine priority models
        configured_model = os.getenv("OPENROUTER_MODEL", self.primary_model)
        models_to_attempt = list(
            dict.fromkeys([
                configured_model,
                "nvidia/nemotron-3-ultra-550b-a55b",
                "nvidia/nemotron-3.5-lightning",
            ])
        )

        async with httpx.AsyncClient(timeout=45.0) as client:
            for model in models_to_attempt:
                try:
                    payload = {
                        "model": model,
                        "messages": messages_payload,
                        "temperature": 0.25,
                        "max_tokens": 500,
                    }

                    response = await client.post(
                        self.base_url,
                        headers=headers,
                        json=payload,
                    )

                    if response.status_code == 200:
                        data = response.json()
                        if "error" in data:
                            last_error = f"Model {model} returned API error in response: {data['error']}"
                            continue
                        if "choices" in data and len(data["choices"]) > 0:
                            reply_content = data["choices"][0]["message"]["content"]
                            return ChatResponse(
                                reply=reply_content,
                                model=model,
                                status="success",
                            )
                        else:
                            last_error = f"Model {model} returned unexpected body: {data}"
                    else:
                        last_error = f"Model {model} returned HTTP {response.status_code}: {response.text}"
                except httpx.RequestError as exc:
                    last_error = f"Request to model {model} failed: {exc}"
                    continue

        raise RuntimeError(f"AI model generation failed. Details: {last_error}")


ai_service = AIService()

