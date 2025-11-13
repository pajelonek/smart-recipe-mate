# CI/CD Pipeline Documentation

## Przegląd

Workflow CI/CD automatycznie uruchamia testy jednostkowe, buduje aplikację produkcyjną oraz wykonuje testy end-to-end (E2E) przy każdej aktualizacji gałęzi `master` lub na żądanie (manualnie).

## Struktura Pipeline

Pipeline składa się z dwóch równoległych jobów:

1. **test-and-build** - Testy jednostkowe i build produkcyjny
2. **test-e2e** - Testy end-to-end (uruchamiane po sukcesie pierwszego joba)

## Konfiguracja GitHub Secrets

Aby pipeline działał poprawnie, musisz skonfigurować następujące secrets w repozytorium GitHub. **Ważne**: Sekrety są rozdzielone na testowe i produkcyjne, aby umożliwić testowanie na osobnym środowisku bez wpływu na produkcję.

### Sekrety Produkcyjne (używane do budowania aplikacji)

Te sekrety są używane w jobie `test-and-build` do budowania aplikacji produkcyjnej:

1. **SUPABASE_URL_PROD** - URL Twojego produkcyjnego projektu Supabase
   - Znajdziesz w: Supabase Dashboard → Settings → API → Project URL
   - ⚠️ Używany do budowania aplikacji produkcyjnej

2. **SUPABASE_KEY_PROD** - Anon/Public key z produkcyjnego Supabase
   - Znajdziesz w: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`
   - ⚠️ Używany do budowania aplikacji produkcyjnej

3. **OPENROUTER_API_KEY_PROD** - Klucz API z OpenRouter.ai (produkcyjny)
   - Wymagany do budowania aplikacji (może być używany przez niektóre komponenty)

### Sekrety Testowe (używane tylko w testach E2E)

Te sekrety są używane w jobie `test-e2e` do testowania na osobnym środowisku:

1. **SUPABASE_URL_TEST** - URL Twojego testowego projektu Supabase
   - Może być ten sam co produkcyjny lub osobny projekt testowy
   - Znajdziesz w: Supabase Dashboard → Settings → API → Project URL

2. **SUPABASE_KEY_TEST** - Anon/Public key z testowego Supabase
   - Znajdziesz w: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

3. **SUPABASE_SERVICE_ROLE_KEY_TEST** - Service Role Key dla środowiska testowego
   - ⚠️ **UWAGA**: Ten klucz ma pełne uprawnienia administracyjne - nigdy nie udostępniaj go publicznie!
   - Znajdziesz w: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`
   - Używany tylko w testach E2E do czyszczenia danych testowych

4. **OPENROUTER_API_KEY_TEST** - Klucz API z OpenRouter.ai (testowy, opcjonalny)
   - Może być ten sam co produkcyjny lub osobny klucz testowy

### Strategia rozdzielenia sekretów

**Dlaczego rozdzielamy sekrety?**

- **Bezpieczeństwo**: Testy E2E mogą modyfikować dane (tworzenie/usuwanie użytkowników), więc lepiej używać osobnego środowiska testowego
- **Izolacja**: Testy nie wpływają na dane produkcyjne
- **Elastyczność**: Możesz używać różnych konfiguracji dla testów i produkcji

**Co jeśli nie masz osobnego środowiska testowego?**

Jeśli nie masz jeszcze osobnego projektu Supabase do testów, możesz tymczasowo użyć tych samych wartości dla sekretów testowych i produkcyjnych:

- `SUPABASE_URL_TEST` = `SUPABASE_URL_PROD` (ten sam projekt)
- `SUPABASE_KEY_TEST` = `SUPABASE_KEY_PROD` (ten sam klucz)
- `SUPABASE_SERVICE_ROLE_KEY_TEST` = Service Role Key z tego samego projektu
- `OPENROUTER_API_KEY_TEST` = `OPENROUTER_API_KEY_PROD` (ten sam klucz)

⚠️ **Uwaga**: W takim przypadku testy E2E będą działać na danych produkcyjnych. Rozważ utworzenie osobnego projektu Supabase dla testów.

### Jak dodać Secrets w GitHub

1. Przejdź do repozytorium na GitHub
2. Kliknij **Settings** → **Secrets and variables** → **Actions**
3. Kliknij **New repository secret**
4. Dodaj każdy z powyższych secrets z odpowiednimi wartościami

## Uruchamianie Pipeline

### Automatyczne uruchomienie

Pipeline uruchamia się automatycznie przy każdym pushu do gałęzi `master`.

### Manualne uruchomienie

1. Przejdź do zakładki **Actions** w repozytorium GitHub
2. Wybierz workflow **CI/CD Pipeline**
3. Kliknij **Run workflow**
4. Wybierz gałąź i kliknij **Run workflow**

## Etapy Pipeline

### Job 1: Test & Build

1. **Checkout code** - Pobranie kodu z repozytorium
2. **Setup Node.js** - Instalacja Node.js 22.14.0 z cache'owaniem npm
3. **Install dependencies** - Instalacja zależności (`npm ci`)
4. **Run linter** - Sprawdzenie jakości kodu (nie blokuje pipeline przy błędach)
5. **Run unit tests** - Uruchomienie testów jednostkowych (Vitest)
6. **Build production** - Budowa aplikacji produkcyjnej (Astro build)

### Job 2: E2E Tests

1. **Checkout code** - Pobranie kodu z repozytorium
2. **Setup Node.js** - Instalacja Node.js 22.14.0 z cache'owaniem npm
3. **Install dependencies** - Instalacja zależności (`npm ci`)
4. **Install Playwright browsers** - Instalacja przeglądarek Chromium dla Playwright
5. **Run E2E tests** - Uruchomienie testów end-to-end
6. **Upload Playwright report** - Przesłanie raportu z testów jako artifact (dostępny przez 30 dni)

## Artifacts

Po zakończeniu testów E2E, raport Playwright jest automatycznie zapisywany jako artifact i dostępny do pobrania przez 30 dni. Możesz go pobrać z zakładki **Actions** → wybierz uruchomienie → **Artifacts**.

## Rozwiązywanie problemów

### Build nie przechodzi

- Sprawdź czy wszystkie wymagane sekrety produkcyjne (`*_PROD`) są poprawnie skonfigurowane
- Sprawdź logi w GitHub Actions, aby zobaczyć szczegółowe błędy
- Upewnij się, że używasz poprawnych wartości dla środowiska produkcyjnego

### Testy E2E nie przechodzą

- Upewnij się, że wszystkie sekrety testowe (`*_TEST`) są poprawnie skonfigurowane
- Sprawdź czy `SUPABASE_SERVICE_ROLE_KEY_TEST` jest poprawnie skonfigurowany
- Sprawdź czy Twój testowy projekt Supabase jest dostępny z internetu
- Sprawdź logi Playwright w artifacts
- **Uwaga**: Testy E2E używają osobnych sekretów testowych, więc nie wpływają na środowisko produkcyjne

### Problem z Node.js version

- Pipeline używa Node.js 22.14.0 - upewnij się, że Twoja lokalna wersja jest zgodna

## Dodatkowe informacje

- Pipeline używa `npm ci` zamiast `npm install` dla szybszej i bardziej niezawodnej instalacji
- Testy E2E są uruchamiane tylko na Chromium (zgodnie z konfiguracją projektu)
- Linter nie blokuje pipeline - błędy są tylko raportowane
- W środowisku CI testy Playwright mają 2 retry przy niepowodzeniu

