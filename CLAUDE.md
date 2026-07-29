# PROYECTO: Predicta AI - Perú (Prevención Fenómeno del Niño)

## STACK TECNOLÓGICO Y REGLAS ESTRICTAS
1. **Frontend:** Vite + React + TypeScript + Tailwind CSS v4.
   - **Regla Tailwind v4:** NO uses `tailwind.config.js`. Usa el nuevo sistema `@theme` en el archivo CSS principal.
   - **UI/UX (Estilo Vercel / Hallmark):** Usa diseño atómico. Tema Dark/Light estricto. Usa colores neutrales (zinc/slate), bordes sutiles (`border-border`), glassmorphism, y animaciones suaves con Framer Motion. Nada de interfaces Bootstrap o Material. UI limpia, técnica y profesional.
   - **Mapa:** Usa `react-map-gl` o `maplibre-gl` con estilos dark/light de OpenStreetMap o Mapbox (estilos base limpios).
   - **Estructura Frontend:** Diseño basado en features (`src/features/map`, `src/features/chat`, `src/features/csv-upload`).

2. **Backend:** NestJS + TypeScript + PostgreSQL.
   - **Arquitectura Hexagonal Estricta:** Separa por capas:
     - `Domain`: Entidades (Report, Prediction), Value Objects, Puertos (Interfaces).
     - `Application`: Casos de uso (AnalyzeRiskUseCase, UploadCSVUseCase).
     - `Infrastructure`: Controladores (REST), Repositorios (TypeORM/Prisma), Adapters de IA.
   - **AI Integration:** Uso de modelos LLM (Gemma u otro) para análisis de datos históricos (familia del evento, región, año) para predecir riesgos futuros (ej. desabastecimiento de medicamentos).

3. **Despliegue:** 
   - Preparado para Dokploy (Docker-compose y Dockerfiles limpios).
   - Base de datos relacional (PostgreSQL) para históricos.