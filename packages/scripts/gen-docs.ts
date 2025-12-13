import path from "path";
import {
  Project,
  SyntaxKind,
  FunctionDeclaration,
  ArrowFunction,
  ParameterDeclaration,
} from "ts-morph";

const ROOT = process.cwd();

const project = new Project({
  tsConfigFilePath: path.join(ROOT, "tsconfig.json"),
});

// Include backend + utils + shared files
project.addSourceFilesAtPaths([
  // Backend (TS)
  "apps/be/**/*.ts",
  "apps/be/*.ts",
  // Frontend (Next.js app in apps/fe)
  "apps/fe/**/*.tsx",
  "apps/fe/**/*.ts",
  // WebSocket server
  "apps/ws/**/*.ts",
  // Shared utils and packages
  "packages/utils/**/*.ts",
  // DB package (include nested files like prisma helpers)
  "packages/db/**/*.ts",
  // UI React components
  "packages/ui/**/*.tsx",

  //Price Poller and Engine
  "apps/price-poller/*.ts",
  "apps/price-engine/*.ts",

  //Kafka
  "packages/kafka/**/*.ts",
]);

const files = project.getSourceFiles();

/**
 * Generates inferred JSDoc for a given function-like declaration.
 */
function generateDocs(
  entity: FunctionDeclaration | ArrowFunction,
  name: string,
  isArrow = false,
) {
  const params = entity
    .getParameters()
    .filter((p: ParameterDeclaration) => p.getName() !== "this")
    .map((p: ParameterDeclaration) => {
      let typeText = "unknown";
      try {
        typeText = p.getType().getText();
      } catch {
        typeText = "unknown";
      }
      return {
        name: p.getName(),
        type: typeText,
      };
    });

  let returnType = "unknown";
  try {
    returnType = entity.getReturnType().getText();
  } catch {
    returnType = "unknown";
  }
  const description = `${isArrow ? "Executes" : "Performs"} ${name
    .replace(/([A-Z])/g, " $1")
    .toLowerCase()} operation.`;

  entity.addJsDoc({
    description,
    tags: [
      ...params.map((param: { name: string; type: string }) => ({
        tagName: "param",
        text: `{${param.type}} ${param.name} - Description of ${param.name}`,
      })),
      {
        tagName: "returns",
        text: `{${returnType}} Description of return value`,
      },
    ],
  });

  console.log(` Added docs for ${isArrow ? "arrow " : ""}function: ${name}`);
}

for (const file of files) {
  // --- Handle named functions ---
  for (const func of file.getFunctions()) {
    const name = func.getName();
    if (!name || func.getJsDocs().length > 0) continue;
    generateDocs(func, name);
  }

  // --- Handle arrow functions exported as constants ---
  for (const variable of file.getVariableDeclarations()) {
    const initializer = variable.getInitializer();
    if (!initializer || initializer.getKind() !== SyntaxKind.ArrowFunction)
      continue;

    const name = variable.getName();

    const existingDocs = (initializer as ArrowFunction).getJsDocs();
    if (existingDocs.length > 0) continue;

    generateDocs(initializer as ArrowFunction, name, true);
  }
}

await project.save();
console.log("Auto-generated JSDocs with inferred types!");
