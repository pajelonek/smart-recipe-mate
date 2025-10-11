# Dokument wymagań produktu (PRD) - HealthyMeal

## 1. Przegląd produktu

HealthyMeal to webowa aplikacja MVP wspierająca osoby planujące posiłki poprzez personalizację istniejących przepisów z wykorzystaniem AI. Produkt adresuje użytkowników domowych lub entuzjastów fitness, którzy samodzielnie gotują i muszą uwzględniać wymagania dietetyczne, alergie lub preferencje smakowe. Kluczowa propozycja wartości polega na tym, że system przechowuje preferencje użytkownika, pozwala ręcznie dodawać przepisy w ustandaryzowanym formacie oraz modyfikuje je na czacie z AI, zachowując historię zmian.

Główne komponenty MVP obejmują prosty moduł kont, pięcioetapowy kreator zbierający preferencje (intro, wybór kuchni, wybór typu diety, preferowane składniki, alergie), profil użytkownika z możliwością późniejszej edycji, repozytorium przepisów z wersjonowaniem, interfejs czatu z AI zwracający odpowiedzi w ustalonej strukturze oraz powiadomienia e-mail ograniczone do potwierdzenia rejestracji i resetu hasła. Interfejs i odpowiedzi AI są wyłącznie w języku angielskim, natomiast proces projektowania i dokumentacja pozostają dwujęzyczne według potrzeb zespołu.

Założenia: użytkownicy dodają przepisy manualnie, aplikacja działa w przeglądarce desktopowej, a modele AI dostarczane są przez zewnętrzną usługę. Sukces będzie mierzony odsetkiem użytkowników wypełniających preferencje oraz aktywnie generujących przepisy tygodniowo, przy czym pełna instrumentacja analityczna zostanie zaplanowana później.

## 2. Problem użytkownika

Osoby dbające o dietę napotykają trudności w adaptacji znalezionych przepisów do swoich ograniczeń kalorii, makroskładników i alergii. Dotychczas polegały na ręcznych modyfikacjach lub arkuszach kalkulacyjnych, co jest czasochłonne i podatne na błędy. Brakuje narzędzia, które prowadziłoby użytkownika przez konfigurację preferencji, umożliwiało szybkie dostosowanie przepisu w powtarzalnym formacie oraz zachowywało historię zmian, aby można było wrócić do wcześniejszych wersji. Zdobycie takich możliwości w jednym miejscu pozwoli użytkownikom szybciej planować posiłki i zwiększy ich pewność, że przepisy są zgodne z wymaganiami zdrowotnymi.

## 3. Wymagania funkcjonalne

3.1 Konta i bezpieczeństwo

- Rejestracja konta e-mail z hasłem, walidacją haseł oraz wysyłką maila potwierdzającego.
- Logowanie oraz utrzymywanie sesji użytkownika, w tym wylogowanie.
- Reset hasła z obsługą wiadomości e-mail zawierającej link do zmiany.

  3.2 Onboarding preferencji

- Obowiązkowy kreator pięciu ekranów uruchamiany przy pierwszym logowaniu; użytkownik nie może go pominąć.
- Każdy ekran zapisuje częściowe dane i umożliwia powrót do poprzedniego kroku.
- Po ukończeniu kreatora profil zostaje oznaczony jako kompletny, a użytkownik przechodzi do listy przepisów.

  3.3 Profil preferencji

- Strona profilu wyświetla wszystkie bieżące preferencje i status kompletności.
- Użytkownik może w dowolnym momencie edytować preferencje (kuchnie, typ diety, preferowane składniki, alergie).
- System waliduje zgodność danych (np. brak pustych pól wymaganych) i zapisuje datę ostatniej aktualizacji.

  3.4 Zarządzanie przepisami

- Dodawanie przepisu poprzez wklejenie treści do dostarczonego szablonu tekstowego z wymaganymi sekcjami (np. Ingredients, Instructions, Notes, Nutrition).
- Lista przepisów filtrowana domyślnie po właścicielu, z wyszukiwaniem po tytule.
- Widok szczegółowy przepisu prezentujący aktualną wersję, metadane i ostrzeżenia o alergenach.
- Edycja przepisu nadpisuje obecna wersje.
- Usuwanie przepisu wymaga potwierdzenia i przenosi wpis do kosza lub usuwa trwale (zgodnie z decyzją zespołu technicznego).

  3.5 Wersjonowanie

- Każda zmiana przepisu powoduje nadpisanie obecnej wersji i jedyne co widzimy to last_updated_date timstamp zeby user wiedzial kiedy edytowal przepis

  3.6 Integracja AI i czat

- Interfejs czatu umożliwia zadawanie pytań i poleceń dotyczących modyfikacji przepisu.
- AI generuje odpowiedzi w ustalonym, jednolitym formacie zawierającym podsumowanie, listę zmian i zaktualizowane sekcje przepisu.
- Jeśli AI nie jest w stanie zaproponować rozwiązania, wysyła dodatkową wiadomość z informacją o braku rekomendacji i sugerowanymi dalszymi krokami.
- Rezultaty AI mogą zostać zaakceptowane i zapisane jako nowa wersja przepisu.
- System uwzględnia preferencje i alergie użytkownika przy każdorazowej odpowiedzi.

  3.7 Ostrzeżenia żywieniowe

- Podczas zapisu nowego przepisu lub wersji system analizuje treść pod kątem składników oznaczonych jako alergeny i wyświetla ostrzeżenie bez blokowania zapisu.
- Ostrzeżenie zawiera listę wykrytych alergicznych składników oraz odsyłacz do centrum pomocy.

  3.8 Komunikacja e-mail

- Wiadomość powitalna z linkiem do potwierdzenia rejestracji.
- Wiadomość resetu hasła z jednorazowym linkiem wygasającym po określonym czasie.
- Brak innych powiadomień e-mail w MVP.

  3.9 Testy i zgodność

- Automatyczne testy e2e w Playwright pokrywające ścieżki krytyczne (onboarding, dodanie przepisu, modyfikacja AI, przywrócenie wersji, reset hasła).
- System logowania błędów i monitorowania działania AI (min. status odpowiedzi, czas).

  3.10 Lokalizacja i ton komunikacji

- Cały interfejs użytkownika, kopie w kreatorze i odpowiedzi AI są w języku angielskim z konsekwentnym, wspierającym tonem.
- Materiały pomocnicze i dokumentacja wewnętrzna mogą pozostać w języku polskim.

## 4. Granice produktu

- Poza zakresem: import przepisów z URL, dodawanie multimediów (zdjęcia, wideo), udostępnianie i współdzielenie przepisów, funkcje społecznościowe, personalizowane powiadomienia push/e-mail spoza rejestracji i resetu oraz instrumentacja metryk produktowych w MVP.
- Zależności: dostawca usług e-mail, platforma AI (API dostarczające modele generatywne), mechanizmy bezpiecznego przechowywania haseł, przyszła platforma analityczna dla metryk produktu.
- Założenia: użytkownicy dysponują wiarygodnymi przepisami tekstowymi, regulamin i polityka prywatności pokrywają wykorzystanie AI, dane alergii i preferencji są zdefiniowane przez użytkownika i nie wymagają zewnętrznej walidacji.
- Ryzyka i otwarte tematy: brak zdefiniowanego schematu danych dla odpowiedzi AI i wersji wymaga opracowania; brak planu instrumentacji KPI utrudni pomiar sukcesu; konieczne dopracowanie copy kreatora i szablonu przepisu; niezawodność API AI i ograniczenia kosztowe mogą wpływać na doświadczenie użytkownika.

## 5. Historyjki użytkowników

### US-001. Rejestracja konta e-mail

Opis: Jako nowy użytkownik chcę utworzyć konto na podstawie adresu e-mail, aby móc korzystać z aplikacji i przechowywać własne przepisy.
Kryteria akceptacji:

- Formularz wymaga unikalnego adresu e-mail, hasła i potwierdzenia hasła zgodnie z polityką złożoności.
- Po rejestracji system wysyła e-mail weryfikacyjny z linkiem aktywującym konto.
- Dopóki adres e-mail nie zostanie potwierdzony, użytkownik nie może zapisywać ani edytować przepisów.

### US-002. Logowanie do konta

Opis: Jako zweryfikowany użytkownik chcę zalogować się do aplikacji, aby uzyskać dostęp do swoich przepisów i profilu.
Kryteria akceptacji:

- Użytkownik może zalogować się tylko poprawnym zestawem e-mail/hasło.
- Nieprawidłowe dane logowania zwracają komunikat o błędzie bez ujawniania, czy konto istnieje.
- Po zalogowaniu użytkownik trafia do kreatora, jeśli preferencje nie są kompletne, w przeciwnym razie na listę przepisów.

### US-003. Reset hasła

Opis: Jako użytkownik, który zapomniał hasła, chcę otrzymać e-mail resetujący, aby odzyskać dostęp do konta.
Kryteria akceptacji:

- Formularz resetu przyjmuje adres e-mail i potwierdza wysłanie wiadomości niezależnie od istnienia konta.
- Wysłany e-mail zawiera link jednorazowy ważny przez skonfigurowany czas.
- Po ustawieniu nowego hasła użytkownik może zalogować się natychmiast z nowymi danymi.

### US-004. Kreator preferencji przy pierwszym logowaniu

Opis: Jako nowy użytkownik chcę przejść przez kreator preferencji, aby aplikacja zebrała informacje o mojej kuchni, diecie, składnikach i alergiach.
Kryteria akceptacji:

- Kreator składa się dokładnie z pięciu ekranów: intro, wybór kuchni, wybór typu diety, preferowane składniki, alergie.
- Użytkownik nie może ukończyć rejestracji bez przejścia przez wszystkie kroki; przycisk zakończenia jest aktywny dopiero po wypełnieniu wymaganych pól.
- Każdy krok zapisuje dane i umożliwia cofnięcie się bez utraty wcześniej wprowadzonych informacji.

### US-005. Edycja preferencji w profilu

Opis: Jako istniejący użytkownik chcę edytować swoje preferencje żywieniowe na stronie profilu, aby utrzymać je w aktualnym stanie.
Kryteria akceptacji:

- Strona profilu wyświetla aktualne preferencje oraz datę ostatniej modyfikacji.
- Zmiany wymaganych pól są walidowane przed zapisem; błędne dane blokują zapis i pokazują komunikat.
- Po zapisaniu profilu wskaźnik kompletności aktualizuje się natychmiast i pozostaje powyżej 90% dla wypełnionych pól obowiązkowych.

### US-006. Przegląd listy przepisów

Opis: Jako użytkownik chcę zobaczyć listę wszystkich moich przepisów, aby szybko wybrać ten, który chcę edytować lub użyć.
Kryteria akceptacji:

- Widok listy pokazuje tytuł, datę ostatniej wersji i status ostrzeżeń o alergenach dla każdego przepisu.
- Użytkownik może filtrować lub wyszukiwać przepisy po tytule.
- Kliknięcie przepisu otwiera widok szczegółowy z najnowszą wersją.

### US-007. Dodanie przepisu według szablonu

Opis: Jako użytkownik chcę dodać nowy przepis, wklejając go w wymagany szablon tekstowy, aby system mógł go poprawnie przetworzyć.
Kryteria akceptacji:

- Formularz zawiera pola odpowiadające sekcjom szablonu i wymaga wypełnienia minimalnych elementów (tytuł, listy składników, instrukcje).
- System waliduje obecność kluczowych nagłówków przed zapisem i informuje o brakujących sekcjach.
- Po zapisaniu nowy przepis pojawia się na liście użytkownika wraz z numerem wersji 1.

### US-008. Edycja przepisu i tworzenie nowej wersji

Opis: Jako użytkownik chcę edytować istniejący przepis, aby aktualizować go i zachowac date edycji.
Kryteria akceptacji:

- Formularz edycji pokazuje aktualną zawartość i pozwala na modyfikacje w obrębie szablonu tekstowego.
- Zapis zmian automatycznie nadpisuje obecna wersje i mamy informacje o nowej date ostatniej edycji
- Interfejs potwierdza edycje

### US-010. Usuwanie przepisu

Opis: Jako użytkownik chcę usunąć przepis, który już nie jest mi potrzebny, aby utrzymać porządek.
Kryteria akceptacji:

- Interfejs oferuje opcję usunięcia z wyraźnym ostrzeżeniem o konsekwencjach.
- Użytkownik musi potwierdzić usunięcie (np. modal z przyciskiem Confirm).
- Po usunięciu przepis znika z listy, a historia wersji przestaje być dostępna lub zostaje oznaczona jako zarchiwizowana zgodnie z decyzją techniczną.

### US-011. Modyfikacja przepisu na czacie z AI

Opis: Jako użytkownik chcę poprosić AI o modyfikację przepisu zgodnie z moimi celami dietetycznymi, aby szybko uzyskać dopasowaną wersję.
Kryteria akceptacji:

- Czat umożliwia przesłanie kontekstu przepisu i polecenia (np. zwiększenie białka, zamiana składnika).
- Odpowiedź AI zawiera sekcje Summary, Suggested Changes, Updated Recipe i Additional Tips w ustalonym formacie.
- Użytkownik może zaakceptować odpowiedź i zapisać ją jako nową wersję przepisu.

### US-012. Obsługa braku rozwiązania AI

Opis: Jako użytkownik chcę otrzymać jasny komunikat, gdy AI nie potrafi zaproponować zmian, aby wiedzieć, co zrobić dalej.
Kryteria akceptacji:

- Jeśli model AI zwraca brak rekomendacji, system prezentuje dodatkową wiadomość No viable modification found.
- Komunikat zawiera krótkie wyjaśnienie i sugeruje alternatywne działania (np. rozluźnienie ograniczeń, konsultację specjalisty).
- Użytkownik może kontynuować rozmowę bez konieczności restartu czatu.

### US-013. Ostrzeżenia o alergenach

Opis: Jako użytkownik z alergiami chcę otrzymać ostrzeżenie, gdy przepis zawiera niedozwolone składniki, aby świadomie zdecydować o dalszym działaniu.
Kryteria akceptacji:

- Po zapisaniu przepisu system skanuje tekst i identyfikuje składniki oznaczone w profilu jako alergeny.
- Ostrzeżenie pojawia się w widoku przepisu oraz przed zatwierdzeniem nowej wersji.
- Ostrzeżenie nie blokuje zapisu, ale wymaga od użytkownika potwierdzenia, że rozumie ryzyko.

### US-014. Historia czatu z AI

Opis: Jako użytkownik chcę mieć dostęp do pełnej historii czatu dla danego przepisu, aby móc odwoływać się do wcześniejszych sugestii.
Kryteria akceptacji:

- Widok czatu wyświetla chronologicznie wszystkie wiadomości użytkownika i AI dla danego przepisu.

### US-015. Monitorowanie statusu konta

Opis: Jako użytkownik chcę widzieć status mojego konta i możliwość wylogowania, aby zachować kontrolę nad dostępem.
Kryteria akceptacji:

- Menu konta pokazuje nazwę użytkownika, status weryfikacji e-mail i przycisk sign out.
- Wylogowanie natychmiast kończy sesję i wymaga ponownego logowania do kolejnych akcji.
- Próba dostępu do zasobów po wylogowaniu przekierowuje do ekranu logowania.

## 6. Metryki sukcesu

- 90% zarejestrowanych użytkowników uzupełnia wszystkie wymagane preferencje żywieniowe w profilu w ciągu pierwszych 7 dni od rejestracji.
- 75% aktywnych użytkowników generuje co najmniej jeden przepis tygodniowo z wykorzystaniem integracji AI.
- Dodatkowe metryki monitorowane eksperymentalnie: odsetek ukończonych kreatorów przy pierwszym logowaniu, średnia liczba wersji przepisu na użytkownika, odsetek zweryfikowanych adresów e-mail.
- Obecnie brak wdrożonej instrumentacji do automatycznego śledzenia KPI; plan implementacji analityki zostanie opracowany po MVP, a tymczasowo metryki będą zbierane za pomocą raportów operacyjnych lub prostych logów.
