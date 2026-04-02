# Utilize Context Managers for SQLite Connections

**Status:** Aprobat  
**Categorie:** refactor  
**Fi?ier ?inta:** retetar_api.py  
**Confidence:** 0.9  
**Data:** 01.04.2026 08:11

## Descriere
Inlocuieste apelurile manuale `get_db()` si `conn.close()` cu declaratii `with sqlite3.connect(DB_PATH) as conn:` pentru a gestiona automat ciclul de viata al conexiunilor la baza de date SQLite, asigurand inchiderea corespunzatoare chiar si in caz de erori.

## Motiva?ie
Imbunatateste gestionarea resurselor si robustetea codului. Utilizarea context manager-ilor previne scurgerile de conexiuni, simplifica tratarea erorilor si asigura ca toate tranzactiile sunt fie comise, fie anulate in mod explicit sau implicit la iesirea din blocul `with`.

## Cod sugerat
```python
            # Asumand ca `get_db()` este o functie simpla de `sqlite3.connect` si ca AppConfig.DB_PATH este disponibil
            with sqlite3.connect(AppConfig.DB_PATH) as conn:
                conn.row_factory = sqlite3.Row # Adauga aceasta linie daca randurile ar trebui sa fie accesibile prin nume (exemplu)
                existing_titles = [r[0].lower() for r in conn.execute(
                    "SELECT title FROM suggestions WHERE status IN ('pending', 'approved', 'rejected')"
                ).fetchall()]
```
