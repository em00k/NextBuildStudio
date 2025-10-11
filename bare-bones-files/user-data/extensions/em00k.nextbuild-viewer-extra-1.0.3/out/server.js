"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
// Create a connection for the server, using Node's IPC as a transport.
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
// Create a simple text document manager.
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
// Cache for parsed symbols per document
const documentSymbols = new Map();
connection.onInitialize((params) => {
    const capabilities = params.capabilities;
    hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);
    hasDiagnosticRelatedInformationCapability = !!(capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation);
    const result = {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: ['.', ' ']
            },
            documentSymbolProvider: true,
            definitionProvider: true,
            referencesProvider: true
        }
    };
    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true
            }
        };
    }
    return result;
});
connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        connection.client.register(node_1.DidChangeConfigurationNotification.type, undefined);
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(_event => {
            connection.console.log('Workspace folder change event received.');
        });
    }
});
// Helper function to parse parameters from function/subroutine definitions
function parseParameters(paramString, lineNumber, variables) {
    // Split parameters by comma
    const params = paramString.split(',').map(p => p.trim()).filter(p => p.length > 0);
    const parameters = [];
    params.forEach(param => {
        // Match parameter patterns like: "x", "bank as ubyte", "ByRef value as integer"
        const paramMatch = param.match(/(?:ByRef\s+|ByVal\s+)?([A-Za-z_][A-Za-z0-9_$]*)\s*(?:as\s+([A-Za-z]+))?/i);
        if (paramMatch) {
            const name = paramMatch[1];
            const type = paramMatch[2];
            // Create parameter range (approximate position)
            const range = node_1.Range.create(lineNumber, 0, lineNumber, name.length);
            parameters.push({ name, type, range });
            // Don't duplicate if already exists in variables
            if (!variables.find(v => v.name.toLowerCase() === name.toLowerCase())) {
                variables.push({ name, type, range, line: lineNumber });
            }
        }
    });
    return parameters;
}
// Parse NextBuild document for symbols
function parseDocument(document) {
    const text = document.getText();
    const lines = text.split('\n');
    const variables = [];
    const functions = [];
    const labels = [];
    const subroutines = [];
    connection.console.log(`Parsing document: ${document.uri} with ${lines.length} lines`);
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        // Skip comments and empty lines
        if (trimmedLine.startsWith("'") || trimmedLine.startsWith("REM") ||
            trimmedLine.startsWith("/'") || trimmedLine === '') {
            continue;
        }
        // Parse labels (lines ending with :)
        const labelMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*):(.*)$/);
        if (labelMatch) {
            const name = labelMatch[1];
            const range = node_1.Range.create(i, 0, i, name.length);
            labels.push({ name, range, line: i });
            connection.console.log(`Found label: ${name} at line ${i + 1}`);
            continue;
        }
        // Parse function declarations and definitions (including fastcall)
        const functionMatch = line.match(/\b(?:(?:DECLARE\s+)?FUNCTION|DEF\s+FN)(?:\s+(?:FASTCALL|STDCALL))?\s+([A-Za-z_][A-Za-z0-9_$]*)\s*\(([^)]*)\)/i);
        if (functionMatch) {
            const name = functionMatch[1];
            const params = functionMatch[2];
            // Create full signature
            const fullMatch = functionMatch[0];
            const signature = fullMatch.replace(/\b(?:(?:DECLARE\s+)?FUNCTION|DEF\s+FN)\s+/i, '').trim();
            const startPos = line.indexOf(name);
            const range = node_1.Range.create(i, startPos, i, startPos + name.length);
            // Parse parameters and get parameter list
            let parameters = [];
            if (params && params.trim()) {
                parameters = parseParameters(params, i, variables);
            }
            functions.push({ name, signature, parameters, range, line: i });
        }
        // Parse subroutine definitions (including fastcall)
        const subMatch = line.match(/\bSUB(?:\s+(?:FASTCALL|STDCALL))?\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)/i);
        if (subMatch) {
            const name = subMatch[1];
            const params = subMatch[2];
            // Create full signature
            const fullMatch = subMatch[0];
            const signature = fullMatch.replace(/\bSUB\s+/i, '').trim();
            const startPos = line.indexOf(name);
            const range = node_1.Range.create(i, startPos, i, startPos + name.length);
            // Parse parameters and get parameter list
            let parameters = [];
            if (params && params.trim()) {
                parameters = parseParameters(params, i, variables);
            }
            subroutines.push({ name, signature, parameters, range, line: i });
        }
        // Parse variable declarations with DIM (including multiple variables)
        const dimMatch = line.match(/\b(?:DIM|CONST)\s+([A-Za-z_][A-Za-z0-9_$,\s]*)\s*(?:AS\s+([A-Za-z]+))?(?:\s*=\s*[^']*)?/i);
        if (dimMatch) {
            const varList = dimMatch[1];
            const type = dimMatch[2];
            // Split by comma to handle multiple variables
            const varNames = varList.split(',').map(v => v.trim()).filter(v => v.length > 0);
            varNames.forEach(name => {
                // Clean up the name to remove any extra whitespace or AS clause
                const cleanName = name.replace(/\s+as\s+.*$/i, '').trim();
                if (cleanName) {
                    const startPos = line.indexOf(cleanName);
                    if (startPos >= 0) {
                        const range = node_1.Range.create(i, startPos, i, startPos + cleanName.length);
                        // Update existing variable if found, otherwise add new one
                        const existingVar = variables.find(v => v.name.toLowerCase() === cleanName.toLowerCase());
                        if (existingVar) {
                            existingVar.type = type; // Update with type information
                            existingVar.range = range; // Update position to DIM declaration
                            existingVar.line = i;
                        }
                        else {
                            variables.push({ name: cleanName, type, range, line: i });
                        }
                    }
                }
            });
        }
        // Parse LET statements
        const letMatch = line.match(/\bLET\s+([A-Za-z_][A-Za-z0-9_$]*)\s*=/i);
        if (letMatch) {
            const name = letMatch[1];
            const startPos = line.indexOf(name);
            const range = node_1.Range.create(i, startPos, i, startPos + name.length);
            // Don't duplicate if already declared
            if (!variables.find(v => v.name.toLowerCase() === name.toLowerCase())) {
                variables.push({ name, range, line: i });
            }
        }
        // Parse FOR loop variables
        const forMatch = line.match(/\bFOR\s+([A-Za-z_][A-Za-z0-9_$]*)\s*=/i);
        if (forMatch) {
            const name = forMatch[1];
            const startPos = line.indexOf(name);
            const range = node_1.Range.create(i, startPos, i, startPos + name.length);
            // Don't duplicate if already declared
            if (!variables.find(v => v.name.toLowerCase() === name.toLowerCase())) {
                variables.push({ name, range, line: i });
            }
        }
        // Parse simple variable assignments (including multiple on one line)
        // Handle patterns like: basex = 124 : basey = 132
        const multiAssignMatch = line.match(/([A-Za-z_][A-Za-z0-9_$]*)\s*=\s*[^:']*/g);
        if (multiAssignMatch && !line.match(/\b(?:IF|FOR|WHILE|PRINT|INPUT|LET|DIM)\b/i)) {
            multiAssignMatch.forEach(assignment => {
                const assignMatch = assignment.match(/([A-Za-z_][A-Za-z0-9_$]*)\s*=/);
                if (assignMatch) {
                    const name = assignMatch[1];
                    const startPos = line.indexOf(name);
                    const range = node_1.Range.create(i, startPos, i, startPos + name.length);
                    // Don't duplicate if already declared
                    if (!variables.find(v => v.name.toLowerCase() === name.toLowerCase())) {
                        variables.push({ name, range, line: i });
                    }
                }
            });
        }
    }
    connection.console.log(`Found ${variables.length} variables, ${functions.length} functions, ${labels.length} labels, ${subroutines.length} subroutines`);
    return { variables, functions, labels, subroutines };
}
// Update symbols when document changes
documents.onDidChangeContent(change => {
    const symbols = parseDocument(change.document);
    documentSymbols.set(change.document.uri, symbols);
});
documents.onDidOpen(event => {
    const symbols = parseDocument(event.document);
    documentSymbols.set(event.document.uri, symbols);
});
// Provide document symbols for outline
connection.onDocumentSymbol((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return [];
    }
    const symbols = documentSymbols.get(params.textDocument.uri);
    if (!symbols) {
        return [];
    }
    const result = [];
    // Add functions
    symbols.functions.forEach(func => {
        // Create parameter names string (without types)
        const paramNames = func.parameters.map(p => p.name).join(', ');
        const displayName = paramNames ? `${func.name}(${paramNames})` : `${func.name}()`;
        // Create child symbols for parameters
        const children = func.parameters.map(param => ({
            name: param.name + (param.type ? ` (${param.type})` : ''),
            kind: node_1.SymbolKind.Variable,
            range: param.range,
            selectionRange: param.range
        }));
        result.push({
            name: displayName,
            kind: node_1.SymbolKind.Function,
            range: func.range,
            selectionRange: func.range,
            children: children.length > 0 ? children : undefined
        });
    });
    // Add subroutines
    symbols.subroutines.forEach(sub => {
        // Create parameter names string (without types)
        const paramNames = sub.parameters.map(p => p.name).join(', ');
        const displayName = paramNames ? `${sub.name}(${paramNames})` : `${sub.name}()`;
        // Create child symbols for parameters
        const children = sub.parameters.map(param => ({
            name: param.name + (param.type ? ` (${param.type})` : ''),
            kind: node_1.SymbolKind.Variable,
            range: param.range,
            selectionRange: param.range
        }));
        result.push({
            name: displayName,
            kind: node_1.SymbolKind.Method,
            range: sub.range,
            selectionRange: sub.range,
            children: children.length > 0 ? children : undefined
        });
    });
    // Add labels
    connection.console.log(`Adding ${symbols.labels.length} labels to document symbols`);
    symbols.labels.forEach(label => {
        connection.console.log(`Adding label: ${label.name}`);
        result.push({
            name: label.name,
            kind: node_1.SymbolKind.Constant,
            range: label.range,
            selectionRange: label.range
        });
    });
    // Add variables
    symbols.variables.forEach(variable => {
        result.push({
            name: variable.name + (variable.type ? ` (${variable.type})` : ''),
            kind: node_1.SymbolKind.Variable,
            range: variable.range,
            selectionRange: variable.range
        });
    });
    return result;
});
// Provide go-to-definition for subroutines and functions
connection.onDefinition((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return [];
    }
    const symbols = documentSymbols.get(params.textDocument.uri);
    if (!symbols) {
        return [];
    }
    const position = params.position;
    const text = document.getText();
    const offset = document.offsetAt(position);
    // Get word at position
    const wordRange = getWordRangeAtPosition(text, offset);
    if (!wordRange) {
        return [];
    }
    const word = text.substring(wordRange.start, wordRange.end);
    // Find matching function, subroutine, or label
    const allSymbols = [
        ...symbols.functions,
        ...symbols.subroutines,
        ...symbols.labels
    ];
    const matchingSymbol = allSymbols.find(symbol => symbol.name.toLowerCase() === word.toLowerCase());
    if (matchingSymbol) {
        return [{
                uri: params.textDocument.uri,
                range: matchingSymbol.range
            }];
    }
    return [];
});
// Provide find all references for functions, subroutines, and labels
connection.onReferences((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return [];
    }
    const symbols = documentSymbols.get(params.textDocument.uri);
    if (!symbols) {
        return [];
    }
    const position = params.position;
    const text = document.getText();
    const offset = document.offsetAt(position);
    // Get word at position
    const wordRange = getWordRangeAtPosition(text, offset);
    if (!wordRange) {
        return [];
    }
    const word = text.substring(wordRange.start, wordRange.end);
    const locations = [];
    // Find matching function, subroutine, or label definition
    const allSymbols = [
        ...symbols.functions,
        ...symbols.subroutines,
        ...symbols.labels
    ];
    const matchingSymbol = allSymbols.find(symbol => symbol.name.toLowerCase() === word.toLowerCase());
    if (matchingSymbol) {
        // Add the definition location
        locations.push({
            uri: params.textDocument.uri,
            range: matchingSymbol.range
        });
        // Search for all usages/calls of this function/subroutine/label in the document
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            // Skip comments and empty lines
            if (trimmedLine.startsWith("'") || trimmedLine.startsWith("REM") ||
                trimmedLine.startsWith("/'") || trimmedLine === '') {
                continue;
            }
            // Find all occurrences of the word in this line
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            let match;
            while ((match = regex.exec(line)) !== null) {
                const startPos = match.index;
                const endPos = startPos + word.length;
                // Create a range for this occurrence
                const range = node_1.Range.create(i, startPos, i, endPos);
                // Check if this is not the definition itself (we already added that)
                if (!(i === matchingSymbol.line && startPos >= matchingSymbol.range.start.character && endPos <= matchingSymbol.range.end.character)) {
                    locations.push({
                        uri: params.textDocument.uri,
                        range: range
                    });
                }
            }
        }
    }
    return locations;
});
// Provide completion suggestions for variables
connection.onCompletion((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return [];
    }
    const symbols = documentSymbols.get(params.textDocument.uri);
    if (!symbols) {
        return [];
    }
    const completionItems = [];
    // Add user-defined variables
    symbols.variables.forEach((variable, index) => {
        completionItems.push({
            label: variable.name,
            kind: node_1.CompletionItemKind.Variable,
            detail: variable.type ? `Variable (${variable.type})` : 'Variable',
            documentation: `User-defined variable at line ${variable.line + 1}`,
            sortText: `0${index.toString().padStart(3, '0')}`
        });
    });
    // Add functions
    symbols.functions.forEach((func, index) => {
        // Create parameter names string for completion detail
        const paramNames = func.parameters.map(p => p.name).join(', ');
        const paramDetail = paramNames ? `(${paramNames})` : '()';
        completionItems.push({
            label: func.name,
            kind: node_1.CompletionItemKind.Function,
            detail: `Function${paramDetail}`,
            documentation: `Function defined at line ${func.line + 1}`,
            sortText: `1${index.toString().padStart(3, '0')}`
        });
    });
    // Add subroutines
    symbols.subroutines.forEach((sub, index) => {
        // Create parameter names string for completion detail
        const paramNames = sub.parameters.map(p => p.name).join(', ');
        const paramDetail = paramNames ? `(${paramNames})` : '()';
        completionItems.push({
            label: sub.name,
            kind: node_1.CompletionItemKind.Method,
            detail: `Subroutine${paramDetail}`,
            documentation: `Subroutine defined at line ${sub.line + 1}`,
            sortText: `2${index.toString().padStart(3, '0')}`
        });
    });
    // Add labels
    symbols.labels.forEach((label, index) => {
        completionItems.push({
            label: label.name,
            kind: node_1.CompletionItemKind.Constant,
            detail: 'Label',
            documentation: `Label defined at line ${label.line + 1}`,
            sortText: `3${index.toString().padStart(3, '0')}`
        });
    });
    return completionItems;
});
connection.onCompletionResolve((item) => {
    return item;
});
// Helper function to get word range at position
function getWordRangeAtPosition(text, offset) {
    const wordRegex = /[A-Za-z_][A-Za-z0-9_$]*/g;
    let match;
    while ((match = wordRegex.exec(text)) !== null) {
        if (offset >= match.index && offset <= match.index + match[0].length) {
            return {
                start: match.index,
                end: match.index + match[0].length
            };
        }
    }
    return null;
}
// Make the text document manager listen on the connection
documents.listen(connection);
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map