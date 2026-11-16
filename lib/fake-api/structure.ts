import type { AssetPreviewSourceNode } from "@/lib/listings/asset-preview/types";
import { pick, randomInt, seededRandom } from "@/lib/fake-api/random";

type Random = () => number;

function file(name: string): AssetPreviewSourceNode {
  return { name, kind: "file" };
}

function folder(name: string, children: AssetPreviewSourceNode[]): AssetPreviewSourceNode {
  return { name, kind: "folder", children };
}

function sample<T>(random: Random, items: readonly T[], min: number, max: number): T[] {
  return [...items].sort(() => random() - 0.5).slice(0, randomInt(random, min, max));
}

const DOMAIN_MODULES = [
  "accounts",
  "audit",
  "billing",
  "catalog",
  "checkout",
  "exports",
  "imports",
  "invoices",
  "ledger",
  "notifications",
  "orders",
  "payments",
  "reports",
  "scheduling",
  "search",
  "settings",
  "shipments",
  "users",
  "webhooks",
];

const pascal = (name: string) =>
  name.replace(/(^|[-_])(\w)/g, (_, __, letter: string) => letter.toUpperCase());
const singular = (name: string) => name.replace(/ies$/, "y").replace(/s$/, "");
const snake = (name: string) => name.replace(/-/g, "_");

/** The repository part of `owner/repo`, or the seed for inventory assets. */
function projectName(seed: string): string {
  return (seed.split("/").pop() ?? seed).replace(/^ast_/, "").toLowerCase();
}

type Layout = (random: Random, name: string, modules: string[]) => AssetPreviewSourceNode[];

const ci = folder(".github", [folder("workflows", [file("ci.yml")])]);

const LAYOUTS: Record<string, Layout> = {
  TypeScript: (random, _name, modules) => [
    ci,
    folder("app", [
      folder("(dashboard)", modules.map((module) => folder(module, [file("page.tsx")]))),
      folder("api", modules.slice(0, 3).map((module) => folder(module, [file("route.ts")]))),
      file("layout.tsx"),
      file("page.tsx"),
    ]),
    folder("components", [
      folder("ui", sample(random, ["button.tsx", "dialog.tsx", "input.tsx", "table.tsx", "toast.tsx"], 3, 5).sort().map(file)),
      ...modules.slice(0, 3).map((module) => file(`${singular(module)}-form.tsx`)),
    ]),
    folder("lib", [file("db.ts"), file("auth.ts"), ...modules.slice(0, 2).map((module) => file(`${module}.ts`))]),
    folder("prisma", [file("schema.prisma"), folder("migrations", [file("migration_lock.toml")])]),
    folder("tests", modules.slice(0, 2).map((module) => file(`${module}.test.ts`))),
    file(".env.example"),
    file("next.config.ts"),
    file("package.json"),
    file("pnpm-lock.yaml"),
    file("README.md"),
    file("tsconfig.json"),
  ],
  JavaScript: (_random, _name, modules) => [
    folder("src", [
      folder("routes", modules.map((module) => file(`${module}.js`))),
      folder("models", modules.slice(0, 4).map((module) => file(`${pascal(singular(module))}.js`))),
      folder("middleware", [file("auth.js"), file("errors.js")]),
      file("app.js"),
      file("db.js"),
    ]),
    folder("public", [folder("css", [file("main.css")]), folder("js", [file("main.js")]), file("index.html")]),
    folder("test", modules.slice(0, 2).map((module) => file(`${module}.test.js`))),
    file(".eslintrc.js"),
    file("Dockerfile"),
    file("package.json"),
    file("package-lock.json"),
    file("README.md"),
  ],
  Python: (_random, name, modules) => [
    ci,
    folder("docs", [file("architecture.md"), file("runbook.md")]),
    folder("migrations", [folder("versions", [file("0001_initial.py")]), file("env.py")]),
    folder(snake(name), [
      folder("api", modules.map((module) => file(`${snake(module)}.py`))),
      folder("services", modules.slice(0, 4).map((module) => file(`${snake(singular(module))}_service.py`))),
      file("__init__.py"),
      file("config.py"),
      file("models.py"),
      file("worker.py"),
    ]),
    folder("tests", modules.slice(0, 3).map((module) => file(`test_${snake(module)}.py`))),
    file(".gitignore"),
    file("docker-compose.yml"),
    file("pyproject.toml"),
    file("README.md"),
    file("uv.lock"),
  ],
  Go: (_random, name, modules) => [
    ci,
    folder("cmd", [folder(name, [file("main.go")]), folder("migrate", [file("main.go")])]),
    folder(
      "internal",
      modules.map((module) =>
        folder(snake(singular(module)), [
          file("handler.go"),
          file("service.go"),
          file("store.go"),
          file("service_test.go"),
        ]),
      ),
    ),
    folder("migrations", [file("0001_init.up.sql"), file("0001_init.down.sql")]),
    file("go.mod"),
    file("go.sum"),
    file("Makefile"),
    file("README.md"),
  ],
  Rust: (_random, _name, modules) => [
    ci,
    folder("benches", [file("throughput.rs")]),
    folder("src", [
      ...modules.map((module) => file(`${snake(singular(module))}.rs`)),
      file("config.rs"),
      file("error.rs"),
      file("lib.rs"),
      file("main.rs"),
    ]),
    folder("tests", [file("integration.rs")]),
    file("Cargo.lock"),
    file("Cargo.toml"),
    file("README.md"),
  ],
  Java: (_random, name, modules) => [
    folder("src", [
      folder("main", [
        folder("java", [
          folder(
            snake(name).replace(/_/g, ""),
            modules.map((module) =>
              folder(snake(singular(module)), [
                file(`${pascal(singular(module))}Controller.java`),
                file(`${pascal(singular(module))}Service.java`),
                file(`${pascal(singular(module))}Repository.java`),
              ]),
            ),
          ),
        ]),
        folder("resources", [file("application.yml"), folder("db", [folder("migration", [file("V1__init.sql")])])]),
      ]),
      folder("test", [folder("java", modules.slice(0, 2).map((module) => file(`${pascal(singular(module))}ServiceTest.java`)))]),
    ]),
    file("Dockerfile"),
    file("mvnw"),
    file("pom.xml"),
    file("README.md"),
  ],
  Kotlin: (_random, _name, modules) => [
    folder("app", [
      folder("src", [
        folder("main", [
          folder("kotlin", modules.map((module) => folder(snake(module), [
            file(`${pascal(singular(module))}Screen.kt`),
            file(`${pascal(singular(module))}ViewModel.kt`),
          ]))),
          folder("res", [folder("values", [file("strings.xml"), file("themes.xml")])]),
          file("AndroidManifest.xml"),
        ]),
        folder("test", [file("ExampleUnitTest.kt")]),
      ]),
      file("build.gradle.kts"),
    ]),
    folder("gradle", [file("libs.versions.toml")]),
    file("build.gradle.kts"),
    file("gradlew"),
    file("README.md"),
    file("settings.gradle.kts"),
  ],
  Ruby: (_random, _name, modules) => [
    folder("app", [
      folder("controllers", modules.map((module) => file(`${snake(module)}_controller.rb`))),
      folder("jobs", modules.slice(0, 2).map((module) => file(`${snake(singular(module))}_sync_job.rb`))),
      folder("models", modules.map((module) => file(`${snake(singular(module))}.rb`))),
      folder("views", modules.slice(0, 3).map((module) => folder(snake(module), [file("index.html.erb"), file("show.html.erb")]))),
    ]),
    folder("config", [file("database.yml"), file("routes.rb")]),
    folder("db", [file("schema.rb"), file("seeds.rb")]),
    folder("spec", modules.slice(0, 3).map((module) => file(`${snake(singular(module))}_spec.rb`))),
    file("Gemfile"),
    file("Gemfile.lock"),
    file("README.md"),
  ],
  "C#": (_random, name, modules) => [
    folder("src", [
      folder(`${pascal(name)}.Api`, [
        folder("Controllers", modules.map((module) => file(`${pascal(module)}Controller.cs`))),
        file("Program.cs"),
        file("appsettings.json"),
      ]),
      folder(`${pascal(name)}.Domain`, modules.slice(0, 4).map((module) => file(`${pascal(singular(module))}.cs`))),
    ]),
    folder("tests", [folder(`${pascal(name)}.Tests`, modules.slice(0, 2).map((module) => file(`${pascal(singular(module))}Tests.cs`)))]),
    file(`${pascal(name)}.sln`),
    file("Dockerfile"),
    file("README.md"),
  ],
  PHP: (_random, _name, modules) => [
    folder("app", [
      folder("Http", [folder("Controllers", modules.map((module) => file(`${pascal(singular(module))}Controller.php`)))]),
      folder("Models", modules.map((module) => file(`${pascal(singular(module))}.php`))),
    ]),
    folder("database", [folder("migrations", modules.slice(0, 3).map((module, index) => file(`2023_0${index + 1}_01_create_${snake(module)}_table.php`)))]),
    folder("resources", [folder("js", [file("app.js"), folder("components", [file("DataTable.vue")])]), folder("views", [file("layout.blade.php")])]),
    folder("routes", [file("api.php"), file("web.php")]),
    folder("tests", [folder("Feature", modules.slice(0, 2).map((module) => file(`${pascal(singular(module))}Test.php`)))]),
    file("artisan"),
    file("composer.json"),
    file("composer.lock"),
    file("README.md"),
  ],
  Swift: (_random, name, modules) => [
    folder(pascal(name), [
      folder("Features", modules.map((module) => folder(pascal(module), [
        file(`${pascal(singular(module))}View.swift`),
        file(`${pascal(singular(module))}Model.swift`),
      ]))),
      folder("Resources", [file("Assets.xcassets"), file("Localizable.strings")]),
      file(`${pascal(name)}App.swift`),
    ]),
    folder(`${pascal(name)}Tests`, [file(`${pascal(name)}Tests.swift`)]),
    file("Package.resolved"),
    file("README.md"),
  ],
  Dart: (_random, _name, modules) => [
    folder("lib", [
      folder("features", modules.map((module) => folder(snake(module), [file(`${snake(singular(module))}_page.dart`), file(`${snake(singular(module))}_repository.dart`)]))),
      file("main.dart"),
      file("router.dart"),
    ]),
    folder("test", [file("widget_test.dart")]),
    file("analysis_options.yaml"),
    file("pubspec.lock"),
    file("pubspec.yaml"),
    file("README.md"),
  ],
};

const UNITY_SYSTEMS = ["Board", "Economy", "Enemies", "Inventory", "Levels", "Player", "Quests", "Save", "Shop", "UI"];

function unityLayout(random: Random): AssetPreviewSourceNode[] {
  const systems = sample(random, UNITY_SYSTEMS, 4, 6).sort();
  return [
    folder("Assets", [
      folder("Prefabs", [file("Player.prefab"), file("HUD.prefab")]),
      folder("Scenes", [file("Boot.unity"), file("Main.unity"), file("Level01.unity")]),
      folder("Scripts", systems.map((system) => folder(system, [file(`${system}Controller.cs`), file(`${system}Config.cs`)]))),
      folder("Sprites", [file("atlas_main.png"), file("icons.png")]),
    ]),
    folder("Packages", [file("manifest.json")]),
    folder("ProjectSettings", [file("ProjectSettings.asset"), file("TagManager.asset")]),
    file(".gitignore"),
    file("README.md"),
  ];
}

/** A plausible repository tree for a codebase in `language`, laid out the way that ecosystem does. */
export function codebaseStructure(seed: string, language: string): AssetPreviewSourceNode[] {
  const random = seededRandom(seed);
  const name = projectName(seed);
  if (language === "C#" && /game|unity|merge|tower|dungeon|kart/.test(name)) return unityLayout(random);
  const layout = LAYOUTS[language];
  const modules = sample(random, DOMAIN_MODULES, 4, 6).sort();
  if (!layout) return [folder("src", modules.map((module) => file(`${module}.txt`))), file("README.md")];
  return layout(random, name, modules);
}

/** File stems per extension, so a dataset's files read like what they hold. */
const DATA_STEMS: Record<string, string[]> = {
  csv: ["accounts", "line_items", "orders", "prices_daily", "readings_hourly", "sessions", "transactions"],
  jsonl: ["conversations", "episodes", "records", "tickets", "trajectories"],
  json: ["schema", "task", "labels", "config"],
  parquet: ["part-00000", "part-00001", "part-00002", "part-00003"],
  pdf: ["agreement", "invoice", "policy", "statement", "report"],
  docx: ["memo", "proposal", "sop", "brief"],
  xlsx: ["budget_model", "cash_flow", "debt_schedule", "forecast", "unit_economics"],
  pptx: ["board_update", "pitch", "quarterly_review"],
  md: ["notes", "rubric", "task"],
  txt: ["article", "transcript", "note"],
  png: ["img", "frame", "scan"],
  jpg: ["img", "photo", "frame"],
  wav: ["call", "clip", "utt"],
  eml: ["msg"],
  py: ["grader", "env", "tools"],
};

const DATA_FOLDERS: Record<string, string[]> = {
  csv: ["tables"],
  jsonl: ["train", "validation", "test"],
  json: ["meta"],
  parquet: ["year=2023", "year=2024", "year=2025"],
  pdf: ["documents"],
  docx: ["documents"],
  xlsx: ["models"],
  pptx: ["decks"],
  md: ["docs"],
  txt: ["texts"],
  png: ["images"],
  jpg: ["images"],
  wav: ["audio"],
  eml: ["mailboxes"],
  py: ["graders"],
};

function dataFile(random: Random, ext: string, index: number): AssetPreviewSourceNode {
  const stem = pick(random, DATA_STEMS[ext] ?? ["file"]);
  return file(`${stem}_${String(index + 1).padStart(4, "0")}.${ext}`);
}

/** A plausible dataset tree: a folder per file type it mostly holds, with a README and manifest. */
export function rawDataStructure(seed: string, extensions: Record<string, number>): AssetPreviewSourceNode[] {
  const random = seededRandom(seed);
  const types = Object.entries(extensions)
    .filter(([ext]) => ext !== "md")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const folders = types.flatMap(([ext, count]) => {
    const parts = DATA_FOLDERS[ext] ?? [ext];
    const perPart = Math.max(1, Math.min(6, Math.ceil(count / parts.length)));
    return parts.map((part) =>
      folder(
        part,
        Array.from({ length: Math.min(perPart, randomInt(random, 3, 6)) }, (_, index) =>
          dataFile(random, ext, index),
        ),
      ),
    );
  });
  const merged = new Map<string, AssetPreviewSourceNode[]>();
  for (const node of folders) merged.set(node.name, [...(merged.get(node.name) ?? []), ...(node.children ?? [])]);
  return [
    folder(
      "data",
      [...merged].map(([name, children]) => folder(name, children)),
    ),
    file("DATA_CARD.md"),
    file("LICENSE.txt"),
    file("manifest.json"),
    file("README.md"),
  ];
}
