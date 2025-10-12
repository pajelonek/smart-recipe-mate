Jesteś doświadczonym menedżerem produktu, którego zadaniem jest stworzenie kompleksowego dokumentu wymagań produktu (PRD) w oparciu o poniższe opisy:

<project_description>

# Aplikacja - Smart Recipe Mate (MVP)

### Główny problem

Dostosowywanie dostępnych w sieci przepisów kulinarnych do osobistych potrzeb i wymagań żywieniowych jest problematyczne. Aplikacja wykorzystuje AI oraz preferencje użytkownika do proponowania dopasowanych przepisów.

### Najmniejszy zestaw funkcjonalności

- Zapisywanie, odczytywanie, przeglądanie i usuwanie przepisów w formie tekstowej
- Prosty system kont użytkowników do powiązania użytkownika z własnymi przepisami
- Strona profilu użytkownika służąca do zapisywania preferencji żywnościowych
- Integracja z AI umożliwiająca tworzenie i znajdowanie przepisów w oparciu o posiadane produkty i preferencje.

### Co NIE wchodzi w zakres MVP

- Import przepisów z adresu URL
- Bogata obsługa multimediów (np. zdjęć przepisów)
- Udostępnianie przepisów dla innych użytkowników
- Funkcje społecznościowe

### Kryteria sukcesu

- 90% użytkowników posiada wypełnioną sekcję preferencji żywnościowych w swoim profilu
- 75% użytkowników generuje jeden lub więcej przepisów w tygodniu
  </project_description>

<project_details>
<conversation_summary><decisions>

1. Przepisy w bazie przechowujemy wyłącznie jako tekst: tytuł, sekcja składników, sekcja przygotowania, bez dodatkowej walidacji.
2. System wersjonowania przechowuje tylko datę i autora ostatniej edycji; brak historii zmian i przywracania wersji.
3. Brak wersji roboczych; przepisy zawsze pobierane z bazy w aktualnej formie.
4. Aplikacja jest wyłącznie webowa, bez wsparcia urządzeń mobilnych.
5. Kreator preferencji jest obowiązkowy przy zakładaniu konta; brak zapisu postępu, brak możliwości pomijania kroków.
6. Preferencje obejmują: rodzaj diety, preferowane składniki, alergie, z możliwością późniejszej edycji.
7. Repozytorium przepisów oferuje filtrację po nazwie i możliwość dodawania do 10 tagów (z autouzupełnianiem i tworzeniem nowych tagów).
8. Czat AI komunikuje się w JSON-ie po REST; zapisujemy każdą wiadomość wychodzącą i przychodzącą wraz z sesją (nowa sesja po każdym odświeżeniu).
9. Tryb edycji AI blokuje ręczną edycję przepisu do czasu powrotu odpowiedzi; użytkownik widzi zaktualizowany tekst oraz snackbar z informacją o nadpisaniu i potwierdza zmianę.
10. Logujemy zdarzenia oraz błędy AI do bazy; brak dodatkowych KPI, powiadomień e-mail, exportu przepisów i terminów wydania.
    </decisions><matched_recommendations>
11. Zdefiniowany szablon tekstowy przepisu (tytuł, składniki, przygotowanie) odpowiada rekomendacji doprecyzowania struktury zapisu.
12. Wprowadzenie informacji o użytkowniku i czasie edycji wpisuje się w zalecenie dodania metadanych do wersjonowania.
13. Autocomplete i limit tagów wykonują zalecenia uporządkowania taksonomii repozytorium.
14. Potwierdzenie nadpisania przepisu przez AI realizuje rekomendację ochrony przed przypadkową utratą danych.
15. Zachowanie historii wiadomości czatu (we/wy) oraz nieskończonej retencji spełnia rekomendację ustalenia polityki przechowywania interakcji AI.
16. Snackbar i automatyczna aktualizacja widoku to odpowiedź na wskazanie informowania użytkownika o nowych wersjach przepisu.
17. Obowiązkowy kreator preferencji przy rejestracji odnosi się do zalecenia jasnego ustalenia reguł przepływu użytkownika.
18. Logowanie zdarzeń i błędów pokrywa rekomendację przygotowania podstawowego monitoringu.
    </matched_recommendations><prd_planning_summary>

- Produkt Smart Recipe Mate (MVP) wspiera osoby na dietach wysokobiałkowych, eliminacyjnych czy z ograniczeniami alergicznymi w znajdowaniu i personalizowaniu przepisów poprzez AI oraz własne repozytorium. Kluczowe funkcje obejmują: konta użytkowników, pięcioetapowy kreator preferencji, profil z edycją, repozytorium przepisów z filtracją po nazwie i tagach, czat AI zwracający ustrukturyzowany JSON, zapis historii wiadomości oraz powiadomienia e-mail (rejestracja/reset).
- Najważniejsze scenariusze: użytkownik podaje produkty i preferencje, generuje przepis poprzez AI, edytuje go ręcznie lub prosi AI o poprawki, zapisuje i przegląda listę przepisów, filtruje po nazwie, dodaje tagi, aktualizuje preferencje. Sesje czatu resetują się po odświeżeniu strony, ale każdy request/response jest archiwizowany.
- Kryteria sukcesu z briefu (90% profili z preferencjami, 75% użytkowników generuje ≥1 przepis tygodniowo) nie mają jeszcze zaplanowanych sposobów pomiaru; system rejestruje zdarzenia i błędy, lecz nie definiuje KPI ani dashboardów.
- Istotne decyzje techniczne: brak walidacji treści przepisu, brak historii wersji, brak progresu rejestracji, limit 10 tagów, brak planu mobilnego, brak exportu, czas działania AI nieograniczony, snackbar jako powiadomienie. Projekt realizuje jedna osoba, bez formalnych terminów.
  </prd_planning_summary><unresolved_issues>
- Brak ustalonego sposobu monitorowania sukcesu (pomiar KPI, dashboard) mimo zdefiniowanych celów.
- Nieokreślone przyszłe potrzeby walidacji jakości przepisów i potencjalny wpływ na UX.
- Brak strategii skalowania repozytorium (paginacja/lazy load) w przypadku większej liczby przepisów.
  </unresolved_issues></conversation_summary>

</project_details>

Wykonaj następujące kroki, aby stworzyć kompleksowy i dobrze zorganizowany dokument:

1. Podziel PRD na następujące sekcje:
   a. Przegląd projektu
   b. Problem użytkownika
   c. Wymagania funkcjonalne
   d. Granice projektu
   e. Historie użytkownika
   f. Metryki sukcesu

2. W każdej sekcji należy podać szczegółowe i istotne informacje w oparciu o opis projektu i odpowiedzi na pytania wyjaśniające. Upewnij się, że:
   - Używasz jasnego i zwięzłego języka
   - W razie potrzeby podajesz konkretne szczegóły i dane
   - Zachowujesz spójność w całym dokumencie
   - Odnosisz się do wszystkich punktów wymienionych w każdej sekcji

3. Podczas tworzenia historyjek użytkownika i kryteriów akceptacji
   - Wymień WSZYSTKIE niezbędne historyjki użytkownika, w tym scenariusze podstawowe, alternatywne i skrajne.
   - Przypisz unikalny identyfikator wymagań (np. US-001) do każdej historyjki użytkownika w celu bezpośredniej identyfikowalności.
   - Uwzględnij co najmniej jedną historię użytkownika specjalnie dla bezpiecznego dostępu lub uwierzytelniania, jeśli aplikacja wymaga identyfikacji użytkownika lub ograniczeń dostępu.
   - Upewnij się, że żadna potencjalna interakcja użytkownika nie została pominięta.
   - Upewnij się, że każda historia użytkownika jest testowalna.

Użyj następującej struktury dla każdej historii użytkownika:

- ID
- Tytuł
- Opis
- Kryteria akceptacji

4. Po ukończeniu PRD przejrzyj go pod kątem tej listy kontrolnej:
   - Czy każdą historię użytkownika można przetestować?
   - Czy kryteria akceptacji są jasne i konkretne?
   - Czy mamy wystarczająco dużo historyjek użytkownika, aby zbudować w pełni funkcjonalną aplikację?
   - Czy uwzględniliśmy wymagania dotyczące uwierzytelniania i autoryzacji (jeśli dotyczy)?

5. Formatowanie PRD:
   - Zachowaj spójne formatowanie i numerację.
   - Nie używaj pogrubionego formatowania w markdown ( \*\* ).
   - Wymień WSZYSTKIE historyjki użytkownika.
   - Sformatuj PRD w poprawnym markdown.

Przygotuj PRD z następującą strukturą:

```markdown
# Dokument wymagań produktu (PRD) - {{app-name}}

## 1. Przegląd produktu

## 2. Problem użytkownika

## 3. Wymagania funkcjonalne

## 4. Granice produktu

## 5. Historyjki użytkowników

## 6. Metryki sukcesu
```

Pamiętaj, aby wypełnić każdą sekcję szczegółowymi, istotnymi informacjami w oparciu o opis projektu i nasze pytania wyjaśniające. Upewnij się, że PRD jest wyczerpujący, jasny i zawiera wszystkie istotne informacje potrzebne do dalszej pracy nad produktem.

Ostateczny wynik powinien składać się wyłącznie z PRD zgodnego ze wskazanym formatem w markdown, który zapiszesz w pliku .ai/prd.md
