import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("RELOAD", "True").lower() in ("true", "1", "t")

    print(f"=== Starting CampusFix AI Backend on http://{host}:{port} ===")
    uvicorn.run("app.main:app", host=host, port=port, reload=reload)
