let audioContext = null;

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

function playWorkComplete() {
  initAudio();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 523.25; // C5
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.8);
}

function playBreakComplete() {
  initAudio();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 392.00; // G4
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.8);
}

function playTick() {
  initAudio();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'square';
  
  gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.05);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'playSound') {
    try {
      if (message.soundType === 'workComplete') {
        playWorkComplete();
      } else if (message.soundType === 'breakComplete') {
        playBreakComplete();
      } else if (message.soundType === 'tick') {
        playTick();
      }
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error playing sound:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  return true;
});
