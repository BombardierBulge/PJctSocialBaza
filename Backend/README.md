# Social Media Backend

Backend platformy SocialBaza oparty na **Node.js** + **TypeScript**. Wykorzystuje **modularną architekturę kontrolerów** i komunikuje się z bazami danych **PostgreSQL** poprzez **TypeORM**.

##  Architektura

System został zaprojektowany z myślą o bezpieczeństwie i skalowalności:
*   **Główna Baza Danych (`socialbaza`)**: Przechowuje dane biznesowe (Użytkownicy, Posty, Komentarze, Polubienia, Profile, Obserwacje).
*   **Baza Uwierzytelniania (`socialbaza_auth`)**: Przechowuje wrażliwe dane uwierzytelniające (Hashe haseł) oddzielnie.
*   **Modularne Kontrolery**: Logika jest rozdzielona pomiędzy `AuthController`, `UserController`, `PostController`, `InteractionController` oraz `AdminController`.

##  Pierwsze kroki

### Wymagania wstępne
*   Node.js 16+
*   PostgreSQL 12+

### Instalacja

1.  Przejdź do katalogu Backend:
    ```bash
    cd Backend
    ```
2.  Zainstaluj zależności:
    ```bash
    npm install
    ```
3.  Skonfiguruj Zmienne Środowiskowe:
    *   Utwórz plik `.env` na podstawie `.env.example`.
    *   Upewnij się, że dane logowania do bazy danych są poprawne.

4.  Uruchom Serwer:
    *   **Development**:
        ```bash
        npm run dev
        ```
    *   **Produkcja**:
        ```bash
        npm start
        ```
    *   Serwer działa domyślnie na porcie `3000`.

---

##  Endpointy API

###  Uwierzytelnianie (`AuthController`)
*   `POST /User` - **Rejestracja** nowego użytkownika. (Transakcyjna)
*   `POST /Login` - **Logowanie** (zwraca obiekt użytkownika + avatarUrl).
*   `GET /UserPassword` - (Debug) Podgląd zahashowanych haseł.

###  Użytkownicy i Profile (`UserController`)
*   `GET /User` - Lista wszystkich użytkowników.
*   `GET /User/:id` - Szczegóły użytkownika po ID.
*   `GET /User/search/:q` - **Wyszukiwanie** użytkowników po nazwie (Sortowane po liczbie obserwujących).
*   `GET /UserProfile` - Lista wszystkich profili.
*   `GET /UserProfile/:userId` - Pełny profil (Bio, Statystyki, Posty) konkretnego użytkownika.
*   `PUT /UserProfile` - **Aktualizacja Profilu** (Bio, Lokalizacja, Strona WWW). (Transakcyjna)
*   `PUT /UserProfile/avatar` - **Przesyłanie Awatara** (Multipart/Form-Data). (Transakcyjna)

###  Posty (`PostController`)
*   `GET /Post` - Lista wszystkich postów (z autorami, polubieniami, komentarzami).
*   `POST /Post` - Tworzenie nowego posta (Obsługuje obrazki w Markdown/Upload).
*   `GET /Post/:id` - Pobranie konkretnego posta.
*   `PUT /Post/:id` - Edycja posta.
*   `DELETE /Post/:id` - Usuwanie posta (Właściciel lub Admin).
*   `GET /Feed/:userId` - Spersonalizowany strumień (feed). **Algorytm**: Obserwowani -> Popularne -> Najnowsze.

###  Interakcje (`InteractionController`)
*   `POST /Like/toggle` - Polub/Odlub post.
*   `GET /Like` - Lista wszystkich polubień.
*   `GET /Like/post/:postId` - Polubienia dla konkretnego posta.
*   `POST /Comment` - Dodaj komentarz.
*   `GET /Comment` - Lista wszystkich komentarzy.
*   `GET /Comment/post/:postId` - Pobierz komentarze dla posta.
*   `PUT /Comment/:id` - Edycja komentarza (Właściciel).
*   `DELETE /Comment/:id` - Usuń komentarz (Właściciel lub Admin).
*   `POST /Follow/toggle` - Obserwuj/Przestań obserwować użytkownika.
*   `GET /Follow` - Lista wszystkich relacji obserwowania.

###  Admin (`AdminController`)
*   `POST /Admin/toggle` - **Nadaj lub Odbierz** uprawnienia Administratora.
    *   *Payload*: `{ target_user_id: number }`
    *   *Nagłówki*: `x-user-id` (ID Wnioskującego, musi być adminem).
    *   *Logi*: Akcje są zapisywane w pliku `admin_actions.log`.

###  Pliki
*   `POST /upload` - **Przesyłanie Obrazka**. Zwraca ścieżkę do pliku.
    *   Odpowiedź: `{ "path": "/uploads/filename.jpg" }`

---

##  Stos Technologiczny
*   **Express**: Framework webowy.
*   **TypeORM**: ORM do bazy danych.
*   **PostgreSQL**: Baza danych.
*   **Multer**: Przesyłanie plików.
*   **Bcrypt**: Hashowanie haseł.