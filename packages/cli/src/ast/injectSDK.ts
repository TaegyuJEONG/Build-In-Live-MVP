import { Project, SyntaxKind } from 'ts-morph';
import path from 'path';
import fs from 'fs/promises';
import pc from 'picocolors';
import type { FrameworkType } from '../utils/frameworks';

const SDK_PACKAGE_NAME = '@build-in-live/sdk';
const SDK_COMPONENT_NAME = 'LiveFeedbackSDK';

export async function injectSDK(cwd: string, framework: FrameworkType) {
  let targetPath = '';
  
  if (framework === 'nextjs') {
    const possiblePaths = [
      path.join(cwd, 'app', 'layout.tsx'),
      path.join(cwd, 'src', 'app', 'layout.tsx')
    ];
    for (const p of possiblePaths) {
      try { await fs.access(p); targetPath = p; break; } catch { /* ignore */ }
    }
  } else if (framework === 'vitereact') {
    const possiblePaths = [
      path.join(cwd, 'src', 'main.tsx'),
      path.join(cwd, 'src', 'main.jsx')
    ];
    for (const p of possiblePaths) {
      try { await fs.access(p); targetPath = p; break; } catch { /* ignore */ }
    }
  }

  if (!targetPath) {
    console.log(pc.yellow(`⚠️ Could not find standard entry file to inject SDK.`));
    return false;
  }

  console.log(pc.gray(`Found entry file at: ${targetPath}`));
  console.log(pc.gray(`Mocking SDK installation: npm install ${SDK_PACKAGE_NAME}`));
  // In real life: execSync(`npm install ${SDK_PACKAGE_NAME}`, { stdio: 'inherit', cwd });

  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(targetPath);

  // Inject Import Declaration if not exists
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

  let bodyInjected = false;

  if (framework === 'nextjs') {
    sourceFile.forEachDescendant(node => {
      if (node.getKind() === SyntaxKind.JsxElement) {
        const jsxElement = node.asKind(SyntaxKind.JsxElement);
        const openingElement = jsxElement?.getOpeningElement();
        if (openingElement?.getTagNameNode().getText() === 'body') {
          const textArea = jsxElement!.getText();
          if (textArea.includes(SDK_COMPONENT_NAME)) {
            bodyInjected = true;
            console.log(pc.gray(`<${SDK_COMPONENT_NAME} /> is already injected in <body>.`));
            return;
          }
          const originalBodyText = jsxElement!.getText();
          const updatedBodyText = originalBodyText.replace(/(<body[^>]*>)/i, `$1\n        <${SDK_COMPONENT_NAME} />`);
          jsxElement!.replaceWithText(updatedBodyText);
          bodyInjected = true;
          console.log(pc.green(`✔ Injected <${SDK_COMPONENT_NAME} /> inside <body> tag.`));
        }
      }
    });

  } else if (framework === 'vitereact') {
    const codeText = sourceFile.getFullText();
    if (codeText.includes(`<${SDK_COMPONENT_NAME} />`)) {
       bodyInjected = true;
       console.log(pc.gray(`<${SDK_COMPONENT_NAME} /> is already injected.`));
    } else {
       sourceFile.forEachDescendant(node => {
         if (node.getKind() === SyntaxKind.CallExpression) {
            const callExpr = node.asKind(SyntaxKind.CallExpression);
            const callText = callExpr?.getExpression().getText();
            if (callText && callText.endsWith('.render')) {
               const args = callExpr?.getArguments();
               if (args && args.length > 0) {
                 const rootJsx = args[0];
                 if (rootJsx.getKind() === SyntaxKind.JsxElement || rootJsx.getKind() === SyntaxKind.JsxSelfClosingElement || rootJsx.getKind() === SyntaxKind.JsxFragment) {
                   const originalJsxText = rootJsx.getText();
                   const newJsxText = `<>\n    <${SDK_COMPONENT_NAME} />\n    ${originalJsxText}\n  </>`;
                   rootJsx.replaceWithText(newJsxText);
                   bodyInjected = true;
                   console.log(pc.green(`✔ Injected <${SDK_COMPONENT_NAME} /> into ReactDOM.render tree.`));
                 }
               }
            }
         }
       });
    }
  }

  if (!bodyInjected) {
    console.log(pc.yellow(`⚠️ Could not automatically find injection point. Please add <${SDK_COMPONENT_NAME} /> manually.`));
  } else {
    await sourceFile.save();
    console.log(pc.green(`✅ File updated successfully!`));
  }

  return true;
}
