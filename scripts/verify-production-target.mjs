import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expected = {
  supabaseRef: "fahrhrcxzcnnrhjavrfk",
  vercelProjectId: "prj_2pimmMlPl2G3xz0zTv4ERZWxsoxh",
  supabaseUrl: "https://fahrhrcxzcnnrhjavrfk.supabase.co",
};

const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");
const failures = [];

try {
  const project = JSON.parse(await read(".vercel/project.json"));
  if (project.projectId !== expected.vercelProjectId) {
    failures.push(`Vercel projectId inesperado: ${project.projectId}`);
  }
} catch {
  failures.push("Não foi possível validar .vercel/project.json");
}

try {
  const localRef = (await read("supabase/.temp/project-ref")).trim();
  if (localRef !== expected.supabaseRef) {
    failures.push(`Supabase link inesperado: ${localRef || "vazio"}`);
  }
} catch {
  failures.push("Supabase CLI não está vinculado ao projeto de produção esperado");
}

try {
  const env = await read(".env");
  const envUrl = env.match(/^VITE_SUPABASE_URL=(.*)$/m)?.[1]?.trim();
  if (envUrl !== expected.supabaseUrl) {
    failures.push(`VITE_SUPABASE_URL inesperada: ${envUrl || "ausente"}`);
  }
} catch {
  failures.push(".env local não foi encontrado para validar o destino Supabase");
}

try {
  const rootRoute = await read("src/routes/__root.tsx");
  if (!rootRoute.includes(`supabaseUrl: "${expected.supabaseUrl}"`)) {
    failures.push("A configuração runtime do app não aponta para o Supabase ELLO1");
  }
} catch {
  failures.push("Não foi possível validar a configuração runtime do app");
}

if (failures.length) {
  console.error("DEPLOY INTERROMPIDO: alvo de produção do ELLO não foi confirmado.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Alvo confirmado: Supabase ELLO1 (fahrhrcxzcnnrhjavrfk) + Vercel ello-app.");
}
