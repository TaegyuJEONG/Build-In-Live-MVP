"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectSDK = injectSDK;
const ts_morph_1 = require("ts-morph");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const picocolors_1 = __importDefault(require("picocolors"));
const SDK_PACKAGE_NAME = '@build-in-live/sdk';
const SDK_COMPONENT_NAME = 'LiveFeedbackSDK';
async function injectSDK(cwd) {
    // 1. Determine if using app or src/app
    const possiblePaths = [
        path_1.default.join(cwd, 'app', 'layout.tsx'),
        path_1.default.join(cwd, 'src', 'app', 'layout.tsx')
    ];
    let targetLayoutPath = '';
    for (const p of possiblePaths) {
        try {
            await promises_1.default.access(p);
            targetLayoutPath = p;
            break;
        }
        catch {
            // ignore
        }
    }
    if (!targetLayoutPath) {
        console.log(picocolors_1.default.yellow(`⚠️ Could not find layout.tsx in standard Next.js App Router locations.`));
        return false;
    }
    console.log(picocolors_1.default.gray(`Found layout.tsx at: ${targetLayoutPath}`));
    // 2. Install the mock dependency (Simulated)
    console.log(picocolors_1.default.gray(`Mocking SDK installation: npm install ${SDK_PACKAGE_NAME}`));
    // In real life: execSync(`npm install ${SDK_PACKAGE_NAME}`, { stdio: 'inherit', cwd });
    // 3. Setup ts-morph project
    const project = new ts_morph_1.Project();
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
        console.log(picocolors_1.default.green(`✔ Injected import statement for ${SDK_COMPONENT_NAME}`));
    }
    else {
        console.log(picocolors_1.default.gray(`import statement for ${SDK_COMPONENT_NAME} already exists.`));
    }
    // 5. Inject Component into layout body
    let bodyInjected = false;
    // We need to look for JSX Elements that have a <body> tag.
    sourceFile.forEachDescendant(node => {
        if (node.getKind() === ts_morph_1.SyntaxKind.JsxElement) {
            const jsxElement = node.asKind(ts_morph_1.SyntaxKind.JsxElement);
            const openingElement = jsxElement?.getOpeningElement();
            if (openingElement?.getTagNameNode().getText() === 'body') {
                // Check if our SDK is already injected
                const textArea = jsxElement.getText();
                if (textArea.includes(SDK_COMPONENT_NAME)) {
                    bodyInjected = true;
                    console.log(picocolors_1.default.gray(`<${SDK_COMPONENT_NAME} /> is already injected in <body>.`));
                    return;
                }
                // String replacement approach for safely adding child without messing up ts-morph JsxChild indexing
                const originalBodyText = jsxElement.getText();
                // regex finds `<body ...>` and inserts `<LiveFeedbackSDK />` right after it
                const updatedBodyText = originalBodyText.replace(/(<body[^>]*>)/i, `$1\n        <${SDK_COMPONENT_NAME} />`);
                jsxElement.replaceWithText(updatedBodyText);
                bodyInjected = true;
                console.log(picocolors_1.default.green(`✔ Injected <${SDK_COMPONENT_NAME} /> inside <body> tag.`));
            }
        }
    });
    if (!bodyInjected) {
        console.log(picocolors_1.default.yellow(`⚠️ Could not automatically find <body> tag to inject the SDK. Please add it manually.`));
    }
    // 6. Save modifications
    await sourceFile.save();
    console.log(picocolors_1.default.green(`✅ Layout file updated successfully!`));
    return true;
}
