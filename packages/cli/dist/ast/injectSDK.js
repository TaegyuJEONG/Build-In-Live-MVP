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
async function injectSDK(cwd, framework) {
    let targetPath = '';
    if (framework === 'nextjs') {
        const possiblePaths = [
            path_1.default.join(cwd, 'app', 'layout.tsx'),
            path_1.default.join(cwd, 'src', 'app', 'layout.tsx')
        ];
        for (const p of possiblePaths) {
            try {
                await promises_1.default.access(p);
                targetPath = p;
                break;
            }
            catch { /* ignore */ }
        }
    }
    else if (framework === 'vitereact') {
        const possiblePaths = [
            path_1.default.join(cwd, 'src', 'main.tsx'),
            path_1.default.join(cwd, 'src', 'main.jsx')
        ];
        for (const p of possiblePaths) {
            try {
                await promises_1.default.access(p);
                targetPath = p;
                break;
            }
            catch { /* ignore */ }
        }
    }
    if (!targetPath) {
        console.log(picocolors_1.default.yellow(`⚠️ Could not find standard entry file to inject SDK.`));
        return false;
    }
    console.log(picocolors_1.default.gray(`Found entry file at: ${targetPath}`));
    console.log(picocolors_1.default.gray(`Mocking SDK installation: npm install ${SDK_PACKAGE_NAME}`));
    // In real life: execSync(`npm install ${SDK_PACKAGE_NAME}`, { stdio: 'inherit', cwd });
    const project = new ts_morph_1.Project();
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
        console.log(picocolors_1.default.green(`✔ Injected import statement for ${SDK_COMPONENT_NAME}`));
    }
    else {
        console.log(picocolors_1.default.gray(`import statement for ${SDK_COMPONENT_NAME} already exists.`));
    }
    let bodyInjected = false;
    if (framework === 'nextjs') {
        sourceFile.forEachDescendant(node => {
            if (node.getKind() === ts_morph_1.SyntaxKind.JsxElement) {
                const jsxElement = node.asKind(ts_morph_1.SyntaxKind.JsxElement);
                const openingElement = jsxElement?.getOpeningElement();
                if (openingElement?.getTagNameNode().getText() === 'body') {
                    const textArea = jsxElement.getText();
                    if (textArea.includes(SDK_COMPONENT_NAME)) {
                        bodyInjected = true;
                        console.log(picocolors_1.default.gray(`<${SDK_COMPONENT_NAME} /> is already injected in <body>.`));
                        return;
                    }
                    const originalBodyText = jsxElement.getText();
                    const updatedBodyText = originalBodyText.replace(/(<body[^>]*>)/i, `$1\n        <${SDK_COMPONENT_NAME} />`);
                    jsxElement.replaceWithText(updatedBodyText);
                    bodyInjected = true;
                    console.log(picocolors_1.default.green(`✔ Injected <${SDK_COMPONENT_NAME} /> inside <body> tag.`));
                }
            }
        });
    }
    else if (framework === 'vitereact') {
        const codeText = sourceFile.getFullText();
        if (codeText.includes(`<${SDK_COMPONENT_NAME} />`)) {
            bodyInjected = true;
            console.log(picocolors_1.default.gray(`<${SDK_COMPONENT_NAME} /> is already injected.`));
        }
        else {
            sourceFile.forEachDescendant(node => {
                if (node.getKind() === ts_morph_1.SyntaxKind.CallExpression) {
                    const callExpr = node.asKind(ts_morph_1.SyntaxKind.CallExpression);
                    const callText = callExpr?.getExpression().getText();
                    if (callText && callText.endsWith('.render')) {
                        const args = callExpr?.getArguments();
                        if (args && args.length > 0) {
                            const rootJsx = args[0];
                            if (rootJsx.getKind() === ts_morph_1.SyntaxKind.JsxElement || rootJsx.getKind() === ts_morph_1.SyntaxKind.JsxSelfClosingElement || rootJsx.getKind() === ts_morph_1.SyntaxKind.JsxFragment) {
                                const originalJsxText = rootJsx.getText();
                                const newJsxText = `<>\n    <${SDK_COMPONENT_NAME} />\n    ${originalJsxText}\n  </>`;
                                rootJsx.replaceWithText(newJsxText);
                                bodyInjected = true;
                                console.log(picocolors_1.default.green(`✔ Injected <${SDK_COMPONENT_NAME} /> into ReactDOM.render tree.`));
                            }
                        }
                    }
                }
            });
        }
    }
    if (!bodyInjected) {
        console.log(picocolors_1.default.yellow(`⚠️ Could not automatically find injection point. Please add <${SDK_COMPONENT_NAME} /> manually.`));
    }
    else {
        await sourceFile.save();
        console.log(picocolors_1.default.green(`✅ File updated successfully!`));
    }
    return true;
}
