Frontend - Astro z React dla komponentów interaktywnych:

- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Backend - Supabase jako kompleksowe rozwiązanie backendowe:

- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników

AI - Komunikacja z modelami przez usługę Openrouter.ai:

- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszta
- Pozwala na ustawianie limitów finansowych na klucze API

Testowanie:

- Vitest jako framework do testów jednostkowych - zintegrowany z Vite, który wykorzystuje Astro, zapewnia szybkie wykonanie testów i doskonałe wsparcie dla TypeScript
- React Testing Library do testowania komponentów React - zapewnia testowanie z perspektywy użytkownika i zgodność z najlepszymi praktykami
- MSW (Mock Service Worker) do mockowania wywołań API - pozwala na izolowanie testów jednostkowych od zewnętrznych zależności
- Playwright do testów end-to-end (E2E) - zapewnia testowanie w rzeczywistych przeglądarkach (Chrome, Firefox, WebKit) oraz automatyczną obsługę asynchronicznych operacji

CI/CD i Hosting:

- Github Actions do tworzenia pipeline'ów CI/CD
- DigitalOcean do hostowania aplikacji za pośrednictwem obrazu docker
