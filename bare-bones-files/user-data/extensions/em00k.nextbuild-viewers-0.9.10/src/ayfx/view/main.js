// AYFX Viewer Main Script

// Wait for the DOM and the VSCode API to be ready
window.addEventListener('load', () => {
    const vscode = acquireVsCodeApi();

    // --- STATE ---
    let bank = new Bank(); // From the bundled afx.js
    let currentEffect = bank.effect;
    let emptyBanks = new Set();
    let copyBank = new Bank();
    let playingSource = null;
    let audioContext = null;
    let startState = { filter: null, checked: null };
    let currentOctave = 4; // Default octave for keyboard entry

    // --- MULTI-CHANNEL STATE ---
    let channelMode = 'single'; // 'single', 'dual', 'triple'
    let activeChannel = 'a'; // Current active channel for note entry
    let channels = {
        a: { bank: new Bank(), effect: null, emptyBanks: new Set(), cursorPosition: 0 },
        b: { bank: new Bank(), effect: null, emptyBanks: new Set(), cursorPosition: 0 },
        c: { bank: new Bank(), effect: null, emptyBanks: new Set(), cursorPosition: 0 }
    };
    
    // Initialize channels
    channels.a.effect = channels.a.bank.effect;
    channels.b.effect = channels.b.bank.effect;
    channels.c.effect = channels.c.bank.effect;
    
    // Channel settings
    let channelSettings = {
        a: { muted: false, volume: 0.8 },
        b: { muted: false, volume: 0.8 },
        c: { muted: false, volume: 0.8 }
    };
    
    let syncChannels = true; // Whether to sync cursor positions
    let combinedPlayback = true; // Whether to play all channels together
    let toneLogarithmic = false; // Whether to use logarithmic scaling for tone bars

    // --- DOM ELEMENTS ---
    const nameEl = document.querySelector('#effect-name');
    const positionSelect = document.querySelector('#position');
    const totalEffectsSpan = document.querySelector('#total-effects');
    const noteKeyboardContainer = document.getElementById('note-keyboard-container');
    const importCollection = document.querySelector('#import-collection');
    const previewNotesCheckbox = document.querySelector('#preview-notes');
    const octaveDisplay = document.querySelector('#octave-display');
    
    // Multi-channel DOM elements
    const channelModeRadios = document.querySelectorAll('input[name="channel-mode"]');
    const activeChannelSelect = document.querySelector('#active-channel');
    const syncChannelsCheckbox = document.querySelector('#sync-channels');
    const combinedPlaybackCheckbox = document.querySelector('#combined-playback');
    const toneLogarithmicCheckbox = document.querySelector('#tone-logarithmic');
    const channelTables = {
        a: { body: document.querySelector('#effect-table-a tbody'), table: document.querySelector('#effect-table-a') },
        b: { body: document.querySelector('#effect-table-b tbody'), table: document.querySelector('#effect-table-b') },
        c: { body: document.querySelector('#effect-table-c tbody'), table: document.querySelector('#effect-table-c') }
    };
    const channelPanels = {
        a: document.querySelector('#channel-a'),
        b: document.querySelector('#channel-b'),
        c: document.querySelector('#channel-c')
    };
    const channelMuteCheckboxes = document.querySelectorAll('.channel-mute');
    const channelVolumeSliders = document.querySelectorAll('.channel-volume');
    
    // Legacy single-channel compatibility
    const effectTableBody = channelTables.a.body;
    const effectTable = channelTables.a.table;

    // --- MUSICAL NOTE LOGIC ---
    const noteFreqs = {
        'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13, 'E': 329.63, 'F': 349.23,
        'F#': 369.99, 'G': 392.00, 'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
    };

    function freqToPeriod(freq, octave = 4) {
        const actualFreq = freq * Math.pow(2, octave - 4);
        const clockFreq = 1773400; // AY-3-8910 clock on ZX Spectrum
        return Math.round(clockFreq / (16 * actualFreq));
    }

    // --- KEYBOARD NOTE MAPPING ---
    const keyboardNoteMap = {
        'q': 'C',
        '2': 'C#',
        'w': 'D',
        '3': 'D#',
        'e': 'E',
        'r': 'F',
        '5': 'F#',
        't': 'G',
        '6': 'G#',
        'y': 'A',
        '7': 'A#',
        'u': 'B',
        '8': 'C'  // Next octave C
    };

    // Track current cursor position for keyboard note entry
    let currentCursorPosition = 0;

    function playKeyboardNote(key) {
        const note = keyboardNoteMap[key.toLowerCase()];
        if (!note) return false;
        
        // Handle octave for the high C
        let octave = currentOctave;
        if (key === '8') octave = currentOctave + 1;
        
        const freq = noteFreqs[note];
        if (!freq) return false;
        
        const period = freqToPeriod(freq, octave);
        
        // Use the current channel's cursor position
        const currentChannel = getCurrentChannel();
        const currentPos = currentChannel.cursorPosition || 0;
        
        // Add note at current cursor position on active channel
        addNoteAtPosition(period, currentPos);
        
        // Move cursor to next position
        currentChannel.cursorPosition = currentPos + 1;
        
        // Sync cursors if enabled
        if (syncChannels) {
            syncCursorPositions(currentChannel.cursorPosition);
        }
        
        // Update UI to show new cursor position
        updatePositionAndDisplay(currentChannel.cursorPosition);
        return true;
    }

    function addNoteAtPosition(period, position) {
        const currentChannel = getCurrentChannel();
        const currentEffect = getCurrentEffect();
        
        // Silently limit position to maximum effect length
        position = Math.min(position, 0xFFF - 1);
        
        console.log(`Adding note to channel ${activeChannel} at position ${position}, effect length: ${currentEffect.length}`);
        
        const frame = new EffectFrame({
            t: true,
            n: false,
            tone: period,
            noise: 0,
            volume: 10,
        });

        currentEffect.snapshot();
        
        // Extend effect if needed
        while (currentEffect.length <= position) {
            const emptyFrame = new EffectFrame({
                t: false,
                n: false,
                tone: 0,
                noise: 0,
                volume: 0,
            });
            currentEffect.push(emptyFrame);
        }
        
        // Set the frame at the position
        const targetFrame = currentEffect.get(position);
        targetFrame.t = frame.t;
        targetFrame.n = frame.n;
        targetFrame.tone = frame.tone;
        targetFrame.noise = frame.noise;
        targetFrame.volume = frame.volume;
        
        // Render the active channel
        renderChannelEffect(activeChannel);
        
        // Also update legacy single-channel view if in single mode
        if (channelMode === 'single') {
            renderEffect();
        }
        
        // Play the note for feedback on the active channel
        playNote(frame, 0.5, activeChannel);
        
        console.log(`Note added to channel ${activeChannel}, new effect length: ${currentEffect.length}`);
    }

    // function updateCursorDisplay() {
    //     // Clear previous selection
    //     clearSelection();
        
    //     // Select current cursor position if it exists
    //     if (currentCursorPosition < currentEffect.length) {
    //         selectRow(currentCursorPosition);
    //         const row = effectTableBody.querySelector(`tr[data-frame="${currentCursorPosition}"]`);
    //         if (row) {
    //             row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    //             row.tabIndex = 0;
    //             row.focus();
    //             lastFocusedRow = currentCursorPosition;
    //         }
    //     }
        
    //     console.log(`Cursor position: ${currentCursorPosition}, effect length: ${currentEffect.length}`);
    // }

    // Unified function to update display and position for any operation
    function updatePositionAndDisplay(newPosition, shouldScroll = true, shouldSelect = true) {
        // Update cursor position for active channel
        const currentChannel = getCurrentChannel();
        currentChannel.cursorPosition = newPosition;
        
        // Also update legacy single-channel variables for backward compatibility
        currentCursorPosition = newPosition;
        lastFocusedRow = newPosition;
        
        // Find the row in the active channel's table
        let row = null;
        if (channelMode === 'single') {
            // Use legacy single-channel table
            row = effectTableBody?.querySelector(`tr[data-frame="${newPosition}"]`);
        } else {
            // Use multi-channel table for active channel
            const channelTable = channelTables[activeChannel];
            if (channelTable && channelTable.body) {
                row = channelTable.body.querySelector(`tr[data-frame="${newPosition}"]`);
            }
        }
        
        if (row) {
            // Scroll to position
            if (shouldScroll) {
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            // Select and focus the row
            if (shouldSelect) {
                selectRow(newPosition);
            }
            row.tabIndex = 0;
            row.focus();
        }
        
        console.log(`Position updated to: ${newPosition} on channel ${activeChannel}, effect length: ${getCurrentEffect().length}`);
    }

    function updateOctaveDisplay() {
        if (octaveDisplay) {
            octaveDisplay.textContent = `Octave: ${currentOctave} (Use Page Up/Down to change)`;
        }
    }

    // --- MULTI-CHANNEL FUNCTIONS ---
    function getCurrentChannel() {
        return channels[activeChannel];
    }

    function getCurrentEffect() {
        const channel = getCurrentChannel();
        if (!channel || !channel.effect) {
            console.warn('getCurrentEffect: No effect available for current channel');
            return null;
        }
        return channel.effect;
    }

    // Complete reinitialization function for when loading new banks
    function reinitializeAfterLoad() {
        console.log('🔄 Reinitializing multi-channel system after bank load...');
        
        // Reset all channel cursor positions
        Object.keys(channels).forEach(channelId => {
            channels[channelId].cursorPosition = 0;
            channels[channelId].emptyBanks.clear();
        });
        
        // Clear any selections
        clearSelection();
        
        // Update channel effects to point to correct bank effects
        updateChannelEffects();
        
        // Update current effect reference
        currentEffect = getCurrentEffect();
        
        // Reset cursor tracking variables
        currentCursorPosition = 0;
        lastFocusedRow = 0;
        nextInsertPosition = null;
        
        // Update totals and UI
        updateTotals();
        
        // Re-render all visible channels
        renderVisibleChannels();
        
        // Also render legacy single-channel view for compatibility
        renderEffect();
        
        // Show the current effect
        showEffect(currentEffect);
        
        // Reset position display
        updatePositionAndDisplay(0, true, true);
        
        console.log('✅ Multi-channel system reinitialized successfully');
        console.log(`Bank has ${bank.length} effects, active channel: ${activeChannel}`);
    }

    // Handle PSG data loading
    function handlePSGDataLoad(channelData, effectName, options) {
        console.log('Converting PSG data to AYFX effects...', channelData, options);
        
        // Determine target channels from options
        const targetChannels = options.targetChannels || ['a'];
        console.log(`Target channels:`, targetChannels);
        console.log(`Available channel data:`, Object.keys(channelData));
        
        const targetChannel = targetChannels[0]; // Use first target channel
        const frames = channelData[targetChannel];
        
        if (!frames || frames.length === 0) {
            console.error('No frame data for target channel:', targetChannel);
            return;
        }
        
        console.log(`Appending PSG data to channel ${targetChannel} effect with ${frames.length} frames`);
        console.log(`Current bank selection: ${bank.selected}, Channel count: ${getChannelCount()}`);
        
        // Calculate the correct effect index for the target channel using the existing system
        const targetEffectIndex = getEffectIndexForChannel(targetChannel);
        console.log(`Target effect index for channel ${targetChannel}: ${targetEffectIndex}`);
        
        // Ensure the target effect exists
        while (bank.length <= targetEffectIndex) {
            bank.add();
        }
        
        // Get the effect for the target channel
        const oldSelected = bank.selected;
        bank.selected = targetEffectIndex;
        const targetEffect = bank.effect;
        bank.selected = oldSelected; // Restore original selection
        
        if (!targetEffect) {
            console.error('Failed to get target effect');
            return;
        }
        
        // Take snapshot for undo
        targetEffect.snapshot();
        
        // Append PSG frames to the target effect with silent size limiting
        let framesToImport = frames;
        const currentLength = targetEffect.length;
        const maxFrames = 0xFFF;
        
        if (currentLength + frames.length > maxFrames) {
            const availableFrames = maxFrames - currentLength;
            if (availableFrames <= 0) {
                // Effect is already at maximum size, skip import silently
                return;
            }
            
            // Silently truncate to available frames
            framesToImport = frames.slice(0, availableFrames);
        }
        
        framesToImport.forEach(frameData => {
            const frame = new EffectFrame({
                t: frameData.t || false,
                n: frameData.n || false,
                tone: frameData.tone || 0,
                noise: frameData.noise || 0,
                volume: frameData.volume || 0
            });
            targetEffect.push(frame);
        });
        
        console.log(`PSG data appended. Target effect now has ${targetEffect.length} frames`);
        
        // Update the channel reference to point to the correct effect
        channels[targetChannel].effect = targetEffect;
        
        // Update the current cursor position to the start of the imported data
        const importStartPosition = targetEffect.length - framesToImport.length;
        channels[targetChannel].cursorPosition = importStartPosition;
        
        // Set active channel and update current effect reference
        setActiveChannel(targetChannel);
        currentEffect = targetEffect;
        currentCursorPosition = importStartPosition;
        
        // Clear any selections
        clearSelection();
        
        // Update totals and UI
        updateTotals();
        
        // Render the target channel
        renderChannelEffect(targetChannel);
        if (channelMode === 'single') {
            renderEffect(); // Also render legacy single-channel view
        }
        
        // Show the effect
        showEffect(targetEffect);
        
        // Update position display to show the start of imported data
        updatePositionAndDisplay(importStartPosition, true, true);
        
        console.log(`PSG import complete: ${framesToImport.length} frames appended to channel ${targetChannel} (effect ${targetEffectIndex}), cursor at position ${importStartPosition}`);
    }

    function setChannelMode(mode) {
        channelMode = mode;
        document.body.setAttribute('data-channel-mode', mode);
        
        // Show/hide channel panels based on mode
        Object.keys(channelPanels).forEach(channelId => {
            const panel = channelPanels[channelId];
            if (mode === 'single') {
                panel.style.display = channelId === 'a' ? 'flex' : 'none';
            } else if (mode === 'dual') {
                panel.style.display = (channelId === 'a' || channelId === 'b') ? 'flex' : 'none';
            } else if (mode === 'triple') {
                panel.style.display = 'flex';
            }
        });
        
        // Update channel effects based on consecutive effects approach
        updateChannelEffects();
        
        // Re-render all visible channels
        renderVisibleChannels();
    }

    function setActiveChannel(channelId) {
        // Remove active class from all panels
        Object.values(channelPanels).forEach(panel => {
            panel.classList.remove('active');
        });
        
        // Set new active channel
        activeChannel = channelId;
        channelPanels[channelId].classList.add('active');
        
        // Update the selector
        if (activeChannelSelect) {
            activeChannelSelect.value = channelId;
        }
        
        console.log(`Active channel set to: ${channelId}`);
    }

    function syncCursorPositions(newPosition) {
        if (syncChannels) {
            Object.keys(channels).forEach(channelId => {
                channels[channelId].cursorPosition = newPosition;
            });
        }
    }

    function renderVisibleChannels() {
        const visibleChannels = getVisibleChannels();
        visibleChannels.forEach(channelId => {
            renderChannelEffect(channelId);
        });
    }

    function getVisibleChannels() {
        if (channelMode === 'single') return ['a'];
        if (channelMode === 'dual') return ['a', 'b'];
        if (channelMode === 'triple') return ['a', 'b', 'c'];
        return [];
    }

    function getChannelCount() {
        return getVisibleChannels().length;
    }

    function getEffectIndexForChannel(channelId) {
        const channelOrder = ['a', 'b', 'c'];
        const channelOffset = channelOrder.indexOf(channelId);
        const baseEffectIndex = Math.floor(bank.selected / getChannelCount()) * getChannelCount();
        return baseEffectIndex + channelOffset;
    }

    function updateChannelEffects() {
        const visibleChannels = getVisibleChannels();
        
        visibleChannels.forEach(channelId => {
            const effectIndex = getEffectIndexForChannel(channelId);
            
            // Ensure the effect exists in the bank
            while (bank.length <= effectIndex) {
                bank.add(); // Add new empty effect
            }
            
            // Navigate to the correct effect for this channel
            const oldSelected = bank.selected;
            bank.selected = effectIndex;
            channels[channelId].effect = bank.effect;
            bank.selected = oldSelected; // Restore original selection
        });
        
        // Update current effect reference for backward compatibility
        currentEffect = getCurrentEffect();
        
        console.log(`Updated channel effects for ${channelMode} mode. Base effect: ${Math.floor(bank.selected / getChannelCount()) * getChannelCount()}`);
    }

    function renderChannelEffect(channelId) {
        const channel = channels[channelId];
        const tableBody = channelTables[channelId].body;
        
        if (!tableBody) return;
        
        // Clear current table
        tableBody.innerHTML = '';
        
        // Render frames with proper input elements
        for(let i = 0; i < 255; i++) {
            channel.emptyBanks.delete(i);
            const frame = channel.effect.frames.get(i);
            const row = document.createElement('tr');
            row.dataset.frame = i;
            row.dataset.channel = channelId;
            row.tabIndex = 0;
            
            if (frame) {
                row.dataset.volume = frame.volume;
                row.innerHTML = `
                    <td class="pos">${pad(i, 3)}</td>
                    <td class="bool"><input type="checkbox" name="t" ${frame.t ? 'checked' : ''}><label class="t"></label></td>
                    <td class="bool"><input type="checkbox" name="n" ${frame.n ? 'checked' : ''}><label class="n"></label></td>
                    <td><input type="text" name="tone" value="${padHex(frame.tone, 3)}" size="3"></td>
                    <td><input type="text" name="noise" value="${padHex(frame.noise, 2)}" size="2"></td>
                    <td><input type="text" name="volume" value="${padHex(frame.volume, 1)}" size="1"></td>
                    <td><span class="bar" data-name="tone"><input type="range" name="tone" min="0" max="4095" value="${frame.tone}"><label style="--width: ${getToneBarPosition(frame.tone)}%"></label></span></td>
                    <td><span class="bar" data-name="noise"><input type="range" name="noise" min="0" max="31" value="${frame.noise}"><label style="--width: ${(100/31)*frame.noise}%"></label></span></td>
                    <td><span class="bar" data-name="volume"><input type="range" name="volume" min="0" max="15" value="${frame.volume}"><label style="--width: ${(100/15)*frame.volume}%"></label></span></td>
                `;
            } else {
                if (channel.emptyBanks.has(i)) {
                    continue;
                }
                channel.emptyBanks.add(i);
                row.dataset.volume = 0;
                row.innerHTML = `
                    <td class="pos">${pad(i, 3)}</td>
                    <td class="bool"><input type="checkbox" name="t"><label class="t"></label></td>
                    <td class="bool"><input type="checkbox" name="n"><label class="n"></label></td>
                    <td><input type="text" name="tone" value="000" size="3"></td>
                    <td><input type="text" name="noise" value="00" size="2"></td>
                    <td><input type="text" name="volume" value="0" size="1"></td>
                    <td><span class="bar" data-name="tone"><input type="range" name="tone" min="0" max="4095" value="0"><label style="--width: 0%"></label></span></td>
                    <td><span class="bar" data-name="noise"><input type="range" name="noise" min="0" max="31" value="0"><label style="--width: 0%"></label></span></td>
                    <td><span class="bar" data-name="volume"><input type="range" name="volume" min="0" max="15" value="0"><label style="--width: 0%"></label></span></td>
                `;
            }
            
            tableBody.appendChild(row);
        }
    }

    // --- UTILITY FUNCTIONS ---
    function padHex(value, length) {
        return value.toString(16).padStart(length, '0').toUpperCase();
    }

    function pad(value, length) {
        return value.toString().padStart(length, '0');
    }

    function maxForInput(name) {
        if (name === 'volume') return 1; // 4-bit: 0-15 (F)
        if (name === 'noise') return 2;  // 5-bit: 0-31 (1F) - displayed as 2 hex digits
        if (name === 'tone') return 3;   // 12-bit: 0-4095 (FFF)
    }

    function getActualMax(name) {
        if (name === 'volume') return 15;   // 4-bit max
        if (name === 'noise') return 31;    // 5-bit max
        if (name === 'tone') return 4095;   // 12-bit max
    }

    // Tone bar positioning functions based on original C++ implementation

    function getToneBarPosition(value) {
        if (toneLogarithmic) {
            // Original C++: return (int)float(float(tone_wdt)*log(period/8.)/log(4095./8.));
            // Scale to percentage: (result / tone_wdt) * 100
            if (value <= 0) return 0;
            const logBase = Math.log(4095.0 / 8.0);
            const result = Math.log(value / 8.0) / logBase;
            return Math.floor(result * 100);
        } else {
            // Original C++: return 1+tone_wdt*period/4096;
            // Scale to percentage: (result / tone_wdt) * 100
            const result = (1 + value / 4096);
            return Math.floor(result * 100);
        }
    }



    function updateAllToneBars() {
        // Update all tone bars in all visible channels to reflect the new scaling mode
        const visibleChannels = getVisibleChannels();
        
        visibleChannels.forEach(channelId => {
            const tableBody = channelTables[channelId].body;
            if (!tableBody) return;
            
            const toneBars = tableBody.querySelectorAll('.bar[data-name="tone"]');
            toneBars.forEach(bar => {
                const rangeInput = bar.querySelector('input[type="range"]');
                const label = bar.querySelector('label');
                
                if (rangeInput && label) {
                    const toneValue = parseInt(rangeInput.value, 10) || 0;
                    const newPosition = getToneBarPosition(toneValue);
                    label.style.setProperty('--width', `${newPosition}%`);
                }
            });
        });
        
        // Also update the legacy single-channel table if in single mode
        if (channelMode === 'single' && effectTableBody) {
            const toneBars = effectTableBody.querySelectorAll('.bar[data-name="tone"]');
            toneBars.forEach(bar => {
                const rangeInput = bar.querySelector('input[type="range"]');
                const label = bar.querySelector('label');
                
                if (rangeInput && label) {
                    const toneValue = parseInt(rangeInput.value, 10) || 0;
                    const newPosition = getToneBarPosition(toneValue);
                    label.style.setProperty('--width', `${newPosition}%`);
                }
            });
        }
    }

    // --- EFFECT MANAGEMENT ---
    function updateTotals() {
        const length = bank.length;
        const selected = bank.selected;
        const channelCount = getChannelCount();
        
        // Calculate effect group (which set of consecutive effects we're on)
        const effectGroup = Math.floor(selected / channelCount);
        const maxGroups = Math.ceil(length / channelCount) - 1;
        
        positionSelect.value = effectGroup;
        positionSelect.max = maxGroups;
        totalEffectsSpan.textContent = pad(maxGroups, 3);
        
        console.log(`Effect totals updated: Group ${effectGroup} of ${maxGroups}, Bank effect ${selected}, Channels: ${channelCount}`);
    }

    function showEffect(effect) {
        nameEl.value = effect.name;
        positionSelect.value = bank.selected;
        renderEffect();
    }

    function navigateToEffect(index) {
        const channelCount = getChannelCount();
        
        // Round to nearest channel group boundary
        const groupIndex = Math.floor(index / channelCount);
        const newBaseIndex = groupIndex * channelCount;
        
        // Clamp to valid range
        const maxGroups = Math.ceil(bank.length / channelCount);
        if (groupIndex >= 0 && groupIndex < maxGroups) {
            bank.selected = newBaseIndex;
            updateChannelEffects();
            updateTotals();
            showEffect(getCurrentEffect());
            
            console.log(`Navigated to effect group ${groupIndex} (base effect ${newBaseIndex}) in ${channelMode} mode`);
        }
    }

    // --- AUDIO FUNCTIONS ---
    function stop() {
        // Only stop full effect playback, not note previews
        if (playingSource) {
            try {
                playingSource.stop();
            } catch (e) {}
            playingSource = null;
        }
    }
    
    function stopAllAudio() {
        // Stop everything including note previews
        stop(); // Stop full effect
        
        // Stop all note previews
        noteSources.forEach(sourceData => {
            try {
                sourceData.source.stop();
            } catch (e) {}
        });
        noteSources = [];
    }

    // --- MULTI-CHANNEL AUDIO FUNCTIONS ---
    function createAudioContext() {
        if (!audioContext) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.error("Could not create audio context", e);
                return null;
            }
        }
        return audioContext;
    }

    function playChannel(channelId) {
        const context = createAudioContext();
        if (!context) return;

        const channel = channels[channelId];
        const settings = channelSettings[channelId];
        
        if (settings.muted || channel.effect.length === 0) {
            console.log(`Channel ${channelId} is muted or empty`);
            return;
        }

        console.log(`Playing channel ${channelId}`);
        
        const data = channel.effect.play();
        context.decodeAudioData(data.buffer, function (buffer) {
            stop(); // Stop any current playback
            playingSource = context.createBufferSource();
            playingSource.buffer = buffer;
            
            const gainNode = context.createGain();
            gainNode.gain.value = settings.volume * 0.7; // Scale volume
            
            playingSource.connect(gainNode);
            gainNode.connect(context.destination);
            playingSource.start(0);
        });
    }

    function playAllChannels() {
        const context = createAudioContext();
        if (!context) return;

        console.log('Playing all channels in combined mode');
        
        if (combinedPlayback) {
            // Mixed playback - combine all channels
            playMixedChannels();
        } else {
            // Sequential playback - play active channel only
            playChannel(activeChannel);
        }
    }

    function playMixedChannels() {
        const context = createAudioContext();
        if (!context) return;

        // Get visible channels that aren't muted and have content
        const visibleChannels = getVisibleChannels().filter(channelId => {
            const settings = channelSettings[channelId];
            const channel = channels[channelId];
            // Add safety checks for undefined effect
            return !settings.muted && channel && channel.effect && channel.effect.length > 0;
        });

        if (visibleChannels.length === 0) {
            console.log('No channels to play - all channels are muted, empty, or undefined');
            return;
        }

        // Stop any current playback
        stop();

        // Create audio data for each channel
        const channelBuffers = [];
        let processedChannels = 0;
        let failedChannels = 0;

        visibleChannels.forEach(channelId => {
            const channel = channels[channelId];
            
            try {
                const data = channel.effect.play();
                
                context.decodeAudioData(data.buffer, function (buffer) {
                    channelBuffers.push({
                        channelId: channelId,
                        buffer: buffer,
                        volume: channelSettings[channelId].volume
                    });
                    
                    processedChannels++;
                    
                    // When all channels are processed, mix them
                    if (processedChannels + failedChannels === visibleChannels.length) {
                        if (channelBuffers.length > 0) {
                            mixAndPlayChannels(channelBuffers);
                        } else {
                            console.log('No valid audio buffers to play');
                        }
                    }
                }, function(error) {
                    console.error(`Failed to decode audio for channel ${channelId}:`, error);
                    failedChannels++;
                    
                    // Check if all channels are done (including failed ones)
                    if (processedChannels + failedChannels === visibleChannels.length) {
                        if (channelBuffers.length > 0) {
                            mixAndPlayChannels(channelBuffers);
                        } else {
                            console.log('No valid audio buffers to play');
                        }
                    }
                });
            } catch (error) {
                console.error(`Error generating audio data for channel ${channelId}:`, error);
                failedChannels++;
                
                // Check if all channels are done (including failed ones)
                if (processedChannels + failedChannels === visibleChannels.length) {
                    if (channelBuffers.length > 0) {
                        mixAndPlayChannels(channelBuffers);
                    } else {
                        console.log('No valid audio buffers to play');
                    }
                }
            }
        });
    }

    // Add guard to prevent recursive calls
    let isMixing = false;
    
    function mixAndPlayChannels(channelBuffers) {
        // Prevent recursive calls
        if (isMixing) {
            console.warn('mixAndPlayChannels already in progress, skipping');
            return;
        }
        
        isMixing = true;
        
        try {
            const context = createAudioContext();
            if (!context || channelBuffers.length === 0) {
                isMixing = false;
                return;
            }

            // Validate channel buffers
            const validBuffers = channelBuffers.filter(cb => cb && cb.buffer && cb.buffer.length > 0);
            if (validBuffers.length === 0) {
                console.warn('No valid channel buffers to mix');
                isMixing = false;
                return;
            }

            // Find the longest buffer to determine mix length
            const maxLength = Math.max(...validBuffers.map(cb => cb.buffer.length));
            const sampleRate = validBuffers[0].buffer.sampleRate;
            
            // Create a new buffer for the mixed audio
            const mixedBuffer = context.createBuffer(
                validBuffers[0].buffer.numberOfChannels,
                maxLength,
                sampleRate
            );

            // Mix all channels together
            for (let channel = 0; channel < mixedBuffer.numberOfChannels; channel++) {
                const mixedData = mixedBuffer.getChannelData(channel);
                
                // Clear the buffer
                for (let i = 0; i < maxLength; i++) {
                    mixedData[i] = 0;
                }
                
                // Add each channel's contribution
                validBuffers.forEach(channelBuffer => {
                    const channelData = channelBuffer.buffer.getChannelData(channel);
                    const volume = channelBuffer.volume || 1.0;
                    
                    for (let i = 0; i < channelData.length && i < maxLength; i++) {
                        mixedData[i] += channelData[i] * volume;
                    }
                });
                
                // Normalize to prevent clipping - use iterative approach to avoid stack overflow
                let maxVolume = 0;
                for (let i = 0; i < maxLength; i++) {
                    const absValue = Math.abs(mixedData[i]);
                    if (absValue > maxVolume) {
                        maxVolume = absValue;
                    }
                }
                
                if (maxVolume > 1.0) {
                    const normalizeRatio = 0.95 / maxVolume;
                    for (let i = 0; i < maxLength; i++) {
                        mixedData[i] *= normalizeRatio;
                    }
                }
            }

            // Play the mixed buffer
            playingSource = context.createBufferSource();
            playingSource.buffer = mixedBuffer;
            
            const masterGain = context.createGain();
            masterGain.gain.value = 0.8; // Master volume
            
            playingSource.connect(masterGain);
            masterGain.connect(context.destination);
            playingSource.start(0);
            
            console.log(`Mixed and playing ${validBuffers.length} channels`);
        } catch (error) {
            console.error('Error in mixAndPlayChannels:', error);
        } finally {
            isMixing = false;
        }
    }

    function play(effect = null) {
        // Legacy single-channel play function, now redirects to multi-channel system
        if (effect) {
            // Direct effect play (for backward compatibility)
            const context = createAudioContext();
            if (!context) return;

            const data = effect.play();
            context.decodeAudioData(data.buffer, function (buffer) {
                stop();
                playingSource = context.createBufferSource();
                playingSource.buffer = buffer;
                const gainNode = context.createGain();
                gainNode.gain.value = 0.5;
                playingSource.connect(gainNode);
                gainNode.connect(context.destination);
                playingSource.start(0);
            });
        } else {
            // Use new multi-channel system
            playAllChannels();
        }
    }

    // Track multiple note sources for overlapping playback
    let noteSources = [];
    
    function cleanupNoteSources() {
        // Remove finished sources
        noteSources = noteSources.filter(source => source.source.playbackState !== source.source.FINISHED_STATE);
    }

    function playNote(frame, duration = 0.8, channelId = null) {
        const context = createAudioContext();
        if (!context) return;

        // Use active channel if none specified
        const targetChannelId = channelId || activeChannel;
        const settings = channelSettings[targetChannelId];
        
        // Check if channel is muted or volume is 0
        if (settings.muted || settings.volume === 0) {
            console.log(`Note preview skipped - channel ${targetChannelId} is muted or volume is 0`);
            return;
        }

        // Create a temporary single-frame effect for preview
        console.log(`Creating note preview for channel ${targetChannelId}, volume: ${settings.volume}`);
        const tempEffect = new Effect();
        tempEffect.push(frame);
        
        const data = tempEffect.play();
        console.log(`Audio data generated, buffer length: ${data.buffer.byteLength}`);
        
        context.decodeAudioData(data.buffer, function (buffer) {
            console.log(`Audio decoded successfully, buffer duration: ${buffer.duration}s`);
            // Don't stop previous notes - allow overlapping
            cleanupNoteSources();
            
            const noteSource = context.createBufferSource();
            noteSource.buffer = buffer;
            const gainNode = context.createGain();
            
            // Apply channel volume to note preview
            const finalVolume = 0.4 * settings.volume;
            gainNode.gain.value = finalVolume;
            console.log(`Playing note with volume: ${finalVolume} (base: 0.4 × channel: ${settings.volume})`);
            
            noteSource.connect(gainNode);
            gainNode.connect(context.destination);
            noteSource.start(0);
            
            // Track this source
            const sourceData = { source: noteSource, gainNode, channelId: targetChannelId };
            noteSources.push(sourceData);
            
            // Auto-stop the note after duration with fade out
            // setTimeout(() => {
            //     try {
            //         // Fade out over 100ms for smoother ending
            //         gainNode.gain.setValueAtTime(gainNode.gain.value, context.currentTime);
            //         gainNode.gain.linearRampToValueAtTime(0, context.currentTime + 0.1);
                    
            //         setTimeout(() => {
            //             try {
            //                 noteSource.stop();
            //             } catch (e) {}
            //             // Remove from tracking
            //             const index = noteSources.indexOf(sourceData);
            //             if (index > -1) {
            //                 noteSources.splice(index, 1);
            //             }
            //         }, 100);
            //     } catch (e) {}
            // }, duration * 1000);
        });
    }

    // --- UI RENDERING ---
    function createNoteKeyboard() {
        if (!noteKeyboardContainer) return;
        
        const octaves = [2, 3, 4, 5, 6];
        
        octaves.forEach(octave => {
            const pianoDiv = document.createElement('div');
            pianoDiv.className = 'piano-octave';
            
            const label = document.createElement('div');
            label.className = 'octave-label';
            label.textContent = `${octave}`;
            pianoDiv.appendChild(label);
            
            const keysContainer = document.createElement('div');
            keysContainer.className = 'piano-keys';
            
            // Create white keys first
            const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
            whiteNotes.forEach((note, index) => {
                const key = document.createElement('button');
                key.className = 'piano-key white-key';
                key.dataset.note = note;
                key.dataset.octave = octave;
                key.title = `${note}${octave} (${freqToPeriod(noteFreqs[note], octave)})`;
                
                // Add note label
                const noteLabel = document.createElement('span');
                noteLabel.className = 'key-label';
                noteLabel.textContent = note;
                key.appendChild(noteLabel);
                
                key.addEventListener('click', () => {
                    const period = freqToPeriod(noteFreqs[note], octave);
                    const currentChannel = getCurrentChannel();
                    const currentPos = currentChannel.cursorPosition || 0;
                    
                    addNoteAtPosition(period, currentPos);
                    
                    // Move cursor and sync if needed
                    currentChannel.cursorPosition = currentPos + 1;
                    if (syncChannels) {
                        syncCursorPositions(currentChannel.cursorPosition);
                    }
                    updatePositionAndDisplay(currentChannel.cursorPosition);
                });

                key.addEventListener('mouseenter', () => {
                    if (previewNotesCheckbox && previewNotesCheckbox.checked) {
                        const period = freqToPeriod(noteFreqs[note], octave);
                        const previewFrame = new EffectFrame({
                            t: true,
                            n: false,
                            tone: period,
                            noise: 0,
                            volume: 8,
                        });
                        playNote(previewFrame, 0.2, activeChannel);
                    }
                });
                
                keysContainer.appendChild(key);
            });
            
            // Create black keys (sharps/flats) positioned over white keys
            const blackNotes = [
                { note: 'C#', position: 0.5 },
                { note: 'D#', position: 1.5 },
                { note: 'F#', position: 3.5 },
                { note: 'G#', position: 4.5 },
                { note: 'A#', position: 5.5 }
            ];
            
                            blackNotes.forEach(({ note, position }) => {
                const key = document.createElement('button');
                key.className = 'piano-key black-key';
                key.dataset.note = note;
                key.dataset.octave = octave;
                key.style.left = `${(position * 100/7)}%`;
                key.title = `${note}${octave} (${freqToPeriod(noteFreqs[note], octave)})`;
                
                // Add note label
                const noteLabel = document.createElement('span');
                noteLabel.className = 'key-label';
                noteLabel.textContent = note;
                key.appendChild(noteLabel);
                
                key.addEventListener('click', () => {
                    const period = freqToPeriod(noteFreqs[note], octave);
                    const currentChannel = getCurrentChannel();
                    const currentPos = currentChannel.cursorPosition || 0;
                    
                    addNoteAtPosition(period, currentPos);
                    
                    // Move cursor and sync if needed
                    currentChannel.cursorPosition = currentPos + 1;
                    if (syncChannels) {
                        syncCursorPositions(currentChannel.cursorPosition);
                    }
                    updatePositionAndDisplay(currentChannel.cursorPosition);
                });

                key.addEventListener('mouseenter', () => {
                    if (previewNotesCheckbox && previewNotesCheckbox.checked) {
                        const period = freqToPeriod(noteFreqs[note], octave);
                        const previewFrame = new EffectFrame({
                            t: true,
                            n: false,
                            tone: period,
                            noise: 0,
                            volume: 8,
                        });
                        playNote(previewFrame, 0.2, activeChannel);
                    }
                });
                
                keysContainer.appendChild(key);
            });
            
            pianoDiv.appendChild(keysContainer);
            noteKeyboardContainer.appendChild(pianoDiv);
        });
    }
    
    function renderEffect() {
        if (!effectTableBody) return;
        
        // Clear current table
        effectTableBody.innerHTML = '';
        
        // Render frames with proper input elements
        for(let i = 0; i < 255; i++) {
            emptyBanks.delete(i);
            const frame = currentEffect.frames.get(i);
            const row = document.createElement('tr');
            row.dataset.frame = i;
            row.tabIndex = 0;
            
            if (frame) {
                row.dataset.volume = frame.volume;
                row.innerHTML = `
                    <td class="pos">${pad(i, 3)}</td>
                    <td class="bool"><input type="checkbox" name="t" ${frame.t ? 'checked' : ''}><label class="t"></label></td>
                    <td class="bool"><input type="checkbox" name="n" ${frame.n ? 'checked' : ''}><label class="n"></label></td>
                    <td><input type="text" name="tone" value="${padHex(frame.tone, 3)}" size="3"></td>
                    <td><input type="text" name="noise" value="${padHex(frame.noise, 2)}" size="2"></td>
                    <td><input type="text" name="volume" value="${padHex(frame.volume, 1)}" size="1"></td>
                    <td><span class="bar" data-name="tone"><input type="range" name="tone" min="0" max="4095" value="${frame.tone}"><label style="--width: ${getToneBarPosition(frame.tone)}%"></label></span></td>
                    <td><span class="bar" data-name="noise"><input type="range" name="noise" min="0" max="31" value="${frame.noise}"><label style="--width: ${(100/31)*frame.noise}%"></label></span></td>
                    <td><span class="bar" data-name="volume"><input type="range" name="volume" min="0" max="15" value="${frame.volume}"><label style="--width: ${(100/15)*frame.volume}%"></label></span></td>
                `;
            } else {
                if (emptyBanks.has(i)) {
                    continue;
                }
                emptyBanks.add(i);
                row.dataset.volume = 0;
                row.innerHTML = `
                    <td class="pos">${pad(i, 3)}</td>
                    <td class="bool"><input type="checkbox" name="t"><label class="t"></label></td>
                    <td class="bool"><input type="checkbox" name="n"><label class="n"></label></td>
                    <td><input type="text" name="tone" value="000" size="3"></td>
                    <td><input type="text" name="noise" value="00" size="2"></td>
                    <td><input type="text" name="volume" value="0" size="1"></td>
                    <td><span class="bar" data-name="tone"><input type="range" name="tone" min="0" max="4095" value="0"><label></label></span></td>
                    <td><span class="bar" data-name="noise"><input type="range" name="noise" min="0" max="31" value="0"><label></label></span></td>
                    <td><span class="bar" data-name="volume"><input type="range" name="volume" min="0" max="15" value="0"><label></label></span></td>
                `;
            }
            effectTableBody.appendChild(row);
        }
    }

    // --- FRAME EDITING ---
    function handleCheckboxUpdate(event) {
        const target = event.target;
        const root = target.closest('tr');
        const currentEffect = getCurrentEffect();
        const frame = currentEffect.get(parseInt(root.dataset.frame, 10));
        const name = target.name;

        if (target.type === 'checkbox') {
            frame[name] = target.checked;
        }
    }

    function handleRangeAdjust(event) {
        const target = event.target;
        const root = target.closest('tr');
        const currentEffect = getCurrentEffect();
        const frame = currentEffect.get(parseInt(root.dataset.frame, 10));
        const name = target.name;

        if (target.type !== 'text' && target.type !== 'range') return;

        const bar = root.querySelector(`.bar[data-name="${name}"]`);
        const text = root.querySelector(`input[name="${name}"][type="text"]`);
        const range = root.querySelector(`input[name="${name}"][type="range"]`);
        const maxLength = maxForInput(name);
        const actualMax = getActualMax(name);
        let value = parseInt(target.value, 10);

        if (target.type === 'text') {
            value = parseInt('0x' + target.value.slice(-maxLength), 16);
            if (range) range.value = value;
        }

        if (name === 'volume') {
            root.dataset.volume = value;
        }

        if (isNaN(value)) value = 0;
        if (value > actualMax) value = actualMax;
        if (value < 0) value = 0;
        
        text.value = value.toString(16).padStart(maxLength, '0').toUpperCase();
        frame[name] = value;

        // Handle the bar change
        if (bar) {
            bar.dataset.value = value;
            let p;
            if (name === 'tone') {
                p = getToneBarPosition(value);
            } else {
                p = (100 / actualMax) * value;
            }
            const label = bar.querySelector('label');
            if (label) {
                label.style.setProperty('--width', `${p}%`);
            }
        }
    }

    // --- ROW SELECTION SYSTEM ---
    let selectedRows = new Set();
    let selectionStart = null;
    let isSelecting = false;
    let lastFocusedRow = null; // Store the last focused row for piano insertion
    let nextInsertPosition = null; // Track where the next note should go for sequential playing

    function clearSelection() {
        selectedRows.clear();
        updateSelectionDisplay();
    }

    function updateSelectionDisplay() {
        // Clear all selections in all channels
        Object.values(channelTables).forEach(channelTable => {
            if (channelTable.body) {
                const allRows = channelTable.body.querySelectorAll('tr[data-frame]');
                allRows.forEach(row => {
                    row.classList.remove('selected');
                    row.classList.remove('cursor-position');
                });
            }
        });

        // Apply selection to selected rows in active channel
        const activeTableBody = channelTables[activeChannel]?.body;
        if (activeTableBody) {
            selectedRows.forEach(frameIndex => {
                const row = activeTableBody.querySelector(`tr[data-frame="${frameIndex}"]`);
                if (row) {
                    row.classList.add('selected');
                }
            });
            
            // Show cursor position
            const currentChannel = getCurrentChannel();
            const cursorRow = activeTableBody.querySelector(`tr[data-frame="${currentChannel.cursorPosition}"]`);
            if (cursorRow) {
                cursorRow.classList.add('cursor-position');
            }
        }
    }

    function selectRow(frameIndex, extend = false) {
        if (!extend) {
            selectedRows.clear();
        }
        selectedRows.add(frameIndex);
        updateSelectionDisplay();
        
        // Update cursor position for keyboard note entry
        currentCursorPosition = frameIndex;
        lastFocusedRow = frameIndex; // Keep these in sync
    }

    function selectRange(startIndex, endIndex) {
        const start = Math.min(startIndex, endIndex);
        const end = Math.max(startIndex, endIndex);
        
        selectedRows.clear();
        for (let i = start; i <= end; i++) {
            selectedRows.add(i);
        }
        updateSelectionDisplay();
    }

    function getSelection() {
        return Array.from(selectedRows).sort((a, b) => a - b);
    }

    // --- ACTIONS ---
    function setFrameAtPosition(index, frame) {
        // Helper function to set a frame at a specific position
        const existingFrame = currentEffect.get(index);
        if (existingFrame) {
            // Frame exists, replace its values
            existingFrame.t = frame.t;
            existingFrame.n = frame.n;
            existingFrame.tone = frame.tone;
            existingFrame.noise = frame.noise;
            existingFrame.volume = frame.volume;
        } else {
            // Frame doesn't exist, we need to extend the effect to this position
            while (currentEffect.length <= index) {
                // Add empty frames up to the desired position
                const emptyFrame = new EffectFrame({
                    t: false,
                    n: false,
                    tone: 0,
                    noise: 0,
                    volume: 0,
                });
                currentEffect.push(emptyFrame);
            }
            // Now set the frame at the desired position
            const targetFrame = currentEffect.get(index);
            targetFrame.t = frame.t;
            targetFrame.n = frame.n;
            targetFrame.tone = frame.tone;
            targetFrame.noise = frame.noise;
            targetFrame.volume = frame.volume;
        }
    }

    function addNoteToEffect(period) {
        const frame = new EffectFrame({
            t: true,
            n: false,
            tone: period,
            noise: 0,
            volume: 10,
        });

        // Check if the effect is empty or has only silent frames
        const isEffectEmpty = currentEffect.length === 0;
        const hasOnlySilentFrames = currentEffect.length === 1 && 
            currentEffect.get(0) && 
            currentEffect.get(0).volume === 0 && 
            currentEffect.get(0).tone === 0 && 
            currentEffect.get(0).noise === 0;

        let insertIndex;
        
        if (isEffectEmpty || hasOnlySilentFrames) {
            console.log('Effect is empty, inserting at start');
            currentEffect.clear();
            currentEffect.push(frame);
            insertIndex = 0;
        } else {
            // Insert at selected position, focused row, or at end
            const selection = getSelection();
            const focused = document.activeElement;
            
            console.log('Selection:', selection);
            console.log('Focused element:', focused);
            console.log('Focused element tagName:', focused?.tagName);
            console.log('Focused element dataset:', focused?.dataset);
            
            if (selection.length > 0) {
                // Use selection if available
                insertIndex = Math.min(...selection);
                console.log('Using selection, setting at:', insertIndex);
                setFrameAtPosition(insertIndex, frame);
                nextInsertPosition = insertIndex + 1; // Next note goes to next position
            } else if (nextInsertPosition !== null && nextInsertPosition < 255) {
                // Continue sequential playing from last position
                insertIndex = nextInsertPosition;
                console.log('Continuing sequence, setting at:', insertIndex);
                setFrameAtPosition(insertIndex, frame);
                nextInsertPosition = insertIndex + 1;
            } else if (focused && focused.tagName === 'TR' && focused.dataset.frame) {
                // Use focused row if no selection
                insertIndex = parseInt(focused.dataset.frame, 10);
                console.log('Using focused row, setting at:', insertIndex);
                setFrameAtPosition(insertIndex, frame);
                nextInsertPosition = insertIndex + 1;
            } else if (lastFocusedRow !== null) {
                // Use last focused row if no current focus
                insertIndex = lastFocusedRow;
                console.log('Using last focused row, setting at:', insertIndex);
                setFrameAtPosition(insertIndex, frame);
                nextInsertPosition = insertIndex + 1;
            } else {
                // Default to end
                insertIndex = currentEffect.length;
                console.log('No selection or focus, adding at end:', insertIndex);
                currentEffect.push(frame);
                nextInsertPosition = insertIndex + 1;
            }
        }
        
        renderEffect();
        
        // Update position and display using unified function
        updatePositionAndDisplay(insertIndex);
        
        // Brief highlight for visual feedback
        // setTimeout(() => {
        //     const newRow = effectTableBody.querySelector(`tr[data-frame="${insertIndex}"]`);
        //     if (newRow) {
        //         newRow.style.backgroundColor = 'var(--vscode-list-focusBackground)';
        //         setTimeout(() => {
        //             newRow.style.backgroundColor = '';
        //         }, 1000);
        //     }
        // }, 100);
        
        // Play just the single note for immediate feedback
        playNote(frame, 0.4);
    }

    function download() {
        vscode.postMessage({
            command: 'saveDialog',
            defaultName: 'untitled.afb',
            data: bank.export() // Send raw Uint8Array instead of Array
        });
    }

    function copyEffect() {
        const effect = currentEffect;
        copyBank.effect.clear();
        for (let i = 0; i < effect.length; i++) {
            copyBank.effect.push(effect.get(i));
        }
        navigator.clipboard.writeText(copyBank.effect.export().join(','));
    }

    function saveEffect() {
        console.log('Save effect called');
        const defaultFilename = (currentEffect.name || pad(bank.selected, 3)) + '.wav';
        vscode.postMessage({
            command: 'promptSaveEffect',
            message: 'Save single effect (default is wave file, change extension to .afx for AYFX effect)',
            defaultFilename: defaultFilename
        });
    }

    function doSaveEffect(filename) {
        console.log('Filename entered:', filename);
        if (filename) {
            if (filename.endsWith('.afx')) {
                console.log('Saving as AYFX file');
                vscode.postMessage({
                    command: 'saveFile',
                    filename: filename,
                    data: Array.from(currentEffect.export()) // Convert to Array for JSON
                });
            } else {
                console.log('Saving as WAV file');
                vscode.postMessage({
                    command: 'saveFile',
                    filename: filename,
                    data: Array.from(currentEffect.play()) // Convert to Array for JSON
                });
            }
        }
    }

    function pasteEffect() {
        navigator.clipboard.readText().then(text => {
            try {
                const paste = Uint8Array.from(
                    text.split(',').map(val => parseInt(val.trim(), 10))
                );
                
                currentEffect.snapshot();
                currentEffect.load(paste);
                showEffect(currentEffect);
            } catch (error) {
                alert('Invalid clipboard data. Please copy an effect first.');
            }
        }).catch(() => {
            alert('Could not access clipboard. Use Ctrl/Cmd+V instead.');
        });
    }

    function clearEffect() {
        console.log('Clear effect called');
        doClearEffect();
    }

    function doClearEffect() {
        console.log('doClearEffect called - clearing current effect');
        
        // Get current effect safely
        const effectToClear = getCurrentEffect();
        if (!effectToClear) {
            console.error('No current effect to clear');
            return;
        }
        
        console.log('Current effect length before clear:', effectToClear.length);
        effectToClear.snapshot();
        effectToClear.clear();
        console.log('Current effect length after clear:', effectToClear.length);
        
        // Update currentEffect reference
        currentEffect = effectToClear;
        
        showEffect(effectToClear);
        clearSelection(); // Also clear any selection
        
        // Re-render the current channel
        renderChannelEffect(activeChannel);
        if (channelMode === 'single') {
            renderEffect();
        }
        
        console.log('Effect cleared and display updated');
    }

    function deleteEffect() {
        console.log('Delete effect called');
        doDeleteEffect();
    }

    function doDeleteEffect() {
        console.log('doDeleteEffect called - deleting effect from bank');
        console.log('Bank selected index before delete:', bank.selected);
        console.log('Total effects before delete:', bank.length);
        
        // Only delete if we have more than one effect
        if (bank.length <= 1) {
            console.log('Cannot delete - only one effect remaining');
            return;
        }
        
        bank.delete(bank.selected);
        console.log('Total effects after delete:', bank.length);
        
        // Update current effect reference
        currentEffect = bank.effect;
        
        // Update channel effects to reassign after deletion
        updateChannelEffects();
        
        // Get the new current effect safely
        const newCurrentEffect = getCurrentEffect();
        
        // Safely check effect length
        const effectLength = newCurrentEffect ? newCurrentEffect.length : 0;
        console.log('New current effect length:', effectLength);
        
        updateTotals();
        
        if (newCurrentEffect) {
            showEffect(newCurrentEffect);
            // Re-render the current channel
            renderChannelEffect(activeChannel);
            if (channelMode === 'single') {
                renderEffect();
            }
        }
        
        console.log('Effect deleted and display updated');
    }

    function insertEffect() {
        console.log('Insert effect called');
        bank.add();
        currentEffect = bank.effect;
        updateTotals();
        showEffect(currentEffect);
    }

    function insertBlankSample() {
        console.log(`Inserting blank at cursor position ${currentCursorPosition}, current effect length: ${currentEffect.length}`);
        
        const frame = new EffectFrame({
            t: false,
            n: false,
            tone: 0,
            noise: 0,
            volume: 0,
        });

        currentEffect.snapshot();
        
        // Insert blank at current cursor position
        addNoteAtPosition(0, currentCursorPosition); // Use existing logic but with no sound
        
        // Update the frame to be truly blank (no tone)
        const blankFrame = currentEffect.get(currentCursorPosition);
        blankFrame.t = false;
        blankFrame.n = false;
        blankFrame.tone = 0;
        blankFrame.noise = 0;
        blankFrame.volume = 0;
        
        // Move cursor to next position
        currentCursorPosition++;
        
        renderEffect();
        
        // Update position and display using unified function
        updatePositionAndDisplay(currentCursorPosition);
        
        console.log(`Blank inserted, cursor now at position ${currentCursorPosition}, effect length: ${currentEffect.length}`);
    }

    // --- MOUSE TRACKING FOR BARS, CHECKBOXES, AND TEXT INPUTS ---
    let isDragging = false;
    let dragType = null; // 'bar', 'checkbox', 'textinput'
    let dragState = null; // for checkboxes: true/false state to apply
    let dragStarted = false; // Track if we've actually started dragging
    let dragStartPos = { x: 0, y: 0 };
    let dragThreshold = 3; // Minimum pixels to move before starting drag
    let dragStartValue = null; // Store initial value for text input dragging
    let dragSensitivity = 2; // Pixels per value unit for text input dragging (higher = less sensitive)
    let draggedInput = null; // Store the input being dragged

    const updateBarValue = (bar, clientX) => {
        const rect = bar.getBoundingClientRect();
        const layerX = clientX - rect.left;
        const name = bar.dataset.name;
        const actualMax = getActualMax(name);
        
        let value;
        if (name === 'tone') {
            // Use the exact original C++ approach: WidthToPeriod(pixel_offset)
            if (toneLogarithmic) {
                // Original C++: return (int)float(8.*exp(float(1+wdt)/(float(tone_wdt)/log(4095./8.))));
                const logBase = Math.log(4095.0 / 8.0);
                const scaledWidth = (1 + layerX) / (rect.width / logBase);
                value = Math.floor(8.0 * Math.exp(scaledWidth));
            } else {
                // Original C++: return wdt*4096/tone_wdt;
                value = Math.floor(layerX * 4096 / rect.width);
            }
            value = Math.max(0, Math.min(value, actualMax));
        } else {
            // Linear mode for noise and volume bars
            const p = Math.max(0, Math.min(1, layerX / rect.width));
            value = Math.round(p * actualMax);
        }
        
        const input = bar.querySelector('input[type="range"]');
        if (input) {
            input.value = value;
            handleRangeAdjust({ target: input });
        }
    };

    const updateCheckboxValue = (checkbox, state) => {
        if (checkbox.checked !== state) {
            checkbox.checked = state;
            handleCheckboxUpdate({ target: checkbox });
        }
    };

    const updateTextInputValue = (input, deltaY) => {
        const name = input.name;
        const actualMax = getActualMax(name);
        const currentValue = parseInt('0x' + input.value, 16) || 0;
        
        // Adjust sensitivity based on field type - volume is more sensitive than tone
        let sensitivity = dragSensitivity;
        if (name === 'volume') sensitivity = 1; // More sensitive for volume (0-15)
        if (name === 'noise') sensitivity = 1.5; // Medium sensitivity for noise (0-31)
        if (name === 'tone') sensitivity = 3; // Less sensitive for tone (0-4095)
        
        // Calculate new value based on mouse movement (negative deltaY = up = increase)
        const valueChange = Math.round(-deltaY / sensitivity);
        let newValue = dragStartValue + valueChange;
        
        // Clamp to valid range
        newValue = Math.max(0, Math.min(newValue, actualMax));
        
        // Update the input if value changed
        if (newValue !== currentValue) {
            const maxLength = maxForInput(name);
            input.value = newValue.toString(16).padStart(maxLength, '0').toUpperCase();
            handleRangeAdjust({ target: input });
            
            // Visual feedback
            input.style.cursor = 'ns-resize';
            input.style.backgroundColor = 'var(--vscode-inputValidation-infoBorder)';
            
            // Clear the visual feedback after a short delay
            setTimeout(() => {
                if (input.style.backgroundColor === 'var(--vscode-inputValidation-infoBorder)') {
                    input.style.backgroundColor = '';
                }
            }, 100);
        }
    };

    // Cache row elements to avoid repeated DOM queries
    let cachedRows = [];
    const updateRowCache = () => {
        // Use active channel's table body
        const activeTableBody = channelTables[activeChannel]?.body || effectTableBody;
        cachedRows = Array.from(activeTableBody.querySelectorAll('tr[data-frame]')).map(row => ({
            element: row,
            rect: row.getBoundingClientRect(),
            frameIndex: parseInt(row.dataset.frame, 10)
        }));
    };

    const findRowAtY = (y) => {
        for (const rowData of cachedRows) {
            if (y >= rowData.rect.top && y <= rowData.rect.bottom) {
                return rowData.element;
            }
        }
        return null;
    };

    const handleMouseMove = (event) => {
        if (!isDragging) return;
        
        // Check if we should start actual dragging
        if (!dragStarted) {
            const deltaX = Math.abs(event.clientX - dragStartPos.x);
            const deltaY = Math.abs(event.clientY - dragStartPos.y);
            
            if (deltaX > dragThreshold || deltaY > dragThreshold) {
                dragStarted = true;
                updateRowCache(); // Cache rows when dragging starts
                getCurrentEffect().snapshot(); // Only snapshot when actual dragging starts
            } else {
                return; // Don't start dragging until threshold is met
            }
        }
        
        if (dragType === 'textinput' && draggedInput) {
            // For text input dragging, use the stored input element
            const deltaY = event.clientY - dragStartPos.y;
            updateTextInputValue(draggedInput, deltaY);
        } else {
            const targetRow = findRowAtY(event.clientY);
            
            if (targetRow) {
                if (dragType === 'bar' && startState.filter) {
                    const bar = targetRow.querySelector(`.bar[data-name="${startState.filter}"]`);
                    if (bar) {
                        updateBarValue(bar, event.clientX);
                    }
                } else if (dragType === 'checkbox' && startState.filter) {
                    const checkbox = targetRow.querySelector(`input[name="${startState.filter}"][type="checkbox"]`);
                    if (checkbox) {
                        updateCheckboxValue(checkbox, dragState);
                    }
                }
            }
        }
        
        event.preventDefault();
    };

    const handleMouseUp = (event) => {
        if (isDragging) {
            // If we never started actual dragging, allow normal click behavior
            if (!dragStarted && event) {
                // This was just a click, not a drag
                const target = event.target;
                if (target.type === 'checkbox' && (target.name === 't' || target.name === 'n')) {
                    // Allow normal checkbox click behavior
                    getCurrentEffect().snapshot();
                    // The checkbox state has already been toggled by the browser
                    handleCheckboxUpdate({ target });
                } else if (target.type === 'text' && (target.name === 'tone' || target.name === 'noise' || target.name === 'volume')) {
                    // Allow normal text input behavior for simple clicks
                    target.focus();
                    target.select(); // Select all text for easy editing
                }
            }

            // Reset dragging visual feedback
            if (draggedInput) {
                draggedInput.style.cursor = '';
                draggedInput = null;
            }
            
            isDragging = false;
            dragType = null;
            dragState = null;
            dragStarted = false;
            dragStartValue = null;
            startState = { checked: null, filter: null };
            cachedRows = [];
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
    };

    const handleMouseDown = (event) => {
        let target = event.target;
        
        // Auto-switch to the channel we're interacting with
        const channelPanel = target.closest('[data-channel]');
        if (channelPanel) {
            const channelId = channelPanel.dataset.channel;
            if (channelId && channelId !== activeChannel) {
                setActiveChannel(channelId);
            }
        }
        
        // Check if we clicked on a range input or its parent bar
        if (target.type === 'range') {
            target = target.parentNode; // Get the .bar element
        }
        
        // Handle bar interactions
        if (target.classList.contains('bar')) {
            const name = target.dataset.name;
            
            isDragging = true;
            dragType = 'bar';
            dragStarted = true; // Bars start dragging immediately
            startState.filter = name;
            dragStartPos = { x: event.clientX, y: event.clientY };
            
            getCurrentEffect().snapshot();
            updateRowCache();
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            updateBarValue(target, event.clientX);
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        
        // Handle text input interactions (tone, noise, volume columns)
        if (target.type === 'text' && (target.name === 'tone' || target.name === 'noise' || target.name === 'volume')) {
            const name = target.name;
            
            isDragging = true;
            dragType = 'textinput';
            dragStarted = false; // Don't start dragging until mouse moves
            startState.filter = name;
            dragStartValue = parseInt('0x' + target.value, 16) || 0;
            dragStartPos = { x: event.clientX, y: event.clientY };
            draggedInput = target; // Store reference to the input being dragged
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            // Don't prevent default initially - allow normal text selection for clicks
            event.stopPropagation();
            return;
        }

        // Handle checkbox interactions (T and N columns)
        if (target.type === 'checkbox' && (target.name === 't' || target.name === 'n')) {
            const name = target.name;
            
            isDragging = true;
            dragType = 'checkbox';
            dragStarted = false; // Don't start dragging until mouse moves
            startState.filter = name;
            dragState = !target.checked; // Toggle to opposite state
            dragStartPos = { x: event.clientX, y: event.clientY };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            // Don't prevent default - allow normal checkbox behavior for clicks
            event.stopPropagation();
            return;
        }
        
        // Handle row selection if clicking on position column or outside input elements
        if (target.tagName !== 'INPUT' && !target.closest('.bar')) {
            const row = target.closest('tr[data-frame]');
            if (row) {
                const frameIndex = parseInt(row.dataset.frame, 10);
                
                if (event.shiftKey && selectionStart !== null) {
                    // Shift+click: select range
                    selectRange(selectionStart, frameIndex);
                } else if (event.ctrlKey || event.metaKey) {
                    // Ctrl+click: toggle single row
                    if (selectedRows.has(frameIndex)) {
                        selectedRows.delete(frameIndex);
                    } else {
                        selectedRows.add(frameIndex);
                    }
                    updateSelectionDisplay();
                    selectionStart = frameIndex;
                } else {
                    // Normal click: select single row
                    selectRow(frameIndex);
                    selectionStart = frameIndex;
                }

                // Update position and display using unified function
                updatePositionAndDisplay(frameIndex, false, false); // Don't scroll or select again since we already did
                nextInsertPosition = null; // Reset sequence when clicking a new row
                
                event.preventDefault();
                return;
            }
        }
    };

    // Mouse wheel handler for text inputs
    const handleMouseWheel = (event) => {
        const target = event.target;
        
        // Only handle wheel events on text inputs for tone, noise, volume
        if (target.type === 'text' && (target.name === 'tone' || target.name === 'noise' || target.name === 'volume')) {
            event.preventDefault();
            
            const name = target.name;
            const actualMax = getActualMax(name);
            const currentValue = parseInt('0x' + target.value, 16) || 0;
            
            // Determine direction: negative deltaY = scroll up = increase value
            const direction = event.deltaY < 0 ? 1 : -1;
            let newValue = currentValue + direction;
            
            // Clamp to valid range
            newValue = Math.max(0, Math.min(newValue, actualMax));
            
            // Update the input
            if (newValue !== currentValue) {
                getCurrentEffect().snapshot();
                const maxLength = maxForInput(name);
                target.value = newValue.toString(16).padStart(maxLength, '0').toUpperCase();
                handleRangeAdjust({ target });
            }
        }
    };

    // Set up mouse tracking for all channel tables
    Object.values(channelTables).forEach(channelTable => {
        if (channelTable.table) {
            channelTable.table.addEventListener('mousedown', handleMouseDown);
            channelTable.table.addEventListener('input', handleRangeAdjust);
            channelTable.table.addEventListener('change', handleCheckboxUpdate);
            channelTable.table.addEventListener('update', handleCheckboxUpdate);
            channelTable.table.addEventListener('wheel', handleMouseWheel, { passive: false });
        }
    });

    // --- ROW SELECTION EVENT HANDLERS ---
    // Clear selection when clicking outside tables
    document.addEventListener('mousedown', (e) => {
        const isClickingInAnyTable = Object.values(channelTables).some(channelTable => 
            e.target.closest(`#${channelTable.table?.id}`)
        );
        if (!isClickingInAnyTable) {
            clearSelection();
        }
    });

    // Click handler is now handled by the enhanced mouse tracking system

    positionSelect.addEventListener('change', (e) => {
        const effectGroup = parseInt(e.target.value, 10);
        const channelCount = getChannelCount();
        const newBaseIndex = effectGroup * channelCount;
        navigateToEffect(newBaseIndex);
    });

    positionSelect.addEventListener('input', (e) => {
        const effectGroup = parseInt(e.target.value, 10);
        if (!isNaN(effectGroup)) {
            const channelCount = getChannelCount();
            const newBaseIndex = effectGroup * channelCount;
            navigateToEffect(newBaseIndex);
        }
    });

    nameEl.addEventListener('input', (e) => {
        currentEffect.name = e.target.value.trim();
    });

    // Copy event
    window.addEventListener('copy', (event) => {
        const selection = getSelection();
        if (selection.length === 0) return;
        
        const effect = currentEffect;
        copyBank.effect.clear();
        selection.forEach((id) => {
            const frame = effect.get(id);
            // Create a proper copy to avoid reference issues
            const frameCopy = new EffectFrame({
                t: frame.t,
                n: frame.n,
                volume: frame.volume,
                tone: frame.tone,
                noise: frame.noise
            });
            copyBank.effect.push(frameCopy);
        });
        event.clipboardData.setData('text/plain', copyBank.effect.export().join(','));
        event.preventDefault();
    });

    // Paste event
    document.documentElement.addEventListener('paste', async (event) => {
        const focused = document.activeElement;
        if (focused.tagName === 'INPUT') {
            return;
        }

        let insert = focused.tagName === 'TR';
        let paste = Uint8Array.from(
            (event.clipboardData || window.clipboardData)
                .getData('text')
                .split(',')
                .map((_) => parseInt(_, 10))
        );

        currentEffect.snapshot();

        if (insert) {
            const start = parseInt(focused.dataset.frame, 10);
            copyBank.effect.clear();
            copyBank.effect.load(paste);
            currentEffect.insertBefore(start, copyBank.effect.toArray());
        } else {
            currentEffect.load(paste);
        }

        showEffect(currentEffect);
        event.preventDefault();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Don't interfere with input fields - comprehensive check
        if (e.target.tagName === 'INPUT') {
            // Check for any input that should disable virtual keyboard
            if (e.target.type === 'text' || e.target.type === 'number' || 
                e.target.name === 'tone' || e.target.name === 'noise' || e.target.name === 'volume') {
                console.log('Keyboard event blocked: input field focused', e.target.tagName, e.target.type, e.target.name);
                e.stopPropagation(); // Prevent event bubbling
                return;
            }
        }
        
        // Also check if any parent element is an input field
        let currentElement = e.target;
        while (currentElement && currentElement !== document) {
            if (currentElement.tagName === 'INPUT' && 
                (currentElement.type === 'text' || currentElement.type === 'number' ||
                 currentElement.name === 'tone' || currentElement.name === 'noise' || currentElement.name === 'volume')) {
                console.log('Keyboard event blocked: nested in input field', currentElement);
                e.stopPropagation();
                return;
            }
            currentElement = currentElement.parentElement;
        }

        // Handle octave changes
        // if (e.key === 'PageUp') {
        //     e.preventDefault();
        //     if (currentOctave < 8) {
        //         currentOctave++;
        //         updateOctaveDisplay();
        //         console.log('Octave changed to:', currentOctave);
        //     }
        //     return;
        // }

        // if (e.key === 'PageDown') {
        //     e.preventDefault();
        //     if (currentOctave > 1) {
        //         currentOctave--;
        //         updateOctaveDisplay();
        //         console.log('Octave changed to:', currentOctave);
        //     }
        //     return;
        // }

        // Handle F1 for help
        if (e.key === 'F1') {
            e.preventDefault();
            // Send message to VSCode to open help
            vscode.postMessage({
                command: 'showHelp',
                keyword: 'AYFX_EDITOR'
            });
            return;
        }

        // Handle keyboard note entry
        if (playKeyboardNote(e.key)) {
            e.preventDefault();
            return;
        }

        // Noise entry with 'N' key
        if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
            e.preventDefault();
            const currentChannel = getCurrentChannel();
            const currentPos = currentChannel.cursorPosition || 0;
            
            // Add noise frame
            const noiseFrame = new EffectFrame({
                t: false,
                n: true,
                tone: 0,
                noise: Math.floor(Math.random() * 32), // Random noise value 0-31
                volume: 10,
            });
            
            const currentEffect = getCurrentEffect();
            currentEffect.snapshot();
            
            // Extend effect if needed
            while (currentEffect.length <= currentPos) {
                const emptyFrame = new EffectFrame({
                    t: false,
                    n: false,
                    tone: 0,
                    noise: 0,
                    volume: 0,
                });
                currentEffect.push(emptyFrame);
            }
            
            // Set the noise frame at the position
            const targetFrame = currentEffect.get(currentPos);
            targetFrame.t = false;
            targetFrame.n = true;
            targetFrame.tone = 0;
            targetFrame.noise = noiseFrame.noise;
            targetFrame.volume = 10;
            
            // Move cursor and update display
            currentChannel.cursorPosition = currentPos + 1;
            if (syncChannels) {
                syncCursorPositions(currentChannel.cursorPosition);
            }
            
            renderChannelEffect(activeChannel);
            if (channelMode === 'single') {
                renderEffect();
            }
            
            updatePositionAndDisplay(currentChannel.cursorPosition);
            
            // Play noise feedback
            playNote(targetFrame, 0.5, activeChannel);
            
            console.log(`Noise added to channel ${activeChannel} at position ${currentPos}`);
            return;
        }

        if (e.key === 'Escape') {
            return stopAllAudio();
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            const selection = getSelection();
            if (selection.length) {
                currentEffect.snapshot();
                currentEffect.delete(selection[0], selection.length);
                clearSelection(); // Clear selection after deletion
                showEffect(currentEffect);
                return;
            }

            // Check if we're focused on a specific table row
            const focused = document.activeElement;
            if (focused.tagName === 'TR' && focused.dataset.frame) {
                const frameIndex = parseInt(focused.dataset.frame, 10);
                if (frameIndex >= 0 && frameIndex < currentEffect.length) {
                    currentEffect.snapshot();
                    currentEffect.delete(frameIndex, 1);
                    showEffect(currentEffect);
                    return;
                }
            }

            vscode.postMessage({
                command: 'confirm',
                message: 'Delete the current effect?',
                action: 'doDeleteEffect'
            });
        }

        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            bank.add();
            currentEffect = bank.effect;
            updateTotals();
            showEffect(currentEffect);
            return;
        }

        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            return play(currentEffect); // Always play full effect
        }

        if (e.key === 'D' || e.key === 'd') {
            e.preventDefault();
            download();
            return;
        }

        if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            currentEffect.undo();
            showEffect(currentEffect);
            return;
        }

        if (e.key === 'x' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            const selection = getSelection();
            if (selection.length === 0) return;
            
            // Copy to clipboard first
            const effect = currentEffect;
            copyBank.effect.clear();
            selection.forEach((id) => {
                const frame = effect.get(id);
                const frameCopy = new EffectFrame({
                    t: frame.t,
                    n: frame.n,
                    volume: frame.volume,
                    tone: frame.tone,
                    noise: frame.noise
                });
                copyBank.effect.push(frameCopy);
            });
            
            // Copy to system clipboard
            navigator.clipboard.writeText(copyBank.effect.export().join(','));
            
            // Then delete the selection
            currentEffect.snapshot();
            currentEffect.delete(selection[0], selection.length);
            showEffect(currentEffect);
            clearSelection();
            return;
        }

        if (e.key === '=' || e.key === '+') {
            e.preventDefault();
            const channelCount = getChannelCount();
            navigateToEffect(bank.selected + channelCount);
        }

        if (e.key === '-' || e.key === '_') {
            e.preventDefault();
            const channelCount = getChannelCount();
            navigateToEffect(bank.selected - channelCount);
        }

        if (e.key === 'Insert' || (e.key === 'i' && (e.ctrlKey || e.metaKey))) {
            e.preventDefault();
            insertBlankSample();
            return;
        }

        // Arrow key navigation for selection
        // if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        //     e.preventDefault();
        //     const selection = getSelection();
        //     if (selection.length === 0) return;
            
        //     const currentIndex = e.key === 'ArrowUp' ? Math.min(...selection) : Math.max(...selection);
        //     let newIndex = e.key === 'ArrowUp' ? currentIndex - 1 : currentIndex + 1;
            
        //     // Clamp to valid range
        //     newIndex = Math.max(0, Math.min(newIndex, currentEffect.length - 1));
            
        //     if (e.shiftKey) {
        //         // Extend selection
        //         if (selectionStart === null) selectionStart = currentIndex;
        //         selectRange(selectionStart, newIndex);
        //     } else {
        //         // Move selection
        //         selectRow(newIndex);
        //         selectionStart = newIndex;
        //     }
            
        //     // Update position and display using unified function
        //     updatePositionAndDisplay(newIndex);
        //     return;
        // }
    });

    // Button actions
    document.body.addEventListener('click', async (e) => {
        console.log('Click event detected on:', e.target);
        console.log('Target dataset:', e.target.dataset);
        if (!e.target.dataset.action) return;
        
        const action = e.target.dataset.action;
        console.log('Button action triggered:', action);

        if (action === 'save-effect') {
            return saveEffect();
        }

        if (action === 'download') {
            return download();
        }

        if (action === 'copy') {
            return copyEffect();
        }

        if (action === 'paste') {
            return pasteEffect();
        }

        if (action === 'clear') {
            return clearEffect();
        }

        if (action === 'delete-effect') {
            return deleteEffect();
        }

        if (action === 'insert-effect') {
            return insertEffect();
        }

        if (action === 'insert-blank') {
            return insertBlankSample();
        }

        if (action === 'stop') {
            return stop();
        }

        if (action === 'play') {
            return play(); // Use new multi-channel system
        }

        if (action === 'play-channel-a') {
            return playChannel('a');
        }

        if (action === 'play-channel-b') {
            return playChannel('b');
        }

        if (action === 'play-channel-c') {
            return playChannel('c');
        }

        if (action === 'import') {
            const collection = importCollection.value;
            if (collection === 'From PSG'){
                vscode.postMessage({
                    command: 'loadPSG'
                });
            }
            if (collection) {
                vscode.postMessage({
                    command: 'loadCollection',
                    collection: collection
                });
            }
        }
    });

    // Handle drag and drop
    document.documentElement.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    document.documentElement.addEventListener('drop', (e) => {
        e.preventDefault();
        vscode.postMessage({
            command: 'handleDrop',
            files: Array.from(e.dataTransfer.files).map(f => f.name)
        });
    });

    // Initialize bank hooks
    bank.hook((type) => {
        if (type === 'update-effects') {
            updateTotals();
        }
    });

    // Handle messages from VSCode
    window.addEventListener('message', event => {
        const message = event.data;
        
        switch (message.command) {
            case 'loadBank':
                console.log('📁 Loading new bank...');
                bank = new Bank(new Uint8Array(message.data));
                
                // Set up bank hooks
                bank.hook((type) => {
                    if (type === 'update-effects') {
                        updateTotals();
                    }
                });
                
                // Completely reinitialize the multi-channel system
                reinitializeAfterLoad();
                
                console.log('✅ Bank loaded successfully');
                break;
                
            case 'loadEffect':
                console.log('🎵 Loading single effect...');
                bank.addEffect(new Uint8Array(message.data), message.name || 'Imported');
                
                // Navigate to the newly added effect
                bank.selected = bank.length - 1;
                
                // Reinitialize the multi-channel system
                reinitializeAfterLoad();
                
                console.log('✅ Effect loaded successfully');
                break;
                
            case 'loadPSGData':
                console.log('🎛️ Loading PSG data...');
                handlePSGDataLoad(message.channelData, message.effectName, message.options);
                console.log('✅ PSG data loaded successfully');
                break;
                
            case 'confirmResult':
                if (message.confirmed && message.action) {
                    // Call the action function
                    if (message.action === 'doClearEffect') {
                        doClearEffect();
                    } else if (message.action === 'doDeleteEffect') {
                        doDeleteEffect();
                    }
                }
                break;
                
            case 'confirmationResult':
                if (message.confirmed && message.action) {
                    // Call the action function
                    if (message.action === 'doClearEffect') {
                        doClearEffect();
                    } else if (message.action === 'doDeleteEffect') {
                        doDeleteEffect();
                    }
                }
                break;
                
            case 'warningMessageResult':
                // Handle VSCode warning message responses
                if (message.selection && message.action) {
                    if (message.selection === 'Clear Effect' && message.action === 'doClearEffect') {
                        doClearEffect();
                    } else if (message.selection === 'Delete Effect' && message.action === 'doDeleteEffect') {
                        doDeleteEffect();
                    }
                }
                break;
                
            case 'promptResult':
                if (message.result && message.action === 'doSaveEffect') {
                    doSaveEffect(message.result);
                }
                break;
        }
    });

    // --- MULTI-CHANNEL EVENT HANDLERS ---
    
    // Channel mode radio buttons
    channelModeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                setChannelMode(e.target.value);
                console.log(`Channel mode changed to: ${e.target.value}`);
            }
        });
    });

    // Active channel selector
    if (activeChannelSelect) {
        activeChannelSelect.addEventListener('change', (e) => {
            setActiveChannel(e.target.value);
        });
    }

    // Sync channels checkbox
    if (syncChannelsCheckbox) {
        syncChannelsCheckbox.addEventListener('change', (e) => {
            syncChannels = e.target.checked;
            console.log(`Channel sync ${syncChannels ? 'enabled' : 'disabled'}`);
        });
    }

    // Combined playback checkbox
    if (combinedPlaybackCheckbox) {
        combinedPlaybackCheckbox.addEventListener('change', (e) => {
            combinedPlayback = e.target.checked;
            console.log(`Combined playback ${combinedPlayback ? 'enabled' : 'disabled'}`);
        });
    }

    // Tone logarithmic checkbox
    if (toneLogarithmicCheckbox) {
        toneLogarithmicCheckbox.addEventListener('change', (e) => {
            toneLogarithmic = e.target.checked;
            console.log(`Tone logarithmic scaling ${toneLogarithmic ? 'enabled' : 'disabled'}`);
            
            // Update all existing tone bars to reflect the new scaling mode
            updateAllToneBars();
        });
    }

    // Channel mute checkboxes
    channelMuteCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const channelId = e.target.dataset.channel;
            channelSettings[channelId].muted = e.target.checked;
            console.log(`Channel ${channelId} ${e.target.checked ? 'muted' : 'unmuted'}`);
        });
    });

    // Channel volume sliders
    channelVolumeSliders.forEach(slider => {
        slider.addEventListener('input', (e) => {
            const channelId = e.target.dataset.channel;
            channelSettings[channelId].volume = parseFloat(e.target.value);
            console.log(`Channel ${channelId} volume: ${e.target.value}`);
        });
    });

    // Enhanced keyboard shortcuts for multi-channel
    document.addEventListener('keydown', (e) => {
        // Don't interfere with input fields - comprehensive check
        if (e.target.tagName === 'INPUT') {
            // Check for any input that should disable virtual keyboard
            if (e.target.type === 'text' || e.target.type === 'number' || 
                e.target.name === 'tone' || e.target.name === 'noise' || e.target.name === 'volume') {
                console.log('Multi-channel keyboard event blocked: input field focused', e.target.tagName, e.target.type, e.target.name);
                e.stopPropagation(); // Prevent event bubbling
                return;
            }
        }
        
        // Also check if any parent element is an input field
        let currentElement = e.target;
        while (currentElement && currentElement !== document) {
            if (currentElement.tagName === 'INPUT' && 
                (currentElement.type === 'text' || currentElement.type === 'number' ||
                 currentElement.name === 'tone' || currentElement.name === 'noise' || currentElement.name === 'volume')) {
                console.log('Multi-channel keyboard event blocked: nested in input field', currentElement);
                e.stopPropagation();
                return;
            }
            currentElement = currentElement.parentElement;
        }

        // Individual channel playback
        if (e.key === '1' || e.key === 'Space' || e.key === 'NumpadEnter') {
            e.preventDefault();
            playChannel('a');
            return;
        }

        // if (e.key === '2') {
        //     e.preventDefault();
        //     playChannel('b');
        //     return;
        // }

        // if (e.key === '3') {
        //     e.preventDefault();
        //     playChannel('c');
        //     return;
        // }

        // Tab to switch active channel
        // if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        //     e.preventDefault();
        //     const channelOrder = ['a', 'b', 'c'];
        //     const visibleChannels = getVisibleChannels();
        //     const currentIndex = visibleChannels.indexOf(activeChannel);
        //     const nextIndex = (currentIndex + 1) % visibleChannels.length;
        //     setActiveChannel(visibleChannels[nextIndex]);
        //     return;
        // }

        // Arrow key navigation and selection
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const currentChannel = getCurrentChannel();
            const currentEffect = getCurrentEffect();
            const currentPos = currentChannel.cursorPosition || 0;
            const direction = e.key === 'ArrowUp' ? -1 : 1;
            let newIndex = currentPos + direction;
            
            // Clamp to valid range
            newIndex = Math.max(0, Math.min(newIndex, Math.max(0, currentEffect.length - 1)));
            
            // Handle selection with Shift
            if (e.shiftKey) {
                const startIndex = selectedRows.size > 0 ? Math.min(...selectedRows) : currentPos;
                const endIndex = newIndex;
                selectRange(Math.min(startIndex, endIndex), Math.max(startIndex, endIndex));
            } else {
                clearSelection();
                selectRow(newIndex);
            }
            
            // Update cursor position and sync if needed
            currentChannel.cursorPosition = newIndex;
            if (syncChannels) {
                syncCursorPositions(newIndex);
            }
            updatePositionAndDisplay(newIndex);
            return;
        }
        if (e.key === 'ArrowLeft'){
            e.preventDefault();
            // decrease selected tone value 
            const currentChannel = getCurrentChannel();
            const currentEffect = getCurrentEffect();
            const currentPos = currentChannel.cursorPosition || 0;
            
            // Check if we have a valid position and frame
            if (currentPos < currentEffect.length) {
                const frame = currentEffect.get(currentPos);
                if (frame) {
                    currentEffect.snapshot(); // Take snapshot for undo
                    const newTone = Math.max(0, frame.tone - 1);
                    frame.tone = newTone;
                    
                    // Re-render the effect to show changes
                    renderChannelEffect(activeChannel);
                    if (channelMode === 'single') {
                        renderEffect();
                    }
                    
                    console.log(`Tone decreased to ${newTone} at position ${currentPos}`);
                }
            }
            return; 
        }
        if (e.key === 'ArrowRight'){
            e.preventDefault();
            // increase selected tone value 
            const currentChannel = getCurrentChannel();
            const currentEffect = getCurrentEffect();
            const currentPos = currentChannel.cursorPosition || 0;
            
            // Check if we have a valid position and frame
            if (currentPos < currentEffect.length) {
                const frame = currentEffect.get(currentPos);
                if (frame) {
                    currentEffect.snapshot(); // Take snapshot for undo
                    const newTone = Math.min(4095, frame.tone + 1); // Clamp to max tone value
                    frame.tone = newTone;
                    
                    // Re-render the effect to show changes
                    renderChannelEffect(activeChannel);
                    if (channelMode === 'single') {
                        renderEffect();
                    }
                    
                    console.log(`Tone increased to ${newTone} at position ${currentPos}`);
                }
            }
            return;
        }

        // Page Up/Down for octave changes
        if (e.key === 'PageUp') {
            e.preventDefault();
            currentOctave = Math.min(6, currentOctave + 1);
            updateOctaveDisplay();
            return;
        }

        if (e.key === 'PageDown') {
            e.preventDefault();
            currentOctave = Math.max(2, currentOctave - 1);
            updateOctaveDisplay();
            return;
        }

        // Home/End navigation
        if (e.key === 'Home') {
            e.preventDefault();
            const currentChannel = getCurrentChannel();
            currentChannel.cursorPosition = 0;
            if (syncChannels) {
                syncCursorPositions(0);
            }
            updatePositionAndDisplay(0);
            return;
        }

        if (e.key === 'End') {
            e.preventDefault();
            const currentChannel = getCurrentChannel();
            const currentEffect = getCurrentEffect();
            const lastPos = Math.max(0, currentEffect.length - 1);
            currentChannel.cursorPosition = lastPos;
            if (syncChannels) {
                syncCursorPositions(lastPos);
            }
            updatePositionAndDisplay(lastPos);
            return;
        }
    });

    // Update functions to work with multi-channel system
    function updateMultiChannelEffect(channelId, effect) {
        channels[channelId].effect = effect;
        if (getVisibleChannels().includes(channelId)) {
            renderChannelEffect(channelId);
        }
    }

    // Add click handlers for multi-channel tables
    Object.keys(channelTables).forEach(channelId => {
        const table = channelTables[channelId].table;
        if (table) {
            table.addEventListener('click', (e) => {
                const row = e.target.closest('tr[data-frame]');
                if (row) {
                    const frameIndex = parseInt(row.dataset.frame, 10);
                    const currentChannelId = row.closest('[data-channel]')?.dataset.channel;
                    
                    if (currentChannelId) {
                        // Switch to this channel if it's not active
                        if (currentChannelId !== activeChannel) {
                            setActiveChannel(currentChannelId);
                        }
                        
                        // Handle selection
                        if (e.shiftKey && selectedRows.size > 0) {
                            // Range selection
                            const startIndex = Math.min(...selectedRows);
                            const endIndex = frameIndex;
                            selectRange(Math.min(startIndex, endIndex), Math.max(startIndex, endIndex));
                        } else if (e.ctrlKey || e.metaKey) {
                            // Multi-selection
                            if (selectedRows.has(frameIndex)) {
                                selectedRows.delete(frameIndex);
                            } else {
                                selectedRows.add(frameIndex);
                            }
                            updateSelectionDisplay();
                        } else {
                            // Single selection
                            clearSelection();
                            selectRow(frameIndex);
                        }
                        
                        // Update cursor position
                        const currentChannel = getCurrentChannel();
                        currentChannel.cursorPosition = frameIndex;
                        if (syncChannels) {
                            syncCursorPositions(frameIndex);
                        }
                        updatePositionAndDisplay(frameIndex, false, false); // Don't scroll or select again
                    }
                }
            });
        }
    });

    // Override legacy functions to work with active channel
    const originalAddNoteAtPosition = addNoteAtPosition;
    addNoteAtPosition = function(period, position) {
        const currentChannel = getCurrentChannel();
        const currentEffect = getCurrentEffect();
        
        console.log(`Adding note to channel ${activeChannel} at position ${position}`);
        
        const frame = new EffectFrame({
            t: true,
            n: false,
            tone: period,
            noise: 0,
            volume: 10,
        });

        currentEffect.snapshot();
        
        // Extend effect if needed
        while (currentEffect.length <= position) {
            const emptyFrame = new EffectFrame({
                t: false,
                n: false,
                tone: 0,
                noise: 0,
                volume: 0,
            });
            currentEffect.push(emptyFrame);
        }
        
        // Set the frame at the position
        const targetFrame = currentEffect.get(position);
        targetFrame.t = frame.t;
        targetFrame.n = frame.n;
        targetFrame.tone = frame.tone;
        targetFrame.noise = frame.noise;
        targetFrame.volume = frame.volume;
        
        // Update cursor position
        currentChannel.cursorPosition = position;
        if (syncChannels) {
            syncCursorPositions(position);
        }
        
        // Re-render the active channel
        renderChannelEffect(activeChannel);
        
        // Play the note for feedback on the active channel
        playNote(frame, 0.5, activeChannel);
        
        console.log(`Note added to channel ${activeChannel}, new effect length: ${currentEffect.length}`);
    };

    // --- TESTING FUNCTIONS FOR MULTI-CHANNEL ---
    function addTestEffect(channelId, testType = 'basic') {
        const channel = channels[channelId];
        const effect = channel.effect;
        
        effect.clear(); // Clear existing
        
        switch (testType) {
            case 'basic':
                // Add a simple tone sweep
                for (let i = 0; i < 16; i++) {
                    const frame = new EffectFrame({
                        t: true,
                        n: false,
                        tone: 200 + (i * 50), // Rising tone
                        noise: 0,
                        volume: Math.max(1, 15 - i), // Descending volume
                    });
                    effect.push(frame);
                }
                break;
                
            case 'chord':
                // Add a chord progression
                const chordTones = channelId === 'a' ? [400, 500, 600] : 
                                  channelId === 'b' ? [320, 400, 480] : 
                                  [240, 300, 360];
                for (let i = 0; i < 12; i++) {
                    const toneIndex = Math.floor(i / 4);
                    const frame = new EffectFrame({
                        t: true,
                        n: false,
                        tone: chordTones[toneIndex] || 400,
                        noise: 0,
                        volume: 12,
                    });
                    effect.push(frame);
                }
                break;
        }
        
        renderChannelEffect(channelId);
        console.log(`Added test effect '${testType}' to channel ${channelId}`);
    }

    // Add testing capabilities
    window.addTestEffects = function() {
        addTestEffect('a', 'basic');
        addTestEffect('b', 'chord');
        addTestEffect('c', 'basic');
        console.log('Test effects added to all channels');
    };

    window.testMultiChannelPlayback = function() {
        setChannelMode('triple');
        combinedPlayback = true;
        addTestEffects();
        setTimeout(() => playAllChannels(), 500);
        console.log('Testing multi-channel playback');
    };

    // --- INITIALIZATION ---
    
    // Enhance selection visibility with better CSS
    const style = document.createElement('style');
    style.textContent = `
        .effect-table tr.selected {
            background-color: var(--vscode-list-activeSelectionBackground) !important;
            color: var(--vscode-list-activeSelectionForeground) !important;
            border: 1px solid var(--vscode-list-focusOutline) !important;
        }
        .effect-table tr.cursor-position {
            outline: 2px solid var(--vscode-focusBorder) !important;
            outline-offset: -1px;
        }
        .effect-table tr:focus {
            background-color: var(--vscode-list-focusBackground) !important;
            outline: 1px solid var(--vscode-focusBorder) !important;
        }
        .channel-panel.active {
            border-color: var(--vscode-focusBorder) !important;
            box-shadow: 0 0 4px var(--vscode-focusBorder) !important;
        }
        
        /* Text input drag enhancements */
        .effect-table input[type="text"][name="tone"],
        .effect-table input[type="text"][name="noise"],
        .effect-table input[type="text"][name="volume"] {
            transition: background-color 0.1s ease;
        }
        
        .effect-table input[type="text"][name="tone"]:hover,
        .effect-table input[type="text"][name="noise"]:hover,
        .effect-table input[type="text"][name="volume"]:hover {
            cursor: ns-resize;
            background-color: var(--vscode-input-background);
            border-color: var(--vscode-inputOption-activeBorder);
        }
        
        .effect-table input[type="text"][name="tone"]:active,
        .effect-table input[type="text"][name="noise"]:active,
        .effect-table input[type="text"][name="volume"]:active {
            cursor: ns-resize;
        }
    `;
    document.head.appendChild(style);
    
    updateTotals();
    createNoteKeyboard();
    
    // Initialize multi-channel system
    setChannelMode('single'); // Start in single channel mode
    setActiveChannel('a'); // Set channel A as active
    
    // Initialize all channels with consecutive effects
    updateChannelEffects();
    Object.keys(channels).forEach(channelId => {
        renderChannelEffect(channelId);
    });
    
    showEffect(currentEffect);
    updateOctaveDisplay();
    
    console.log('🎵 AYFX Multi-Channel Editor Initialized!');
    console.log('💡 Try these commands in the console:');
    console.log('   - addTestEffects() - Add test sounds to all channels');
    console.log('   - testMultiChannelPlayback() - Test mixed playback');
    console.log('⌨️ Keyboard shortcuts:');
    console.log('   - 1, 2, 3: Play individual channels A, B, C');
    console.log('   - Tab: Switch active channel');
    console.log('   - Space: Play all channels (mixed or active)');


}); 