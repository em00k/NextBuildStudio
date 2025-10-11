const vscode = require('vscode');

function createFormatter() {
    return vscode.languages.registerDocumentFormattingEditProvider('nextbuild', {
        provideDocumentFormattingEdits(document) {
            try {
                const edits = [];
                let indentLevel = 0;
                const INDENT_SIZE = 4;
                let inAsm = false;
                let inSub = false;
                const COMMENT_COLUMN = 60;  // Align all comments here
                
                // Process each line
                for (let i = 0; i < document.lineCount; i++) {
                    const line = document.lineAt(i);
                    let text = line.text;

                    // Skip empty lines
                    if (!text.trim()) {
                        edits.push(vscode.TextEdit.replace(line.range, ''));
                        continue;
                    }

                    let formattedText = text.trim();
                    const upperText = formattedText.toUpperCase();

                    // Check for SUB/FUNCTION start/end
                    if (upperText.startsWith('SUB ') || upperText.startsWith('FUNCTION ')) {
                        inSub = true;
                        formattedText = formattedText;
                        edits.push(vscode.TextEdit.replace(line.range, formattedText));
                        indentLevel = 1;
                        continue;
                    }

                    if (upperText.startsWith('END SUB') || upperText.startsWith('END FUNCTION')) {
                        inSub = false;
                        indentLevel = 0;
                        formattedText = formattedText;
                        edits.push(vscode.TextEdit.replace(line.range, formattedText));
                        continue;
                    }

                    // Check for ASM blocks
                    if (formattedText.toLowerCase() === 'asm') {
                        inAsm = true;
                        formattedText = '\t'.repeat(indentLevel) + formattedText;
                        edits.push(vscode.TextEdit.replace(line.range, formattedText));
                        continue;
                    }

                    if (formattedText.toLowerCase() === 'end asm') {
                        inAsm = false;
                        formattedText = '\t'.repeat(indentLevel) + formattedText;
                        edits.push(vscode.TextEdit.replace(line.range, formattedText));
                        continue;
                    }

                    // Handle ASM code
                    if (inAsm) {
                        const baseIndent = '\t'.repeat(indentLevel);
                        
                        if (formattedText.endsWith(':')) {
                            // Labels get base indent
                            formattedText = baseIndent + formattedText.trim();
                        } else {
                            // Instructions get additional tab
                            const parts = formattedText.split(/\s+/);
                            if (parts.length > 1) {
                                const opcode = parts[0];
                                const operands = parts.slice(1).join(' ');
                                formattedText = baseIndent + '\t' + opcode.padEnd(8) + operands;
                            } else {
                                formattedText = baseIndent + '\t' + formattedText;
                            }
                        }

                        // Align comments in ASM
                        if (formattedText.includes(';')) {
                            const [code, comment] = formattedText.split(';');
                            formattedText = code.padEnd(COMMENT_COLUMN) + '; ' + comment.trim();
                        }

                        edits.push(vscode.TextEdit.replace(line.range, formattedText));
                        continue;
                    }

                    // Handle regular code comments
                    if (formattedText.includes("'")) {
                        // Don't modify preprocessor directives
                        if (formattedText.startsWith("'!")) {
                            // Leave as-is
                            formattedText = formattedText.trim();
                        }
                        // Don't align section separators
                        else if (!formattedText.includes('----')) {
                            const [code, comment] = formattedText.split("'");
                            if (code.trim()) {
                                // Inline comment
                                formattedText = code.padEnd(COMMENT_COLUMN) + "' " + comment.trim();
                            } else {
                                // Full line comment (but not preprocessor)
                                formattedText = '\t'.repeat(indentLevel) + "' " + comment.trim();
                            }
                        }
                    }

                    // Handle regular code (non-ASM, non-comment)
                    if (!formattedText.startsWith("'") && !formattedText.includes('----')) {
                        // Check for control structures that decrease indent
                        if (upperText.match(/^(ENDIF|NEXT|WEND|LOOP|ELSE|ELSEIF)/)) {
                            indentLevel = Math.max(0, indentLevel - 1);
                        }

                        // Apply current indentation
                        formattedText = '\t'.repeat(indentLevel) + formattedText;

                        // Check for control structures that increase indent
                        if (upperText.match(/^(IF|FOR|DO|WHILE)/) || 
                            upperText.match(/^(ELSE|ELSEIF)/)) {
                            indentLevel++;
                        }
                    }

                    // Handle DIM statements
                    if (upperText.startsWith('DIM ')) {
                        // Convert DIM to lowercase
                        formattedText = formattedText.replace(/^DIM/i, 'dim');
                        
                        // Split the line into components
                        let varPart = '';
                        let typePart = '';
                        let valuePart = '';
                        
                        // Extract any initialization value first
                        if (formattedText.includes('=')) {
                            const [before, after] = formattedText.split('=').map(s => s.trim());
                            formattedText = before;
                            valuePart = '= ' + after;
                        }
                        
                        // Handle different variable patterns
                        if (formattedText.includes(' as ')) {
                            const [beforeAs, afterAs] = formattedText.split(' as ').map(s => s.trim());
                            varPart = beforeAs.replace(/^dim\s+/, '');
                            typePart = afterAs;
                        }
                        
                        // Format the line with consistent spacing
                        formattedText = 'dim ' + 
                                        varPart.padEnd(15) + 
                                        'as ' + 
                                        typePart.padEnd(8) + 
                                        (valuePart ? valuePart.padEnd(20) : '');
                    }

                    edits.push(vscode.TextEdit.replace(line.range, formattedText));
                }
                
                return edits;
            } catch (error) {
                console.error('Formatting error:', error);
                return [];
            }
        }
    });
}

module.exports = createFormatter; 