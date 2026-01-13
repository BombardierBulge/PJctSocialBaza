# Platforma SocialBaza

Kompletna aplikacja społecznościowa z modularnym backendem **Node.js** i frontendem **React**.

## Struktura Projektu

Projekt podzielony jest na dwa główne komponenty:

*   **[Frontend](./Frontend/README.md)**: Interfejs użytkownika zbudowany w oparciu o React + Vite.
*   **[Backend](./Backend/README.md)**: Serwer API zbudowany w oparciu o Node.js + Express + TypeORM.

## Kluczowe Funkcje

*   **Pełny proces uwierzytelniania**: Rejestracja, Logowanie, Wylogowanie (z bezpiecznym hashowaniem haseł).
*   **Inteligentny Feed**: Algorytm priorytetyzujący posty obserwowanych użytkowników i popularne treści.
*   **Wsparcie dla Mediów**: Przesyłanie zdjęć, obsługa obrazków w postach (Markdown).
*   **Interakcje**: Lajkowanie postów (z wizualnym wskaźnikiem), Komentarze (Edycja/Usuwanie), Obserwowanie użytkowników.
*   **Profile**: W pełni edytowalne profile (Avatar, Bio, Lokalizacja, Strona WWW) i statystyki.
*   **Wyszukiwanie**: Znajdowanie użytkowników (Sortowane po popularności).
*   **Panel Administratora**:
    *   Dedykowany pulpit dla administratorów.
    *   Zarządzanie uprawnieniami użytkowników (Nadawanie/Odbieranie Admina).
    *   Moderacja treści (Usuwanie dowolnego posta/komentarza).
    *   Szczegółowe logowanie akcji administracyjnych.

## Przewodnik Szybkiego Startu

Aby uruchomić całą aplikację lokalnie, będziesz potrzebować dwóch okien terminala.

### 1. Uruchomienie Backend'u
```bash
cd Backend
npm install
# Upewnij się, że plik .env jest skonfigurowany (zobacz Backend/README.md)
npm run dev
```
*Serwer działa na porcie 3000.*

### 2. Uruchomienie Frontend'u
```bash
cd Frontend
npm install
npm run dev
```
*Aplikacja działa pod adresem http://localhost:5173.*

---

## Przegląd Architektury

*   **Separacja Baz Danych**: `socialbaza` (Dane Główne) i `socialbaza_auth` (Dane Uwierzytelniające) są przechowywane w oddzielnych bazach PostgreSQL dla zwiększenia bezpieczeństwa.
*   **Transakcje**: Operacje krytyczne (takie jak Rejestracja) wykorzystują symulację transakcji rozproszonych, aby zapewnić spójność danych między obiema bazami.

## Dokumentacja

Szczegółowe instrukcje dotyczące endpointów API lub ekranów Frontendu znajdują się w dedykowanych plikach README w każdym katalogu:

*   [Dokumentacja Frontend](./Frontend/README.md)
*   [Dokumentacja Backend](./Backend/README.md)