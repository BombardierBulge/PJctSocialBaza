# Social Media Backend

Prosty backend systemu społecznościowego z REST API i PostgreSQL.

## Szybki start

### Wymagania
- Node.js 14+
- PostgreSQL 12+

### Instalacja
```bash
# 1. Klonuj repozytorium
git clone <twoje-repo>
cd <nazwa-projektu>

# 2. Zainstaluj zależności
npm install

# 3. Utwórz bazy danych
createdb socialbaza
createdb socialbaza_auth

# 4. Skonfiguruj zmienne środowiskowe
cp .env.example .env
# Edytuj .env według potrzeb

# 5. Uruchom aplikację
npm run dev
```

## Funkcjonalności
- Użytkownicy i profile
- Posty, komentarze, polubienia
- Relacje obserwowania
- 14 endpointów REST API
- Automatyczne seedowanie danych

## API Endpoints

### Podstawowe endpointy
- `GET /User` - lista użytkowników
- `GET /Post` - lista postów
- `GET /Post/:id` - szczegóły posta
- `GET /Comment/post/:postId` - komentarze do posta
- `GET /UserProfile/:userId` - profil użytkownika

### Testowanie
```bash
# Przykładowe zapytanie
curl http://localhost:3000/User
```

## Baza danych
- **socialbaza** - główna baza (użytkownicy, posty, komentarze)
- **socialbaza_auth** - baza haseł (oddzielna dla bezpieczeństwa)

## Technologie
- Node.js + Express
- TypeScript + TypeORM
- PostgreSQL
- dotenv (zmienne środowiskowe)

## Skrypty
```bash
npm run dev      # Tryb developerski
npm run build    # Kompilacja TypeScript
npm start        # Uruchomienie produkcyjne
```

## ⚠️ Uwagi
- Hasła przechowywane w oddzielnej bazie
- Brak autentykacji w obecnej wersji (tylko do celów edukacyjnych)
- Wszystkie endpointy są typu GET (tylko odczyt)

## 📄 Licencja
MIT