/**
 * Prueba en vivo del agente de dengue SIN levantar NestJS.
 * Replica exactamente lo que hace el endpoint POST /v1/riesgo/seir-model:
 *   contexto real por depto  →  prompt del .md + contrato  →  Gemma  →  JSON.
 *
 * Uso:
 *   cd apps/backend
 *   pnpm install                       # instala @google/genai
 *   # asegúrate de tener GEMINI_API_KEY en .env
 *   node scripts/test-dengue-agent.mjs "PIURA — Piura / Sullana"
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.resolve(__dirname, '..');

// ── .env mínimo (sin dependencias). Único .env en la raíz del monorepo ───────
function loadEnv() {
  const candidates = [path.resolve(BASE, '../../.env'), path.join(BASE, '.env')];
  const env = {};
  for (const f of candidates) {
    if (!fs.existsSync(f)) continue;
    for (const line of fs.readFileSync(f, 'utf-8').split('\n')) {
      const m = /^\s*([A-Z_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return env;
}
const env = { ...loadEnv(), ...process.env };
const apiKey = env.GEMINI_API_KEY || '';
const model = env.LLM_MODEL || 'gemma-4-31b-it';

// ── contexto real por departamento ──────────────────────────────────────────
const ctxAll = JSON.parse(
  fs.readFileSync(path.join(BASE, 'data/datasets/dengue_context.json'), 'utf-8'),
);
const norm = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim().replace(/\s+/g, ' ');
const depDe = (region) => norm(region.split(/[—/-]/)[0] ?? region);

const region = process.argv[2] || 'PIURA — Piura / Sullana';
const dep = depDe(region);
const datos = ctxAll[dep] ?? null;
const contexto = { departamento: dep, encontrado: datos != null, datos };

const parametros = {
  anomalia_lluvias_pct: 60,
  anomalia_temperatura_c: 1.5,
  enos_intensidad: 'moderado',
  racionamiento_agua_pct: 35,
  eficiencia_control_vectorial_pct: 40,
  desabastecimiento_insumos_pct: 20,
  serotipo_dominante: 'DEN-2',
};
const payload = { region, ventana_semanas: 16, parametros, datos_reales: contexto };

// ── prompt del agente (.md sin frontmatter) + contrato ──────────────────────
let systemPrompt = fs.readFileSync(path.join(BASE, 'agents/dengue-seir.md'), 'utf-8');
systemPrompt = systemPrompt.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '');

const contractRaw = fs.readFileSync(path.join(BASE, 'src/riesgo/seir-agent.contract.ts'), 'utf-8');
const contract = contractRaw.slice(contractRaw.indexOf('{'), contractRaw.lastIndexOf('}') + 1);

const userMessage =
  `Datos de entrada (JSON):\n${JSON.stringify(payload, null, 2)}` +
  `\n\nContrato de salida OBLIGATORIO (responde EXACTAMENTE con esta forma de JSON):\n${contract}` +
  `\n\nResponde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin fences.`;

console.log(`Region: ${region}  →  Departamento: ${dep}  (datos ${contexto.encontrado ? 'OK' : 'NO ENCONTRADOS'})`);
console.log(`Modelo: ${model}`);

if (!apiKey) {
  console.error('\n❌ Falta GEMINI_API_KEY en .env. El prompt está listo pero no se puede llamar a Gemma.');
  process.exit(1);
}

// ── llamada a Gemma (igual que GeminiLLMAdapter) ────────────────────────────
const ai = new GoogleGenAI({ apiKey });
const text = `${systemPrompt}\n\n---\n\n${userMessage}`;

console.log('\n⏳ Llamando a Gemma...\n');
const resp = await ai.models.generateContentStream({
  model,
  config: { temperature: 0.15, maxOutputTokens: 4096 },
  contents: [{ role: 'user', parts: [{ text }] }],
});

let out = '';
for await (const chunk of resp) if (chunk.text) out += chunk.text;

// ── parseo robusto + validación del contrato ────────────────────────────────
const cleaned = out.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
const json = cleaned.slice(cleaned.indexOf('{'), cleaned.lastIndexOf('}') + 1);

let data;
try {
  data = JSON.parse(json);
} catch (e) {
  console.error('❌ Gemma no devolvió JSON válido:\n', out.slice(0, 1000));
  process.exit(1);
}

const req = ['kpis', 'proyeccion_semanal', 'alertas', 'notas_metodologicas'];
const faltan = req.filter((k) => !(k in data));

console.log('✅ Respuesta de Gemma (SEIRModelResponse):\n');
console.log(JSON.stringify(data, null, 2));
console.log(
  faltan.length
    ? `\n⚠️  Faltan claves del contrato: ${faltan.join(', ')}`
    : `\n✅ Contrato OK. KPIs: casos=${data.kpis?.casos_proyectados_total}, riesgo=${data.kpis?.nivel_riesgo}, saturación=${data.kpis?.saturacion_hospitalaria_pct}%`,
);
