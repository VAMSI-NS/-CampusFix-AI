import json
import random
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from app.models.knowledge_base import (
    KBArticle,
    KBArticleCreate,
    KBArticleUpdate,
    KBSearchResponse,
)
from app.database import db

logger = logging.getLogger("campusfix.kb")


class KBService:
    def __init__(self):
        now_iso = datetime.now(timezone.utc).isoformat()
        self._articles: List[KBArticle] = [
            KBArticle(
                id="kb-1",
                slug="eduroam-wifi-setup-android-ios-windows",
                title="Eduroam Campus Wi-Fi Connection Guide (iOS, Android, Windows, Mac)",
                category="Wi-Fi",
                tags=["wifi", "eduroam", "802.1x", "network", "certificate"],
                read_time_mins=4,
                updated_at=now_iso,
                summary="Official configuration parameters and root CA settings for connecting laptops and mobile devices to the campus-wide 802.1X Eduroam wireless network.",
                content_markdown="""# Connecting to Eduroam Campus Wi-Fi

Eduroam is the encrypted, secure wireless network available to all university students, faculty, and staff.

---

### Key Authentication Requirement:
> **Important:** Your username must always be entered as your **Full Campus Email Address** (e.g. `netid@university.edu`), **NOT** just your NetID username.

---

### Configuration by Operating System:

#### 1. Android (Versions 11, 12, 13, 14+)
* **EAP Method:** `PEAP`
* **Phase 2 Authentication:** `MSCHAPV2`
* **CA Certificate:** `Use system certificates` (or `Don't validate` if older device)
* **Online Certificate Status:** `Do not verify` or `Require status for all certificates`
* **Domain:** `university.edu`
* **Identity:** `your_netid@university.edu`
* **Anonymous Identity:** *(Leave blank)*
* **Password:** Your campus NetID password

#### 2. Apple iOS (iPhone & iPad) & macOS
1. Open **Settings** > **Wi-Fi** and tap **eduroam**.
2. Enter your full campus email (`netid@university.edu`) and password.
3. When prompted to trust the certificate **radius.auth.university.edu** signed by *InCommon RSA Server CA*, tap **Trust**.

#### 3. Windows 11 / 10
1. Click the Wi-Fi icon in the system tray and select **eduroam** > **Connect Automatically**.
2. Enter your full email address and password when prompted.
3. If asked *"Continue connecting?"* because the server's certificate is recognized, click **Connect**.

---

### Need In-Person Help?
Visit the **Main Library 1st Floor Tech Bar** (Mon–Fri 8:00 AM – 7:00 PM) for hardware diagnostics.
""",
                helpful_count=342,
                icon="wifi",
                is_published=True,
            ),
            KBArticle(
                id="kb-2",
                slug="self-service-password-reset-sspr",
                title="NetID Self-Service Password Reset (SSPR) & Account Unlock",
                category="Password",
                tags=["password", "netid", "sspr", "account", "unlock", "security"],
                read_time_mins=3,
                updated_at=now_iso,
                summary="Step-by-step instructions to recover your forgotten NetID password or unlock an Active Directory account via automated SMS/Email verification.",
                content_markdown="""# NetID Self-Service Password Reset (SSPR)

If you have forgotten your campus NetID password or your account is locked due to too many failed attempts, you can reset it instantly.

---

### Automated SSPR Steps:
1. Navigate to the official identity portal: `https://identity.university.edu/sspr`
2. Enter your university NetID or registered personal recovery email.
3. Choose your verification challenge:
   * **Duo Mobile Push** (Recommended)
   * **SMS Security Code** to your registered mobile phone
   * **Alternate Recovery Email** verification link
4. Create a new password meeting campus complexity requirements:
   * Minimum 12 characters
   * At least one uppercase letter (A–Z)
   * At least one lowercase letter (a–z)
   * At least one number (0–9)
   * At least one special symbol (`!@#$%^&*`)
   * Cannot match your previous 4 passwords

---

> [!NOTE]
> Password sync across Canvas, Microsoft 365, Eduroam, and Lab computers may take up to **5 minutes** to propagate through Active Directory.
""",
                helpful_count=218,
                icon="key",
                is_published=True,
            ),
            KBArticle(
                id="kb-3",
                slug="canvas-lms-login-troubleshooting-sso",
                title="Canvas LMS Login & SSO Session Token Troubleshooting",
                category="Canvas / LMS",
                tags=["canvas", "lms", "sso", "shibboleth", "browser", "cookies"],
                read_time_mins=3,
                updated_at=now_iso,
                summary="How to resolve SAML/Shibboleth login loops, expired authentication tokens, and browser caching conflicts on the Canvas LMS portal.",
                content_markdown="""# Canvas LMS & SSO Login Troubleshooting

If clicking **Log in with NetID** loops back to the login page without showing an error, follow these diagnostic steps.

---

### Step 1: Test in Incognito / Private Browsing Window
Most SSO loops are caused by stale Shibboleth SAML cookies stored in your browser cache:
* **Chrome / Edge / Brave:** Press `Ctrl + Shift + N` (Windows) or `Cmd + Shift + N` (Mac)
* **Firefox / Safari:** Press `Ctrl + Shift + P` (Windows) or `Cmd + Shift + P` (Mac)
* Navigate to `https://canvas.university.edu` and attempt login.

If incognito works, proceed to Step 2 to clear campus cookies permanently.

---

### Step 2: Clear University Site Data & Cookies
1. In your browser settings, search for **Cookies and site permissions**.
2. Search for `university.edu` and click **Delete All Stored Data**.
3. Restart your browser and log in again.

---

### Step 3: Check Central LMS Status
If the issue persists, verify whether Central SSO is experiencing an outage in the **Campus Service Status** tab.
""",
                helpful_count=189,
                icon="book-open",
                is_published=True,
            ),
            KBArticle(
                id="kb-4",
                slug="papercut-webprint-library-release-stations",
                title="PaperCut WebPrint Quota, Submissions & Release Stations",
                category="Printing",
                tags=["printing", "papercut", "webprint", "library", "quota"],
                read_time_mins=4,
                updated_at=now_iso,
                summary="Guide to submitting PDF documents via PaperCut WebPrint, student printing allocations ($25/semester), and releasing print jobs at library terminals.",
                content_markdown="""# PaperCut WebPrint & Campus Printing Guide

All enrolled students receive a **$25.00 printing quota** each semester for campus printing.

---

### How to Print from Laptops / Phones:
1. Connect to **eduroam** Wi-Fi.
2. Navigate to `https://print.university.edu` and log in with your NetID.
3. Click **Web Print** in the left navigation sidebar.
4. Click **Submit a Job** > Select **Campus_B&W_Duplex** or **Campus_Color**.
5. Upload your document in standard **PDF** or Microsoft Office (`.docx`, `.pptx`) format.
6. Click **Upload & Complete**.

---

### Releasing Your Print Job at a Station:
* Go to any release terminal in the **Main Library (1st & 2nd Floor)** or **Engineering Hall Lab 110**.
* Tap your Student ID card against the contactless badge reader, or enter your NetID manually.
* Select your job from the queue and tap **Print**.

---

### Common Issues & Quota Refunds:
* **Stuck in Spooler:** If a printer jams or runs out of paper, funds are automatically refunded if the job is not physically released within 4 hours.
* **Request a Manual Refund:** Use the **Incident Resolver** to report a hardware jam for immediate credit.
""",
                helpful_count=156,
                icon="printer",
                is_published=True,
            ),
            KBArticle(
                id="kb-5",
                slug="duo-mfa-new-phone-offline-passcodes",
                title="Duo 2-Factor Authentication: Phone Migration & Passcodes",
                category="MFA / Duo",
                tags=["duo", "2fa", "mfa", "security", "phone", "push"],
                read_time_mins=3,
                updated_at=now_iso,
                summary="How to transfer your Duo Mobile account when switching phones, generate offline passcodes, or obtain temporary bypass codes.",
                content_markdown="""# Duo 2FA Device Migration & Recovery

University accounts require Duo Multi-Factor Authentication for email, Canvas, and VPN access.

---

### Upgraded to a New Smartphone?
If you still have access to your old phone:
1. Open the **Duo Mobile** app on your old device.
2. Tap the settings gear icon > **Duo Restore** / **Transfer account to new phone**.
3. Open Duo Mobile on your new phone and scan the QR code displayed on your old phone.

---

### Lost / Broken Device (No Old Phone)?
If you do not have your old phone to authorize the transfer:
1. Open the **CampusFix Incident Resolver** or visit the **Library Tech Bar**.
2. Provide your Student ID number to receive a temporary 24-hour bypass code.
3. Use the bypass code to log in at `https://duo.university.edu` and register your new mobile number.

---

### Offline 6-Digit Passcodes (No Cellular/Wi-Fi):
You can generate offline codes inside the Duo Mobile app even without internet:
* Open Duo Mobile > Tap **University Login** > Enter the 6-digit numeric passcode shown on screen into the prompt.
""",
                helpful_count=278,
                icon="shield-check",
                is_published=True,
            ),
            KBArticle(
                id="kb-6",
                slug="dorm-resnet-gaming-console-mac-registration",
                title="Dorm ResNet: Registering Gaming Consoles (PS5, Xbox, Switch)",
                category="ResNet",
                tags=["resnet", "dorm", "ethernet", "ps5", "xbox", "switch", "gaming"],
                read_time_mins=4,
                updated_at=now_iso,
                summary="Register the 12-character MAC address for gaming consoles, Apple TVs, and Smart TVs on the dorm residential wired and wireless networks.",
                content_markdown="""# Dorm ResNet Gaming Console & Smart Device Setup

Gaming consoles (PlayStation 5, Xbox Series X/S, Nintendo Switch) and Smart TVs do not support WPA-Enterprise 802.1X logins. They must be registered via their MAC address.

---

### Step 1: Locate Your Device's MAC Address:
* **PlayStation 5:** Settings > Network > Connection Status > View Connection Status (LAN MAC Address).
* **Xbox Series X/S:** Settings > General > Network Settings > Advanced Settings > MAC Address.
* **Nintendo Switch:** System Settings > Internet > System MAC Address.
* Format: 12 hexadecimal characters (e.g. `00:1A:2B:3C:4D:5E`).

---

### Step 2: Register on the ResNet Portal:
1. Connect your laptop or phone to **eduroam**.
2. Visit `https://resnet.university.edu/register`.
3. Log in with your campus NetID.
4. Click **Add New Device** > Select Device Type > Paste the MAC address.
5. Click **Submit & Activate**.

---

### Step 3: Connect to Dorm Ethernet Wall Jack:
Plug your Cat6 Ethernet cable from the console into the dorm room wall jack (typically Port A). Restart the console.
""",
                helpful_count=164,
                icon="gamepad-2",
                is_published=True,
            ),
            KBArticle(
                id="kb-7",
                slug="campus-vpn-globalprotect-installation",
                title="Campus VPN Setup (GlobalProtect) for Off-Campus Access",
                category="VPN",
                tags=["vpn", "globalprotect", "remote", "library", "research"],
                read_time_mins=3,
                updated_at=now_iso,
                summary="Download, install, and authenticate the GlobalProtect VPN client to access campus library research databases and engineering software off-campus.",
                content_markdown="""# GlobalProtect Campus VPN Setup

The campus Virtual Private Network (VPN) encrypts your off-campus traffic and gives your device a campus IP address for restricted academic databases and license servers.

---

### Installation Instructions:
1. Navigate to `https://vpn.university.edu`.
2. Log in with your NetID and approve the Duo push notification.
3. Download the GlobalProtect client for **Windows 64-bit** or **macOS**.
4. Run the installer and launch GlobalProtect.
5. In the portal address box, type: `vpn.university.edu`
6. Click **Connect** and enter your campus credentials.

---

### When Should You Use the VPN?
* Accessing licensed library research journals (IEEE, JSTOR, ScienceDirect) from home.
* Connecting to remote Linux compute clusters (`ssh student@compute.university.edu`).
* Accessing MATLAB and SolidWorks campus floating license managers.
""",
                helpful_count=132,
                icon="shield",
                is_published=True,
            ),
            KBArticle(
                id="kb-8",
                slug="student-email-outlook-m365-setup",
                title="Student Email (Microsoft 365 & Outlook) Setup",
                category="Email",
                tags=["email", "outlook", "m365", "office", "inbox"],
                read_time_mins=3,
                updated_at=now_iso,
                summary="Configure your official student email address on Outlook for iOS/Android, Apple Mail, and desktop Microsoft 365 apps.",
                content_markdown="""# Student Email (Microsoft 365 Outlook) Setup

All official university notices, course announcements, and financial aid updates are sent to your `@university.edu` email inbox.

---

### Web Access:
Go directly to `https://outlook.office.com` and log in with your full campus email (`netid@university.edu`) and NetID password.

---

### Outlook Mobile App (iOS & Android):
1. Download **Microsoft Outlook** from the App Store or Google Play Store.
2. Tap **Add Account** > Enter your full email: `netid@university.edu`.
3. You will be redirected to the University SSO portal.
4. Enter your NetID password and approve the Duo push.
""",
                helpful_count=195,
                icon="mail",
                is_published=True,
            ),
            KBArticle(
                id="kb-9",
                slug="free-student-software-licenses-matlab-adobe",
                title="Free & Discounted Student Software (Office 365, MATLAB, Adobe, CAD)",
                category="Software",
                tags=["software", "matlab", "adobe", "office", "cad", "solidworks"],
                read_time_mins=4,
                updated_at=now_iso,
                summary="List of university-licensed academic software packages available at zero cost for enrolled students including Microsoft 365, MATLAB, and Autodesk.",
                content_markdown="""# Free Academic Software for Enrolled Students

Enrolled students have access to over $4,000 worth of academic software licenses funded by student technology fees.

---

### Available Software Suite:
* **Microsoft 365 Apps:** Word, Excel, PowerPoint, OneNote (Install on up to 5 devices via `portal.office.com`).
* **MathWorks MATLAB & Simulink:** Full campus academic license at `matlab.university.edu`.
* **Autodesk Suite:** AutoCAD, Revit, Fusion 360, Maya (Free student tier with university email).
* **SolidWorks 3D CAD:** Student Design Kit license keys available via the Engineering Helpdesk.
* **Adobe Creative Cloud:** Discounted $19.99/year licenses for enrolled Media & Art students.
* **Zoom Enterprise:** Unlimited meeting duration with cloud recording.
""",
                helpful_count=284,
                icon="cpu",
                is_published=True,
            ),
        ]

    def list_articles(
        self,
        category: Optional[str] = None,
        search: Optional[str] = None,
    ) -> KBSearchResponse:
        results = [a for a in self._articles if a.is_published]
        categories = list(set([a.category for a in self._articles if a.is_published]))
        categories.sort()

        if category and category.lower() != "all":
            results = [a for a in results if a.category.lower() == category.lower()]

        if search:
            q = search.lower().strip()
            results = [
                a
                for a in results
                if q in a.title.lower()
                or q in a.summary.lower()
                or q in a.content_markdown.lower()
                or any(q in tag.lower() for tag in a.tags)
            ]

        return KBSearchResponse(
            articles=results,
            total_count=len(results),
            categories=["All"] + categories,
        )

    def sync_to_db(self):
        """Seeds initial memory articles into PostgreSQL if kb_articles table is empty."""
        if not db.is_connected():
            return
        try:
            with db.get_cursor(commit=True) as cur:
                cur.execute("SELECT COUNT(*) AS count FROM kb_articles;")
                count = cur.fetchone()["count"]
                if count == 0:
                    logger.info("Seeding initial KB articles into PostgreSQL kb_articles table...")
                    for a in self._articles:
                        self._save_to_db(a, cur=cur)
                    logger.info(f"Seeded {len(self._articles)} KB articles into Neon PostgreSQL.")
        except Exception as e:
            logger.error(f"Error syncing KB articles to DB: {e}")

    def _row_to_article(self, row: Dict[str, Any]) -> KBArticle:
        tags_raw = row.get("tags")
        if isinstance(tags_raw, str):
            try:
                tags_raw = json.loads(tags_raw)
            except Exception:
                tags_raw = []
        elif not isinstance(tags_raw, list):
            tags_raw = []

        return KBArticle(
            id=row["id"],
            slug=row["slug"],
            title=row["title"],
            category=row["category"],
            tags=tags_raw,
            read_time_mins=int(row.get("read_time_mins") or 2),
            updated_at=str(row.get("updated_at") or datetime.now(timezone.utc).isoformat()),
            summary=row["summary"],
            content_markdown=row["content_markdown"],
            helpful_count=int(row.get("helpful_count") or 0),
            icon=row.get("icon") or "file-text",
            is_published=row.get("is_published", True),
        )

    def _save_to_db(self, article: KBArticle, cur=None):
        sql = """
        INSERT INTO kb_articles (
            id, slug, title, category, tags, read_time_mins, summary,
            content_markdown, helpful_count, icon, is_published, updated_at
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        ) ON CONFLICT (id) DO UPDATE SET
            slug = EXCLUDED.slug,
            title = EXCLUDED.title,
            category = EXCLUDED.category,
            tags = EXCLUDED.tags,
            read_time_mins = EXCLUDED.read_time_mins,
            summary = EXCLUDED.summary,
            content_markdown = EXCLUDED.content_markdown,
            helpful_count = EXCLUDED.helpful_count,
            icon = EXCLUDED.icon,
            is_published = EXCLUDED.is_published,
            updated_at = NOW();
        """
        params = (
            article.id,
            article.slug,
            article.title,
            article.category,
            json.dumps(article.tags),
            article.read_time_mins,
            article.summary,
            article.content_markdown,
            article.helpful_count,
            article.icon,
            article.is_published,
            article.updated_at or datetime.now(timezone.utc).isoformat(),
        )
        if cur is not None:
            cur.execute(sql, params)
        else:
            with db.get_cursor(commit=True) as cursor:
                cursor.execute(sql, params)

    def get_article(self, article_id: str) -> Optional[KBArticle]:
        if db.is_connected():
            try:
                with db.get_cursor(commit=False) as cur:
                    cur.execute(
                        "SELECT * FROM kb_articles WHERE id = %s OR slug = %s LIMIT 1;",
                        (article_id, article_id),
                    )
                    row = cur.fetchone()
                    if row:
                        return self._row_to_article(row)
            except Exception as e:
                logger.error(f"Error querying KB article from DB: {e}")

        for a in self._articles:
            if a.id == article_id or a.slug == article_id:
                return a
        return None

    def create_article(self, data: KBArticleCreate) -> KBArticle:
        now_iso = datetime.now(timezone.utc).isoformat()
        slug = data.title.lower().replace(" ", "-").replace("/", "").replace("(", "").replace(")", "")[:50]
        new_id = f"kb-{int(datetime.now(timezone.utc).timestamp())}"

        article = KBArticle(
            id=new_id,
            slug=slug,
            title=data.title.strip(),
            category=data.category.strip(),
            tags=data.tags,
            read_time_mins=max(1, len(data.content_markdown.split()) // 150),
            updated_at=now_iso,
            summary=data.summary.strip(),
            content_markdown=data.content_markdown,
            helpful_count=0,
            icon=data.icon or "file-text",
            is_published=data.is_published,
        )
        self._articles.insert(0, article)

        if db.is_connected():
            try:
                self._save_to_db(article)
            except Exception as e:
                logger.error(f"Error saving KB article to DB: {e}")

        return article

    def update_article(self, article_id: str, data: KBArticleUpdate) -> Optional[KBArticle]:
        article = self.get_article(article_id)
        if not article:
            return None

        now_iso = datetime.now(timezone.utc).isoformat()
        if data.title:
            article.title = data.title.strip()
        if data.category:
            article.category = data.category.strip()
        if data.tags is not None:
            article.tags = data.tags
        if data.summary:
            article.summary = data.summary.strip()
        if data.content_markdown:
            article.content_markdown = data.content_markdown
            article.read_time_mins = max(1, len(data.content_markdown.split()) // 150)
        if data.icon:
            article.icon = data.icon
        if data.is_published is not None:
            article.is_published = data.is_published

        article.updated_at = now_iso

        if db.is_connected():
            try:
                self._save_to_db(article)
            except Exception as e:
                logger.error(f"Error updating KB article in DB: {e}")

        return article

    def delete_article(self, article_id: str) -> bool:
        for idx, a in enumerate(self._articles):
            if a.id == article_id or a.slug == article_id:
                target_id = a.id
                self._articles.pop(idx)

                if db.is_connected():
                    try:
                        with db.get_cursor(commit=True) as cur:
                            cur.execute("DELETE FROM kb_articles WHERE id = %s;", (target_id,))
                    except Exception as e:
                        logger.error(f"Error deleting KB article from DB: {e}")

                return True
        return False

    def vote_helpful(self, article_id: str) -> Optional[KBArticle]:
        article = self.get_article(article_id)
        if article:
            article.helpful_count += 1
            if db.is_connected():
                try:
                    with db.get_cursor(commit=True) as cur:
                        cur.execute("UPDATE kb_articles SET helpful_count = helpful_count + 1 WHERE id = %s;", (article.id,))
                except Exception as e:
                    logger.error(f"Error updating helpful count in DB: {e}")
            return article
        return None


kb_service = KBService()
