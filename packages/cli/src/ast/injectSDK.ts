import { Project, SyntaxKind } from 'ts-morph';
import path from 'path';
import fs from 'fs/promises';
import pc from 'picocolors';

const SDK_PACKAGE_NAME = '@build-in-live/sdk';
const SDK_COMPONENT_NAME = 'LiveFeedbackSDK';

export async function injectSDK(cwd: string) {
  // 1. Determine if using app or src/app
  const possiblePaths = [
    path.join(cwd, 'app', 'layout.tsx'),
    path.join(cwd, 'src', 'app', 'layout.tsx')
  ];

  let targetLayoutPath = '';
  for (const p of possiblePaths) {
    try {
      await fs.access(p);
      targetLayoutPath = p;
      break;
    } catch {
      // ignore
    }
  }

  if (!targetLayoutPath) {
    console.log(pc.yellow(`⚠️ Could not find layout.tsx in standard Next.js App Router locations.`));
    return false;
  }

  console.log(pc.gray(`Found layout.tsx at: ${targetLayoutPath}`));

  // 2. Install the mock dependency (Simulated)
  console.log(pc.gray(`Mocking SDK installation: npm install ${SDK_PACKAGE_NAME}`));
  // In real life: execSync(`npm install ${SDK_PACKAGE_NAME}`, { stdio: 'inherit', cwd });
  
  // 3. Setup ts-morph project
  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(targetLayoutPath);

  // 4. Inject Import Declaration if not exists
  const hasImport = sourceFile.getImportDeclarations().some(imp => {
    return imp.getModuleSpecifierValue() === SDK_PACKAGE_NAME;
  });

  if (!hasImport) {
    sourceFile.addImportDeclaration({
      namedImports: [SDK_COMPONENT_NAME],
      moduleSpecifier: SDK_PACKAGE_NAME,
    });
    console.log(pc.green(`✔ Injected import statement for ${SDK_COMPONENT_NAME}`));
  } else {
    console.log(pc.gray(`import statement for ${SDK_COMPONENT_NAME} already exists.`));
  }

  // 5. Inject Component into layout body
  let bodyInjected = false;
  
  // We need to look for JSX Elements that have a <body> tag.
  sourceFile.forEachDescendant(node => {
    if (node.getKind() === SyntaxKind.JsxElement) {
      const jsxElement = node.asKind(SyntaxKind.JsxElement);
      const openingElement = jsxElement?.getOpeningElement();
      if (openingElement?.getTagNameNode().getText() === 'body') {
        
        // Check if our SDK is already injected
        const textArea = jsxElement!.getText();
        if (textArea.includes(SDK_COMPONENT_NAME)) {
          bodyInjected = true;
          console.log(pc.gray(`<${SDK_COMPONENT_NAME} /> is already injected in <body>.`));
          return;
        }

        // String replacement approach for safely adding child without messing up ts-morph JsxChild indexing
        const originalBodyText = jsxElement!.getText();
        // regex finds `<body ...>` and inserts `<LiveFeedbackSDK />` right after it
        const updatedBodyText = originalBodyText.replace(/(<body[^>]*>)/i, `$1\n        <${SDK_COMPONENT_NAME} />`);
        
        jsxElement!.replaceWithText(updatedBodyText);
        bodyInjected = true;
        console.log(pc.green(`✔ Injected <${SDK_COMPONENT_NAME} /> inside <body> tag.`));
      }
    }
  });

  if (!bodyInjected) {
    console.log(pc.yellow(`⚠️ Could not automatically find <body> tag to inject the SDK. Please add it manually.`));
  }

  // 6. Save modifications
  await sourceFile.save();
  console.log(pc.green(`✅ Layout file updated successfully!`));

  return true;
}
