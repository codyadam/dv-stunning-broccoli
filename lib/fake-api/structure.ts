import type { AssetPreviewSourceNode } from "@/lib/listings/asset-preview/types";
import { pick, randomInt, seededRandom } from "@/lib/fake-api/random";

const LANGUAGE_FILES: Record<string, { ext: string; manifest: string[] }> = {
  TypeScript: { ext: "ts", manifest: ["package.json", "tsconfig.json"] },
  Python: { ext: "py", manifest: ["pyproject.toml", "uv.lock"] },
  Go: { ext: "go", manifest: ["go.mod", "go.sum"] },
  Rust: { ext: "rs", manifest: ["Cargo.toml", "Cargo.lock"] },
  Java: { ext: "java", manifest: ["pom.xml"] },
  Kotlin: { ext: "kt", manifest: ["build.gradle.kts", "settings.gradle.kts"] },
  Ruby: { ext: "rb", manifest: ["Gemfile", "Gemfile.lock"] },
  "C#": { ext: "cs", manifest: ["Solution.sln"] },
};

const MODULES = [
  "api",
  "auth",
  "billing",
  "core",
  "db",
  "events",
  "jobs",
  "models",
  "notifications",
  "search",
  "storage",
  "sync",
  "ui",
  "utils",
  "workers",
];

const FILE_STEMS = [
  "client",
  "config",
  "handlers",
  "index",
  "mapper",
  "middleware",
  "parser",
  "queue",
  "repository",
  "routes",
  "schema",
  "service",
  "types",
  "validation",
];

function file(name: string): AssetPreviewSourceNode {
  return { name, kind: "file" };
}

function folder(name: string, children: AssetPreviewSourceNode[]): AssetPreviewSourceNode {
  return { name, kind: "folder", children };
}

function sourceFiles(random: () => number, ext: string, count: number): AssetPreviewSourceNode[] {
  const stems = [...FILE_STEMS].sort(() => random() - 0.5).slice(0, count);
  return stems.sort().map((stem) => file(`${stem}.${ext}`));
}

/** A plausible repository tree for a codebase in `language`. */
export function codebaseStructure(seed: string, language: string): AssetPreviewSourceNode[] {
  const random = seededRandom(seed);
  const spec = LANGUAGE_FILES[language] ?? { ext: "txt", manifest: [] };
  const modules = [...MODULES].sort(() => random() - 0.5).slice(0, randomInt(random, 4, 7));
  const src = folder(
    "src",
    modules.sort().map((module) =>
      folder(module, sourceFiles(random, spec.ext, randomInt(random, 2, 6))),
    ),
  );
  const tests = folder(
    "tests",
    modules.slice(0, 3).map((module) => file(`test_${module}.${spec.ext}`)),
  );
  const docs = folder("docs", [file("architecture.md"), file("getting-started.md")]);
  const ci = folder(".github", [folder("workflows", [file("ci.yml")])]);
  return [
    ci,
    docs,
    src,
    tests,
    file(".gitignore"),
    ...spec.manifest.map(file),
    file("README.md"),
  ];
}

const RAW_DATA_LAYOUTS: Record<string, string[]> = {
  csv: ["2023", "2024", "2025"],
  jsonl: ["train", "validation", "test"],
  pdf: ["contracts", "invoices", "reports"],
  wav: ["speaker_a", "speaker_b", "speaker_c"],
  png: ["batch_01", "batch_02", "batch_03"],
  parquet: ["daily", "hourly"],
};

/** A plausible dataset tree for raw data holding mostly `ext` files. */
export function rawDataStructure(seed: string, ext: string): AssetPreviewSourceNode[] {
  const random = seededRandom(seed);
  const parts = RAW_DATA_LAYOUTS[ext] ?? ["part_1", "part_2"];
  return [
    folder(
      "data",
      parts.map((part) =>
        folder(
          part,
          Array.from({ length: randomInt(random, 3, 6) }, (_, index) =>
            file(`${pick(random, ["sample", "record", "item", "chunk"])}_${String(index + 1).padStart(4, "0")}.${ext}`),
          ),
        ),
      ),
    ),
    file("LICENSE.txt"),
    file("manifest.json"),
    file("README.md"),
  ];
}
