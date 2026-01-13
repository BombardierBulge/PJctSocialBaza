# SocialBaza Frontend

Nowoczesny, responsywny interfejs mediów społecznościowych zbudowany w oparciu o **React** i **Vite**.

## 🚀 Pierwsze kroki

### Wymagania wstępne
- Zainstalowane środowisko Node.js

### Instalacja

1. Przejdź do katalogu Frontend:
   ```bash
   cd Frontend
   ```
2. Zainstaluj zależności:
   ```bash
   npm install
   ```

### Uruchamianie aplikacji

Uruchom serwer deweloperski:
```bash
npm run dev
```
Aplikacja będzie dostępna pod adresem `http://localhost:5173`.

---

## 📱 Funkcje i Ekrany

### 1. **Uwierzytelnianie**
- **Logowanie**: Bezpieczne logowanie za pomocą Emaila lub Nazwy użytkownika. Obsługa trwałych sesji poprzez LocalStorage.
- **Rejestracja**: Tworzenie nowego konta z nazwą użytkownika, e-mailem i hasłem.

### 2. **Strona Główna (Feed)**
- **Przeglądanie Postów**: Przewijaj strumień postów od wszystkich użytkowników.
- **Tworzenie Postów**: Dziel się przemyśleniami za pomocą tekstu i **zdjęć** (obsługa przesyłania plików).
- **Interakcje**:
  - **Polubienia**: Lajkuj posty, aby okazać uznanie.
  - **Komentarze**: Komentuj posty, aby dołączyć do dyskusji.
  - **Usuwanie**: Usuwaj własne posty (lub dowolne, jeśli jesteś Administratorem).

### 3. **Profile**
- **Profil Użytkownika**: Wyświetlaj szczegóły użytkownika, biogram, lokalizację i stronę www.
- **Zarządzanie Awatarem**: Prześlij własne zdjęcie profilowe (kliknij na swój awatar).
- **System Obserwacji**: Obserwuj/Przestań obserwować użytkowników, aby budować swoją sieć.
- **Historia Postów**: Przeglądaj wszystkie posty opublikowane przez konkretnego użytkownika.

### 4. **Wyszukiwanie**
- **Znajdź Użytkowników**: Szukaj innych użytkowników po nazwie, aby znaleźć ich profile.

### 5. **Panel Administratora** (Dostęp Ograniczony)
- *Dostępny tylko dla użytkowników z uprawnieniami Administratora.*
- **Lista Użytkowników**: Przeglądaj tabelę wszystkich zarejestrowanych użytkowników.
- **Wyszukiwanie**: Filtruj użytkowników po nazwie lub e-mailu.
- **Zarządzanie Uprawnieniami**: Przełączaj status "Admin" dla dowolnego użytkownika (Nadaj/Odbierz).

---

## 🛠 Stos Technologiczny

- **Framework**: React
- **Narzędzie budowania**: Vite
- **Style**: Czysty CSS (Własny Design System)
- **Klient HTTP**: Axios
- **Routing**: React Router DOM
