If you are using MacOS or a 3rd party fork of, or actual VSCode (Codium/Cursor/VSCode), it is possible to manually set up most of the functionality that NextBuildStudio provides. You can do this by downloading the NextBuildStudio-barebones.zip and following these steps:

	- Extract the NextBuildStudio-barebones.zip to a temporary folder
	- If you already have your editor installed you can skip this step - otherwise download and install VSCode or whatever your choice is. Run the program onces and quit.
	- Copy the extensions folder from the temp folder to the following place (note this folder will be customised to whatever fork of VSCode you are running)
		- Linux / MacOS : ~/.vscode/ 
		- Windows %appdata%/vscode/
	- Copy the NextBuildv9 folder to : 
		- Linux / MacOS : ~/Documents
		- Windows %userprofile%/Documents
	- Launch the editor eg Visual Studio Code
	- Choose open file and open NextBuild.workspace and change the 
	- From the filemenu pick New Window
	- Open Project, Select the "Sources" folder
    - Install the vsix for your OS (CTRL+SHIFT+P Install VSIX)
    
    Done
