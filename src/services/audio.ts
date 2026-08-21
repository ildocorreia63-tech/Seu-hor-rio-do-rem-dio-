class AudioService {
  private audioCtx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private loopInterval: any = null;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Play a single pleasant beep / tone
  playNote(frequency: number, duration: number = 0.3, type: OscillatorType = 'sine', gainVal: number = 0.2) {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  // Play continuous alarm based on sound type
  startAlarm(type: 'soft' | 'standard' | 'loud' | 'harp' | 'siren' = 'standard') {
    this.stopAlarm();
    this.isPlaying = true;

    const playPattern = () => {
      if (!this.isPlaying) return;

      switch (type) {
        case 'soft':
          // Gentle marimba/chime chord
          this.playNote(523.25, 0.4, 'sine', 0.25); // C5
          setTimeout(() => this.playNote(659.25, 0.4, 'sine', 0.25), 150); // E5
          setTimeout(() => this.playNote(783.99, 0.6, 'sine', 0.25), 300); // G5
          break;

        case 'loud':
          // High intensity dual buzzer
          this.playNote(880, 0.25, 'sawtooth', 0.4);
          this.playNote(1760, 0.25, 'triangle', 0.3);
          setTimeout(() => {
            this.playNote(880, 0.25, 'sawtooth', 0.4);
            this.playNote(1760, 0.25, 'triangle', 0.3);
          }, 300);
          break;

        case 'harp':
          // Relaxing harp pentatonic arpeggio
          [440, 554.37, 659.25, 880, 987.77].forEach((freq, idx) => {
            setTimeout(() => this.playNote(freq, 0.5, 'sine', 0.2), idx * 120);
          });
          break;

        case 'siren':
          // Pulse siren
          this.playNote(700, 0.2, 'square', 0.2);
          setTimeout(() => this.playNote(900, 0.2, 'square', 0.25), 200);
          setTimeout(() => this.playNote(1100, 0.3, 'square', 0.3), 400);
          break;

        case 'standard':
        default:
          // Standard pleasant medical chime
          this.playNote(587.33, 0.2, 'triangle', 0.3); // D5
          setTimeout(() => this.playNote(739.99, 0.2, 'triangle', 0.3), 160); // F#5
          setTimeout(() => this.playNote(880.00, 0.4, 'triangle', 0.35), 320); // A5
          break;
      }
    };

    playPattern();
    this.loopInterval = setInterval(playPattern, 2200);
  }

  stopAlarm() {
    this.isPlaying = false;
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
  }

  // Voice announcement in Portuguese
  speak(text: string) {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis error:', e);
      }
    }
  }

  // Play test sound for settings
  testSound(type: 'soft' | 'standard' | 'loud' | 'harp' | 'siren') {
    this.stopAlarm();
    this.startAlarm(type);
    setTimeout(() => {
      this.stopAlarm();
    }, 2400);
  }

  // Vibration support
  vibrate(pattern: number[] = [300, 200, 300, 200, 500]) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }
}

export const audio = new AudioService();
