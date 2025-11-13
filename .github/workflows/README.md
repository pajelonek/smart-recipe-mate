# CI/CD Pipeline Documentation

## Przegląd

Workflow CI/CD automatycznie uruchamia testy jednostkowe, buduje aplikację produkcyjną oraz wykonuje testy end-to-end (E2E) przy każdej aktualizacji gałęzi `master` lub na żądanie (manualnie).

## Struktura Pipeline

Pipeline składa się z dwóch równoległych jobów:

1. **test-and-build** - Testy jednostkowe i build produkcyjny
2. **test-e2e** - Testy end-to-end (uruchamiane po sukcesie pierwszego joba)

## Konfiguracja GitHub Secrets

Aby pipeline działał poprawnie, musisz skonfigurować następujące secrets w repozytorium GitHub:

### Wymagane Secrets

1. **SUPABASE_URL** - URL Twojego projektu Supabase
   - Znajdziesz w: Supabase Dashboard → Settings → API → Project URL

2. **SUPABASE_KEY** - Anon/Public key z Supabase
   - Znajdziesz w: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

3. **SUPABASE_SERVICE_ROLE_KEY** - Service Role Key (używany tylko w testach E2E)
   - ⚠️ **UWAGA**: Ten klucz ma pełne uprawnienia administracyjne - nigdy nie udostępniaj go publicznie!
   - Znajdziesz w: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`

4. **OPENROUTER_API_KEY** - Klucz API z OpenRouter.ai
   - Wymagany do budowania aplikacji (może być używany przez niektóre komponenty)

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

- Sprawdź czy wszystkie wymagane secrets są poprawnie skonfigurowane
- Sprawdź logi w GitHub Actions, aby zobaczyć szczegółowe błędy

### Testy E2E nie przechodzą

- Upewnij się, że `SUPABASE_SERVICE_ROLE_KEY` jest poprawnie skonfigurowany
- Sprawdź czy Twój projekt Supabase jest dostępny z internetu
- Sprawdź logi Playwright w artifacts

### Problem z Node.js version

- Pipeline używa Node.js 22.14.0 - upewnij się, że Twoja lokalna wersja jest zgodna

## Dodatkowe informacje

- Pipeline używa `npm ci` zamiast `npm install` dla szybszej i bardziej niezawodnej instalacji
- Testy E2E są uruchamiane tylko na Chromium (zgodnie z konfiguracją projektu)
- Linter nie blokuje pipeline - błędy są tylko raportowane
- W środowisku CI testy Playwright mają 2 retry przy niepowodzeniu

