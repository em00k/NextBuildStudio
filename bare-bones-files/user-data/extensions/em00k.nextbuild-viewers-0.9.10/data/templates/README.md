# NextBuild Project Templates

This directory contains project templates for the NextBuild Studio extension. Templates define the structure and initial files for new projects.

## Available Templates

- **single-file.json** - Simple single-file NextBuild project
- **multi-file.json** - Modular project with multiple files and includes
- **simple-game.json** - Game template with sprite handling (converted from example)

## Creating New Templates

### Method 1: Direct JSON (Advanced)

Create a `.json` file with this structure:

```json
{
    "name": "Template Name",
    "description": "Template description",
    "type": "custom",
    "directories": [
        "assets",
        "data",
        "build"
    ],
    "files": [
        {
            "name": "{projectName}.bas",
            "template": "' Content with \\n for newlines"
        }
    ]
}
```

### Method 2: Markdown + Converter (Recommended)

1. Create a `.md` file using this format:

```markdown
# Template Name: Your Template
Description: Description of what this template creates

## Directories
- assets
- data
- modules

## Files

### {projectName}.bas
```nextbuild
' Your NextBuild code here
' Use {projectName} as placeholder
```

### data/config.txt
```
configuration=value
```
```

2. Convert to JSON using the converter:

```bash
node scripts/template-converter.js your-template.md
```

## Template Placeholders

Use `{projectName}` in file names and content - it will be replaced with the actual project name when creating a project.

### File Name Examples:
- `{projectName}.bas` → `MyGame.bas`
- `{projectName}-config.json` → `MyGame-config.json`
- `modules/{projectName}-main.bas` → `modules/MyGame-main.bas`

### Content Examples:
```nextbuild
' Project: {projectName}
PRINT "Welcome to {projectName}!"
```

## Directory Structure

Templates can create any directory structure:

```
MyProject/
├── assets/           # Game assets
├── data/            # Data files  
├── modules/         # Code modules
├── includes/        # Include files
├── build/           # Build output
└── MyProject.bas    # Main file
```

## File Types Supported

Templates can create any file type:
- `.bas` - NextBuild source files
- `.txt` - Text configuration
- `.md` - Documentation
- `.json` - JSON data
- `.dat` - Binary data files
- Any other text-based format

## Best Practices

1. **Clear Naming**: Use descriptive template names
2. **Good Descriptions**: Explain what the template is for
3. **Proper Structure**: Organize files logically
4. **Comments**: Add helpful comments in generated code
5. **Placeholders**: Use `{projectName}` consistently
6. **Documentation**: Include README files in complex templates

## Example Template Markdown

See `example-template.md` for a complete example showing:
- Multiple file types
- Directory structure
- Code templates
- Configuration files
- Documentation

## Converting Examples

Convert the example template:
```bash
node scripts/template-converter.js data/templates/example-template.md
```

Create your own:
```bash
# 1. Create markdown template
cp data/templates/example-template.md my-template.md
# 2. Edit my-template.md
# 3. Convert to JSON
node scripts/template-converter.js my-template.md
```

## Template Installation

After creating or converting templates:

1. Place `.json` files in `data/templates/`
2. Restart VS Code or reload the extension
3. Templates will appear in "NextBuild: Create New Project"

## Troubleshooting

**Template not appearing?**
- Check JSON syntax with `node -c template.json`
- Ensure file is in `data/templates/` directory
- Restart VS Code

**Conversion errors?**
- Check markdown format matches examples
- Ensure proper section headers (`## Directories`, `## Files`)
- Verify code blocks are properly closed with `\`\`\``

**File creation issues?**
- Check file paths don't have invalid characters
- Ensure directory structure is valid for the target OS
- Test template with simple project names first 