import io
import sqlite3
import sys
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

try:
    if hasattr(sys.stdout, 'buffer') and sys.stdout.buffer is not None and not sys.stdout.buffer.closed:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'buffer') and sys.stderr.buffer is not None and not sys.stderr.buffer.closed:
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
except Exception:
    pass

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import os
from dotenv import load_dotenv

load_dotenv()

# ─── CONFIG ───────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
DB_PATH = BASE_DIR / "data" / "retetar.db"
SUGESTII = BASE_DIR / "Sugestii_Aplicatie"
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
FIREBASE_API_KEY = os.environ.get("FIREBASE_API_KEY", "AIzaSyBIyPXyENV4Lsg-vhhEkumgoSy3dTiAX6E")
FIREBASE_PROJECT_ID = "bucataria-mea-edd3a"
# Email-uri care primesc rol creator la login cu Google
CREATOR_EMAILS = ["alexandrumadalinmargineanu@yahoo.com"]


# ─── LIFESPAN ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_db()
    setup_auth()
    setup_folders()
    print("[OK] Retetar API pornit")
    yield


# ─── APP ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="Rețetar AI", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── DATABASE ─────────────────────────────────────────────────────────────────
def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=DELETE")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def setup_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS recipes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            ingredients TEXT DEFAULT '',
            instructions TEXT DEFAULT '',
            prep_time INTEGER DEFAULT 0,
            cook_time INTEGER DEFAULT 0,
            servings INTEGER DEFAULT 2,
            calories INTEGER DEFAULT 0,
            tags TEXT DEFAULT '',
            image_url TEXT DEFAULT '',
            category TEXT DEFAULT 'toata_ziua',
            difficulty TEXT DEFAULT 'mediu',
            is_public INTEGER DEFAULT 0,
            is_inspired INTEGER DEFAULT 0,
            created_by TEXT DEFAULT 'creator',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS favorites (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            recipe_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(username, recipe_id)
        );

        CREATE TABLE IF NOT EXISTS saved_recipes (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            recipe_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(username, recipe_id)
        );

        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS user_preferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            source TEXT DEFAULT 'explicit',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(category, key)
        );

        CREATE TABLE IF NOT EXISTS pantry (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            quantity REAL DEFAULT 0,
            unit TEXT DEFAULT '',
            category TEXT DEFAULT '',
            expiry_date TEXT DEFAULT '',
            created_by TEXT DEFAULT 'creator',
            min_quantity REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS planner (
            id TEXT PRIMARY KEY,
            recipe_id TEXT,
            recipe_name TEXT NOT NULL,
            plan_date TEXT NOT NULL,
            meal_type TEXT DEFAULT 'pranz',
            servings INTEGER DEFAULT 2,
            created_by TEXT DEFAULT 'creator',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS planner_week (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL DEFAULT 'anonymous',
            week_start TEXT NOT NULL,
            day TEXT NOT NULL,
            meal_type TEXT NOT NULL,
            meal_name TEXT NOT NULL DEFAULT '',
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, week_start, day, meal_type)
        );

                CREATE TABLE IF NOT EXISTS shopping_list (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            quantity REAL DEFAULT 1,
            unit TEXT DEFAULT '',
            category TEXT DEFAULT '',
            done INTEGER DEFAULT 0,
            urgent INTEGER DEFAULT 0,
            created_by TEXT DEFAULT 'creator',
            count INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS suggestions (
            id TEXT PRIMARY KEY,
            type TEXT DEFAULT 'general',
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            status TEXT DEFAULT 'pending',
            created_by TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            page TEXT DEFAULT '',
            data TEXT DEFAULT '{}',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # Migrare planner_week — recreare cu user_id corect dacă e nevoie
    tables = [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
    if 'planner_week' not in tables:
        conn.execute("""
            CREATE TABLE planner_week (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL DEFAULT '',
                week_start TEXT NOT NULL,
                day TEXT NOT NULL,
                meal_type TEXT NOT NULL,
                meal_name TEXT NOT NULL DEFAULT '',
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, week_start, day, meal_type)
            )
        """)
        print("[OK] Tabel planner_week creat")
    else:
        # Verifică dacă UNIQUE constraint include user_id
        # Cel mai simplu: verifică schema tabelului
        schema = conn.execute(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name='planner_week'"
        ).fetchone()
        if schema and 'user_id' not in (schema[0] or ''):
            # Constraint vechi fără user_id — recreăm tabela, datele vechi se pierd (oricum sunt mixate)
            conn.execute("DROP TABLE planner_week")
            conn.execute("""
                CREATE TABLE planner_week (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL DEFAULT '',
                    week_start TEXT NOT NULL,
                    day TEXT NOT NULL,
                    meal_type TEXT NOT NULL,
                    meal_name TEXT NOT NULL DEFAULT '',
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, week_start, day, meal_type)
                )
            """)
            print("[OK] Tabel planner_week recreat cu user_id in UNIQUE constraint")

    # Migrare coloane lipsă dacă DB-ul e vechi
    existing = [r[1] for r in conn.execute("PRAGMA table_info(recipes)").fetchall()]
    migrations = {
        "category": "TEXT DEFAULT 'toata_ziua'",
        "difficulty": "TEXT DEFAULT 'mediu'",
        "is_public": "INTEGER DEFAULT 0",
        "is_inspired": "INTEGER DEFAULT 0",
    }

    # Migrare pantry — adăugare min_quantity
    pantry_cols = [r[1] for r in conn.execute("PRAGMA table_info(pantry)").fetchall()]
    if "min_quantity" not in pantry_cols:
        conn.execute("ALTER TABLE pantry ADD COLUMN min_quantity REAL DEFAULT 0")
        print("[OK] Coloana pantry.min_quantity adaugata")
    for col, defn in migrations.items():
        if col not in existing:
            conn.execute(f"ALTER TABLE recipes ADD COLUMN {col} {defn}")
            print(f"[OK] Coloana recipes.{col} adaugata")

    # Migrare shopping_list — adăugare count și created_by
    shop_cols = [r[1] for r in conn.execute("PRAGMA table_info(shopping_list)").fetchall()]
    if "count" not in shop_cols:
        conn.execute("ALTER TABLE shopping_list ADD COLUMN count INTEGER DEFAULT 1")
        print("[OK] Coloana shopping_list.count adaugata")
    if "created_by" not in shop_cols:
        conn.execute("ALTER TABLE shopping_list ADD COLUMN created_by TEXT DEFAULT 'creator'")
        print("[OK] Coloana shopping_list.created_by adaugata")

    # Migrare pantry — adăugare created_by
    pantry_cols2 = [r[1] for r in conn.execute("PRAGMA table_info(pantry)").fetchall()]
    if "created_by" not in pantry_cols2:
        conn.execute("ALTER TABLE pantry ADD COLUMN created_by TEXT DEFAULT 'creator'")
        print("[OK] Coloana pantry.created_by adaugata")

    # Migrare planner — adăugare created_by
    planner_cols = [r[1] for r in conn.execute("PRAGMA table_info(planner)").fetchall()]
    if "created_by" not in planner_cols:
        conn.execute("ALTER TABLE planner ADD COLUMN created_by TEXT DEFAULT 'creator'")
        print("[OK] Coloana planner.created_by adaugata")

    # Curăță duplicate existente în shopping_list — păstrează primul, șterge restul
    shop_rows = conn.execute("SELECT id, name, created_by FROM shopping_list ORDER BY created_at ASC").fetchall()
    seen_shop = {}
    to_delete = []
    for row in shop_rows:
        key = (row['name'].lower(), row['created_by'] or 'creator')
        if key in seen_shop:
            to_delete.append(row['id'])
        else:
            seen_shop[key] = row['id']
    for del_id in to_delete:
        conn.execute("DELETE FROM shopping_list WHERE id=?", (del_id,))
    if to_delete:
        print(f"[OK] {len(to_delete)} duplicate din shopping_list sterse")

    conn.commit()
    conn.close()
    print(f"[OK] Database la: {DB_PATH}")


def setup_folders():
    SUGESTII.mkdir(parents=True, exist_ok=True)
    print(f"[OK] Folder Sugestii_Aplicatie la: {SUGESTII}")


# ─── AUTH SETUP ───────────────────────────────────────────────────────────────
import hashlib


def hash_password(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()


def setup_auth():
    conn = get_db()
    existing = conn.execute("SELECT username FROM users WHERE role='creator'").fetchone()
    if not existing:
        import os
        creator_pin = os.environ.get("CREATOR_PIN", "admin123")
        creator_user = os.environ.get("CREATOR_USER", "madalin")
        conn.execute(
            "INSERT OR IGNORE INTO users (id, username, password_hash, role) VALUES (?,?,?,?)",
            (str(uuid.uuid4()), creator_user, hash_password(creator_pin), "creator")
        )
        conn.commit()
        print(f"[OK] Utilizator creator creat: {creator_user}")

        # Seed demo recipes
        demo_recipes = [
            {
                "id": str(uuid.uuid4()),
                "name": "Spaghetti Carbonara",
                "description": "Rețeta romană autentică — fără smântână, doar ouă, guanciale și Pecorino",
                "ingredients": "400g spaghetti\n200g guanciale\n4 gălbenușuri\n100g Pecorino Romano\nPiper negru\nSare",
                "instructions": "1. Fierbe pastele al dente\n2. Prăjește guanciale\n3. Amestecă gălbenușurile cu brânza\n4. Combină totul",
                "prep_time": 10, "cook_time": 20, "servings": 4, "calories": 620,
                "category": "cina", "difficulty": "mediu", "is_public": 1,
                "created_by": "madalin",
                "image_url": "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=1200&q=80",
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Croissant cu unt",
                "description": "Croissant franțuzesc clasic, foietaj auriu și crocant",
                "ingredients": "500g făină\n300g unt\n10g drojdie\n250ml lapte\n50g zahăr\n10g sare",
                "instructions": "1. Pregătește aluatul\n2. Împachetează untul\n3. Fă turele\n4. Coace la 200°C",
                "prep_time": 60, "cook_time": 25, "servings": 8, "calories": 340,
                "category": "mic_dejun", "difficulty": "greu", "is_public": 1,
                "created_by": "madalin",
                "image_url": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=1200&q=80",
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Ciorbă de perișoare",
                "description": "Ciorbă tradițională românească cu perișoare fragede și smântână",
                "ingredients": "500g carne tocată\n2 morcovi\n1 ceapă\n1 ardei\n200ml smântână\nOrez\nVerdețuri",
                "instructions": "1. Face supă de bază\n2. Formează perișoarele\n3. Fierbe totul\n4. Acrește cu lămâie",
                "prep_time": 30, "cook_time": 45, "servings": 6, "calories": 280,
                "category": "pranz", "difficulty": "usor", "is_public": 1,
                "created_by": "madalin",
                "image_url": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=1200&q=80",
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Smoothie de avocado",
                "description": "Smoothie cremos și nutritiv, perfect pentru orice moment al zilei",
                "ingredients": "1 avocado\n1 banană\n200ml lapte de cocos\n1 lămâie\nMiere după gust",
                "instructions": "1. Taie avocado și banana\n2. Pune totul în blender\n3. Amestecă bine\n4. Servește rece",
                "prep_time": 5, "cook_time": 0, "servings": 2, "calories": 320,
                "category": "toata_ziua", "difficulty": "usor", "is_public": 1,
                "created_by": "madalin",
                "image_url": "https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=1200&q=80",
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Tiramisu clasic",
                "description": "Desertul italian iconic — cafea, mascarpone și pudră de cacao",
                "ingredients": "500g mascarpone\n4 ouă\n100g zahăr\n200ml cafea tare\n24 biscuiți Savoiardi\nCacao pudră\nMarsala",
                "instructions": "1. Separă ouăle\n2. Bate gălbenușurile cu zahăr\n3. Adaugă mascarpone\n4. Înmoaie biscuiții\n5. Asamblează straturi\n6. Răcește 6 ore",
                "prep_time": 30, "cook_time": 0, "servings": 8, "calories": 450,
                "category": "toata_ziua", "difficulty": "mediu", "is_public": 1,
                "created_by": "madalin",
                "image_url": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=1200&q=80",
            },
        ]
        for r in demo_recipes:
            conn.execute("""
                INSERT OR IGNORE INTO recipes
                (id, name, description, ingredients, instructions, prep_time, cook_time, servings, calories, category, difficulty, is_public, created_by, image_url)
                VALUES (:id, :name, :description, :ingredients, :instructions, :prep_time, :cook_time, :servings, :calories, :category, :difficulty, :is_public, :created_by, :image_url)
            """, r)
        conn.commit()
        print("[OK] Retete demo adaugate")
    conn.close()


# ─── MODELS ───────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str = ""
    pin: str = ""


class RecipeModel(BaseModel):
    token: str = ""
    name: str
    description: str = ""
    ingredients: str = ""
    instructions: str = ""
    prep_time: int = 0
    cook_time: int = 0
    servings: int = 2
    calories: int = 0
    tags: str = ""
    image_url: str = ""
    category: str = "toata_ziua"
    difficulty: str = "mediu"
    is_public: int = 0
    is_inspired: int = 0


class DeleteModel(BaseModel):
    token: str = ""


class ChatMessage(BaseModel):
    message: str
    session_id: str = "default"
    token: str = ""
    role: str = "user"
    username: str = "utilizator"


class PantryItem(BaseModel):
    name: str
    quantity: float = 0
    unit: str = ""
    category: str = ""
    expiry_date: str = ""
    min_quantity: float = 0


class PlannerItem(BaseModel):
    recipe_id: str = ""
    recipe_name: str
    plan_date: str
    meal_type: str = "pranz"
    servings: int = 2


class ShoppingItem(BaseModel):
    name: str
    quantity: float = 1
    unit: str = ""
    category: str = ""
    urgent: bool = False


class EventModel(BaseModel):
    event_type: str
    page: str = ""
    data: dict = {}


# ─── AUTH ─────────────────────────────────────────────────────────────────────
@app.post("/api/auth/register")
async def register(req: LoginRequest):
    conn = get_db()
    existing = conn.execute("SELECT username FROM users WHERE username=?", (req.username,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(400, "Username-ul există deja")
    pw = req.password or req.pin
    if not pw or len(pw) < 4:
        conn.close()
        raise HTTPException(400, "PIN-ul trebuie să aibă minim 4 caractere")
    uid = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO users (id, username, password_hash, role) VALUES (?,?,?,?)",
        (uid, req.username.strip(), hash_password(pw), "user")
    )
    token = f"local_{uuid.uuid4().hex[:16]}"
    conn.execute(
        "INSERT OR REPLACE INTO sessions (token, username, role) VALUES (?,?,?)",
        (token, req.username.strip(), "user")
    )
    conn.commit()
    conn.close()
    return {"token": token, "username": req.username.strip(), "role": "user"}


@app.post("/api/auth/login")
async def login(req: LoginRequest):
    conn = get_db()
    pw = req.password or req.pin
    user = conn.execute(
        "SELECT * FROM users WHERE username=? AND password_hash=?",
        (req.username, hash_password(pw))
    ).fetchone()
    if not user:
        conn.close()
        raise HTTPException(401, "Credențiale incorecte")
    token = f"local_{uuid.uuid4().hex[:16]}"
    conn.execute(
        "INSERT OR REPLACE INTO sessions (token, username, role) VALUES (?,?,?)",
        (token, user["username"], user["role"])
    )
    conn.commit()
    conn.close()
    return {"token": token, "username": user["username"], "role": user["role"]}


@app.get("/api/auth/me")
async def me(token: str = ""):
    conn = get_db()
    session = conn.execute("SELECT * FROM sessions WHERE token=?", (token,)).fetchone()
    conn.close()
    if not session:
        raise HTTPException(401, "Neautentificat")
    return {"username": session["username"], "role": session["role"]}


@app.post("/api/auth/logout")
async def logout(token: str = ""):
    conn = get_db()
    conn.execute("DELETE FROM sessions WHERE token=?", (token,))
    conn.commit()
    conn.close()
    return {"status": "ok"}


# ─── FIREBASE AUTH ────────────────────────────────────────────────────────────
class FirebaseAuthRequest(BaseModel):
    id_token: str


@app.post("/api/auth/firebase")
async def firebase_auth(req: FirebaseAuthRequest):
    """Verifică token Firebase Google și creează/găsește utilizatorul local."""
    import httpx as _httpx
    try:
        # Verifică token-ul cu Firebase REST API
        async with _httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={FIREBASE_API_KEY}",
                json={"idToken": req.id_token}
            )
        if resp.status_code != 200:
            raise HTTPException(401, "Token Firebase invalid")

        data = resp.json()
        users = data.get("users", [])
        if not users:
            raise HTTPException(401, "Utilizator Firebase negăsit")

        firebase_user = users[0]
        email = firebase_user.get("email", "")
        display_name = firebase_user.get("displayName", "")
        firebase_uid = firebase_user.get("localId", "")

        if not email:
            raise HTTPException(400, "Email-ul Google nu este disponibil")

        # Username = prima parte din email (ex: ion.popescu@gmail.com → ion.popescu)
        username = email.split("@")[0].replace(".", "_").replace("+", "_")[:30]
        # Rol: creator dacă emailul e în lista creator, altfel user
        role = "creator" if email in CREATOR_EMAILS else "user"

        conn = get_db()
        # Verifică dacă userul există deja
        existing = conn.execute("SELECT * FROM users WHERE username=?", (username,)).fetchone()
        if not existing:
            # Creează user nou
            uid = str(uuid.uuid4())
            conn.execute(
                "INSERT OR IGNORE INTO users (id, username, password_hash, role) VALUES (?,?,?,?)",
                (uid, username, hash_password(firebase_uid), role)
            )
            print(f"[Firebase] Utilizator nou creat: {username} ({role})")
        else:
            # Dacă emailul e creator, upgradează rolul dacă e nevoie
            if role == "creator" and existing["role"] != "creator":
                conn.execute("UPDATE users SET role='creator' WHERE username=?", (username,))
                print(f"[Firebase] Utilizator {username} upgradat la creator")
            role = existing["role"]

        # Creează sesiune
        token = f"fb_{uuid.uuid4().hex[:16]}"
        conn.execute(
            "INSERT OR REPLACE INTO sessions (token, username, role) VALUES (?,?,?)",
            (token, username, role)
        )
        conn.commit()
        conn.close()

        return {
            "token": token,
            "username": display_name or username,
            "role": role,
            "email": email
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[Firebase] Eroare auth: {e}")
        raise HTTPException(500, f"Eroare la autentificare: {str(e)}")


# ─── GOOGLE OAUTH ────────────────────────────────────────────────────────────
import secrets
import time

# Stocare temporara state -> (timestamp, token_result)
_oauth_states: dict = {}
_oauth_results: dict = {}

GOOGLE_CLIENT_ID = "935280617234-r424cnfcuabcvmae5ifnvdg3cpl0itrp.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = "http://localhost:8000/api/auth/google/callback"
GOOGLE_TOKEN_URI = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URI = "https://www.googleapis.com/oauth2/v3/userinfo"


@app.get("/api/auth/google/url")
async def google_auth_url():
    """Generează URL pentru Google OAuth."""
    state = secrets.token_urlsafe(16)
    _oauth_states[state] = time.time()

    from urllib.parse import urlencode
    params = urlencode({
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "select_account",
    })
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{params}"
    return {"url": auth_url, "state": state}


@app.get("/api/auth/google/callback")
async def google_callback(code: str = "", state: str = "", error: str = ""):
    """Primește callback-ul de la Google și procesează autentificarea."""
    import httpx as _httpx

    if error:
        return _html_response("❌ Autentificare anulată. Poți închide această fereastră.")

    if state not in _oauth_states:
        return _html_response("❌ State invalid sau expirat. Încearcă din nou din aplicație.")

    try:
        async with _httpx.AsyncClient(timeout=15) as client:
            # 1. Schimbă codul cu access token
            token_resp = await client.post(GOOGLE_TOKEN_URI, data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            })

            if token_resp.status_code != 200:
                print(f"[OAuth] Token error: {token_resp.text}")
                return _html_response("❌ Eroare la obținerea token-ului Google.")

            token_data = token_resp.json()
            access_token = token_data.get("access_token")

            if not access_token:
                return _html_response("❌ Token Google invalid.")

            # 2. Obține informațiile utilizatorului
            user_resp = await client.get(
                GOOGLE_USERINFO_URI,
                headers={"Authorization": f"Bearer {access_token}"}
            )

            if user_resp.status_code != 200:
                return _html_response("❌ Nu am putut obține informațiile contului.")

            user_info = user_resp.json()

        email = user_info.get("email", "")
        display_name = user_info.get("name", "")
        picture = user_info.get("picture", "")

        if not email:
            return _html_response("❌ Nu am putut obține emailul Google.")

        username = email.split("@")[0].replace(".", "_").replace("+", "_")[:30]
        role = "creator" if email in CREATOR_EMAILS else "user"

        conn = get_db()
        existing = conn.execute("SELECT * FROM users WHERE username=?", (username,)).fetchone()
        if not existing:
            uid = str(uuid.uuid4())
            conn.execute(
                "INSERT OR IGNORE INTO users (id, username, password_hash, role) VALUES (?,?,?,?)",
                (uid, username, hash_password(email), role)
            )
            print(f"[OAuth] Utilizator nou: {username} ({role})")
        else:
            role = existing["role"]
            if email in CREATOR_EMAILS and role != "creator":
                conn.execute("UPDATE users SET role='creator' WHERE username=?", (username,))
                role = "creator"

        token = f"fb_{uuid.uuid4().hex[:16]}"
        display = display_name or username
        conn.execute(
            "INSERT OR REPLACE INTO sessions (token, username, role) VALUES (?,?,?)",
            (token, display, role)
        )
        conn.commit()
        conn.close()

        _oauth_results[state] = {"token": token, "username": display, "role": role, "email": email}
        del _oauth_states[state]

        return _html_response(
            f"✅ Autentificat ca <b>{display}</b>!<br>Poți închide această fereastră — te vei conecta automat în Bucătăria Mea.")

    except Exception as e:
        print(f"[OAuth] Eroare: {e}")
        return _html_response("❌ Eroare la autentificare. Încearcă din nou.")


@app.get("/api/auth/google/callback/poll")
async def google_callback_poll(state: str = ""):
    """Polling pentru rezultatul autentificării Google."""
    from fastapi.responses import JSONResponse as _JSONResponse
    if state in _oauth_results:
        result = _oauth_results.pop(state)
        return _JSONResponse(result)
    # Curăță state-urile expirate (>10 min)
    now = time.time()
    expired = [s for s, t in _oauth_states.items() if now - t > 600]
    for s in expired:
        del _oauth_states[s]
    raise HTTPException(404, "Aștept autentificare...")


def _html_response(message: str):
    from fastapi.responses import HTMLResponse as _HTMLResponse
    return _HTMLResponse(f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bucătăria Mea</title>
  <style>
    body {{ background: #0B0806; color: #FDF6EC; font-family: 'Jost', sans-serif;
           display: flex; align-items: center; justify-content: center;
           height: 100vh; margin: 0; flex-direction: column; gap: 16px; }}
    .msg {{ font-size: 18px; text-align: center; max-width: 400px; line-height: 1.6; }}
    .sub {{ font-size: 13px; color: rgba(253,246,236,0.4); }}
  </style>
</head>
<body>
  <div style="font-size:48px">🍳</div>
  <div class="msg">{message}</div>
  <div class="sub">Bucătăria Mea</div>
  <script>setTimeout(() => window.close(), 3000)</script>
</body>
</html>""")


# ─── RECIPES ──────────────────────────────────────────────────────────────────
@app.get("/api/recipes")
async def list_recipes(token: str = "", public_only: int = 0):
    conn = get_db()
    session = conn.execute("SELECT username, role FROM sessions WHERE token=?", (token,)).fetchone()

    if public_only == 1 or not session:
        rows = conn.execute(
            "SELECT * FROM recipes WHERE is_public=1 ORDER BY created_at DESC"
        ).fetchall()
    else:
        # Utilizatorul vede doar rețetele lui
        rows = conn.execute(
            "SELECT * FROM recipes WHERE created_by=? ORDER BY created_at DESC",
            (session["username"],)
        ).fetchall()

    conn.close()
    return [dict(r) for r in rows]


@app.get("/api/recipes/{recipe_id}")
async def get_recipe(recipe_id: str, token: str = ""):
    conn = get_db()
    row = conn.execute("SELECT * FROM recipes WHERE id=?", (recipe_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Rețeta nu există")
    return dict(row)


@app.post("/api/recipes")
async def create_recipe(r: RecipeModel):
    conn = get_db()
    session = conn.execute("SELECT username FROM sessions WHERE token=?", (r.token,)).fetchone()
    if not session:
        conn.close()
        raise HTTPException(401, "Neautentificat")
    rid = str(uuid.uuid4())
    conn.execute("""
        INSERT INTO recipes (id, name, description, ingredients, instructions,
            prep_time, cook_time, servings, calories, tags, image_url,
            category, difficulty, is_public, is_inspired, created_by)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (rid, r.name, r.description, r.ingredients, r.instructions,
          r.prep_time, r.cook_time, r.servings, r.calories, r.tags, r.image_url,
          r.category, r.difficulty, r.is_public, r.is_inspired, session["username"]))
    conn.commit()
    conn.close()
    return {"id": rid, "status": "created"}


@app.put("/api/recipes/{recipe_id}")
async def update_recipe(recipe_id: str, r: RecipeModel, token: str = ""):
    conn = get_db()
    effective_token = token or r.token
    session = conn.execute("SELECT username, role FROM sessions WHERE token=?", (effective_token,)).fetchone()
    if not session:
        conn.close()
        raise HTTPException(401, "Neautentificat")
    conn.execute("""
        UPDATE recipes SET name=?, description=?, ingredients=?, instructions=?,
            prep_time=?, cook_time=?, servings=?, calories=?, tags=?, image_url=?,
            category=?, difficulty=?, is_public=?, is_inspired=?, updated_at=CURRENT_TIMESTAMP
        WHERE id=? AND (created_by=? OR ?='creator')
    """, (r.name, r.description, r.ingredients, r.instructions,
          r.prep_time, r.cook_time, r.servings, r.calories, r.tags, r.image_url,
          r.category, r.difficulty, r.is_public, r.is_inspired,
          recipe_id, session["username"], session["role"]))
    conn.commit()
    conn.close()
    return {"status": "updated"}


@app.delete("/api/recipes/{recipe_id}")
async def delete_recipe(recipe_id: str, body: DeleteModel, token: str = ""):
    conn = get_db()
    effective_token = token or body.token
    session = conn.execute("SELECT username, role FROM sessions WHERE token=?", (effective_token,)).fetchone()
    if not session:
        conn.close()
        raise HTTPException(401, "Neautentificat")
    conn.execute(
        "DELETE FROM recipes WHERE id=? AND (created_by=? OR ?='creator')",
        (recipe_id, session["username"], session["role"])
    )
    conn.commit()
    conn.close()
    return {"status": "deleted"}


# ─── FAVORITES ────────────────────────────────────────────────────────────────
@app.get("/api/favorites/ids")
async def get_favorite_ids(token: str = ""):
    if not token:
        return []
    conn = get_db()
    session = conn.execute("SELECT username FROM sessions WHERE token=?", (token,)).fetchone()
    if not session:
        conn.close()
        return []
    rows = conn.execute(
        "SELECT recipe_id FROM favorites WHERE username=?", (session["username"],)
    ).fetchall()
    conn.close()
    return [r["recipe_id"] for r in rows]


@app.get("/api/favorites")
async def get_favorites(token: str = ""):
    conn = get_db()
    session = conn.execute("SELECT username FROM sessions WHERE token=?", (token,)).fetchone()
    if not session:
        conn.close()
        raise HTTPException(401, "Neautentificat")
    rows = conn.execute("""
        SELECT r.* FROM recipes r
        JOIN favorites f ON r.id = f.recipe_id
        WHERE f.username=?
        ORDER BY f.created_at DESC
    """, (session["username"],)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/favorites/{recipe_id}")
async def add_favorite(recipe_id: str, token: str = ""):
    conn = get_db()
    session = conn.execute("SELECT username FROM sessions WHERE token=?", (token,)).fetchone()
    if not session:
        conn.close()
        raise HTTPException(401, "Neautentificat")
    try:
        conn.execute(
            "INSERT INTO favorites (id, username, recipe_id) VALUES (?,?,?)",
            (str(uuid.uuid4()), session["username"], recipe_id)
        )
        conn.commit()
        return {"status": "saved"}
    except:
        return {"status": "already_saved"}
    finally:
        conn.close()


@app.delete("/api/favorites/{recipe_id}")
async def remove_favorite(recipe_id: str, token: str = ""):
    conn = get_db()
    session = conn.execute("SELECT username FROM sessions WHERE token=?", (token,)).fetchone()
    if not session:
        conn.close()
        raise HTTPException(401, "Neautentificat")
    conn.execute(
        "DELETE FROM favorites WHERE username=? AND recipe_id=?",
        (session["username"], recipe_id)
    )
    conn.commit()
    conn.close()
    return {"status": "removed"}


# ─── SAVED RECIPES (din Inspirație → Rețetele mele) ──────────────────────────
@app.get("/api/saved_recipes")
async def get_saved_recipes(token: str = ""):
    """Rețetele salvate din Inspirație — apar în Rețetele mele cu badge INSPIRAȚIE."""
    if not token:
        return []
    conn = get_db()
    session = conn.execute("SELECT username FROM sessions WHERE token=?", (token,)).fetchone()
    if not session:
        conn.close()
        return []
    rows = conn.execute("""
        SELECT r.* FROM recipes r
        JOIN favorites f ON r.id = f.recipe_id
        WHERE f.username=? AND r.created_by != ?
        ORDER BY f.created_at DESC
    """, (session["username"], session["username"])).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ─── AI CHAT ──────────────────────────────────────────────────────────────────
from fastapi.responses import StreamingResponse
import json


@app.post("/api/chat")
async def chat(msg: ChatMessage):
    conn = get_db()
    session = conn.execute("SELECT username, role FROM sessions WHERE token=?", (msg.token,)).fetchone()
    username = session["username"] if session else "oaspete"
    role = session["role"] if session else "user"

    # Salvează mesajul utilizatorului (izolat per username)
    real_session_id = username if username != "oaspete" else msg.session_id
    conv_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO conversations (id, session_id, role, content) VALUES (?,?,?,?)",
        (conv_id, real_session_id, "user", msg.message)
    )

    # Preferințe memorate
    prefs = conn.execute("SELECT key, value FROM user_preferences WHERE category=? OR category='general'",
                         (username,)).fetchall()
    pref_text = "\n".join([f"- {r['key']}: {r['value']}" for r in prefs]) if prefs else "Nicio preferință salvată."

    # Istoric conversație (foloseste real_session_id izolat per user)
    history = conn.execute(
        "SELECT role, content FROM conversations WHERE session_id=? ORDER BY created_at DESC LIMIT 20",
        (real_session_id,)
    ).fetchall()
    conn.commit()
    conn.close()

    system_prompt = f"""Ești Chef AI, asistentul culinar al aplicației Bucătăria Mea.
Utilizator: {username} (rol: {role})
Preferințe memorate:
{pref_text}

Răspunde în română. Fii concis, util și prietenos."""

    messages = [{"role": "system", "content": system_prompt}]
    for h in reversed(list(history)):
        messages.append({"role": h["role"], "content": h["content"]})

    async def stream():
        full = ""
        try:
            import httpx as _hx2, certifi as _cv2
            import ssl
            import certifi
            body = json.dumps({
                "model": GROQ_MODEL,
                "messages": messages,
                "stream": True,
                "max_tokens": 1024,
            }).encode("utf-8")
            _resp2 = _hx2.post(GROQ_URL, content=body,
                               headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                               verify=_cv2.where(), timeout=120)
            resp = None
            ctx = None
            if True:
                if True: pass
                for raw_line in _resp2.iter_lines():
                    line = raw_line.strip()
                    if line.startswith("data: "):
                        chunk = line[6:]
                        if chunk == "[DONE]":
                            break
                        try:
                            d = json.loads(chunk)
                            token_text = d.get("choices", [{}])[0].get("delta", {}).get("content", "")
                            if token_text:
                                full += token_text
                                yield f"data: {json.dumps({'token': token_text})}\n\n"
                        except:
                            pass
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

        # Salvează răspunsul
        if full:
            conn2 = get_db()
            conn2.execute(
                "INSERT INTO conversations (id, session_id, role, content) VALUES (?,?,?,?)",
                (str(uuid.uuid4()), real_session_id, "assistant", full)
            )
            conn2.commit()
            conn2.close()
        yield "data: [DONE]\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")


@app.get("/api/chat/history")
async def chat_history(token: str = "", limit: int = 50):
    conn = get_db()
    session = conn.execute("SELECT username, role FROM sessions WHERE token=?", (token,)).fetchone()
    if not session:
        conn.close()
        return []
    username = session["username"]
    is_creator = session["role"] == "creator"
    if is_creator:
        rows = conn.execute(
            "SELECT role, content, created_at FROM conversations ORDER BY created_at ASC LIMIT ?",
            (limit,)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT role, content, created_at FROM conversations WHERE session_id=? ORDER BY created_at ASC LIMIT ?",
            (username, limit)
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.delete("/api/chat/history")
async def clear_history(token: str = ""):
    conn = get_db()
    session = conn.execute("SELECT username, role FROM sessions WHERE token=?", (token,)).fetchone()
    if not session:
        conn.close()
        return {"status": "unauthorized"}
    username = session["username"]
    is_creator = session["role"] == "creator"
    if is_creator:
        conn.execute("DELETE FROM conversations")
    else:
        conn.execute("DELETE FROM conversations WHERE session_id=?", (username,))
    conn.commit()
    conn.close()
    return {"status": "cleared"}


# ─── PANTRY ───────────────────────────────────────────────────────────────────
def compute_status(quantity: float, min_quantity: float) -> str:
    if quantity <= 0:
        return "critical"
    if min_quantity > 0 and quantity <= min_quantity:
        return "low"
    return "ok"


@app.get("/api/pantry")
async def get_pantry(token: str = ""):
    conn = get_db()
    session = conn.execute("SELECT username, role FROM sessions WHERE token=?", (token,)).fetchone()
    username = session["username"] if session else None
    is_creator = session["role"] == "creator" if session else False
    if is_creator:
        rows = conn.execute("SELECT * FROM pantry ORDER BY category, name").fetchall()
    elif username:
        rows = conn.execute("SELECT * FROM pantry WHERE created_by=? ORDER BY category, name", (username,)).fetchall()
    else:
        rows = []
    conn.close()
    result = []
    for r in rows:
        item = dict(r)
        item["status"] = compute_status(item.get("quantity", 0), item.get("min_quantity", 0))
        result.append(item)
    return result


@app.post("/api/pantry")
async def add_pantry(item: PantryItem, token: str = ""):
    conn = get_db()
    session = conn.execute("SELECT username FROM sessions WHERE token=?", (token,)).fetchone()
    username = session["username"] if session else "creator"
    sid = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO pantry (id, name, quantity, unit, category, expiry_date, min_quantity, created_by) VALUES (?,?,?,?,?,?,?,?)",
        (sid, item.name, item.quantity, item.unit, item.category, item.expiry_date, item.min_quantity, username)
    )
    conn.commit()
    conn.close()
    status = compute_status(item.quantity, item.min_quantity)
    return {"id": sid, "status": status}


@app.put("/api/pantry/{item_id}")
async def update_pantry(item_id: str, item: PantryItem, token: str = ""):
    conn = get_db()
    session = conn.execute("SELECT username, role FROM sessions WHERE token=?", (token,)).fetchone()
    username = session["username"] if session else None
    is_creator = session["role"] == "creator" if session else False
    conn.execute(
        "UPDATE pantry SET name=?, quantity=?, unit=?, category=?, expiry_date=?, min_quantity=? WHERE id=? AND (created_by=? OR ?='creator')",
        (item.name, item.quantity, item.unit, item.category, item.expiry_date, item.min_quantity, item_id, username,
         "creator" if is_creator else "")
    )
    conn.commit()
    conn.close()
    status = compute_status(item.quantity, item.min_quantity)
    return {"id": item_id, "status": status}


@app.delete("/api/pantry/{item_id}")
async def delete_pantry(item_id: str, token: str = ""):
    conn = get_db()
    session = conn.execute("SELECT username, role FROM sessions WHERE token=?", (token,)).fetchone()
    username = session["username"] if session else None
    is_creator = session["role"] == "creator" if session else False
    if is_creator:
        conn.execute("DELETE FROM pantry WHERE id=?", (item_id,))
    elif username:
        conn.execute("DELETE FROM pantry WHERE id=? AND created_by=?", (item_id, username))
    conn.commit()
    conn.close()
    return {"status": "deleted"}


# ─── PLANNER ──────────────────────────────────────────────────────────────────
class WeekMealItem(BaseModel):
    week_start: str
    day: str
    meal_type: str
    meal_name: str = ""


# IMPORTANT: rutele specifice /week și /meal trebuie să fie înainte de /{item_id}
@app.get("/api/planner/week")
async def get_week_planner(week: str = "", token: str = ""):
    conn = get_db()
    session = conn.execute("SELECT username FROM sessions WHERE token=?", (token,)).fetchone()
    if not session:
        conn.close()
        return []
    username = session["username"]
    rows = conn.execute(
        "SELECT day, meal_type, meal_name FROM planner_week WHERE user_id=? AND week_start=?",
        (username, week)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/planner/meal")
async def save_week_meal(item: WeekMealItem, token: str = ""):
    conn = get_db()
    session = conn.execute("SELECT username FROM sessions WHERE token=?", (token,)).fetchone()
    if not session:
        conn.close()
        return {"error": "unauthorized"}
    username = session["username"]
    existing = conn.execute(
        "SELECT id FROM planner_week WHERE user_id=? AND week_start=? AND day=? AND meal_type=?",
        (username, item.week_start, item.day, item.meal_type)
    ).fetchone()
    if existing:
        conn.execute(
            "UPDATE planner_week SET meal_name=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
            (item.meal_name, existing["id"])
        )
    else:
        conn.execute(
            "INSERT INTO planner_week (id, user_id, week_start, day, meal_type, meal_name) VALUES (?,?,?,?,?,?)",
            (uuid.uuid4().hex, username, item.week_start, item.day, item.meal_type, item.meal_name)
        )
    conn.commit()
    conn.close()
    return {"status": "saved", "week": item.week_start, "day": item.day, "meal_type": item.meal_type}


@app.get("/api/planner")
async def get_planner(token: str = ""):
    conn = get_db()
    session = conn.execute("SELECT username, role FROM sessions WHERE token=?", (token,)).fetchone()
    username = session["username"] if session else None
    is_creator = session["role"] == "creator" if session else False
    if is_creator:
        rows = conn.execute("SELECT * FROM planner ORDER BY plan_date, meal_type").fetchall()
    elif username:
        rows = conn.execute("SELECT * FROM planner WHERE created_by=? ORDER BY plan_date, meal_type",
                            (username,)).fetchall()
    else:
        rows = []
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/planner")
async def add_planner(item: PlannerItem, token: str = ""):
    conn = get_db()
    session = conn.execute("SELECT username FROM sessions WHERE token=?", (token,)).fetchone()
    username = session["username"] if session else "creator"
    sid = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO planner (id, recipe_id, recipe_name, plan_date, meal_type, servings, created_by) VALUES (?,?,?,?,?,?,?)",
        (sid, item.recipe_id, item.recipe_name, item.plan_date, item.meal_type, item.servings, username)
    )
    conn.commit()
    conn.close()
    return {"id": sid, "status": "added"}


@app.delete("/api/planner/{item_id}")
async def delete_planner(item_id: str, token: str = ""):
    conn = get_db()
    session = conn.execute("SELECT username, role FROM sessions WHERE token=?", (token,)).fetchone()
    username = session["username"] if session else None
    is_creator = session["role"] == "creator" if session else False
    if is_creator:
        conn.execute("DELETE FROM planner WHERE id=?", (item_id,))
    elif username:
        conn.execute("DELETE FROM planner WHERE id=? AND created_by=?", (item_id, username))
    conn.commit()
    conn.close()
    return {"status": "deleted"}


# ─── SHOPPING ─────────────────────────────────────────────────────────────────
@app.get("/api/shopping")
async def get_shopping(token: str = ""):
    conn = get_db()
    session = conn.execute("SELECT username, role FROM sessions WHERE token=?", (token,)).fetchone()
    username = session["username"] if session else None
    is_creator = session["role"] == "creator" if session else False
    if is_creator:
        rows = conn.execute("SELECT * FROM shopping_list ORDER BY done, urgent DESC, name").fetchall()
    elif username:
        rows = conn.execute("SELECT * FROM shopping_list WHERE created_by=? ORDER BY done, urgent DESC, name",
                            (username,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM shopping_list ORDER BY done, urgent DESC, name").fetchall()
    # Deduplicare: un singur rând per nume, count sumat
    seen = {}
    for r in rows:
        key = r["name"].lower()
        if key not in seen:
            seen[key] = dict(r)
            seen[key]["count"] = r["count"] if "count" in r.keys() else 1
        else:
            # Row duplicat in DB — suma count-urilor
            seen[key]["count"] = (seen[key].get("count") or 0) + (r["count"] if "count" in r.keys() else 1)
            # Pastreaza cel care nu e done (daca exista)
            if not r["done"]:
                seen[key]["done"] = 0
    conn.close()
    return list(seen.values())


@app.post("/api/shopping")
async def add_shopping(item: ShoppingItem, token: str = ""):
    conn = get_db()
    session = conn.execute("SELECT username FROM sessions WHERE token=?", (token,)).fetchone()
    username = session["username"] if session else None
    # Caută produs existent cu același nume (case insensitive, per user)
    import re as _re_outer
    def get_base(name):
        """Extrage baza numelui fara cantitate (ex: '600g carne' -> 'carne', '2 x lamai' -> 'lamai')"""
        s = name.strip()
        # Sterge prefix de tip "2 × " sau "2 x " sau "3x "
        s = _re_outer.sub(r'^\d+\s*[×xX]\s*', '', s).strip()
        # Sterge prefix numeric cu unitate: "600g", "1 kg", "2 "
        m = _re_outer.match(r'^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|buc|linguri|lingura|cana)?\s*(.+)$', s,
                            _re_outer.IGNORECASE)
        if m and m.group(3).strip():
            return m.group(3).strip().lower()
        return s.lower()

    new_base = get_base(item.name)

    # Cauta dupa baza numelui (fara cantitate) printre toate produsele userului
    if username:
        all_rows = conn.execute(
            "SELECT id, count, name FROM shopping_list WHERE created_by=? AND done=0",
            (username,)
        ).fetchall()
    else:
        all_rows = conn.execute(
            "SELECT id, count, name FROM shopping_list WHERE done=0"
        ).fetchall()

    existing = None
    for row in all_rows:
        if get_base(row["name"]) == new_base:
            existing = row
            break

    if existing:
        try:
            import re as _re
            name1 = existing["name"].strip()
            name2 = item.name.strip()
            # Incearca sa extraga numarul si restul numelui
            pat = r'^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|buc|linguri|lingura|cana)?\s*(.+)$'
            r1 = _re.match(pat, name1, _re.IGNORECASE)
            r2 = _re.match(pat, name2, _re.IGNORECASE)
            merged = False
            if r1 and r2:
                n1, u1, b1 = float(r1.group(1).replace(',', '.')), (r1.group(2) or '').lower().strip(), r1.group(
                    3).strip()
                n2, u2, b2 = float(r2.group(1).replace(',', '.')), (r2.group(2) or '').lower().strip(), r2.group(
                    3).strip()
                # Acelasi produs daca baza e identica (ex: "unt" == "unt")
                if b1.lower() == b2.lower():
                    total = n1 + n2
                    ts = str(int(total)) if total == int(total) else str(round(total, 2))
                    us = u1 or u2
                    new_name = f"{ts} {us} {b1}".strip() if us else f"{ts} {b1}".strip()
                    conn.execute("UPDATE shopping_list SET name=?, count=1 WHERE id=?", (new_name, existing["id"]))
                    merged = True
            if not merged:
                try:
                    old_count = int(existing["count"] or 1)
                except Exception:
                    old_count = 1
                new_count = old_count + 1
                # Sterge prefix "N × " existent din nume
                import re as _re2
                clean_name = _re2.sub(r'^\d+\s*[×x]\s*', '', existing["name"]).strip()
                new_name_count = f"{new_count} × {clean_name}"
                conn.execute("UPDATE shopping_list SET name=?, count=? WHERE id=?",
                             (new_name_count, new_count, existing["id"]))
        except Exception as e:
            print(f"Merge error: {e} - skipping merge")
            try:
                old_count = int(existing["count"] or 1)
            except Exception:
                old_count = 1
            new_count = old_count + 1
            import re as _re2
            clean_name = _re2.sub(r'^\d+\s*[×x]\s*', '', existing["name"]).strip()
            conn.execute("UPDATE shopping_list SET name=?, count=? WHERE id=?",
                         (f"{new_count} × {clean_name}", new_count, existing["id"]))
        # Sterge duplicate cu aceeasi baza de nume (cleanup)
        if username:
            dup_rows = conn.execute("SELECT id, name FROM shopping_list WHERE id!=? AND created_by=? AND done=0",
                                    (existing["id"], username)).fetchall()
        else:
            dup_rows = conn.execute("SELECT id, name FROM shopping_list WHERE id!=? AND done=0",
                                    (existing["id"],)).fetchall()
        for dup in dup_rows:
            if get_base(dup["name"]) == new_base:
                conn.execute("DELETE FROM shopping_list WHERE id=?", (dup["id"],))
        conn.commit()
        conn.close()
        return {"id": existing["id"], "status": "merged"}
    sid = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO shopping_list (id, name, quantity, unit, category, urgent, created_by, count) VALUES (?,?,?,?,?,?,?,?)",
        (sid, item.name, item.quantity or 0, item.unit, item.category, 1 if item.urgent else 0, username or "creator",
         1)
    )
    conn.commit()
    conn.close()
    return {"id": sid, "status": "added"}


# ─── SHOPPING CLEAR DONE ─────────────────────────────────────────────────────
@app.delete("/api/shopping/done")
async def clear_done_shopping(token: str = ""):
    conn = get_db()
    session = conn.execute("SELECT username, role FROM sessions WHERE token=?", (token,)).fetchone()
    username = session["username"] if session else None
    is_creator = session["role"] == "creator" if session else False
    if is_creator:
        conn.execute("DELETE FROM shopping_list WHERE done=1")
    elif username:
        conn.execute("DELETE FROM shopping_list WHERE done=1 AND created_by=?", (username,))
    conn.commit()
    conn.close()
    return {"status": "cleared"}


@app.post("/api/shopping/{item_id}/toggle")
async def toggle_shopping(item_id: str, token: str = ""):
    conn = get_db()
    session = conn.execute("SELECT username, role FROM sessions WHERE token=?", (token,)).fetchone()
    username = session["username"] if session else None
    is_creator = session["role"] == "creator" if session else False
    if is_creator:
        item = conn.execute("SELECT done FROM shopping_list WHERE id=?", (item_id,)).fetchone()
    elif username:
        item = conn.execute("SELECT done FROM shopping_list WHERE id=? AND created_by=?",
                            (item_id, username)).fetchone()
    else:
        item = None
    if item:
        conn.execute("UPDATE shopping_list SET done=? WHERE id=?", (0 if item["done"] else 1, item_id))
        conn.commit()
    conn.close()
    return {"status": "toggled"}


@app.delete("/api/shopping/{item_id}")
async def delete_shopping(item_id: str, token: str = ""):
    conn = get_db()
    session = conn.execute("SELECT username, role FROM sessions WHERE token=?", (token,)).fetchone()
    username = session["username"] if session else None
    is_creator = session["role"] == "creator" if session else False
    if is_creator:
        conn.execute("DELETE FROM shopping_list WHERE id=?", (item_id,))
    elif username:
        conn.execute("DELETE FROM shopping_list WHERE id=? AND created_by=?", (item_id, username))
    conn.commit()
    conn.close()
    return {"status": "deleted"}


# ─── PROFIL / USERS ──────────────────────────────────────────────────────────
@app.get("/api/auth/users")
async def list_users(token: str = ""):
    conn = get_db()
    session = conn.execute("SELECT username, role FROM sessions WHERE token=?", (token,)).fetchone()
    if not session or session["role"] != "creator":
        conn.close()
        return []
    rows = conn.execute("SELECT id, username, role, created_at FROM users ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.delete("/api/auth/users")
async def delete_user(token: str = "", username: str = ""):
    conn = get_db()
    session = conn.execute("SELECT username, role FROM sessions WHERE token=?", (token,)).fetchone()
    if not session or session["role"] != "creator":
        conn.close()
        return {"error": "unauthorized"}
    if username == session["username"]:
        conn.close()
        return {"error": "cannot delete yourself"}
    conn.execute("DELETE FROM users WHERE username=?", (username,))
    conn.execute("DELETE FROM sessions WHERE username=?", (username,))
    conn.commit()
    conn.close()
    return {"status": "deleted"}


@app.post("/api/auth/change-pin")
async def change_pin(token: str = "", old_pin: str = "", new_pin: str = ""):
    conn = get_db()
    session = conn.execute("SELECT username FROM sessions WHERE token=?", (token,)).fetchone()
    if not session:
        conn.close()
        return {"error": "unauthorized"}
    username = session["username"]
    user = conn.execute("SELECT password_hash FROM users WHERE username=?", (username,)).fetchone()
    if not user or user["password_hash"] != hash_password(old_pin):
        conn.close()
        return {"error": "pin_incorrect"}
    conn.execute("UPDATE users SET password_hash=? WHERE username=?", (hash_password(new_pin), username))
    conn.commit()
    conn.close()
    return {"status": "changed"}


# ─── PREFERINTE ──────────────────────────────────────────────────────────────
@app.get("/api/preferences")
async def get_preferences(token: str = ""):
    conn = get_db()
    session = conn.execute("SELECT username FROM sessions WHERE token=?", (token,)).fetchone()
    username = session["username"] if session else None
    if username:
        rows = conn.execute("SELECT * FROM user_preferences WHERE category=? OR category='general'",
                            (username,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM user_preferences WHERE category='general'").fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ─── SUGESTII (creator only) ──────────────────────────────────────────────────
@app.get("/api/suggestions")
async def get_suggestions(token: str = "", status: str = "pending"):
    conn = get_db()
    session = conn.execute("SELECT username, role FROM sessions WHERE token=?", (token,)).fetchone()
    if not session or session["role"] != "creator":
        conn.close()
        return []
    rows = conn.execute("SELECT * FROM suggestions WHERE status=? ORDER BY created_at DESC",
                        (status,)).fetchall() if status != "all" else conn.execute(
        "SELECT * FROM suggestions ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.get("/api/suggestions/stats")
async def get_suggestion_stats(token: str = ""):
    conn = get_db()
    session = conn.execute("SELECT username, role FROM sessions WHERE token=?", (token,)).fetchone()
    if not session:
        conn.close()
        return {}
    total = conn.execute("SELECT COUNT(*) as c FROM recipes WHERE created_by=?", (session["username"],)).fetchone()["c"]
    public = conn.execute("SELECT COUNT(*) as c FROM recipes WHERE created_by=? AND is_public=1",
                          (session["username"],)).fetchone()["c"]
    conn.close()
    return {"total_recipes": total, "public_recipes": public, "private_recipes": total - public}


@app.post("/api/suggestions/scan")
async def scan_suggestions(token: str = ""):
    conn = get_db()
    session = conn.execute("SELECT username, role FROM sessions WHERE token=?", (token,)).fetchone()
    conn.close()
    if not session or session["role"] != "creator":
        return {"error": "unauthorized"}
    return {"status": "scan_complete", "suggestions": []}


@app.post("/api/suggestions/{suggestion_id}/approve")
async def approve_suggestion(suggestion_id: str, token: str = ""):
    conn = get_db()
    session = conn.execute("SELECT username, role FROM sessions WHERE token=?", (token,)).fetchone()
    conn.close()
    if not session or session["role"] != "creator":
        return {"error": "unauthorized"}
    return {"status": "approved", "id": suggestion_id}


@app.post("/api/suggestions/{suggestion_id}/reject")
async def reject_suggestion(suggestion_id: str, token: str = ""):
    conn = get_db()
    session = conn.execute("SELECT username, role FROM sessions WHERE token=?", (token,)).fetchone()
    conn.close()
    if not session or session["role"] != "creator":
        return {"error": "unauthorized"}
    return {"status": "rejected", "id": suggestion_id}


@app.get("/api/debug/session")
async def debug_session(token: str = ""):
    conn = get_db()
    session = conn.execute("SELECT * FROM sessions WHERE token=?", (token,)).fetchone()
    all_sessions = conn.execute("SELECT token, username FROM sessions").fetchall()
    conn.close()
    return {
        "token_received": token,
        "session_found": dict(session) if session else None,
        "all_sessions": [dict(s) for s in all_sessions]
    }


# ─── EVENTS / TELEMETRY ───────────────────────────────────────────────────────
@app.post("/api/events")
async def track_event(request: Request):
    try:
        body = await request.json()
        event_type = body.get("event_type", "unknown")
        page = body.get("page", "")
        data = body.get("data", {})
        conn = get_db()
        conn.execute(
            "INSERT INTO events (event_type, page, data) VALUES (?,?,?)",
            (event_type, page, json.dumps(data))
        )
        conn.commit()
        conn.close()
    except:
        pass
    return {"status": "ok"}


# ─── RUN ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    # Fix pentru PyInstaller noconsole - stdout/stderr pot fi None
    if sys.stdout is None:
        sys.stdout = open(os.devnull, 'w')
    if sys.stderr is None:
        sys.stderr = open(os.devnull, 'w')

    # Logging simplu fara formatare avansata (compatibil noconsole)
    log_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "()": "uvicorn.logging.DefaultFormatter",
                "fmt": "%(levelprefix)s %(message)s",
                "use_colors": False,
            },
        },
        "handlers": {
            "default": {
                "formatter": "default",
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stderr",
            },
        },
        "loggers": {
            "uvicorn": {"handlers": ["default"], "level": "INFO"},
            "uvicorn.error": {"level": "INFO"},
            "uvicorn.access": {"handlers": ["default"], "level": "INFO", "propagate": False},
        },
    }

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_config=log_config
    )
