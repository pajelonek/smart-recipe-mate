# Dokument wymagań produktu (PRD) - Smart Recipe Mate

## 1. Przegląd produktu

Smart Recipe Mate to webowa aplikacja MVP wspierająca osoby planujące posiłki w dostosowywaniu jadłospisu do preferencji dietetycznych. System łączy proste konto użytkownika, obowiązkową konfigurację preferencji żywieniowych oraz repozytorium przepisów przechowywanych w ustandaryzowanej strukturze tekstowej (tytuł, składniki, przygotowanie). Kluczową przewagą jest integracja z AI, która generuje od zera przepisy na podstawie podanych produktów z lodówki oraz zapisanych preferencji użytkownika, przekazując wynik w uzgodnionym formacie JSON. Aplikacja działa wyłącznie w przeglądarce desktopowej, a każda generacja AI, przepisy i preferencje są powiązane z kontem użytkownika.

## 2. Problem użytkownika

Użytkownicy z wymaganiami dietetycznymi muszą ręcznie dostosowywać przepisy znalezione w sieci, co jest czasochłonne, wymaga znajomości składników i często kończy się brakiem zgodności z planem żywieniowym. Brakuje narzędzia, które zebrałoby preferencje od razu po rejestracji, pozwalało przechowywać przepisy w spójnym formacie oraz potrafiło wygenerować od podstaw dopasowany przepis z dostępnych składników. HealthyMeal eliminuje te bariery, prowadząc użytkownika przez konfigurację preferencji, zapewniając repozytorium własnych przepisów i udostępniając generowanie AI tworzące nowe przepisy w kontekście tych danych.

## 3. Wymagania funkcjonalne

### 3.1 Onboarding preferencji

- Obowiązkowy kreator preferencji uruchamiany przy pierwszym logowaniu zbiera: typ diety, preferowane składniki, kuchnie oraz allergens.
- Frontend może prezentować kreator jako wieloetapowy formularz, ale stan kroków zarządzany jest po stronie klienta (np. w pamięci lub localStorage).
- Po ukończeniu kreatora system zapisuje preferencje do tabeli user_preferences i przekierowuje użytkownika do strony dashboardu.
- Status onboardingu: użytkownik jest uznawany za "onboarded" jeśli posiada rekord w user_preferences.

### 3.2 Profil preferencji

- Strona profilu prezentuje zapisane preferencje oraz datę ostatniej modyfikacji.
- Użytkownik może edytować typ diety, preferowane składniki, allergens i kuchnie; zmiany są walidowane i zapisywane atomowo.
- Edycja preferencji aktualizuje datę modyfikacji oraz wyzwala odświeżenie widoku przepisów w sesji użytkownika.
- Do profilu preferencji mozemy przejsc klikajac w ikonke avatara po prawej stroni navbaru i z listy wybieraniej klikamy "Konto".

### 3.3 Repozytorium przepisów

- Przepisy przechowywane są jako tekst z trzema sekcjami obligatoryjnymi: tytuł, składniki, przygotowanie; brak dodatkowej walidacji poza obecnością sekcji.
- Lista przepisów pokazuje wpisy właściciela, zapewnia wyszukiwanie po tytule oraz filtr tagów dołączonych do przepisu.
- Każdy przepis może posiadać do 10 tagów; interfejs wspiera autouzupełnianie istniejących tagów i tworzenie nowych z natychmiastowym przypisaniem do użytkownika.

### 3.4 Generowanie przepisów przez AI

- Dedykowany widok umożliwia podanie listy dostępnych składników z lodówki oraz celów dietetycznych wynikających z preferencji profilu.
- Po wysłaniu danych AI generuje od zera nowy przepis w uzgodnionej strukturze (Summary, Ingredients, Preparation) i prezentuje go w interfejsie.
- Użytkownik może zaakceptować wygenerowany przepis, przypisać mu tagi i zapisać w repozytorium; odrzucenie zamyka wynik bez tworzenia wpisu.
- Każde zapytanie zapisuje dane wejściowe (input_payload) i odpowiedź AI (output_payload) w tabeli generacji, co umożliwia powiązanie przepisu z jego źródłem.

### 3.5 Zarządzanie ręcznie dodanym przepisem

- Dodawanie przepisu odbywa się poprzez wklejenie treści do szablonu tekstowego; zapis tworzy rekord z datą utworzenia powiązany z właścicielem.
- Ręczna edycja przepisu nadpisuje jego treść, aktualizuje datę ostatniej edycji oraz wyświetla snackbar z potwierdzeniem zapisu.
- Usunięcie przepisu wymaga potwierdzenia; po zatwierdzeniu przepis jest oznaczany jako usunięty (soft delete) i znika z listy użytkownika.

### 3.6 Integracja AI

- Interfejs generowania komunikuje się z usługą AI poprzez REST, przekazując i odbierając dane w strukturze JSON zgodnej ze specyfikacją API.
- Każde zapytanie AI tworzy rekord generacji zawierający dane wejściowe (input_payload), odpowiedź (output_payload) oraz ewentualny komunikat błędu.
- Generowanie przepisu przez AI blokuje możliwość równoległego wysyłania kolejnych zapytań do czasu otrzymania odpowiedzi, po czym interfejs wymaga potwierdzenia zapisu.
- Integracja AI nie edytuje istniejących przepisów; służy wyłącznie do tworzenia nowych receptur.

### 3.7 Obsługa błędów AI

- Błędy podczas generowania przepisów są przechowywane w tabeli generacji AI wraz z pełnym kontekstem żądania (input_payload) oraz komunikatem błędu.
- Interfejs prezentuje użytkownikowi czytelny komunikat o błędzie z możliwością ponowienia próby.


## 4. Granice produktu

- Poza zakresem MVP: import przepisów z adresów URL, obsługa multimediów (obrazy, wideo, pliki), udostępnianie przepisów innym użytkownikom, funkcje społecznościowe, dodatkowe powiadomienia e-mail poza rejestracją i resetem, eksport przepisów oraz dashboard KPI.
- Zależności: dostawca usług e-mail dla weryfikacji i resetów, zewnętrzne API AI zwracające odpowiedzi w JSON, baza danych przechowująca konta, preferencje, przepisy i logi, system uwierzytelniania zdolny do bezpiecznego przechowywania haseł.
- Założenia: użytkownicy posiadają treści przepisu w formie tekstowej, akceptują regulamin obejmujący korzystanie z AI, dane preferencji definiują samodzielnie bez dodatkowej weryfikacji, aplikacja będzie rozwijana przez mały zespół bez odrębnego wsparcia mobilnego.
- Ryzyka i otwarte kwestie: brak zaplanowanej instrumentacji metryk sukcesu utrudni pomiar celów biznesowych, nieokreślony plan skalowania listy przepisów (paginacja, lazy loading) może ograniczyć wydajność przy rosnącej liczbie rekordów, niezawodność i koszty API AI wpływają na czas odpowiedzi, brak walidacji jakości treści przepisu może obniżać spójność danych.

## 5. Historyjki użytkowników

## US-001: Bezpieczny dostęp i uwierzytelnianie

- Tytuł: Bezpieczny dostęp
- Opis: Jako użytkownik chcę mieć możliwość rejestracji i logowania się do systemu w sposób zapewniający bezpieczeństwo moich danych.
- Kryteria akceptacji:
  - Logowanie i rejestracja odbywają się na dedykowanych stronach.
  - Logowanie wymaga podania adresu email i hasła.
  - Rejestracja wymaga podania adresu email, hasła i potwierdzenia hasła.
  - Użytkownik NIE MOŻE miec dostepu do wszelkiego api bez logowania.
  - Użytkownik może logować się do systemu poprzez przycisk w prawym górnym rogu.
  - Użytkownik może się wylogować z systemu poprzez przycisk w prawym górnym rogu w głównym @Layout.astro.
  - Nie korzystamy z zewnętrznych serwisów logowania (np. Google, GitHub).
  - Odzyskiwanie hasła powinno być możliwe.
  - Po zalogowaniu user jezeli nie posiada preferencji to uruchamiamy obowiazkowy kreator (US-005)
  - Jezeli uzytkonik nie jest zalogowany to pokazujemy mu pusta reklamowa strone z przyciskiem zaloguj sie i informacja co aplikacja robi.

### US-005 Obowiązkowy kreator preferencji

Opis: Jako nowy użytkownik chcę wypełnić kreator preferencji, aby aplikacja poznała moje wymagania żywieniowe.
Kryteria akceptacji:

- Kreator uruchamia się automatycznie po pierwszym logowaniu dla użytkowników bez zapisanych preferencji.
- Formularz wymaga wypełnienia wszystkich wymaganych pól (typ diety) przed zapisem; pozostałe pola są opcjonalne.
- Stan formularza może być zarządzany przez frontend (wieloetapowy UI) - przerwanie powoduje utratę danych i restart przy kolejnym logowaniu.
- Po zapisaniu preferencji użytkownik jest przekierowywany do strony dashboardu (strona główna `/` zawierająca repozytorium przepisów).
- Uzytkonik nie ma mozliwosci wylaczenia tego kreatora, nie moze korzystac z serwisu po zalogowaniu bez wypelnienia tego kreatora.

### US-006 Edycja preferencji w profilu

Opis: Jako istniejący użytkownik chcę aktualizować swoje preferencje na stronie profilu.
Kryteria akceptacji:

- Widok profilu prezentuje bieżące wartości preferencji oraz datę ostatniej modyfikacji.
- Formularz waliduje wymagane pola i blokuje zapis przy błędnych danych, wyświetlając wskazówki naprawcze.
- Zapis zmian natychmiast aktualizuje preferencje w sesji użytkownika.

### US-007 Przegląd listy przepisów

Opis: Jako użytkownik chcę widzieć listę moich przepisów, aby szybko uzyskać dostęp do treści.
Kryteria akceptacji:

- Lista prezentuje tytuł oraz datę ostatniej edycji dla każdego przepisu.
- Domyślnie wyświetlane są wyłącznie aktywne przepisy właściciela konta (nieusunięte).
- Kliknięcie pozycji otwiera widok szczegółowy z pełną treścią.

### US-008 Wyszukiwanie i filtrowanie przepisów

Opis: Jako użytkownik chcę wyszukiwać przepisy po tytul.
Kryteria akceptacji:

- Pole wyszukiwania filtruje listę w czasie rzeczywistym po częściowym dopasowaniu tytułu.
- Lista tagów umożliwia zaznaczenie jednego lub wielu tagów; wynik pokazuje przepisy spełniające wszystkie wybrane tagi.
- Usunięcie filtrów przywraca pełną listę bez przeładowania strony.

### US-010 Dodanie przepisu tekstowego

Opis: Jako użytkownik chcę dodać nowy przepis w wymaganym formacie tekstowym.
Kryteria akceptacji:

- Formularz wymaga obecności sekcji tytułu, składników i przygotowania przed zapisem.
- Po zapisie przepis zapisuje datę utworzenia oraz identyfikator właściciela (owner_id) i pojawia się na liście użytkownika.
- W przypadku brakujących sekcji system wyświetla jasny komunikat i nie zapisuje przepisu.

### US-011 Ręczna edycja przepisu

Opis: Jako użytkownik chcę zaktualizować ręcznie dodany przepis.
Kryteria akceptacji:

- Formularz edycyjny pokazuje aktualną treść przepisu z możliwością edycji wyłącznie w granicach szablonu tekstowego.
- Po zapisaniu interfejs wyświetla snackbar z potwierdzeniem, a przepis na liście aktualizuje datę ostatniej edycji.
- Edycja nie tworzy dodatkowych wersji; dostępna jest jedynie najnowsza treść przepisu.

### US-012 Usunięcie przepisu

Opis: Jako użytkownik chcę usunąć przepis, który nie jest już potrzebny.
Kryteria akceptacji:

- Interfejs oferuje opcję usunięcia przepisu wraz z modalem potwierdzającym konsekwencje.
- Zatwierdzenie usunięcia oznacza przepis jako usunięty (ustawia deleted_at), przez co znika z listy użytkownika.
- Anulowanie potwierdzenia pozostawia przepis bez zmian.
- Usunięty przepis nie jest wyświetlany w liście, ale dane pozostają w bazie dla integralności referencyjnej.

### US-013 Generowanie przepisu na podstawie składników

Opis: Jako użytkownik chcę wprowadzić produkty dostępne w lodówce i otrzymać wygenerowany przez AI przepis dopasowany do moich preferencji.
Kryteria akceptacji:

- Formularz generowania przyjmuje listę składników oraz opcjonalne cele dietetyczne wynikające z profilu (np. high protein).
- Wysłanie formularza wywołuje zapytanie do API AI, które zwraca nowy przepis w strukturze JSON zawierającej sekcje Summary, Ingredients, Preparation.
- Użytkownik może zaakceptować lub odrzucić wygenerowany przepis; akceptacja zapisuje przepis w repozytorium, odrzucenie zamyka wynik bez tworzenia wpisu.

### US-014 Historia generacji przepisów

Opis: Jako użytkownik chcę widzieć historię moich generacji AI, aby wracać do poprzednio wygenerowanych receptur.
Kryteria akceptacji:

- System zapisuje każdą generację AI (input_payload, output_payload) wraz z datą utworzenia.
- Użytkownik może przeglądać historię swoich generacji AI.
- Historia generacji zawiera pełny kontekst wejściowy i wyjściowy każdego zapytania.

### US-015 Obsługa braku propozycji AI

Opis: Jako użytkownik chcę otrzymać jasną informację, gdy AI nie potrafi wygenerować przepisu na podstawie podanych składników.
Kryteria akceptacji:

- W przypadku braku rekomendacji API zwraca komunikat, który interfejs prezentuje jako informację o braku rozwiązania.
- Komunikat sugeruje możliwe kolejne kroki (np. dodanie nowych składników, rozluźnienie preferencji dietetycznych).
- Po komunikacie użytkownik może wysłać kolejne zapytanie bez utraty dotychczasowych danych wejściowych.

### US-016 Przeglądanie generacji AI

Opis: Jako użytkownik chcę mieć dostęp do historii generacji AI, aby przeglądać wcześniejsze wyniki.
Kryteria akceptacji:

- System przechowuje wszystkie rekordy generacji AI (ai_generations) powiązane z użytkownikiem.
- Każdy rekord zawiera znacznik czasu utworzenia, dane wejściowe (input_payload), odpowiedź AI (output_payload) oraz ewentualny błąd.
- Użytkownik może przeglądać zapisane przepisy z AI i zobaczyć powiązane dane generacji.

### US-017 Diagnostyka błędów AI

Opis: Jako członek zespołu operacyjnego chcę mieć dostęp do rekordów generacji AI, aby diagnozować błędy integracji.
Kryteria akceptacji:

- System zapisuje każdą generację AI w tabeli ai_generations wraz z pełnym kontekstem (input_payload, output_payload, error_message).
- Rekordy z wypełnionym polem error_message wskazują nieudane generacje.
- Dane przechowywane są w bazie na potrzeby analizy i diagnostyki.

## 6. Metryki sukcesu

- 90% zarejestrowanych użytkowników uzupełnia wszystkie wymagane preferencje w ciągu 7 dni od utworzenia konta.
- 75% aktywnych użytkowników generuje co najmniej jeden przepis w tygodniu z użyciem integracji AI.
- Minimalne wskaźniki operacyjne (eksperymentalne): odsetek ukończeń kreatora podczas pierwszego logowania, średnia liczba zapisanych przepisów na użytkownika, odsetek odpowiedzi AI zakończonych błędem.
- Instrumentacja dla metryk biznesowych nie została jeszcze zaprojektowana; tymczasowe monitorowanie opiera się na logach zdarzeń do czasu wdrożenia dedykowanej analityki.
