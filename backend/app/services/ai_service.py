import os
import httpx
from typing import List
from dotenv import load_dotenv
from app.models.chat import ChatMessage, ChatResponse

# Load environment variables
_backend_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
if os.path.exists(_backend_env):
    load_dotenv(dotenv_path=_backend_env)
else:
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

5. TROUBLESHOOTING FAILURE & TICKET ESCALATION:
   - If the student explicitly states that troubleshooting failed, they already tried the suggested steps, or the issue is still not fixed / unresolved:
     * Acknowledge that the standard troubleshooting did not resolve the issue.
     * Explicitly offer to open an official **Campus IT Support Ticket** to escalate the incident to campus technician staff.
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

    def _generate_fallback_response(self, conversation: List[ChatMessage]) -> str:
        """Rule-based IT technician fallback when external AI provider is temporarily unavailable."""
        user_msgs = [m.content for m in conversation if m.role == "user"]
        last_msg = user_msgs[-1].lower() if user_msgs else ""
        combined_text = " ".join(user_msgs).lower()

        # Check for unresolved / escalation triggers
        unresolved_keywords = [
            "still not fixed", "not fixed", "still not working", "not working",
            "tried all the suggested steps", "tried the suggested steps", "tried suggested steps", "tried all steps", "tried steps",
            "did not work", "didn't work", "doesn't work", "same error", "same issue", "still broken",
            "persisting", "persists", "create ticket", "support ticket", "open ticket", "escalate", "unresolved", "not resolved", "problem is not fixed"
        ]
        is_unresolved = any(k in last_msg for k in unresolved_keywords)

        if is_unresolved:
            return (
                "I understand that the troubleshooting steps did not resolve the problem. "
                "Since this issue requires hands-on investigation by campus technical staff, "
                "would you like me to open an official **Campus IT Support Ticket** to escalate this to the Tech Bar?"
            )

        # Wi-Fi / Eduroam
        if any(w in combined_text for w in ["wifi", "wi-fi", "eduroam", "wireless", "connect"]):
            if "android" in last_msg:
                return (
                    "For **Android devices** on Eduroam:\n"
                    "1. Set **EAP Method** to `PEAP` and **Phase 2 Authentication** to `MSCHAPV2`.\n"
                    "2. Set **CA Certificate** to `Use system certificates` and **Domain** to `university.edu`.\n"
                    "3. Enter your **Full Email** (`netid@university.edu`) as the Identity.\n\n"
                    "Does your device connect after saving these settings?"
                )
            elif any(os_name in last_msg for os_name in ["mac", "ios", "iphone", "apple"]):
                return (
                    "For **Apple iOS / macOS** on Eduroam:\n"
                    "1. Go to **Settings > Wi-Fi**, select **eduroam**, and tap **Forget Network**.\n"
                    "2. Reconnect and enter your full campus email (`netid@university.edu`) and password.\n"
                    "3. Tap **Trust** when prompted for the `radius.auth.university.edu` certificate.\n\n"
                    "Did that allow you to connect?"
                )
            elif "windows" in last_msg:
                return (
                    "For **Windows 11 / 10** on Eduroam:\n"
                    "1. Click the Wi-Fi icon, right-click **eduroam**, and choose **Forget**.\n"
                    "2. Click **eduroam > Connect**, and enter your full institutional email (`netid@university.edu`) and password.\n\n"
                    "Does your connection establish now?"
                )
            else:
                return (
                    "Welcome to Campus IT Support! For **Eduroam Wi-Fi** issues, the most common culprit is entering just your username instead of your **full campus email** (e.g. `username@university.edu`).\n\n"
                    "Which operating system is your device running (**Windows 11, macOS, iOS, or Android**)?"
                )

        # Duo MFA
        if any(w in combined_text for w in ["duo", "2fa", "mfa", "push", "phone"]):
            return (
                "For **Duo 2FA** issues on a new or upgraded device:\n"
                "1. Open the **Duo Mobile** app and tap your university account to generate a 6-digit offline passcode.\n"
                "2. Enter this passcode on the login screen instead of waiting for a push notification.\n\n"
                "If you no longer have your old device, please visit the **Main Library Tech Bar** with your Student ID for an immediate bypass activation code."
            )

        # Canvas / SSO
        if any(w in combined_text for w in ["canvas", "sso", "portal", "login", "shibboleth"]):
            return (
                "For **Canvas / Single Sign-On (SSO)** login issues:\n"
                "1. Open an **Incognito / Private Browsing** window to clear stale authentication cookies.\n"
                "2. Navigate to `canvas.university.edu` and sign in with your NetID credentials.\n\n"
                "Does the private window allow you to authenticate?"
            )

        # PaperCut / Printing
        if any(w in combined_text for w in ["print", "papercut", "webprint", "quota"]):
            return (
                "For **Campus Printing (PaperCut)** issues:\n"
                "1. Verify your active print balance at `print.university.edu`.\n"
                "2. Ensure your document is uploaded in standard PDF format before swiping your student ID at the release station.\n\n"
                "Is your print job showing as 'Held in Queue' on the WebPrint portal?"
            )

        # Default IT Helpdesk Diagnostic Response
        return (
            "Thank you for contacting Campus IT Support. I am diagnosing your issue.\n\n"
            "1. Please verify whether this issue occurs across all campus locations or in a specific building (such as the Main Library or Residence Halls).\n"
            "2. Ensure your device is updated and has restarted recently.\n\n"
            "Could you tell me what specific error message or symptom appears?"
        )

    async def generate_response(self, conversation: List[ChatMessage]) -> ChatResponse:
        api_key = os.getenv("OPENROUTER_API_KEY") or self.api_key

        # If API key is absent or configured to demo placeholder, provide local IT diagnosis
        if not api_key or "your_" in api_key.lower() or "placeholder" in api_key.lower():
            fallback_text = self._generate_fallback_response(conversation)
            return ChatResponse(
                reply=fallback_text,
                model="campusfix-autonomous-diagnostic-agent",
                status="success",
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

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
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
                                last_error = f"Model {model} error: {data['error']}"
                                continue
                            if "choices" in data and len(data["choices"]) > 0:
                                reply_content = data["choices"][0]["message"]["content"]
                                return ChatResponse(
                                    reply=reply_content,
                                    model=model,
                                    status="success",
                                )
                            else:
                                last_error = f"Model {model} empty choices"
                        else:
                            last_error = f"HTTP {response.status_code}"
                    except Exception as exc:
                        last_error = str(exc)
                        continue
        except Exception as exc:
            last_error = str(exc)

        # If external AI is temporarily unavailable, fall back seamlessly without crashing
        fallback_text = self._generate_fallback_response(conversation)
        return ChatResponse(
            reply=fallback_text,
            model="campusfix-autonomous-diagnostic-agent (fallback)",
            status="success",
        )


ai_service = AIService()

