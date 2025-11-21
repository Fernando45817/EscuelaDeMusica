const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();

        // Obtener los selectores del DOM
        const waveformSelector = document.getElementById('waveformSelector');
        const octaveShiftSelector = document.getElementById('octaveShift');

        const numHarmonics = 12;
        const real = new Float32Array(numHarmonics);
        const imag = new Float32Array(numHarmonics);

        // Amplitudes de los armónicos para un timbre más rico (similar a un clavinete/piano)
        real[1] = 1; real[2] = 0.5; real[3] = 0.3; real[4] = 0.25; real[5] = 0.15; real[6] = 0.1;

        const pianoWave = audioCtx.createPeriodicWave(real, imag);

        // Mapeo de Frecuencias (Notas de DO1 a FA3)
        const noteFrequencies = {
            'DO1': 65.41, 'DO#1': 69.30, 'RE1': 73.42, 'RE#1': 77.78, 'MI1': 82.41,
            'FA1': 87.31, 'FA#1': 92.50, 'SOL1': 98.00, 'SOL#1': 103.83, 'LA1': 110.00,
            'LA#1': 116.54, 'SI1': 123.47,
            
            'DO2': 130.81, 'DO#2': 138.59, 'RE2': 146.83, 'RE#2': 155.56, 'MI2': 164.81,
            'FA2': 174.61, 'FA#2': 185.00, 'SOL2': 196.00, 'SOL#2': 207.65, 'LA2': 220.00,
            'LA#2': 233.08, 'SI2': 246.94,
            
            'DO3': 261.63, 'DO#3': 277.18, 'RE3': 293.66, 'RE#3': 311.13, 'MI3': 329.63,
            'FA3': 349.23,
        };
        
        // 🔑 MAPEO DE TECLAS COMPLETO (26 NOTAS) 🔑
        const keyToNoteMap = {
            // Octava 1 (DO1 a SI1) - Fila ASDFG... (12 Teclas)
            'a': 'DO1',   '1': 'DO#1', 
            's': 'RE1',   '2': 'RE#1', 
            'd': 'MI1',   
            
            'f': 'FA1',   '4': 'FA#1', 
            'g': 'SOL1',  '5': 'SOL#1', 
            'h': 'LA1',   '6': 'LA#1', 
            'j': 'SI1',
            

            'q': 'DO2',   '7': 'DO#2', 
            'w': 'RE2',   '8': 'RE#2', 
            'e': 'MI2', 
            
            'r': 'FA2',   '9': 'FA#2', 
            't': 'SOL2',  '0': 'SOL#2', 
            'y': 'LA2',   '-': 'LA#2', 
            'u': 'SI2',
            

            'i': 'DO3',   'o': 'DO#3', 
            'p': 'RE3',   'ñ': 'RE#3', 
            ';': 'MI3',   
            'k': 'FA3'    
        };

        const activeOscillators = {}; 

        function playNote(noteName) {
            // Comprobación para evitar sonar si ya está sonando, útil para prevenir errores
            if (activeOscillators[noteName]) {
                return;
            }

            let freq = noteFrequencies[noteName];
            if (!freq) return; 

            // Aplicar transposición de octava
            const shiftValue = parseInt(octaveShiftSelector.value);
            freq = freq * Math.pow(2, shiftValue);

            // Configurar el oscilador
            const selectedWaveform = waveformSelector.value;
            const oscillator = audioCtx.createOscillator();
            
            if (selectedWaveform === 'piano') {
                oscillator.setPeriodicWave(pianoWave);
            } else {
                oscillator.type = selectedWaveform; 
            }
            
            oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime); 

            // Configurar el Gain Node (Volumen y ADSR simple)
            const gainNode = audioCtx.createGain();
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime); // Inicia en 0 para evitar click
            
            // Ataque rápido
            gainNode.gain.linearRampToValueAtTime(0.6, audioCtx.currentTime + 0.02);
            
            // Decay/Sustain
            gainNode.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.1);


            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start();

            activeOscillators[noteName] = { oscillator, gainNode };
        }
        
        function stopNote(noteName) {
            if (activeOscillators[noteName]) {
                const { oscillator, gainNode } = activeOscillators[noteName];

                // Release (Liberación)
                gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
                gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime); 
                gainNode.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5); // 0.5s de release
                
                // Detener el oscilador después del release
                oscillator.stop(audioCtx.currentTime + 0.5);

                delete activeOscillators[noteName];
            }
        }


        function getKeyElement(noteName) {
            return document.querySelector(`.key[data-note="${noteName}"]`);
        }

        document.querySelectorAll('.key').forEach(key => {
            const noteName = key.getAttribute('data-note'); 
            

            key.addEventListener('mousedown', (e) => {
                e.preventDefault();
                if (audioCtx.state === 'suspended') { audioCtx.resume(); } 
                playNote(noteName);
                key.classList.add('playing');
            });
            key.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (audioCtx.state === 'suspended') { audioCtx.resume(); }
                playNote(noteName);
                key.classList.add('playing');
            }, { passive: false });

            // Mouse Up / Touch End (Detener)
            key.addEventListener('mouseup', () => { 
                stopNote(noteName);
                key.classList.remove('playing'); 
            });
            key.addEventListener('mouseleave', () => { 
                stopNote(noteName);
                key.classList.remove('playing'); 
            });
            key.addEventListener('touchend', (e) => {
                e.preventDefault();
                stopNote(noteName);
                key.classList.remove('playing');
            }, { passive: false });
        });


        const keysPressed = {}; 

        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            const noteName = keyToNoteMap[key];
            
            if (noteName && !keysPressed[key]) {
                e.preventDefault();
                
                if (audioCtx.state === 'suspended') { audioCtx.resume(); }
                playNote(noteName);
                keysPressed[key] = true;

                const keyElement = getKeyElement(noteName);
                if (keyElement) {
                    keyElement.classList.add('playing');
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            const noteName = keyToNoteMap[key];
            
            if (noteName && keysPressed[key]) {
                e.preventDefault();
                keysPressed[key] = false;
                stopNote(noteName);
                
                const keyElement = getKeyElement(noteName);
                if (keyElement) {
                    keyElement.classList.remove('playing');
                }
            }
        });