# Social Media Backend

Backend systemu społecznościowego oparty na architekturze z dwiema bazami danych (Main + Auth), wykorzystujący REST API, PostgreSQL oraz transakcje rozproszone.

## Funkcjonalności

* **Rejestracja i Logowanie:** Bezpieczne tworzenie konta i weryfikacja tożsamości.
* **Bezpieczeństwo:** Hasła są hashowane przy użyciu `bcrypt` i przechowywane w odseparowanej bazie danych.
* **Użytkownicy i Profile:** Zarządzanie danymi osobowymi.
* **Interakcje:** Posty, komentarze, system polubień, relacje obserwowania.
* **Architektura:** Rozdzielenie danych biznesowych (Main DB) od danych uwierzytelniających (Auth DB).

## Technologie

* **Runtime:** Node.js + Express
* **Język:** TypeScript
* **ORM:** TypeORM
* **Baza danych:** PostgreSQL (x2)
* **Bezpieczeństwo:** bcrypt (hashowanie haseł)
* **Inne:** dotenv, body-parser

## Szybki start

### Wymagania

* Node.js 14+
* PostgreSQL 12+

### Instalacja

```bash
# 1. Klonuj repozytorium
git clone <twoje-repo>
cd <nazwa-projektu>

# 2. Zainstaluj zależności
npm install

# 3. Skonfiguruj bazy danych
createdb socialbaza_main      # Baza główna
createdb socialbaza_auth      # Baza autoryzacji

# (Opcjonalnie) Jeśli posiadasz pliki backupu .sql:
# psql -d socialbaza_main < socialbaza_main_backup.sql
# psql -d socialbaza_auth < socialbaza_auth_backup.sql

# 4. Zmienne środowiskowe
cp .env.example .env
# Upewnij się, że dane w .env pasują do Twojej konfiguracji PostgreSQL!

# 5. Uruchom aplikację
npm run dev

```

## API Endpoints

### Autentykacja (POST)

**Rejestracja użytkownika:**
`POST /User`

```json
{
  "username": "bocian",
  "email": "test@test.pl",
  "password": "silne_haslo",
  "bio": "Programista Node.js",
  "location": "PL"
}

```

**Logowanie:**
`POST /Login`

```json
{
  "username": "bocian",
  "password": "silne_haslo"
}

```

### Dane (GET)

* `GET /User` - lista użytkowników
* `GET /Post` - lista wszystkich postów
* `GET /Post/:id` - szczegóły konkretnego posta
* `GET /Comment/post/:postId` - komentarze dla danego posta
* `GET /UserProfile/:userId` - profil użytkownika

### Testowanie

```bash
# Pobranie listy userów
curl http://localhost:3000/User

# Próba logowania
curl -X POST -H "Content-Type: application/json" -d '{"username":"bocian", "password":"silne_haslo"}' http://localhost:3000/Login

```

## Struktura Baz Danych

System wykorzystuje dwie instancje/bazy PostgreSQL dla zwiększenia bezpieczeństwa:

1. **socialbaza_main** – przechowuje dane publiczne/biznesowe:
* `users` (dane jawne: login, email)
* `user_profiles` (bio, awatar)
* `posts`, `comments`, `likes`


2. **socialbaza_auth** – przechowuje dane wrażliwe:
* `user_passwords` (hashed password + referencja do user_id)



## Skrypty

```bash
npm run dev      # Tryb developerski (nodemon)
npm run build    # Kompilacja TypeScript do JavaScript
npm start        # Uruchomienie wersji produkcyjnej (z folderu dist)

```

## Uwagi

* Pamiętaj, aby plik `.env` zawierał poprawne poświadczenia do obu baz danych.
* Hasła w bazie `socialbaza_auth` są nieodwracalnie zahashowane (nie są widoczne tekstem jawnym).

## Licencja

MIT