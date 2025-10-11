// nextbuild-viewers by em00k

/* eslint-disable curly */
// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import * as cp from 'child_process'; // Import child_process
import * as fs from 'fs'; // Import fs for path checking
import * as path from 'path'; // Import path for resolving
import * as crypto from 'crypto';
//import { MarkdownString, CompletionItem, CompletionItemKind } from 'vscode'; // Import MarkdownString and CompletionItem
import { searchKeywordHelp } from './keywordHelp';
import { PaletteViewerProvider } from './paletteViewerProvider';
import { SpriteViewerProvider } from './spriteViewerProvider';
import { BlockViewerProvider } from './blockViewerProvider';
import { ImageViewerProvider } from './imageViewerProvider';
import { SpriteImporterProvider } from './spriteImporterProvider'; // Uncommented
import { detectDuplicates, groupDuplicates, DeduplicationOptions, defaultOptions, removeDuplicates, createSpriteMapping, findBlockFilesThatReferenceSprite, applySpriteMappingToBlockData } from './spriteDedupUtils';
import { parse8BitSprites, parse4BitSprites, parse8x8Font, parse8x8Tiles, encodeSpriteData } from './spriteDataHandler';
import { OptimizedBlockViewerProvider } from './optimizedBlockViewerProvider';

// Import the new CodeActionProvider
import { NextBuildCodeActionProvider } from './nextBuildCodeActions';

// Import the linter
import { NextBuildLinter } from './nextBuildLinter';
import { PythonDetector } from './pythonDetector';

// Import the keyword help functionality
import { 
	loadKeywordHelp,
	showHelp,
	showKeywordHelp,
	editKeywordsFile,
	NextBuildHoverProvider,
	NextBuildCompletionItemProvider,
	keywordHelp
} from './keywordHelp';

// Import the update manager
import { UpdateManager } from './updateManager';

import { ProjectCreatorProvider } from './projectCreatorProvider';
import { AyfxAudioProvider, AyfxAudioEditorProvider } from './ayfxAudioProvider';

// Explicitly reference ProjectCreatorProvider to prevent webpack tree-shaking
// Create a dummy instance to force webpack to include the class
const ensureProjectCreatorProviderIsIncluded = () => {
	// This function ensures the ProjectCreatorProvider is included in the bundle
	return ProjectCreatorProvider;
};

const config = vscode.workspace.getConfiguration('nextbuild-viewers.linting');
// const lintingEnabled = config.get<boolean>('enable', true);
// const compilerPath = config.get<string>('compilerPath', '');
// const compilerArgs = config.get<string>('compilerArgs', 'parse');

// Define feature flags for premium features
interface FeatureFlags {
	spriteImporter: boolean;
	cspectIntegration: boolean;
	optimizedBlocks: boolean;
	deduplicationTools: boolean;
}

// License key validation secret - this would ideally be more securely stored
const LICENSE_SECRET = 'nextbuild-zxspectrum-2023';

// Define a type for our constant entries
interface ConstantEntry {
	value?: any; // Can be number, string, boolean etc.
	description: string;
}

let nextbuildConstants: Record<string, ConstantEntry> = {}; // For our constants

// License system
class LicenseManager {
	private static instance: LicenseManager;
	private context: vscode.ExtensionContext;
	private _licenseType: 'free' | 'premium' = 'free';
	private _featureFlags: FeatureFlags = {
		spriteImporter: false,
		cspectIntegration: false,
		optimizedBlocks: false,
		deduplicationTools: false,
	};

	private constructor(context: vscode.ExtensionContext) {
		this.context = context;
		this.loadLicenseState();
	}

	public static getInstance(context: vscode.ExtensionContext): LicenseManager {
		if (!LicenseManager.instance) {
			LicenseManager.instance = new LicenseManager(context);
		}
		return LicenseManager.instance;
	}

	public get licenseType(): 'free' | 'premium' {
		return this._licenseType;
	}

	public get featureFlags(): FeatureFlags {
		return this._featureFlags;
	}

	private loadLicenseState() {
		const config = vscode.workspace.getConfiguration('nextbuild-viewers');
		this._licenseType = config.get('licenseType', 'free') as 'free' | 'premium';
		
		// If premium, enable all premium features
		if (this._licenseType === 'premium') {
			this._featureFlags = {
				spriteImporter: true,
				cspectIntegration: true,
				optimizedBlocks: true,
				deduplicationTools: true,
			};
		} else {
			// Free version has limited feature set
			this._featureFlags = {
				spriteImporter: true,
				cspectIntegration: true, // Basic feature available in free
				optimizedBlocks: true,
				deduplicationTools: true,
			};
		}
	}

	public async activateLicense(licenseKey: string): Promise<boolean> {
		if (!licenseKey || licenseKey.trim() === '') {
			vscode.window.showErrorMessage('Please enter a valid license key.');
			return false;
		}

		// Simple validation (hash-based)
		const isValid = this.validateLicenseKey(licenseKey);
		
		if (isValid) {
			// Store the license info
			await vscode.workspace.getConfiguration('nextbuild-viewers').update(
				'licenseType', 
				'premium', 
				vscode.ConfigurationTarget.Global
			);
			
			await vscode.workspace.getConfiguration('nextbuild-viewers').update(
				'licenseKey', 
				licenseKey, 
				vscode.ConfigurationTarget.Global
			);
			
			this._licenseType = 'premium';
			this.loadLicenseState(); // Refresh feature flags
			
			vscode.window.showInformationMessage(
				'Premium license activated successfully! Please reload VS Code to enable all premium features.',
				'Reload Now'
			).then(selection => {
				if (selection === 'Reload Now') {
					vscode.commands.executeCommand('workbench.action.reloadWindow');
				}
			});
			
			return true;
		} else {
			vscode.window.showErrorMessage('Invalid license key. Please check and try again.');
			return false;
		}
	}

	public checkFeatureAccess(feature: keyof FeatureFlags): boolean {
		if (!this._featureFlags[feature]) {
			vscode.window.showInformationMessage(
				`This feature requires a premium license. Would you like to upgrade?`,
				'Learn More',
				'Activate License'
			).then(selection => {
				if (selection === 'Learn More') {
					vscode.env.openExternal(vscode.Uri.parse('https://github.com/em00k/nextbuild-viewers#premium-features'));
				} else if (selection === 'Activate License') {
					vscode.commands.executeCommand('nextbuild-viewers.activateLicense');
				}
			});
			return false;
		}
		return true;
	}

	// Very basic license validation (this is just for demonstration)
	// In a real scenario, you'd want a more secure validation method
	private validateLicenseKey(key: string): boolean {
		// Simple validation - check if the key contains a valid hash
		try {
			// Format should be: username-code
			const parts = key.split('-');
			if (parts.length !== 2) {
				return false;
			}
			
			const username = parts[0];
			const providedHash = parts[1];
			
			// Create hash from username and secret
			const expectedHash = crypto
				.createHash('md5')
				.update(`${username}-${LICENSE_SECRET}`)
				.digest('hex')
				.substring(0, 8);
			
			return expectedHash === providedHash;
		} catch (err) {
			console.error('License validation error:', err);
			return false;
		}
	}
}

// Helper function for creating files
async function createNewSpriteFile() {


	// 1. Define Types
	const fileTypes = {
		'Sprite 8-bit (16x16)': { ext: '.spr', w: 16, h: 16, bpp: 8, defaultCount: 256 },
		'Sprite 4-bit (16x16)': { ext: '.spr', w: 16, h: 16, bpp: 4, defaultCount: 256 },
		'Font 8x8 (8-bit)':     { ext: '.fnt', w: 8,  h: 8,  bpp: 8, defaultCount: 512 }, // Common ASCII range
		'Tile 8x8 (4-bit)':     { ext: '.til', w: 8,  h: 8,  bpp: 4, defaultCount: 512 },
		'Map 32x24 (8-bit)':    { ext: '.nxm', w: 32, h: 24, bpp: 8, defaultCount: 32*24 },
	};
	const typeNames = Object.keys(fileTypes);

	// 2. Get Type
	const selectedType = await vscode.window.showQuickPick(typeNames, {
		placeHolder: 'Select the type of file to create',
		title: 'Create New Sprite/Font/Block File'
	});
	if (!selectedType) {return;} // User cancelled

	// Assert type to satisfy TypeScript
	const typeInfo = fileTypes[selectedType as keyof typeof fileTypes];

	// 3. Get Filename
	const filename = await vscode.window.showInputBox({
		prompt: `Enter filename (extension ${typeInfo.ext} will be added)`, 
		value: `new_file${typeInfo.ext}`,
		title: 'Create New Sprite/Font/Map File'
	});
	if (!filename) {return;} // User cancelled

	let mapWidth = typeInfo.w;
	let mapHeight = typeInfo.h;
	let count = typeInfo.defaultCount;
	
	if (selectedType === 'Map 32x24 (8-bit)') {
		const mapSize = await vscode.window.showInputBox({
			prompt: 'Enter the size of the map (e.g. 32x24)',
			value: '32x24',
			title: 'Create New Map File'
		});	
		if (!mapSize) {return;} // User cancelled
		const mapSizeParts = mapSize.split('x');
		if (mapSizeParts.length !== 2) {
			vscode.window.showErrorMessage('Invalid map size. Please enter a valid size (e.g. 32x24).');
			return;
		}
		mapWidth = parseInt(mapSizeParts[0], 10);	
		mapHeight = parseInt(mapSizeParts[1], 10);
		if (isNaN(mapWidth) || isNaN(mapHeight) || mapWidth <= 0 || mapHeight <= 0) {
			vscode.window.showErrorMessage('Invalid map size. Please enter a valid size (e.g. 32x24).');
			return;
		}
		
		const bytesPerByte = 1;
		count = mapWidth * mapHeight;
		const totalSize = bytesPerByte * count;
		if (totalSize > 1024*1024) {
			vscode.window.showErrorMessage(`Map size is too large. Maximum map size is 1024*1024 bytes.`);
			return;
		}
		
		// Skip the count step for maps as we've already determined the size
	} else {
		// 4. Get Count (for non-map files)
		const countStr = await vscode.window.showInputBox({
			prompt: `Enter number of ${selectedType.split(' (')[0]}s`, 
			value: typeInfo.defaultCount.toString(),
			title: 'Create New Sprite/Font/Block File',
			validateInput: text => {
				const num = parseInt(text, 10);
				return (!isNaN(num) && num > 0) ? null : 'Please enter a positive number.';
			}
		});
		if (!countStr) {return;} // User cancelled
		count = parseInt(countStr, 10);
	}
	
	const finalFilename = filename.endsWith(typeInfo.ext) ? filename : `${filename}${typeInfo.ext}`;

	// 5. Calculate Size & Create Buffer
	let totalSize;
	let buffer;
	
	if (selectedType === 'Map 32x24 (8-bit)') {
		// For maps, we just need one byte per cell
		totalSize = mapWidth * mapHeight;
		buffer = Buffer.alloc(totalSize, 0); // Initialize with zeroes
		
		// Additional information for user
		console.log(`Creating map file with dimensions ${mapWidth}x${mapHeight} (${totalSize} bytes)`);
	} else {
		// For sprites, fonts, etc.
		const bytesPerPixel = typeInfo.bpp / 8;
		const pixelsPerItem = typeInfo.w * typeInfo.h;
		const bytesPerItem = pixelsPerItem * bytesPerPixel;
		totalSize = bytesPerItem * count;
		buffer = Buffer.alloc(totalSize); // Filled with zeros by default
	}

	let targetDirectoryUri: vscode.Uri;	
	if (vscode.window.activeTextEditor) {
		const documentUri = vscode.window.activeTextEditor.document.uri;
		targetDirectoryUri = vscode.Uri.joinPath(documentUri, '..');
	} else {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showErrorMessage('Cannot create file: No workspace folder open and no active editor.');
			return;
		}
		targetDirectoryUri = workspaceFolders[0].uri;
	}

	// 6. Get Save Location (use workspace root)
	const activeEditor = vscode.window.activeTextEditor;	

	if (activeEditor) {
		const documentUri = activeEditor.document.uri;
		targetDirectoryUri = vscode.Uri.joinPath(documentUri, '..');
		try {
			const saveUri = await vscode.window.showSaveDialog({
				filters: { 'Next Palette Files': ['nxp'] }, // Prefer .nxp for saving
				title: 'Save Default Palette As'
			});
		} catch (error) {
			vscode.window.showErrorMessage('Failed to save default palette: ' + (error as Error).message);
		}
	} else {
		// Fallback to workspace root if no active editor, or show an error
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showErrorMessage('Cannot create file: No workspace folder open and no active editor.');
			return;
		}
		targetDirectoryUri = workspaceFolders[0].uri;
		vscode.window.showInformationMessage('No active editor, saving to workspace root.');
	}

	const fileUri = vscode.Uri.joinPath(targetDirectoryUri, finalFilename);

	// 7. Write File
	try {
		await vscode.workspace.fs.writeFile(fileUri, buffer);
		
		let successMessage = `Successfully created ${finalFilename} (${totalSize} bytes).`;
		if (selectedType === 'Map 32x24 (8-bit)') {
			successMessage = `Successfully created map ${finalFilename} with dimensions ${mapWidth}x${mapHeight} (${totalSize} bytes).`;
		}
		
		vscode.window.showInformationMessage(successMessage);
		
		// 8. Ask if user wants to open the file
		const openFile = await vscode.window.showQuickPick(['Yes', 'No'], {
			placeHolder: 'Open the created file?'
		});
		
		if (openFile === 'Yes') {
			// Determine the appropriate viewer based on file type
			let viewerCommand = '';
			if (typeInfo.ext === '.spr' || typeInfo.ext === '.til' || typeInfo.ext === '.fnt') {
				viewerCommand = 'nextbuild-viewers.openWithSpriteViewer';
			} else if (typeInfo.ext === '.nxm') {
				viewerCommand = 'nextbuild-viewers.openWithBlockViewer';
			}
			
			if (viewerCommand) {
				await vscode.commands.executeCommand(viewerCommand, fileUri);
			} else {
				// Fallback to regular file open
				await vscode.commands.executeCommand('vscode.open', fileUri);
			}
		}
	} catch (error: any) {
		vscode.window.showErrorMessage(`Failed to create file: ${error.message}`);
	}
}

// --- Function to load constants data ---
async function loadConstantsData(context: vscode.ExtensionContext): Promise<boolean> {
	try {
		const constantsPath = path.join(context.extensionPath, "data", "nextbuild_constants.json");
		if (!fs.existsSync(constantsPath)) {
			console.warn(`Constants file not found at: ${constantsPath}`);
			return false; // Not an error, just no constants to load
		}
		const fileContent = fs.readFileSync(constantsPath, "utf8");
		nextbuildConstants = JSON.parse(fileContent);
		console.log('NextBuild constants data loaded successfully');
		return Object.keys(nextbuildConstants).length > 0;
	} catch (error) {
		console.error('Error loading NextBuild constants data:', error);
		vscode.window.showErrorMessage('Error loading NextBuild constants data. Check format.');
		return false;
	}
}

/**
 * Auto-configure root folder for includes from install_paths.json if available
 */
async function autoConfigureRootFolder(): Promise<void> {
	try {
		// Look for install_paths.json in the workspace root
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			console.log('[NextBuild] No workspace folder found for auto-configuration');
			return;
		}
		
		//const workspaceRoot = workspaceFolders[0].uri.fsPath;
		//const installPathsJsonPath = path.join(workspaceRoot, 'install_paths.json');
		const installPathsJsonPath = './install_paths.json'; //read from root of extension
		
		// Check if install_paths.json exists
		try {
			const installPathsUri = vscode.Uri.file(installPathsJsonPath);
			const installPathsData = await vscode.workspace.fs.readFile(installPathsUri);
			const installPathsJson = JSON.parse(Buffer.from(installPathsData).toString('utf8'));
			
			if (installPathsJson.installDir && typeof installPathsJson.installDir === 'string') {
				const installDir = installPathsJson.installDir.trim();
				
				// Check current configuration
				const config = vscode.workspace.getConfiguration('nextbuild-viewers.linting');
				const currentRootFolder = config.get<string>('rootFolderForIncludes', '');
				
				// Only update if not already set or if different
				if (!currentRootFolder || currentRootFolder.trim() === '' || currentRootFolder !== installDir) {
					await config.update('rootFolderForIncludes', installDir, vscode.ConfigurationTarget.Global);
					console.log(`[NextBuild] Auto-configured root folder for includes: ${installDir}`);
					vscode.window.showInformationMessage(`NextBuild: Root folder for includes auto-configured to: ${installDir}`);
				} else {
					console.log(`[NextBuild] Root folder already configured correctly: ${installDir}`);
				}
			} else {
				console.log('[NextBuild] install_paths.json found but missing or invalid installDir property');
			}
			
		} catch (err) {
			// File doesn't exist or can't be read - this is normal, don't show error
			console.log('[NextBuild] install_paths.json not found - manual configuration required');
		}
		
	} catch (err) {
		console.error('[NextBuild] Error during auto-configuration:', err);
	}
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	console.log('Extension "nextbuild-viewers" is now active!');
	
	// Auto-configure root folder from install_paths.json if available
	autoConfigureRootFolder().catch(err => {
		console.error('[NextBuild] Error in auto-configuration:', err);
	});
	
	// Initialize license manager
	const licenseManager = LicenseManager.getInstance(context);

	// Initialize update manager
	const updateManager = new UpdateManager(context);

	// Initialize the linter
	new NextBuildLinter(context);

	// Load keyword help data
	loadKeywordHelp(context).then(success => {
		if (success) {
			console.log('Keyword help data loaded successfully');
		} else {
			console.warn('Failed to load keyword help data');
		}
	});
	
	// Load constants data
	loadConstantsData(context).then(success => {
		if (success) console.log('Constants data loaded successfully');
		else console.warn('Failed to load constants data');
	});
	
	// Register the keyword help command (F1)
	context.subscriptions.push(
		vscode.commands.registerCommand("nextbuild-viewers.showKeywordHelp", (keyword?: string | string[]) => {
			const config = vscode.workspace.getConfiguration('nextbuild-viewers');
			if (config.get('keywordHelp', true)) {
				if (typeof keyword === 'string') {
					// Direct call with a keyword parameter
					showKeywordHelp(keyword);
				} else if (Array.isArray(keyword) && keyword.length > 0) {
					// Handle when the parameter is passed as an array (from command URIs)
					showKeywordHelp(keyword[0]);
				} else {
					// Traditional F1 call - determine keyword from cursor position
					showHelp();
				}
			} else {
				vscode.window.showInformationMessage('NextBuild F1 Keyword Help is disabled in settings.');
			}
		})
	);
	
	// Register the search keyword help command
	context.subscriptions.push(
		vscode.commands.registerCommand("nextbuild-viewers.searchKeywordHelp", () => {
			const config = vscode.workspace.getConfiguration('nextbuild-viewers');
			if (config.get('keywordHelp', true)) {
				searchKeywordHelp();
			} else {
				vscode.window.showInformationMessage('NextBuild Keyword Help is disabled in settings.');
			}
		})
	);
	
	// Register the edit keywords file command
	context.subscriptions.push(
		vscode.commands.registerCommand("nextbuild-viewers.editKeywordsFile", () => editKeywordsFile(context))
	);
	
	// Create hover provider instance
	const hoverProvider = new NextBuildHoverProvider();
	hoverProvider.setConstants(nextbuildConstants);

	// Register Hover Provider for 'nextbuild' language
	context.subscriptions.push(
		vscode.languages.registerHoverProvider(
			{ language: 'nextbuild', scheme: 'file' }, 
			hoverProvider
		)
	);
	
	// Create a completion provider instance
	const completionProvider = new NextBuildCompletionItemProvider();
	// Set the constants
	completionProvider.setConstants(nextbuildConstants);
	
	// Register Completion Item Provider for 'nextbuild' language
	context.subscriptions.push(
		vscode.languages.registerCompletionItemProvider(
			{ language: 'nextbuild', scheme: 'file' }, 
			completionProvider
			// No specific trigger characters by default, relies on Ctrl+Space or typing
		)
	);
	
	// Register CodeActionProvider for 'nextbuild' language
	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider(
			{ language: 'nextbuild', scheme: 'file' }, 
			new NextBuildCodeActionProvider(),
			{
				providedCodeActionKinds: NextBuildCodeActionProvider.providedCodeActionKinds
			}
		)
	);
	
	// Register the license activation command
	let activateLicenseCommand = vscode.commands.registerCommand(
		'nextbuild-viewers.activateLicense', 
		async () => {
			const licenseKey = await vscode.window.showInputBox({
				prompt: 'Enter your NextBuild Viewers premium license key',
				placeHolder: 'username-licensekey',
				ignoreFocusOut: true
			});
			
			if (licenseKey) {
				await licenseManager.activateLicense(licenseKey);
			}
		}
	);
	
	// Register update commands
	let checkForUpdatesCommand = vscode.commands.registerCommand('nextbuild-viewers.checkForUpdates', async () => {
		const hasUpdates = await updateManager.checkForUpdates();
		if (hasUpdates) {
			vscode.window.showInformationMessage('Extension updates are available!', 'Update Now').then(selection => {
				if (selection === 'Update Now') {
					vscode.commands.executeCommand('nextbuild-viewers.updateComponents');
				}
			});
		} else {
			vscode.window.showInformationMessage('Extension is up to date!');
		}
	});
	
	let updateComponentsCommand = vscode.commands.registerCommand('nextbuild-viewers.updateComponents', async () => {
		await updateManager.updateComponents();
	});

	// Register component update commands
	let checkForComponentUpdatesCommand = vscode.commands.registerCommand('nextbuild-viewers.checkForComponentUpdates', async () => {
		const hasUpdates = await updateManager.checkForComponentUpdates();
		if (hasUpdates) {
			vscode.window.showInformationMessage('Extension component updates are available!', 'Update Now').then(selection => {
				if (selection === 'Update Now') {
					vscode.commands.executeCommand('nextbuild-viewers.updateExtensionComponents');
				}
			});
		} else {
			vscode.window.showInformationMessage('All extension components are up to date!');
		}
	});

	let updateExtensionComponentsCommand = vscode.commands.registerCommand('nextbuild-viewers.updateExtensionComponents', async () => {
		await updateManager.updateExtensionComponents();
	});

	// Register root component update commands
	let checkForRootUpdatesCommand = vscode.commands.registerCommand('nextbuild-viewers.checkForRootUpdates', async () => {
		const hasUpdates = await updateManager.checkForRootUpdates();
		if (hasUpdates) {
			vscode.window.showInformationMessage('NextBuild root component updates are available!', 'Update Now').then(selection => {
				if (selection === 'Update Now') {
					vscode.commands.executeCommand('nextbuild-viewers.updateRootComponents');
				}
			});
		} else {
			vscode.window.showInformationMessage('All NextBuild root components are up to date!');
		}
	});

	let updateRootComponentsCommand = vscode.commands.registerCommand('nextbuild-viewers.updateRootComponents', async () => {
		await updateManager.updateRootComponents();
	});

	let resetUpdateDataCommand = vscode.commands.registerCommand('nextbuild-viewers.resetUpdateData', async () => {
		await updateManager.resetUpdateData();
	});
	
	// Auto-check for updates on startup
	updateManager.autoCheckOnStartup();
	
	
	const expirationDate = new Date('2025-09-25'); 
	const currentDate = new Date();
	
	// if (currentDate > expirationDate) {
	// 	// Extension has expired
	// 	vscode.window.showErrorMessage(
	// 		'This version of NextBuild Viewers has expired. Please download the latest version.',
	// 		'Get Update'
	// 	).then(selection => {
	// 		if (selection === 'Get Update') {
	// 			vscode.env.openExternal(vscode.Uri.parse('https://nextbuildstudio.itch.io'));
	// 		}
	// 	});

	// }
	
	// Check for first install or update
	const extensionId = 'em00k.nextbuild-viewers';
	const extension = vscode.extensions.getExtension(extensionId);
	
	if (extension) {
		const packageJSON = extension.packageJSON;
		const currentVersion = packageJSON.version;
		
		const previousVersion = context.globalState.get<string>('nextbuild-viewers.version');
		
		// First install or update
		if (!previousVersion || previousVersion !== currentVersion) {
			// Show sponsor page on install/update
			showSponsorPage();
			
			// Save version to globalState
			context.globalState.update('nextbuild-viewers.version', currentVersion);
		}
	}
	
	// Add information about file icon themes
	const currentIconTheme = vscode.workspace.getConfiguration('workbench').get<string>('iconTheme');
	const respectExistingTheme = vscode.workspace.getConfiguration('nextbuild-viewers').get<boolean>('respectExistingIconTheme');
	
	if (currentIconTheme && currentIconTheme !== 'nextbuild-icons' && !respectExistingTheme) {
		// Use a status bar item instead of a notification to be less intrusive
		const iconThemeItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
		iconThemeItem.text = "NextBuild Icons Available";
		iconThemeItem.tooltip = "ZX Next file icons are available. Click to switch from your current icon theme.";
		iconThemeItem.command = 'workbench.action.selectIconTheme';
		iconThemeItem.show();
		
		// Add to subscriptions to be cleaned up when extension deactivates
		context.subscriptions.push(iconThemeItem);
	}
	
	// Register the palette viewer first to ensure it's available immediately
	const paletteViewerProvider = new PaletteViewerProvider(context);
	context.subscriptions.push(
		vscode.window.registerCustomEditorProvider(
			PaletteViewerProvider.viewType,
			paletteViewerProvider,
			{
				webviewOptions: {
					retainContextWhenHidden: true,
				},
				supportsMultipleEditorsPerDocument: false,
			}
		)
	);
	
	// Register the sprite viewer
	const spriteViewerProvider = new SpriteViewerProvider(context);
	context.subscriptions.push(
		vscode.window.registerCustomEditorProvider(
			SpriteViewerProvider.viewType,
			spriteViewerProvider,
			{
				webviewOptions: {
					retainContextWhenHidden: true,
				},
				supportsMultipleEditorsPerDocument: false,
			}
		)
	);
	
	// Register the block viewer
	const blockViewerProvider = new BlockViewerProvider(context);
	context.subscriptions.push(
		vscode.window.registerCustomEditorProvider(
			BlockViewerProvider.viewType,
			blockViewerProvider,
			{
				webviewOptions: {
					retainContextWhenHidden: true,
				},
				supportsMultipleEditorsPerDocument: false,
			}
		)
	);
	
	// Register the image viewer
	context.subscriptions.push(
		vscode.window.registerCustomEditorProvider(
			ImageViewerProvider.viewType,
			new ImageViewerProvider(context),
			{
				webviewOptions: {
					retainContextWhenHidden: true,
				},
				supportsMultipleEditorsPerDocument: false,
			}
		)
	);
	
	// Register the optimized block viewer
	context.subscriptions.push(
		vscode.window.registerCustomEditorProvider(
			OptimizedBlockViewerProvider.viewType,
			new OptimizedBlockViewerProvider(context),
			{
				webviewOptions: {
					retainContextWhenHidden: true,
				},
				supportsMultipleEditorsPerDocument: false,
			}
		)
	);

	// Register the AYFX audio editor
	context.subscriptions.push(
		vscode.window.registerCustomEditorProvider(
			AyfxAudioEditorProvider.viewType,
			new AyfxAudioEditorProvider(context),
			{
				webviewOptions: {
					retainContextWhenHidden: true,
				},
				supportsMultipleEditorsPerDocument: false,
			}
		)
	);
	
	// Register a command that opens a palette file with our custom editor
	let openWithPaletteViewer = vscode.commands.registerCommand('nextbuild-viewers.openWithPaletteViewer', async (uri: vscode.Uri) => {
		if (!uri && vscode.window.activeTextEditor) {
			uri = vscode.window.activeTextEditor.document.uri;
		}
		if (uri) {
			// Force open with our custom editor
			await vscode.commands.executeCommand('vscode.openWith', uri, PaletteViewerProvider.viewType);
		}
	});
	
	// Register a command that opens a sprite file with our custom editor
	let openWithSpriteViewer = vscode.commands.registerCommand('nextbuild-viewers.openWithSpriteViewer', async (uri: vscode.Uri) => {
		if (!uri && vscode.window.activeTextEditor) {
			uri = vscode.window.activeTextEditor.document.uri;
		}
		if (uri) {
			// Force open with our custom editor
			await vscode.commands.executeCommand('vscode.openWith', uri, SpriteViewerProvider.viewType);
		}
	});
	
	// Register a command that opens a block file with our custom editor
	let openWithBlockViewer = vscode.commands.registerCommand('nextbuild-viewers.openWithBlockViewer', async (uri: vscode.Uri) => {
		if (!uri && vscode.window.activeTextEditor) {
			uri = vscode.window.activeTextEditor.document.uri;
		}
		if (uri) {
			// Force open with our custom editor
			await vscode.commands.executeCommand('vscode.openWith', uri, BlockViewerProvider.viewType);
		}
	});
	
	// Register a command that opens an image file with our custom editor
	let openWithImageViewer = vscode.commands.registerCommand('nextbuild-viewers.openWithImageViewer', async (uri: vscode.Uri) => {
		if (!uri && vscode.window.activeTextEditor) {
			uri = vscode.window.activeTextEditor.document.uri;
		}
		if (uri) {
			// Force open with our custom editor
			await vscode.commands.executeCommand('vscode.openWith', uri, ImageViewerProvider.viewType);
		}
	});
	
	// Register a simple command that shows a notification
	let showMessage = vscode.commands.registerCommand('nextbuild-viewers.showMessage', () => {
		vscode.window.showInformationMessage('Hello from NextBuild Viewers!');
	});
	
	// Register the "Create New" command
	let createCommand = vscode.commands.registerCommand('nextbuild-viewers.createSpriteFile', createNewSpriteFile);

	// Register the "Create New Project" command  
	// Ensure ProjectCreatorProvider is included in bundle by referencing it directly
	ensureProjectCreatorProviderIsIncluded();
	let createNewProjectCommand = vscode.commands.registerCommand('nextbuild-viewers.createNewProject', async () => {
		const projectCreator = new ProjectCreatorProvider(context);
		await projectCreator.showProjectCreator();
	});

	// Register the "AYFX Audio Editor" command
	let ayfxAudioCommand = vscode.commands.registerCommand('nextbuild-viewers.openAyfxAudioEditor', async () => {
		// Give user choice to open existing file or create new
		const choice = await vscode.window.showQuickPick([
			{ label: '📄 Open Existing AYFX File', value: 'open' },
			{ label: '➕ Create New AYFX Project', value: 'new' }
		], {
			placeHolder: 'Choose an option'
		});

		if (!choice) return;

		if (choice.value === 'new') {
			// Create a virtual document for new project
			const newUri = vscode.Uri.parse('untitled:Untitled.afb');
			await vscode.commands.executeCommand('vscode.openWith', newUri, AyfxAudioEditorProvider.viewType);
		} else {
			// Show file dialog to open existing file
			const fileUri = await vscode.window.showOpenDialog({
				canSelectFiles: true,
				canSelectFolders: false,
				canSelectMany: false,
				filters: {
					'AYFX Bank Files': ['afb'],
					'AYFX Effect Files': ['afx'],
					'All Files': ['*']
				},
				title: 'Open AYFX File'
			});

			if (fileUri && fileUri[0]) {
				await vscode.commands.executeCommand('vscode.openWith', fileUri[0], AyfxAudioEditorProvider.viewType);
			}
		}
	});
	
	// Register the "Play PT3" command
	let playPT3Command = vscode.commands.registerCommand('nextbuild-viewers.playPT3File', async (uri: vscode.Uri) => {
		const filePath = uri?.fsPath;
		if (!filePath) {
			vscode.window.showWarningMessage('Could not determine the PT3 file path.');
			return;
		}

		const fileName = path.basename(filePath);
		const config = vscode.workspace.getConfiguration('nextbuild-viewers');
		const playpt3Path = config.get<string>('playpt3Path');

		if (!playpt3Path) {
			const result = await vscode.window.showErrorMessage(
				'Path to playpt3.exe is not configured. Please set it in settings.',
				'Open Settings',
				'Cancel'
			);
			
			if (result === 'Open Settings') {
				await vscode.commands.executeCommand('workbench.action.openSettings', 'nextbuild-viewers.playpt3Path');
			}
			return;
		}

		try {
			await fs.promises.access(playpt3Path, fs.constants.X_OK);
		} catch (err) {
			const result = await vscode.window.showErrorMessage(
				`Configured playpt3.exe path not found or not executable: ${playpt3Path}`,
				'Open Settings',
				'Cancel'
			);
			
			if (result === 'Open Settings') {
				await vscode.commands.executeCommand('workbench.action.openSettings', 'nextbuild-viewers.playpt3Path');
			}
			return;
		}

		// --- Launch in Integrated Terminal ---
		// Create or get a terminal named "PT3 Playback"
		// Reuse existing terminal if one with the same name exists
		let terminal = vscode.window.terminals.find(t => t.name === 'PT3 Playback');
		if (!terminal) {
			terminal = vscode.window.createTerminal(`PT3 Playback`);
		}
		
		// Construct the command for PowerShell using the call operator '&'
		const command = `"${playpt3Path}" "${filePath}"`;

		// Send the command to the terminal
		terminal.sendText(command);
		// Show the terminal panel
		terminal.show();

		vscode.window.showInformationMessage(`Sent play command for ${fileName} to terminal.`);
	});

	// Register the sprite importer command with license check
	let importSpriteCommand = vscode.commands.registerCommand('nextbuild-viewers.importSpriteFromImage', async () => {
		// Check if this premium feature is accessible
		if (!licenseManager.checkFeatureAccess('spriteImporter')) {
			return; // Exit if user doesn't have access
		}
		
		// Original implementation
		const imageUris = await vscode.window.showOpenDialog({
			canSelectFiles: true,
			canSelectFolders: false,
			canSelectMany: false,
			filters: {
				'Images': ['png', 'bmp', 'jpg', 'jpeg', 'gif'] // Add more as needed
			},
			title: 'Select Image to Import Sprite From'
		});

		if (imageUris && imageUris[0]) {
			const selectedImageUri = imageUris[0];
			console.log('[Extension] Image selected for import:', selectedImageUri.fsPath);
			new SpriteImporterProvider(context, selectedImageUri);
		} else {
			console.log('[Extension] No image selected for import.');
		}
	});

	// Register the icon theme toggle command
	let toggleIconTheme = vscode.commands.registerCommand('nextbuild-viewers.toggleIconTheme', async () => {
		const config = vscode.workspace.getConfiguration('workbench');
		const currentIconTheme = config.get('iconTheme');
		
		if (currentIconTheme === 'nextbuild-icons') {
			// Currently using NextBuild icons, switch to VS Code default
			await config.update('iconTheme', 'vs-seti', vscode.ConfigurationTarget.Global);
			vscode.window.showInformationMessage('Switched to VS Code default icons');
		} else {
			// Not using NextBuild icons, switch to them
			await config.update('iconTheme', 'nextbuild-icons', vscode.ConfigurationTarget.Global);
			vscode.window.showInformationMessage('Switched to NextBuild ZX Next file icons');
		}
	});
	
	// Register a command for sprite deduplication analysis with license check
	let analyzeDuplicatesCommand = vscode.commands.registerCommand('nextbuild-viewers.analyzeSpritesDuplicates', async (uri: vscode.Uri) => {
		// Check if this premium feature is accessible
		if (!licenseManager.checkFeatureAccess('deduplicationTools')) {
			return; // Exit if user doesn't have access
		}
		
		// Get the file URI if not provided
		if (!uri && vscode.window.activeTextEditor) {
			uri = vscode.window.activeTextEditor.document.uri;
		}
		
		if (!uri) {
			vscode.window.showErrorMessage('No file selected for sprite duplication analysis.');
			return;
		}
		
		try {
			// Read the file
			const fileData = await vscode.workspace.fs.readFile(uri);
			const buffer = Buffer.from(fileData);
			const fileExt = path.extname(uri.fsPath).toLowerCase();
			
			// Determine file type and parse sprites
			let spriteData;
			let paletteOffset = 0;
			
			// Prompt for palette offset if needed
			if (fileExt === '.til' || fileExt === '.nxt') {
				const offsetStr = await vscode.window.showInputBox({
					prompt: 'Enter palette offset for 4-bit sprites (0-240)',
					value: '0',
					validateInput: text => {
						const num = parseInt(text, 10);
						return (!isNaN(num) && num >= 0 && num <= 240) ? null : 'Please enter a number between 0 and 240.';
					}
				});
				
				if (offsetStr === undefined) {
					return; // User cancelled
				}
				
				paletteOffset = parseInt(offsetStr, 10);
			}
			
			// Parse file based on extension
			if (fileExt === '.spr') {
				try {
					spriteData = parse8BitSprites(buffer);
				} catch (e) {
					// If 8-bit parsing fails, try 4-bit
					const offsetStr = await vscode.window.showInputBox({
						prompt: 'Could not parse as 8-bit. Enter palette offset for 4-bit sprites (0-240)',
						value: '0',
						validateInput: text => {
							const num = parseInt(text, 10);
							return (!isNaN(num) && num >= 0 && num <= 240) ? null : 'Please enter a number between 0 and 240.';
						}
					});
					
					if (offsetStr === undefined) {
						return; // User cancelled
					}
					
					paletteOffset = parseInt(offsetStr, 10);
					spriteData = parse4BitSprites(buffer, paletteOffset);
				}
			} else if (fileExt === '.fnt') {
				spriteData = parse8x8Font(buffer);
			} else if (fileExt === '.til' || fileExt === '.nxt') {
				spriteData = parse8x8Tiles(buffer, paletteOffset);
			} else {
				vscode.window.showErrorMessage('Unsupported file type for sprite duplication analysis.');
				return;
			}
			
			// Configure deduplication options
			const options: DeduplicationOptions = {
				...defaultOptions
			};
			
			// Ask for detection options
			const detectFlippedH = await vscode.window.showQuickPick(['Yes', 'No'], {
				placeHolder: 'Detect horizontally flipped sprites as duplicates?'
			});
			
			if (detectFlippedH === undefined) {
				return; // User cancelled
			}
			
			options.detectFlippedHorizontal = detectFlippedH === 'Yes';
			
			const detectFlippedV = await vscode.window.showQuickPick(['Yes', 'No'], {
				placeHolder: 'Detect vertically flipped sprites as duplicates?'
			});
			
			if (detectFlippedV === undefined) {
				return; // User cancelled
			}
			
			options.detectFlippedVertical = detectFlippedV === 'Yes';
			
			const detectRotated = await vscode.window.showQuickPick(['Yes', 'No'], {
				placeHolder: 'Detect 180° rotated sprites as duplicates?'
			});
			
			if (detectRotated === undefined) {
				return; // User cancelled
			}
			
			options.detectRotated = detectRotated === 'Yes';
			
			// Find duplicates
			const duplicates = detectDuplicates(spriteData, options);
			
			if (duplicates.length === 0) {
				vscode.window.showInformationMessage('No duplicate sprites found.');
				return;
			}
			
			// Group duplicates for better reporting
			const groups = groupDuplicates(duplicates);
			
			// Create a simple report
			const fileName = path.basename(uri.fsPath);
			const totalSprites = spriteData.sprites.length;
			const uniqueSprites = totalSprites - duplicates.length;
			const savingPercentage = Math.round((duplicates.length / totalSprites) * 100);
			
			// Create and show output channel for the report
			const outputChannel = vscode.window.createOutputChannel('Sprite Duplication Analysis');
			outputChannel.clear();
			outputChannel.appendLine(`=== Sprite Duplication Analysis: ${fileName} ===`);
			outputChannel.appendLine('');
			outputChannel.appendLine(`Total sprites: ${totalSprites}`);
			outputChannel.appendLine(`Unique sprites: ${uniqueSprites}`);
			outputChannel.appendLine(`Duplicate sprites: ${duplicates.length} (${savingPercentage}% of total)`);
			outputChannel.appendLine('');
			outputChannel.appendLine('=== Duplicate Groups ===');
			
			groups.forEach((group, index) => {
				outputChannel.appendLine('');
				outputChannel.appendLine(`Group ${index + 1}:`);
				outputChannel.appendLine(`  Original: Sprite #${group.originalIndex}`);
				outputChannel.appendLine('  Duplicates:');
				
				group.duplicates.forEach(dupe => {
					outputChannel.appendLine(`    Sprite #${dupe.index} (${dupe.matchType})`);
				});
			});
			
			// Show the report
			outputChannel.show();
			
			// Ask if user wants to save a deduplicated version
			const saveDeduplicated = await vscode.window.showQuickPick(['Yes', 'No'], {
				placeHolder: 'Save a deduplicated version of this sprite file?'
			});
			
			if (saveDeduplicated === 'Yes') {
				try {
					// Create deduplicated sprite data
					const deduplicatedSpriteData = removeDuplicates(spriteData, duplicates);
					
					// Create a mapping from old indices to new indices
					const spriteMapping = createSpriteMapping(spriteData.sprites.length, duplicates);
					
					// Calculate savings
					const originalSize = buffer.length;
					const deduplicatedBuffer = encodeSpriteData(deduplicatedSpriteData);
					const newSize = deduplicatedBuffer.length;
					const bytesSaved = originalSize - newSize;
					const percentSaved = Math.round((bytesSaved / originalSize) * 100);
					
					// Get output filename
					const dirName = path.dirname(uri.fsPath);
					const baseName = path.basename(uri.fsPath, path.extname(uri.fsPath));
					const fileExt = path.extname(uri.fsPath);
					const defaultOutputName = `${baseName}_dedup${fileExt}`;
					
					const outputFilename = await vscode.window.showInputBox({
						prompt: 'Enter filename for deduplicated sprite file',
						value: defaultOutputName
					});
					
					if (!outputFilename) {
						return; // User cancelled
					}
					
					// Create output URI
					const outputUri = vscode.Uri.file(path.join(dirName, outputFilename));
					
					// Write the file
					await vscode.workspace.fs.writeFile(outputUri, deduplicatedBuffer);
					
					// Report success
					vscode.window.showInformationMessage(
						`Deduplicated file saved successfully! Reduced from ${originalSize} bytes to ${newSize} bytes (${percentSaved}% smaller).`
					);
					
					// Update output channel with the results
					outputChannel.appendLine('');
					outputChannel.appendLine('=== Deduplication Results ===');
					outputChannel.appendLine(`Original file size: ${originalSize} bytes`);
					outputChannel.appendLine(`Deduplicated file size: ${newSize} bytes`);
					outputChannel.appendLine(`Bytes saved: ${bytesSaved} (${percentSaved}%)`);
					outputChannel.appendLine(`Saved to: ${outputFilename}`);
					
					// Find and update block/map files that reference this sprite file
					const updateReferences = await vscode.window.showQuickPick(['Yes', 'No'], {
						placeHolder: 'Update references in block/map files?'
					});
					
					if (updateReferences === 'Yes') {
						outputChannel.appendLine('');
						outputChannel.appendLine('=== Updating References ===');
						
						// Find block/map files that reference this sprite file
						const referencingFiles = await findBlockFilesThatReferenceSprite(uri.fsPath);
						
						if (referencingFiles.length === 0) {
							outputChannel.appendLine('No block or map files found that reference this sprite file.');
							vscode.window.showInformationMessage('No block or map files found that reference this sprite file.');
						} else {
							outputChannel.appendLine(`Found ${referencingFiles.length} block/map files that may reference this sprite file:`);
							
							// Ask which files to update
							const fileItems = referencingFiles.map(fileUri => ({
								label: path.basename(fileUri.fsPath),
								description: fileUri.fsPath,
								uri: fileUri
							}));
							
							const selectedFiles = await vscode.window.showQuickPick(fileItems, {
								canPickMany: true,
								placeHolder: 'Select block/map files to update'
							});
							
							if (!selectedFiles || selectedFiles.length === 0) {
								outputChannel.appendLine('No files selected for update.');
							} else {
								// Update each selected file
								let updatedFileCount = 0;
								
								for (const item of selectedFiles) {
									try {
										// Read the file
										const fileUri = item.uri;
										const fileData = await vscode.workspace.fs.readFile(fileUri);
										const isMapFile = fileUri.fsPath.toLowerCase().endsWith('.nxm');
										
										// Apply the sprite mapping
										const updatedData = applySpriteMappingToBlockData(
											fileData,
											spriteMapping,
											isMapFile
										);
										
										// Create backup filename
										const backupName = `${path.basename(fileUri.fsPath, path.extname(fileUri.fsPath))}_backup${path.extname(fileUri.fsPath)}`;
										const backupUri = vscode.Uri.file(path.join(path.dirname(fileUri.fsPath), backupName));
										
										// Create backup
										await vscode.workspace.fs.writeFile(backupUri, fileData);
										
										// Write the updated file
										await vscode.workspace.fs.writeFile(fileUri, updatedData);
										
										outputChannel.appendLine(`Updated: ${fileUri.fsPath} (backup: ${backupName})`);
										updatedFileCount++;
									} catch (err: any) {
										outputChannel.appendLine(`Error updating ${item.label}: ${err.message}`);
									}
								}
								
								if (updatedFileCount > 0) {
									vscode.window.showInformationMessage(
										`Updated ${updatedFileCount} block/map files. See output panel for details.`
									);
								}
							}
						}
					}
					
					// Ask if user wants to open the file
					const openFile = await vscode.window.showQuickPick(['Yes', 'No'], {
						placeHolder: 'Open the deduplicated file?'
					});
					
					if (openFile === 'Yes') {
						// Open with appropriate viewer
						vscode.commands.executeCommand('vscode.openWith', outputUri, SpriteViewerProvider.viewType);
					}
				} catch (error: any) {
					vscode.window.showErrorMessage(`Error creating deduplicated file: ${error.message}`);
				}
			}
		} catch (error: any) {
			vscode.window.showErrorMessage(`Error analyzing sprite duplicates: ${error.message}`);
		}
	});

	// Register the "Convert to Optimized Block Format" command with license check
	let convertToOptimizedBlockCommand = vscode.commands.registerCommand('nextbuild-viewers.convertToOptimizedBlock', async (uri: vscode.Uri) => {
		// Check if this premium feature is accessible
		if (!licenseManager.checkFeatureAccess('optimizedBlocks')) {
			return; // Exit if user doesn't have access
		}
		
		if (!uri && vscode.window.activeTextEditor) {
			uri = vscode.window.activeTextEditor.document.uri;
		}

		if (!uri) {
			// Prompt the user to select a file instead of showing an error
			const fileOptions = await vscode.window.showOpenDialog({
				canSelectFiles: true,
				canSelectFolders: false,
				canSelectMany: false,
				openLabel: 'Select Block File for Conversion',
				filters: {
					'Block Files': ['nxb']
				}
			});

			if (!fileOptions || fileOptions.length === 0) {
				vscode.window.showInformationMessage('Conversion cancelled: No block file selected.');
				return;
			}

			uri = fileOptions[0];
		}

		try {
			// Check if it's a block file
			if (!uri.fsPath.toLowerCase().endsWith('.nxb')) {
				vscode.window.showErrorMessage('Only .nxb files can be converted to optimized format.');
				return;
			}

			// Read the block file
			const blockData = await vscode.workspace.fs.readFile(uri);
			console.log(`Read ${blockData.length} bytes from block file.`);

			// Ask user for sprite file
			const spriteFileOptions = await vscode.window.showOpenDialog({
				canSelectFiles: true,
				canSelectFolders: false,
				canSelectMany: false,
				openLabel: 'Select Sprite File',
				filters: {
					'Sprite Files': ['spr', 'til', 'nxt']
				}
			});

			if (!spriteFileOptions || spriteFileOptions.length === 0) {
				vscode.window.showInformationMessage('Conversion cancelled: No sprite file selected.');
				return;
			}

			const spriteFileUri = spriteFileOptions[0];
			const spriteData = await vscode.workspace.fs.readFile(spriteFileUri);
			console.log(`Read ${spriteData.length} bytes from sprite file.`);

			// Ask if user wants to deduplicate sprites
			const shouldDeduplicate = await vscode.window.showQuickPick(['Yes', 'No'], {
				placeHolder: 'Deduplicate sprites to optimize storage?'
			});

			// Parse sprite file based on extension
			const spriteFileExt = path.extname(spriteFileUri.fsPath).toLowerCase();
			let parsedSpriteData;
			
			// Import sprite handlers
			const { parse8BitSprites, parse4BitSprites, parse8x8Tiles } = require('./spriteDataHandler');
			
			if (spriteFileExt === '.spr') {
				parsedSpriteData = parse8BitSprites(Buffer.from(spriteData));
			} else if (spriteFileExt === '.nxt') {
				parsedSpriteData = parse4BitSprites(Buffer.from(spriteData), 0);
			} else if (spriteFileExt === '.til') {
				parsedSpriteData = parse8x8Tiles(Buffer.from(spriteData), 0);
			} else {
				// Default to 8-bit sprites if unknown
				parsedSpriteData = parse8BitSprites(Buffer.from(spriteData));
			}
			
			console.log(`Parsed sprite file with ${parsedSpriteData.sprites.length} sprites`);

			// Initialize sprite mapping
			let spriteIndices = Array.from({ length: 256 }, (_, i) => i);
			
			// Perform deduplication if requested
			if (shouldDeduplicate === 'Yes') {
				// Import deduplication utilities
				const { detectDuplicates, defaultOptions, createSpriteMapping } = require('./spriteDedupUtils');
				
				// Detect duplicates
				const duplicates = detectDuplicates(parsedSpriteData, defaultOptions);
				console.log(`Found ${duplicates.length} duplicate sprites`);
				
				// Create mapping from original indices to deduplicated indices
				if (duplicates.length > 0) {
					spriteIndices = createSpriteMapping(parsedSpriteData.sprites.length, duplicates);
					console.log(`Created sprite mapping for ${spriteIndices.length} sprites`);
				}
			}

			// Ask user for block dimensions
			const blockWidthInput = await vscode.window.showInputBox({
				prompt: 'Enter block width (in sprites)',
				value: '1'
			});

			if (!blockWidthInput) {
				vscode.window.showInformationMessage('Conversion cancelled: No block width provided.');
				return;
			}

			const blockHeightInput = await vscode.window.showInputBox({
				prompt: 'Enter block height (in sprites)',
				value: '1'
			});

			if (!blockHeightInput) {
				vscode.window.showInformationMessage('Conversion cancelled: No block height provided.');
				return;
			}

			const blockWidth = parseInt(blockWidthInput);
			const blockHeight = parseInt(blockHeightInput);

			if (isNaN(blockWidth) || blockWidth <= 0 || isNaN(blockHeight) || blockHeight <= 0) {
				vscode.window.showErrorMessage('Invalid block dimensions. Please enter positive numbers.');
				return;
			}

			// Default sprite dimensions for ZX Next
			const spriteWidth = 16; 
			const spriteHeight = 16;

			// Import the optimizer
			const { createOptimizedBlockFormat, serializeOptimizedBlockFile } = require('./optimizedBlockUtils');

			const optimizedBlockData = createOptimizedBlockFormat(
				blockData,
				spriteIndices,
				blockWidth,
				blockHeight,
				spriteWidth,
				spriteHeight
			);

			console.log(`Created optimized block format with ${optimizedBlockData.blocks.length} blocks.`);

			// Serialize the optimized block data
			const serializedData = serializeOptimizedBlockFile(optimizedBlockData);
			console.log(`Serialized optimized block data: ${serializedData.length} bytes.`);

			// Create output URI
			const outputPath = uri.fsPath.replace('.nxb', '.oxb');
			const outputUri = vscode.Uri.file(outputPath);

			// Write the file
			await vscode.workspace.fs.writeFile(outputUri, serializedData);
			console.log(`Wrote optimized block file to ${outputPath}`);

			// Show success message
			vscode.window.showInformationMessage(`Successfully converted to optimized block format: ${outputPath}`);

			// Ask if user wants to open the file
			const openFile = await vscode.window.showQuickPick(['Yes', 'No'], {
				placeHolder: 'Open the optimized block file?'
			});

			if (openFile === 'Yes') {
				// Open with the optimized block viewer
				vscode.commands.executeCommand('vscode.openWith', outputUri, OptimizedBlockViewerProvider.viewType);
			}
		} catch (error: any) {
			vscode.window.showErrorMessage(`Error converting to optimized block format: ${error.message}`);
			console.error('Error details:', error);
		}
	});

	// Register the "Open with Optimized Block Viewer" command
	let openWithOptimizedBlockViewer = vscode.commands.registerCommand('nextbuild-viewers.openWithOptimizedBlockViewer', async (uri: vscode.Uri) => {
		if (!uri && vscode.window.activeTextEditor) {
			uri = vscode.window.activeTextEditor.document.uri;
		}
		if (uri) {
			// Force open with our custom editor
			await vscode.commands.executeCommand('vscode.openWith', uri, OptimizedBlockViewerProvider.viewType);
		}
	});

	// Register Open with Sprite Importer with license check
	let openWithSpriteImporter = vscode.commands.registerCommand('nextbuild-viewers.openWithSpriteImporter', async (uri: vscode.Uri) => {
		// Check if this premium feature is accessible
		if (!licenseManager.checkFeatureAccess('spriteImporter')) {
			return; // Exit if user doesn't have access
		}
		
		// Original implementation
		if (!uri && vscode.window.activeTextEditor) {
			uri = vscode.window.activeTextEditor.document.uri;
		}
		
		if (!uri) {
			vscode.window.showErrorMessage('No image file selected to open in Sprite Importer.');
			return;
		}

		// Check if it's a supported image format
		const supportedFormats = ['.png', '.jpg', '.jpeg', '.bmp', '.gif', '.webp'];
		const fileExt = path.extname(uri.fsPath).toLowerCase();
		
		if (!supportedFormats.includes(fileExt)) {
			vscode.window.showErrorMessage(`Unsupported image format: ${fileExt}. Supported formats are: ${supportedFormats.join(', ')}`);
			return;
		}

		// Open the image in the sprite importer
		new SpriteImporterProvider(context, uri);
	});

	// Register the "Open with CSpect" command
	let openWithCSpectCommand = vscode.commands.registerCommand('nextbuild-viewers.openWithCSpect', async (uri: vscode.Uri) => {
		const filePath = uri?.fsPath;
		if (!filePath) {
			vscode.window.showWarningMessage('Could not determine the NEX file path.');
			return;
		}

		const fileDir = path.dirname(filePath);
		const folder = vscode.workspace.getConfiguration('nextbuild-viewers.linting');
		const rootFolderForIncludes = folder.get<string>('rootFolderForIncludes', '');

		// Add include path if rootFolderForIncludes is set
		if (rootFolderForIncludes && rootFolderForIncludes.trim() !== '') {
			
		}

		const config = vscode.workspace.getConfiguration('nextbuild-viewers');
		const cspectPath = rootFolderForIncludes + config.get<string>('cspectPath');

		if (!cspectPath) {
			const result = await vscode.window.showErrorMessage(
				'Path to CSpect.exe is not configured. Please set it in settings.',
				'Open Settings',
				'Cancel'
			);
			
			if (result === 'Open Settings') {
				await vscode.commands.executeCommand('workbench.action.openSettings', 'nextbuild-viewers.cspectPath');
			}
			return;
		}

		try {
			await fs.promises.access(cspectPath, fs.constants.X_OK);
		} catch (err) {
			const result = await vscode.window.showErrorMessage(
				`Configured CSpect.exe path not found or not executable: ${cspectPath}`,
				'Open Settings',
				'Cancel'
			);
			
			if (result === 'Open Settings') {
				await vscode.commands.executeCommand('workbench.action.openSettings', 'nextbuild-viewers.cspectPath');
			}
			return;
		}
		
		// Get the arguments and replace {directory} with the actual directory
		let cspectArgs = config.get<string>('cspectArgs', '-w3 -esc -r -basickeys -brk -zxnext -16bit');
		cspectArgs = cspectArgs.replace('{directory}', fileDir);
		
		// Create or get a terminal named "CSpect Emulator"
		let terminal = vscode.window.terminals.find(t => t.name === 'CSpect Emulator');
		if (!terminal) {
			terminal = vscode.window.createTerminal(`CSpect Emulator`);
		}
		
		// Construct the command for the terminal
		const command = `${cspectPath} ${cspectArgs} ${filePath}`;

		// Send the command to the terminal
		terminal.sendText(command);
		// Show the terminal panel
		// terminal.show();
		//vscode.window.showInformationMessage(`Launched CSpect with ${fileName}`);
	});

	// Register all commands
	context.subscriptions.push(
		showMessage,
		openWithPaletteViewer,
		openWithSpriteViewer,
		openWithBlockViewer,
		openWithImageViewer,
		createCommand,
		createNewProjectCommand,
		ayfxAudioCommand,
		playPT3Command,
		importSpriteCommand,
		toggleIconTheme,
//		analyzeDuplicatesCommand,
//		convertToOptimizedBlockCommand,
//		openWithOptimizedBlockViewer,
		openWithSpriteImporter,
		openWithCSpectCommand,
//		activateLicenseCommand,
		checkForUpdatesCommand,
		updateComponentsCommand,
		checkForComponentUpdatesCommand,
		updateExtensionComponentsCommand,
		checkForRootUpdatesCommand,
		updateRootComponentsCommand,
		resetUpdateDataCommand
	);

	// Command to set the root folder for includes
	let setRootFolderCommand = vscode.commands.registerCommand('nextbuild-viewers.setRootFolderForIncludes', async () => {
		const folderUris = await vscode.window.showOpenDialog({
			canSelectFiles: false,
			canSelectFolders: true,
			canSelectMany: false,
			openLabel: 'Select Root Folder',
			title: 'Select Root Folder for NextBuild Includes' // Corrected and simplified title
		});

		if (folderUris && folderUris[0]) {
			const selectedFolderPath = folderUris[0].fsPath;
			await vscode.workspace.getConfiguration('nextbuild-viewers.linting').update('rootFolderForIncludes', selectedFolderPath, vscode.ConfigurationTarget.Global);
			vscode.window.showInformationMessage(`NextBuild: Root folder for includes set to: ${selectedFolderPath}`);
		} else {
			vscode.window.showInformationMessage('NextBuild: Set root folder cancelled.');
		}
	});

	// Command to configure Python path for linting
	let configurePythonPathCommand = vscode.commands.registerCommand('nextbuild-viewers.configurePythonPath', async () => {
		await PythonDetector.showPythonPathDialog();
	});

	// Function to show warning filter configuration dialog
	async function showWarningFilterDialog() {
		const config = vscode.workspace.getConfiguration('nextbuild-viewers.linting');
		const currentHiddenWarnings = config.get<string[]>('hiddenWarnings', []);
		const currentHideAllWarnings = config.get<boolean>('hideAllWarnings', false);

		// Common warning codes with descriptions
		const knownWarnings = [
			{ code: 'W100', description: 'Implicit type warnings (default types)' },
			{ code: 'W110', description: 'Condition warnings (always true/false)' },
			{ code: 'W120', description: 'Type conversion warnings' },
			{ code: 'W130', description: 'Empty loop warnings' },
			{ code: 'W140', description: 'Empty IF statement warnings' },
			{ code: 'W150', description: 'Unused variable warnings' },
			{ code: 'W160', description: 'FASTCALL parameter warnings' },
			{ code: 'W170', description: 'Never called function warnings' },
			{ code: 'W180', description: 'Unreachable code warnings' },
			{ code: 'W190', description: 'Function return value warnings' },
			{ code: 'W200', description: 'Value truncation warnings' },
			{ code: 'W300', description: 'Unknown pragma warnings' }
		];

		// Create quick pick items
		const items: vscode.QuickPickItem[] = [];
		
		// Add "Hide All Warnings" option
		items.push({
			label: currentHideAllWarnings ? '✓ Hide All Warnings' : '  Hide All Warnings',
			description: 'Hide all warning messages (only show errors)',
			picked: currentHideAllWarnings
		});

		// Add separator
		items.push({ label: '', kind: vscode.QuickPickItemKind.Separator });

		// Add individual warning codes
		knownWarnings.forEach(warning => {
			const isHidden = currentHiddenWarnings.includes(warning.code);
			items.push({
				label: isHidden ? `✓ ${warning.code}` : `  ${warning.code}`,
				description: warning.description,
				picked: isHidden
			});
		});

		// Show the quick pick
		const result = await vscode.window.showQuickPick(items, {
			title: 'Configure Warning Filters',
			placeHolder: 'Select warning codes to hide (press Space to toggle)',
			canPickMany: true,
			ignoreFocusOut: true
		});

		if (result) {
			// Process the selections
			const hideAllSelected = result.some(item => item.label.includes('Hide All Warnings'));
			const selectedWarnings = result
				.filter(item => item.label.match(/W\d+/))
				.map(item => item.label.replace(/[✓\s]/g, ''));

			// Update configuration
			await config.update('hideAllWarnings', hideAllSelected, vscode.ConfigurationTarget.Global);
			await config.update('hiddenWarnings', selectedWarnings, vscode.ConfigurationTarget.Global);

			// Show confirmation message
			if (hideAllSelected) {
				vscode.window.showInformationMessage('All warnings will now be hidden. Only errors will be displayed.');
			} else if (selectedWarnings.length > 0) {
				vscode.window.showInformationMessage(`Warning codes ${selectedWarnings.join(', ')} will now be hidden.`);
			} else {
				vscode.window.showInformationMessage('All warning filters cleared. All warnings will be displayed.');
			}
		}
	}

	// Command to configure warning filters
	let configureWarningFiltersCommand = vscode.commands.registerCommand('nextbuild-viewers.configureWarningFilters', async () => {
		await showWarningFilterDialog();
	});

	context.subscriptions.push(setRootFolderCommand, configurePythonPathCommand, configureWarningFiltersCommand);
}

// Function to show the sponsor page
async function showSponsorPage() {
	const showPageSetting = vscode.workspace.getConfiguration('nextbuild-viewers').get('showSponsorPage', true);
	
	if (showPageSetting) {
		const selection = await vscode.window.showInformationMessage(
			'Thanks for installing NextBuild Viewers! Would you like to support development on Patreon?',
			'Open Patreon', 'Don\'t Show Again', 'Close'
		);
		
		if (selection === 'Open Patreon') {
			// Open the Patreon page
			vscode.env.openExternal(vscode.Uri.parse('https://patreon.com/user?u=27217558'));
		} else if (selection === 'Don\'t Show Again') {
			await vscode.workspace.getConfiguration('nextbuild-viewers').update('showSponsorPage', false, vscode.ConfigurationTarget.Global);
		}
	}
}

// This method is called when your extension is deactivated
export function deactivate() {
	console.log('Extension "nextbuild-viewers" is now deactivated.');
}