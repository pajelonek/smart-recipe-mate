# Dokument wymagań produktu (PRD) - HealthyMeal

## 1. Przegląd produktu

HealthyMeal to webowa aplikacja MVP wspierająca osoby planujące posiłki w dostosowywaniu jadłospisu do preferencji dietetycznych i ograniczeń alergicznych. System łączy proste konto użytkownika, obowiązkową konfigurację preferencji żywieniowych oraz repozytorium przepisów przechowywanych w ustandaryzowanej strukturze tekstowej (tytuł, składniki, przygotowanie). Kluczową przewagą jest integracja z czatem AI, który generuje od zera przepisy na podstawie podanych produktów z lodówki oraz zapisanych preferencji użytkownika, przekazując wynik w uzgodnionym formacie JSON. Aplikacja działa wyłącznie w przeglądarce desktopowej, a każda interakcja z AI, przepisy i preferencje są powiązane z kontem użytkownika.

## 2. Problem użytkownika

Użytkownicy z wymaganiami dietetycznymi muszą ręcznie dostosowywać przepisy znalezione w sieci, co jest czasochłonne, wymaga znajomości składników i często kończy się błędami skutkującymi alergiami lub brakiem zgodności z planem żywieniowym. Brakuje narzędzia, które zebrałoby preferencje od razu po rejestracji, pozwalało przechowywać przepisy w spójnym formacie oraz potrafiło wygenerować od podstaw dopasowany przepis z dostępnych składników. HealthyMeal eliminuje te bariery, prowadząc użytkownika przez konfigurację preferencji, zapewniając repozytorium własnych przepisów i udostępniając czat AI generujący nowe przepisy w kontekście tych danych.

## 3. Wymagania funkcjonalne

### 3.1 Konta i bezpieczeństwo
- Rejestracja konta na podstawie adresu e-mail i hasła z polityką złożoności oraz wymogiem potwierdzenia e-mail.
- Logowanie do aplikacji dostępne wyłącznie dla zweryfikowanych kont; sesja utrzymywana do wylogowania lub wygaśnięcia tokenu.
- Reset hasła z wykorzystaniem jednorazowego linku przesyłanego e-mailem.
- Ochrona zasobów po wylogowaniu (brak dostępu do przepisów i preferencji bez aktywnej sesji).

### 3.2 Onboarding preferencji
- Obowiązkowy pięcioetapowy kreator uruchamiany przy pierwszym logowaniu (intro, typ diety, preferowane składniki, kuchnie, alergie) bez możliwości pomijania kroków ani zapisu częściowego postępu.
- Każdy ekran waliduje wymagane pola przed przejściem dalej; przerwanie kreatora oznacza powrót do pierwszego kroku przy kolejnym logowaniu.
- Po ukończeniu kreatora profil oznacza się jako kompletny i przekierowuje użytkownika do repozytorium przepisów.

### 3.3 Profil preferencji
- Strona profilu prezentuje zapisane preferencje, status kompletności oraz datę i autora ostatniej modyfikacji.
- Użytkownik może edytować typ diety, preferowane składniki, alergie i kuchnie; zmiany są walidowane i zapisywane atomowo.
- Edycja preferencji aktualizuje metadane (data i autor) oraz wyzwala odświeżenie widoku przepisów w sesji użytkownika.


### 3.4 Repozytorium przepisów
- Przepisy przechowywane są jako tekst z trzema sekcjami obligatoryjnymi: tytuł, składniki, przygotowanie; brak dodatkowej walidacji poza obecnością sekcji.
- Lista przepisów pokazuje wpisy właściciela, zapewnia wyszukiwanie po tytule oraz filtr tagów dołączonych do przepisu.
- Każdy przepis może posiadać do 10 tagów; interfejs wspiera autouzupełnianie istniejących tagów i tworzenie nowych z natychmiastowym przypisaniem do użytkownika.

### 3.5 Generowanie przepisów przez AI
- Dedykowany widok umożliwia podanie listy dostępnych składników z lodówki oraz celów dietetycznych wynikających z preferencji profilu.
- Po wysłaniu danych AI generuje od zera nowy przepis w uzgodnionej strukturze (Summary, Ingredients, Preparation) i prezentuje go w interfejsie.
- Użytkownik może zaakceptować wygenerowany przepis, przypisać mu tagi i zapisać w repozytorium; odrzucenie zamyka wynik bez tworzenia wpisu.
- Każde zapytanie zapisuje historię konwersacji (produkt wejściowy, preferencje, odpowiedź AI) powiązaną z nowym przepisem.

### 3.6 Zarządzanie ręcznie dodanym przepisem
- Dodawanie przepisu odbywa się poprzez wklejenie treści do szablonu tekstowego; zapis tworzy rekord z metadanymi autora i datą utworzenia.
- Ręczna edycja przepisu nadpisuje jego treść, aktualizuje datę i autora ostatniej edycji oraz wyświetla snackbar z potwierdzeniem zapisu.
- Usunięcie przepisu wymaga potwierdzenia; po zatwierdzeniu przepis znika z listy i nie jest dalej dostępny.

### 3.7 Integracja AI i czat
- Czat AI komunikuje się z usługą AI poprzez REST, przekazując i odbierając wiadomości w strukturze JSON zgodnej ze specyfikacją API.
- Każda wiadomość wychodząca i przychodząca jest zapisywana wraz z identyfikatorem sesji; nowa sesja tworzona jest po każdym odświeżeniu aplikacji.
- Generowanie przepisu przez AI blokuje możliwość równoległego wysyłania kolejnych zapytań do czasu otrzymania odpowiedzi, po czym interfejs wymaga potwierdzenia zapisu.
- Integracja AI nie edytuje istniejących przepisów; służy wyłącznie do tworzenia nowych receptur.

### 3.7 Ostrzeżenia i bezpieczeństwo żywieniowe
- Przy zapisie przepisu system identyfikuje składniki oznaczone jako alergeny w profilu użytkownika i wyświetla ostrzeżenie bez blokowania zapisu.
- Ostrzeżenia są widoczne na liście i w widoku szczegółowym przepisu, zawierając listę wykrytych alergenów oraz link do pomocy.

### 3.8 Logowanie zdarzeń i stabilność
- Logowane są zdarzenia dotyczące interakcji z AI (wysłane polecenia, statusy odpowiedzi, błędy) oraz kluczowe działania użytkownika (utworzenie, edycja, usunięcie przepisu, zmiana preferencji).
- Błędy AI są przechowywane w bazie z kontekstem żądania, co umożliwia diagnostykę.

### 3.9 Dostępność i ograniczenia platformy
- Aplikacja wspiera najnowsze wersje przeglądarek desktopowych, bez natywnego wsparcia urządzeń mobilnych.
- Interfejs i komunikaty kierowane do użytkownika są w języku angielskim; dokumentacja wewnętrzna może pozostać dwujęzyczna.

## 4. Granice produktu

- Poza zakresem MVP: import przepisów z adresów URL, obsługa multimediów (obrazy, wideo, pliki), udostępnianie przepisów innym użytkownikom, funkcje społecznościowe, dodatkowe powiadomienia e-mail poza rejestracją i resetem, eksport przepisów oraz dashboard KPI.
- Zależności: dostawca usług e-mail dla weryfikacji i resetów, zewnętrzne API AI zwracające odpowiedzi w JSON, baza danych przechowująca konta, preferencje, przepisy i logi, system uwierzytelniania zdolny do bezpiecznego przechowywania haseł.
- Założenia: użytkownicy posiadają treści przepisu w formie tekstowej, akceptują regulamin obejmujący korzystanie z AI, dane preferencji i alergii definiują samodzielnie bez dodatkowej weryfikacji, aplikacja będzie rozwijana przez mały zespół bez odrębnego wsparcia mobilnego.
- Ryzyka i otwarte kwestie: brak zaplanowanej instrumentacji metryk sukcesu utrudni pomiar celów biznesowych, nieokreślony plan skalowania listy przepisów (paginacja, lazy loading) może ograniczyć wydajność przy rosnącej liczbie rekordów, niezawodność i koszty API AI wpływają na czas odpowiedzi, brak walidacji jakości treści przepisu może obniżać spójność danych.

## 5. Historyjki użytkowników

### US-001 Rejestracja konta e-mail
Opis: Jako nowy użytkownik chcę utworzyć konto za pomocą adresu e-mail, aby zapisywać preferencje i przepisy.
Kryteria akceptacji:
- Formularz wymaga unikalnego adresu e-mail, hasła spełniającego politykę złożoności oraz potwierdzenia hasła.
- Zarejestrowanie konta wysyła e-mail weryfikacyjny z jednorazowym linkiem aktywacyjnym.
- Dopóki e-mail nie zostanie potwierdzony, użytkownik nie może tworzyć ani modyfikować przepisów.

### US-002 Logowanie do zweryfikowanego konta
Opis: Jako zweryfikowany użytkownik chcę zalogować się do aplikacji, aby korzystać z mojego profilu i przepisów.
Kryteria akceptacji:
- Logowanie akceptuje wyłącznie poprawne zestawy e-mail/hasło powiązane ze zweryfikowanym kontem.
- Nieudane logowanie prezentuje ogólny komunikat o błędzie bez ujawniania, czy konto istnieje.
- Po zalogowaniu użytkownik trafia do kreatora, jeśli preferencje nie są kompletne, w przeciwnym razie na listę przepisów.

### US-003 Wylogowanie i ochrona zasobów
Opis: Jako zalogowany użytkownik chcę móc się wylogować i mieć pewność, że moje dane są chronione po zakończeniu sesji.
Kryteria akceptacji:
- Menu konta zawiera przycisk wylogowania, który natychmiast unieważnia token sesji.
- Dostęp do stron wymagających autoryzacji po wylogowaniu przekierowuje na ekran logowania.
- Próba użycia wygasłej sesji (np. otwartej w innej zakładce) wymaga ponownej autoryzacji.

### US-004 Reset hasła
Opis: Jako użytkownik, który zapomniał hasła, chcę odzyskać dostęp do konta.
Kryteria akceptacji:
- Formularz resetu przyjmuje adres e-mail i potwierdza wysłanie wiadomości niezależnie od tego, czy konto istnieje.
- Wiadomość resetująca zawiera jednorazowy link ważny przez skonfigurowany czas.
- Ustawienie nowego hasła umożliwia natychmiastowe logowanie z nowymi danymi.

### US-005 Obowiązkowy kreator preferencji
Opis: Jako nowy użytkownik chcę przejść przez pięć kroków kreatora, aby aplikacja poznała moje wymagania żywieniowe.
Kryteria akceptacji:
- Kreator uruchamia się automatycznie po pierwszym logowaniu i nie posiada przycisku pomiń.
- Każdy krok wymaga wypełnienia minimalnych pól przed przejściem dalej; powrót do poprzedniego kroku zachowuje wpisane dane.
- Zamknięcie aplikacji podczas kreatora skutkuje rozpoczęciem od kroku pierwszego przy kolejnym logowaniu.

### US-006 Edycja preferencji w profilu
Opis: Jako istniejący użytkownik chcę aktualizować swoje preferencje na stronie profilu.
Kryteria akceptacji:
- Widok profilu prezentuje bieżące wartości preferencji oraz datę i autora ostatniej zmiany.
- Formularz waliduje wymagane pola i blokuje zapis przy błędnych danych, wyświetlając wskazówki naprawcze.
- Zapis zmian natychmiast aktualizuje preferencje w sesji użytkownika i odświeża ostrzeżenia alergiczne.

### US-007 Przegląd listy przepisów
Opis: Jako użytkownik chcę widzieć listę moich przepisów, aby szybko uzyskać dostęp do treści.
Kryteria akceptacji:
- Lista prezentuje tytuł, datę i autora ostatniej edycji oraz znacznik ostrzeżeń alergicznych dla każdego przepisu.
- Domyślnie wyświetlane są wyłącznie przepisy właściciela konta.
- Kliknięcie pozycji otwiera widok szczegółowy z pełną treścią.

### US-008 Wyszukiwanie i filtrowanie przepisów
Opis: Jako użytkownik chcę wyszukiwać przepisy po tytule oraz filtrować je po tagach.
Kryteria akceptacji:
- Pole wyszukiwania filtruje listę w czasie rzeczywistym po częściowym dopasowaniu tytułu.
- Lista tagów umożliwia zaznaczenie jednego lub wielu tagów; wynik pokazuje przepisy spełniające wszystkie wybrane tagi.
- Usunięcie filtrów przywraca pełną listę bez przeładowania strony.

### US-009 Zarządzanie tagami przepisu
Opis: Jako użytkownik chcę dodawać i usuwać tagi przy przepisie, aby lepiej organizować repozytorium.
Kryteria akceptacji:
- Formularz dodawania przepisu oferuje pole tagów z autouzupełnianiem istniejących wartości.
- Użytkownik może tworzyć nowe tagi, o ile nie przekroczy limitu dziesięciu tagów na przepis.
- Usuwanie tagu z przepisu natychmiast aktualizuje listę widoczną dla użytkownika.

### US-010 Dodanie przepisu tekstowego
Opis: Jako użytkownik chcę dodać nowy przepis w wymaganym formacie tekstowym.
Kryteria akceptacji:
- Formularz wymaga obecności sekcji tytułu, składników i przygotowania przed zapisem.
- Po zapisie przepis zapisuje datę utworzenia oraz identyfikator autora i pojawia się na liście użytkownika.
- W przypadku brakujących sekcji system wyświetla jasny komunikat i nie zapisuje przepisu.

### US-011 Ręczna edycja przepisu
Opis: Jako użytkownik chcę zaktualizować ręcznie dodany przepis.
Kryteria akceptacji:
- Formularz edycyjny pokazuje aktualną treść przepisu z możliwością edycji wyłącznie w granicach szablonu tekstowego.
- Po zapisaniu interfejs wyświetla snackbar z potwierdzeniem, a przepis na liście aktualizuje datę i autora ostatniej edycji.
- Edycja nie tworzy dodatkowych wersji; dostępna jest jedynie najnowsza treść przepisu.

### US-012 Usunięcie przepisu
Opis: Jako użytkownik chcę usunąć przepis, który nie jest już potrzebny.
Kryteria akceptacji:
- Interfejs oferuje opcję usunięcia przepisu wraz z modalem potwierdzającym konsekwencje.
- Zatwierdzenie usunięcia permanentnie usuwa przepis z listy i uniemożliwia jego przywrócenie w MVP.
- Anulowanie potwierdzenia pozostawia przepis bez zmian.

### US-013 Generowanie przepisu na podstawie składników
Opis: Jako użytkownik chcę wprowadzić produkty dostępne w lodówce i otrzymać wygenerowany przez AI przepis dopasowany do moich preferencji.
Kryteria akceptacji:
- Formularz generowania przyjmuje listę składników oraz opcjonalne cele dietetyczne wynikające z profilu (np. high protein).
- Wysłanie formularza wywołuje zapytanie do API AI, które zwraca nowy przepis w strukturze JSON zawierającej sekcje Summary, Ingredients, Preparation.
- Użytkownik może zaakceptować lub odrzucić wygenerowany przepis; akceptacja zapisuje przepis w repozytorium, odrzucenie zamyka wynik bez tworzenia wpisu.

### US-014 Historia zapytań generowania przepisów
Opis: Jako użytkownik chcę widzieć historię moich zapytań do AI, aby wracać do poprzednio wygenerowanych receptur.
Kryteria akceptacji:
- Historia zapisuje każde zapytanie (lista składników, preferencje) wraz z otrzymaną odpowiedzią AI i statusem.
- Po odświeżeniu aplikacji nowa sesja rozpoczyna się od pustego formularza, ale historia pozostaje dostępna dla przepisów zapisanych w repozytorium.
- Historia przypisana jest do przepisu, jeśli został zapisany, oraz pozostaje dostępna w logach operacyjnych w przypadku odrzucenia.

### US-015 Obsługa braku propozycji AI
Opis: Jako użytkownik chcę otrzymać jasną informację, gdy AI nie potrafi wygenerować przepisu na podstawie podanych składników.
Kryteria akceptacji:
- W przypadku braku rekomendacji API zwraca komunikat, który interfejs prezentuje jako informację o braku rozwiązania.
- Komunikat sugeruje możliwe kolejne kroki (np. dodanie nowych składników, rozluźnienie preferencji dietetycznych).
- Po komunikacie użytkownik może wysłać kolejne zapytanie bez utraty dotychczasowych danych wejściowych.

### US-016 Ostrzeżenia o alergenach
Opis: Jako użytkownik z alergiami chcę otrzymać ostrzeżenie, gdy przepis zawiera niedozwolone składniki.
Kryteria akceptacji:
- Podczas zapisu przepisu system porównuje składniki z listą alergii w profilu.
- Wykryte alergeny wyświetlane są w modalnym ostrzeżeniu przed finalnym potwierdzeniem zapisu.
- Ostrzeżenia są również widoczne na liście przepisów i w widoku szczegółowym.

### US-017 Historia interakcji AI
Opis: Jako użytkownik chcę mieć dostęp do historii rozmów z AI, aby przeglądać wcześniejsze wyniki generowania.
Kryteria akceptacji:
- Historia prezentuje wszystkie zapytania użytkownika i odpowiedzi AI powiązane z generowanymi przepisami w kolejności chronologicznej.
- Każdy wpis zawiera znacznik czasu, dane wejściowe, status odpowiedzi i link do przepisu, jeśli został zapisany.
- Historia dostępna jest również po zakończeniu sesji przeglądarki.

### US-018 Logowanie zdarzeń AI dla wsparcia operacyjnego
Opis: Jako członek zespołu operacyjnego chcę mieć dostęp do logów AI, aby diagnozować błędy i monitorować działanie integracji.
Kryteria akceptacji:
- System zapisuje każde żądanie i odpowiedź AI wraz z kodem statusu i czasem trwania.
- Błędy AI są flagowane i dostępne w widoku diagnostycznym lub poprzez eksport danych operacyjnych.
- Logi przechowywane są bezterminowo w bazie na potrzeby analizy incydentów.

## 6. Metryki sukcesu

- 90% zarejestrowanych użytkowników uzupełnia wszystkie wymagane preferencje w ciągu 7 dni od utworzenia konta.
- 75% aktywnych użytkowników generuje co najmniej jeden przepis w tygodniu z użyciem integracji AI.
- Minimalne wskaźniki operacyjne (eksperymentalne): odsetek ukończeń kreatora podczas pierwszego logowania, średnia liczba zapisanych przepisów na użytkownika, odsetek odpowiedzi AI zakończonych błędem.
- Instrumentacja dla metryk biznesowych nie została jeszcze zaprojektowana; tymczasowe monitorowanie opiera się na logach zdarzeń do czasu wdrożenia dedykowanej analityki.

