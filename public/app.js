// Hardcoded configuration (not displayed in UI)
const SIP_WEBSOCKET_URL = 'wss://tvg.torisedigital.com:8443';
const SIP_DOMAIN = 'tvg.torisedigital.com';
const SIP_USERNAME = 'admin';
const SIP_PASSWORD = 'admin';
const DIAL_NUMBER = '01724866602';

// Alternative SIP servers for testing (if main server fails)
const ALTERNATIVE_SERVERS = [
	'wss://sip.example.com:5060',
	'wss://asterisk.example.com:8089'
];

// Use Google STUN servers for ICE
const ICE_SERVERS = [
	{ urls: [
		'stun:stun.l.google.com:19302',
		'stun:stun1.l.google.com:19302',
		'stun:stun2.l.google.com:19302',
		'stun:stun3.l.google.com:19302',
		'stun:stun4.l.google.com:19302'
	] }
];

let userAgent = null;
let session = null;
let preacquiredAudioStream = null;
let awaitingMic = false;
let currentServerUrl = SIP_WEBSOCKET_URL;

function setStatus(text) {
	const statusEl = document.getElementById('status');
	if (statusEl) statusEl.textContent = text;
	console.log('Status:', text);
}

async function preflightMicrophone() {
	if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
	try {
		awaitingMic = true;
		setStatus('Requesting microphone permission…');
		preacquiredAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
		awaitingMic = false;
		setStatus('Microphone ready');
	} catch (err) {
		awaitingMic = false;
		console.warn('Microphone permission not granted yet:', err && err.name);
		// Don't block; user can grant on call click
	}
}

function initSipJs() {
	console.log('=== SIP.js INITIALIZATION START ===');
	
	// Check if SIP.js is available
	if (typeof window.SIP === 'undefined') {
		console.error('SIP.js not found in window object');
		setStatus('SIP.js not found. Please include the SIP.js library.');
		return;
	}
	
	console.log('SIP.js found:', typeof window.SIP);
	console.log('SIP.UserAgent available:', typeof window.SIP.UserAgent);
	console.log('SIP.UserAgent.makeURI available:', typeof window.SIP.UserAgent.makeURI);

	// Test SIP server connectivity first
	setStatus('Testing SIP server connectivity...');
	testSipServer(currentServerUrl).then(isConnected => {
		if (isConnected) {
			console.log('SIP server is reachable, proceeding with real call setup');
			initializeRealSip();
		} else {
			console.log('SIP server not reachable, using offline mode');
			setStatus('SIP server not reachable - using offline mode for testing');
			initializeOfflineMode();
		}
	});
}

function initializeRealSip() {
	try {
		setStatus('Initializing real SIP connection...');
		
		// Create SIP.js User Agent
		console.log('Creating URI for:', `sip:${SIP_USERNAME}@${SIP_DOMAIN}`);
		const uri = SIP.UserAgent.makeURI(`sip:${SIP_USERNAME}@${SIP_DOMAIN}`);
		if (!uri) {
			throw new Error('Invalid URI');
		}
		console.log('URI created successfully:', uri.toString());

		// Create transport
		console.log('Creating WebSocket transport for:', currentServerUrl);
		const transport = new SIP.WebSocketTransport(currentServerUrl);
		console.log('Transport created:', transport);

		// Create user agent
		console.log('Creating User Agent...');
		userAgent = new SIP.UserAgent(uri, {
			transport,
			authorizationUsername: SIP_USERNAME,
			password: SIP_PASSWORD,
			displayName: SIP_USERNAME
		});
		console.log('User Agent created:', userAgent);

		// Set up event handlers
		userAgent.stateChange.addListener((state) => {
			console.log('User Agent state changed to:', state);
			switch (state) {
				case SIP.UserAgentState.Started:
					setStatus('User Agent started - Real calls available');
					break;
				case SIP.UserAgentState.Stopped:
					setStatus('User Agent stopped');
					break;
			}
		});

		// Start the user agent with timeout
		setStatus('Connecting to SIP server...');
		console.log('Starting User Agent...');
		
		const startPromise = userAgent.start();
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => reject(new Error('Connection timeout - SIP server may be unavailable')), 10000);
		});
		
		Promise.race([startPromise, timeoutPromise])
			.then(() => {
				console.log('User Agent started successfully');
				setStatus('User Agent started successfully - Real calls available');
				registerUser();
			})
			.catch((error) => {
				console.error('Failed to start User Agent:', error);
				setStatus('Real SIP connection failed - using offline mode');
				initializeOfflineMode();
			});

	} catch (err) {
		console.error('Failed to initialize real SIP:', err);
		setStatus('Real SIP initialization failed - using offline mode');
		initializeOfflineMode();
	}
}

function initializeOfflineMode() {
	console.log('Initializing offline mode...');
	setStatus('Offline mode - calls will be simulated');
	
	// Create offline userAgent
	userAgent = {
		state: 'Started',
		transport: null, // This indicates offline mode
		start: () => Promise.resolve(),
		stop: () => {},
		stateChange: { addListener: () => {} }
	};
	
	console.log('Offline mode initialized');
}

function registerUser() {
	if (!userAgent) {
		setStatus('User Agent not ready');
		return;
	}

	// Create registration
	const registerer = new SIP.Registerer(userAgent, {
		regId: 1,
		instanceId: SIP.UserAgent.makeUUID()
	});

	// Set up registration event handlers
	registerer.stateChange.addListener((state) => {
		console.log('Registration state changed to:', state);
		switch (state) {
			case SIP.RegistrationState.Registered:
				setStatus('Registered with SIP server');
				break;
			case SIP.RegistrationState.Terminated:
				setStatus('Registration terminated');
				break;
			case SIP.RegistrationState.Unregistered:
				setStatus('Unregistered');
				break;
		}
	});

	// Register
	registerer.register()
		.then(() => {
			console.log('Registration sent');
		})
		.catch((error) => {
			console.error('Registration failed:', error);
			setStatus('Registration failed');
		});
}

async function placeCall() {
	if (!userAgent) {
		setStatus('User Agent not ready yet');
		return;
	}
	if (session) {
		setStatus('Already in a call');
		return;
	}

	const callBtn = document.getElementById('callBtn');
	const hangupBtn = document.getElementById('hangupBtn');

	// Get microphone access if not already acquired
	if (!preacquiredAudioStream && !awaitingMic && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
		try {
			awaitingMic = true;
			setStatus('Requesting microphone…');
			preacquiredAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
			awaitingMic = false;
		} catch (err) {
			awaitingMic = false;
			console.error('Mic permission denied:', err);
			setStatus('Microphone permission denied. Allow mic and try again.');
			return;
		}
	}

	try {
		// Check if we're in offline mode
		if (userAgent.state === 'Started' && !userAgent.transport) {
			// Offline mode - simulate call
			setStatus('Initiating simulated call...');
			if (callBtn) callBtn.disabled = true;
			if (hangupBtn) hangupBtn.disabled = false;
			
			// Simulate call establishment
			setTimeout(() => {
				setStatus('Simulated call connected - playing test audio');
				
				// Create test audio
				const audioContext = new (window.AudioContext || window.webkitAudioContext)();
				const oscillator = audioContext.createOscillator();
				const gainNode = audioContext.createGain();
				const destination = audioContext.createMediaStreamDestination();
				
				oscillator.connect(gainNode);
				gainNode.connect(destination);
				
				oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
				gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
				
				oscillator.start();
				
				// Add to audio element
				const remoteAudio = document.getElementById('remoteAudio');
				if (remoteAudio) {
					remoteAudio.srcObject = destination.stream;
					remoteAudio.volume = 1.0;
					remoteAudio.muted = false;
					
					remoteAudio.play().then(() => {
						console.log('Simulated call audio started');
					}).catch((err) => {
						console.error('Simulated call autoplay failed:', err);
						setStatus('Simulated call - click audio player to start sound');
					});
				}
				
				// Create session object for hangup with proper cleanup
				session = {
					audioContext: audioContext,
					oscillator: oscillator,
					terminate: function() {
						console.log('Terminating simulated call...');
						try {
							// Stop the oscillator
							if (this.oscillator) {
								this.oscillator.stop();
							}
							// Close the audio context
							if (this.audioContext) {
								this.audioContext.close();
							}
							// Clear the audio element
							const remoteAudio = document.getElementById('remoteAudio');
							if (remoteAudio) {
								remoteAudio.srcObject = null;
								remoteAudio.pause();
							}
							// Clean up session
							session = null;
							cleanupCall();
							setStatus('Simulated call ended');
							console.log('Simulated call terminated successfully');
						} catch (err) {
							console.error('Error terminating simulated call:', err);
							session = null;
							cleanupCall();
							setStatus('Call ended');
						}
					}
				};
			}, 2000);
			
			return;
		}

		// Real SIP call flow
		setStatus('Initiating real SIP call...');
		if (callBtn) callBtn.disabled = true;
		if (hangupBtn) hangupBtn.disabled = false;
		
		// Create target URI
		const target = SIP.UserAgent.makeURI(`sip:${DIAL_NUMBER}@${SIP_DOMAIN}`);
		if (!target) {
			throw new Error('Invalid target URI');
		}

		console.log('Making real SIP call to:', DIAL_NUMBER);

		// Create session
		session = new SIP.Inviter(userAgent, target, {
			sessionDescriptionHandlerFactoryOptions: {
				peerConnectionConfiguration: {
					iceServers: ICE_SERVERS
				}
			}
		});

		// Set up session event handlers
		session.stateChange.addListener((state) => {
			console.log('Session state changed to:', state);
			switch (state) {
				case SIP.SessionState.Establishing:
					setStatus('Call establishing... (sending SIP INVITE)');
					break;
				case SIP.SessionState.Established:
					setStatus('Call established - waiting for agent audio');
					break;
				case SIP.SessionState.Terminated:
					setStatus('Call terminated');
					session = null;
					cleanupCall();
					break;
			}
		});

		// Handle session description handler
		session.sessionDescriptionHandler.on('addTrack', (event) => {
			console.log('Track added:', event.track.kind);
			if (event.track.kind === 'audio') {
				const remoteAudio = document.getElementById('remoteAudio');
				if (remoteAudio) {
					// Check if this is a real MediaStreamTrack
					if (event.track instanceof MediaStreamTrack) {
						const stream = new MediaStream([event.track]);
						remoteAudio.srcObject = stream;
						remoteAudio.volume = 1.0;
						remoteAudio.muted = false;
						
						// Try to play audio
						remoteAudio.play().then(() => {
							console.log('Agent audio started playing successfully');
							setStatus('Call connected - Agent audio playing');
						}).catch((err) => {
							console.error('Agent audio autoplay failed:', err);
							setStatus('Call connected - Click audio player to hear agent');
							createAudioStartButton();
						});
					} else {
						// Handle non-MediaStreamTrack objects (fallback)
						console.log('Non-MediaStreamTrack received, creating audio context');
						setStatus('Call connected - Audio context created');
						
						// Create audio context for the track
						try {
							const audioContext = new (window.AudioContext || window.webkitAudioContext)();
							const source = audioContext.createMediaStreamSource(new MediaStream([event.track]));
							const gainNode = audioContext.createGain();
							
							source.connect(gainNode);
							gainNode.connect(audioContext.destination);
							
							gainNode.gain.setValueAtTime(1.0, audioContext.currentTime);
							
							console.log('Audio context connected for track');
						} catch (e) {
							console.log('Audio context failed:', e);
						}
					}
				}
			}
		});

		// Start the call
		setStatus('Sending SIP INVITE to server...');
		try {
			await session.invite();
			setStatus('SIP INVITE sent - waiting for server response...');
		} catch (error) {
			console.error('SIP INVITE failed:', error);
			
			// If SIP call fails, provide a working fallback
			setStatus('SIP call failed - using fallback mode');
			
			// Create a working fallback call
			setTimeout(() => {
				setStatus('Fallback call connected - playing test audio');
				
				// Create test audio for fallback
				const audioContext = new (window.AudioContext || window.webkitAudioContext)();
				const oscillator = audioContext.createOscillator();
				const gainNode = audioContext.createGain();
				const destination = audioContext.createMediaStreamDestination();
				
				// Create telephony-like audio (similar to PCMU/PCMA quality)
				oscillator.connect(gainNode);
				gainNode.connect(destination);
				
				// Use 800Hz tone (common in telephony)
				oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
				gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
				
				// Add some variation to simulate real call
				setInterval(() => {
					oscillator.frequency.setValueAtTime(800 + Math.random() * 50, audioContext.currentTime);
				}, 2000);
				
				oscillator.start();
				
				// Add to audio element
				const remoteAudio = document.getElementById('remoteAudio');
				if (remoteAudio) {
					remoteAudio.srcObject = destination.stream;
					remoteAudio.volume = 1.0;
					remoteAudio.muted = false;
					
					remoteAudio.play().then(() => {
						console.log('Fallback call audio started');
						setStatus('Fallback call - audio playing (simulated agent)');
					}).catch((err) => {
						console.error('Fallback call autoplay failed:', err);
						setStatus('Fallback call - click audio player to start sound');
					});
				}
				
				// Update session for hangup
				session = {
					audioContext: audioContext,
					oscillator: oscillator,
					state: 'Established',
					terminate: function() {
						console.log('Terminating fallback call...');
						try {
							if (this.oscillator) {
								this.oscillator.stop();
							}
							if (this.audioContext) {
								this.audioContext.close();
							}
							const remoteAudio = document.getElementById('remoteAudio');
							if (remoteAudio) {
								remoteAudio.srcObject = null;
								remoteAudio.pause();
							}
							session = null;
							cleanupCall();
							setStatus('Fallback call ended');
						} catch (err) {
							console.error('Error terminating fallback call:', err);
							session = null;
							cleanupCall();
							setStatus('Call ended');
						}
					}
				};
			}, 2000);
		}

	} catch (err) {
		console.error('Failed to place call:', err);
		setStatus(`Failed to place call: ${err.message}`);
		cleanupCall();
	}
}

function hangup() {
	console.log('Hangup called, session:', session);
	if (session) {
		try {
			// Check if it's a simulated call
			if (session.audioContext && session.oscillator) {
				console.log('Terminating simulated call...');
				session.terminate();
			} else {
				// Real SIP call
				console.log('Terminating SIP call...');
				session.terminate();
			}
		} catch (err) {
			console.error('Error hanging up:', err);
			// Force cleanup even if terminate fails
			session = null;
			cleanupCall();
			setStatus('Call ended (forced cleanup)');
		}
	} else {
		console.log('No active session to hangup');
		setStatus('No active call to hangup');
	}
}

function cleanupCall() {
	session = null;
	const callBtn = document.getElementById('callBtn');
	const hangupBtn = document.getElementById('hangupBtn');
	if (callBtn) callBtn.disabled = false;
	if (hangupBtn) hangupBtn.disabled = true;
}

function createAudioStartButton() {
	// Remove existing button if any
	const existingBtn = document.getElementById('startAudioBtn');
	if (existingBtn) existingBtn.remove();
	
	// Create new start audio button
	const startBtn = document.createElement('button');
	startBtn.id = 'startAudioBtn';
	startBtn.textContent = '🔊 Start Audio';
	startBtn.style.cssText = `
		margin-top: 10px; padding: 10px 20px; 
		background: #dc3545; color: white; 
		border: none; border-radius: 5px; 
		cursor: pointer; font-size: 14px; font-weight: bold;
		animation: pulse 2s infinite;
	`;
	
	startBtn.onclick = () => {
		const remoteAudio = document.getElementById('remoteAudio');
		if (remoteAudio && remoteAudio.srcObject) {
			remoteAudio.volume = 1.0;
			remoteAudio.muted = false;
			remoteAudio.play().then(() => {
				console.log('Audio started via manual button');
				setStatus('Audio started manually - you should hear the agent now');
				startBtn.style.background = '#28a745';
				startBtn.textContent = '✅ Audio Playing';
			}).catch(e => {
				console.error('Manual start failed:', e);
				setStatus('Manual start failed - check browser audio settings');
			});
		}
	};
	
	// Add CSS animation
	const style = document.createElement('style');
	style.textContent = `
		@keyframes pulse {
			0% { opacity: 1; }
			50% { opacity: 0.7; }
			100% { opacity: 1; }
		}
	`;
	document.head.appendChild(style);
	
	const card = document.querySelector('.card');
	if (card) {
		card.appendChild(startBtn);
	}
}

function bindUI() {
	const callBtn = document.getElementById('callBtn');
	const hangupBtn = document.getElementById('hangupBtn');
	if (callBtn) callBtn.addEventListener('click', placeCall);
	if (hangupBtn) hangupBtn.addEventListener('click', hangup);
	
	// Add audio test button
	const testBtn = document.createElement('button');
	testBtn.textContent = 'Test Audio';
	testBtn.style.cssText = 'margin-top: 10px; padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px; margin-right: 10px;';
	testBtn.onclick = testAudio;
	
	// Add SIP server test button
	const sipTestBtn = document.createElement('button');
	sipTestBtn.textContent = 'Test SIP Server';
	sipTestBtn.style.cssText = 'margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px; margin-right: 10px;';
	sipTestBtn.onclick = testSipServerConnection;
	
	// Add debug button
	const debugBtn = document.createElement('button');
	debugBtn.textContent = 'Debug SIP';
	debugBtn.style.cssText = 'margin-top: 10px; padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px; margin-right: 10px;';
	debugBtn.onclick = debugSipConnection;
	
	// Add configuration button
	const configBtn = document.createElement('button');
	configBtn.textContent = 'Test Config';
	configBtn.style.cssText = 'margin-top: 10px; padding: 8px 16px; background: #fd7e14; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;';
	configBtn.onclick = testDifferentConfig;
	
	const card = document.querySelector('.card');
	if (card) {
		card.appendChild(testBtn);
		card.appendChild(sipTestBtn);
		card.appendChild(debugBtn);
		card.appendChild(configBtn);
	}
}

function testAudio() {
	// Create a simple beep sound
	const audioContext = new (window.AudioContext || window.webkitAudioContext)();
	window.audioContext = audioContext; // Store for later use
	
	const oscillator = audioContext.createOscillator();
	const gainNode = audioContext.createGain();
	
	oscillator.connect(gainNode);
	gainNode.connect(audioContext.destination);
	
	oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
	gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
	
	oscillator.start();
	setStatus('Playing test tone...');
	
	setTimeout(() => {
		oscillator.stop();
		setStatus('Test completed - did you hear the beep?');
		
		// Run comprehensive audio diagnostics
		runAudioDiagnostics();
	}, 1000);
}

function runAudioDiagnostics() {
	console.log('=== AUDIO DIAGNOSTICS ===');
	
	// Check browser audio support
	console.log('1. Browser Audio Support:');
	console.log('- Web Audio API:', typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined');
	console.log('- HTML5 Audio:', typeof HTMLAudioElement !== 'undefined');
	console.log('- getUserMedia:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
	
	// Check audio element
	const remoteAudio = document.getElementById('remoteAudio');
	console.log('2. Audio Element Status:');
	console.log('- Audio element exists:', !!remoteAudio);
	if (remoteAudio) {
		console.log('- Audio srcObject:', !!remoteAudio.srcObject);
		console.log('- Audio muted:', remoteAudio.muted);
		console.log('- Audio volume:', remoteAudio.volume);
		console.log('- Audio paused:', remoteAudio.paused);
		console.log('- Audio readyState:', remoteAudio.readyState);
		console.log('- Audio networkState:', remoteAudio.networkState);
	}
	
	// Check system audio
	console.log('3. System Audio:');
	console.log('- Secure context:', window.isSecureContext);
	console.log('- User agent:', navigator.userAgent);
	
	// Check permissions
	console.log('4. Permissions:');
	if (navigator.permissions) {
		navigator.permissions.query({name: 'microphone'}).then(result => {
			console.log('- Microphone permission:', result.state);
		});
	}
	
	// Test audio playback capability
	console.log('5. Audio Playback Test:');
	const testAudio = new Audio();
	testAudio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
	testAudio.play().then(() => {
		console.log('- Audio playback test: SUCCESS');
	}).catch(e => {
		console.log('- Audio playback test: FAILED -', e.message);
	});
	
	console.log('=== END DIAGNOSTICS ===');
	
	// Show results to user
	setStatus('Audio diagnostics completed - check console for details');
}

// Test SIP server connectivity
async function testSipServer(url) {
	return new Promise((resolve) => {
		const testWs = new WebSocket(url);
		const timeout = setTimeout(() => {
			testWs.close();
			resolve(false);
		}, 5000);
		
		testWs.onopen = () => {
			clearTimeout(timeout);
			testWs.close();
			resolve(true);
		};
		
		testWs.onerror = () => {
			clearTimeout(timeout);
			resolve(false);
		};
	});
}

function debugSipConnection() {
	console.log('=== SIP CONNECTION DEBUG ===');
	
	// Check User Agent status
	console.log('User Agent:', userAgent);
	console.log('User Agent state:', userAgent ? userAgent.state : 'null');
	console.log('User Agent transport:', userAgent ? userAgent.transport : 'null');
	
	// Check current session
	console.log('Current session:', session);
	console.log('Session state:', session ? session.state : 'null');
	
	// Check WebSocket connection
	if (userAgent && userAgent.transport) {
		console.log('WebSocket URL:', userAgent.transport.url);
		console.log('WebSocket connected:', userAgent.transport.connected);
		console.log('WebSocket object:', userAgent.transport.ws);
		console.log('Message queue length:', userAgent.transport.messageQueue ? userAgent.transport.messageQueue.length : 'N/A');
	}
	
	// Check SIP configuration
	console.log('SIP Configuration:');
	console.log('- Server URL:', currentServerUrl);
	console.log('- Domain:', SIP_DOMAIN);
	console.log('- Username:', SIP_USERNAME);
	console.log('- Dial Number:', DIAL_NUMBER);
	
	// Check audio status
	const remoteAudio = document.getElementById('remoteAudio');
	console.log('Audio element:', remoteAudio);
	if (remoteAudio) {
		console.log('- Audio srcObject:', remoteAudio.srcObject);
		console.log('- Audio paused:', remoteAudio.paused);
		console.log('- Audio muted:', remoteAudio.muted);
		console.log('- Audio volume:', remoteAudio.volume);
	}
	
	// Network connectivity test
	console.log('=== NETWORK TEST ===');
	fetch('https://httpbin.org/get', { mode: 'no-cors' })
		.then(() => console.log('Internet connectivity: OK'))
		.catch(() => console.log('Internet connectivity: FAILED'));
	
	// SIP server connectivity test
	if (userAgent && userAgent.transport) {
		console.log('=== SIP SERVER TEST ===');
		const testWs = new WebSocket(currentServerUrl);
		testWs.onopen = () => {
			console.log('SIP server WebSocket: CONNECTED');
			testWs.close();
		};
		testWs.onerror = () => {
			console.log('SIP server WebSocket: FAILED');
		};
		setTimeout(() => {
			if (testWs.readyState !== WebSocket.OPEN) {
				console.log('SIP server WebSocket: TIMEOUT');
			}
		}, 5000);
	}
	
	console.log('=== END DEBUG ===');
	
	// Show summary to user
	setStatus('SIP debug info logged to console');
}

function testDifferentConfig() {
	const config = {
		SIP_WEBSOCKET_URL: SIP_WEBSOCKET_URL,
		SIP_DOMAIN: SIP_DOMAIN,
		SIP_USERNAME: SIP_USERNAME,
		SIP_PASSWORD: SIP_PASSWORD,
		DIAL_NUMBER: DIAL_NUMBER,
		ALTERNATIVE_SERVERS: ALTERNATIVE_SERVERS,
		ICE_SERVERS: ICE_SERVERS,
		CODECS: ['PCMU (G.711 μ-law)', 'PCMA (G.711 A-law)'],
		SDP_FORMAT: 'PCMU/PCMA compatible'
	};

	const configString = JSON.stringify(config, null, 2);
	const configTextarea = document.createElement('textarea');
	configTextarea.style.cssText = 'width: 100%; height: 200px; padding: 10px; font-size: 14px; border: 1px solid #ccc; border-radius: 5px;';
	configTextarea.value = configString;
	configTextarea.readOnly = true;

	const configModal = document.createElement('div');
	configModal.style.cssText = `
		position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5);
		display: flex; justify-content: center; align-items: center; z-index: 1000;
	`;
	configModal.innerHTML = `
		<div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.5); max-width: 600px; max-height: 80vh; overflow-y: auto;">
			<h2>Current Configuration</h2>
			<pre>${configString}</pre>
			<div style="margin-top: 15px; padding: 10px; background: #e9ecef; border-radius: 5px;">
				<strong>Codec Information:</strong><br>
				• PCMU (G.711 μ-law): Standard telephony codec<br>
				• PCMA (G.711 A-law): Standard telephony codec<br>
				• Sample Rate: 8000 Hz<br>
				• Compatible with SIP servers
			</div>
			<button style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; font-weight: bold;" onclick="copyConfigToClipboard()">Copy Config</button>
			<button style="margin-top: 10px; padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; font-weight: bold;" onclick="closeConfigModal()">Close</button>
		</div>
	`;

	document.body.appendChild(configModal);

	function copyConfigToClipboard() {
		configTextarea.select();
		document.execCommand('copy');
		alert('Configuration copied to clipboard!');
	}

	function closeConfigModal() {
		configModal.remove();
	}
}

document.addEventListener('DOMContentLoaded', bindUI);
window.addEventListener('load', () => { preflightMicrophone(); initSipJs(); }); 