/**
 * Serviço de Áudio e Sintetizador de Alarmes em Alta Definição
 * Otimizado para máxima audibilidade em celulares, tablets e notebooks.
 * Inclui desbloqueio automático de AudioContext para navegadores mobile (iOS/Android)
 * e compressor de dinâmica para som alto e limpo sem distorções.
 */

class AudioService {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private isPlaying: boolean = false;
  private loopInterval: any = null;
  private isUnlocked: boolean = false;
  private currentVolume: number = 100; // 0 to 100
  private isBoosted: boolean = true;

  constructor() {
    this.setupAutoUnlock();
  }

  /**
   * Configura desbloqueio automático do AudioContext no primeiro toque/clique do usuário
   */
  private setupAutoUnlock() {
    if (typeof window === 'undefined') return;

    const unlockHandler = () => {
      this.unlockAudio();
      // Remove listeners após primeiro desbloqueio bem-sucedido
      ['touchstart', 'touchend', 'click', 'pointerdown', 'keydown'].forEach((ev) => {
        window.removeEventListener(ev, unlockHandler);
      });
    };

    ['touchstart', 'touchend', 'click', 'pointerdown', 'keydown'].forEach((ev) => {
      window.addEventListener(ev, unlockHandler, { once: true, passive: true });
    });
  }

  /**
   * Desbloqueia explicitamente o Web Audio API no dispositivo
   */
  public async unlockAudio(): Promise<boolean> {
    try {
      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Toca um buffer silencioso para aquecer o motor de áudio em iOS/Android
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);

      this.isUnlocked = true;
      console.log('🔊 Sistema de áudio desbloqueado com sucesso!');
      return true;
    } catch (e) {
      console.warn('Não foi possível desbloquear o áudio automaticamente:', e);
      return false;
    }
  }

  public getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();

      // Configura compressor de dinâmica para aumentar volume percebido sem estourar
      this.compressor = this.audioCtx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, this.audioCtx.currentTime);
      this.compressor.knee.setValueAtTime(25, this.audioCtx.currentTime);
      this.compressor.ratio.setValueAtTime(8, this.audioCtx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
      this.compressor.release.setValueAtTime(0.2, this.audioCtx.currentTime);

      this.masterGain = this.audioCtx.createGain();
      this.updateMasterVolume();

      // Encadeamento: Notas -> Compressor -> MasterGain -> Saída de Som
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.audioCtx.destination);
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  public setVolume(volume: number, boosted: boolean = true) {
    this.currentVolume = Math.max(0, Math.min(100, volume));
    this.isBoosted = boosted;
    this.updateMasterVolume();
  }

  private updateMasterVolume() {
    if (!this.masterGain || !this.audioCtx) return;
    const base = this.currentVolume / 100;
    // Se volume boost ativo, amplifica em até 1.4x para speakers de celular
    const gainValue = this.isBoosted ? Math.min(1.4, base * 1.35) : base;
    this.masterGain.gain.setValueAtTime(gainValue, this.audioCtx.currentTime);
  }

  /**
   * Toca uma nota sintetizada rica com harmônicos para ser bem audível em alto-falantes pequenos
   */
  playNote(
    frequency: number,
    duration: number = 0.35,
    type: OscillatorType = 'triangle',
    gainVal: number = 0.85
  ) {
    try {
      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const destination = this.compressor || ctx.destination;

      // Oscilador Principal (Fundamental)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = type;
      osc1.frequency.setValueAtTime(frequency, now);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(gainVal, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc1.connect(gain1);
      gain1.connect(destination);

      osc1.start(now);
      osc1.stop(now + duration);

      // Oscilador Secundário de Harmônico (1 oitava acima para brilho em celular)
      if (frequency < 2000) {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(frequency * 2, now);

        gain2.gain.setValueAtTime(0.001, now);
        gain2.gain.exponentialRampToValueAtTime(gainVal * 0.4, now + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.8);

        osc2.connect(gain2);
        gain2.connect(destination);

        osc2.start(now);
        osc2.stop(now + duration);
      }
    } catch (e) {
      console.warn('Erro ao tocar nota no Web Audio:', e);
      this.playHtmlFallbackTone();
    }
  }

  /**
   * Inicia loop contínuo do alarme com o padrão selecionado
   */
  startAlarm(
    type: 'soft' | 'standard' | 'loud' | 'harp' | 'siren' = 'standard',
    volume: number = 100,
    boosted: boolean = true
  ) {
    this.stopAlarm();
    this.isPlaying = true;
    this.setVolume(volume, boosted);
    this.unlockAudio();

    const playPattern = () => {
      if (!this.isPlaying) return;

      switch (type) {
        case 'loud':
          // Alarme Alto e Penetrante para idosos e ambientes ruidosos (Buzzer duplo)
          this.playNote(987.77, 0.22, 'sawtooth', 0.95); // B5
          this.playNote(1975.53, 0.22, 'square', 0.8); // B6
          setTimeout(() => {
            if (!this.isPlaying) return;
            this.playNote(987.77, 0.22, 'sawtooth', 0.95);
            this.playNote(1975.53, 0.22, 'square', 0.8);
          }, 240);
          setTimeout(() => {
            if (!this.isPlaying) return;
            this.playNote(1174.66, 0.35, 'sawtooth', 1.0); // D6
            this.playNote(2349.32, 0.35, 'square', 0.85);
          }, 480);
          break;

        case 'siren':
          // Sirene Médica Pulsante
          this.playNote(800, 0.22, 'square', 0.9);
          setTimeout(() => this.isPlaying && this.playNote(1050, 0.22, 'square', 0.95), 180);
          setTimeout(() => this.isPlaying && this.playNote(1350, 0.25, 'square', 1.0), 360);
          setTimeout(() => this.isPlaying && this.playNote(1050, 0.22, 'square', 0.95), 560);
          break;

        case 'harp':
          // Harpa Harmônica Brilhante e Cristalina
          [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, idx) => {
            setTimeout(() => {
              if (this.isPlaying) this.playNote(freq, 0.6, 'triangle', 0.85);
            }, idx * 110);
          });
          break;

        case 'soft':
          // Campainha Suave com alta definição
          this.playNote(587.33, 0.35, 'sine', 0.85); // D5
          setTimeout(() => this.isPlaying && this.playNote(739.99, 0.35, 'sine', 0.85), 160); // F#5
          setTimeout(() => this.isPlaying && this.playNote(880.00, 0.55, 'triangle', 0.9), 320); // A5
          setTimeout(() => this.isPlaying && this.playNote(1174.66, 0.7, 'sine', 0.8), 500); // D6
          break;

        case 'standard':
        default:
          // Padrão Médico Encorpado e Audível
          this.playNote(659.25, 0.25, 'triangle', 0.9); // E5
          setTimeout(() => this.isPlaying && this.playNote(830.61, 0.25, 'triangle', 0.9), 160); // G#5
          setTimeout(() => this.isPlaying && this.playNote(987.77, 0.28, 'triangle', 0.95), 320); // B5
          setTimeout(() => this.isPlaying && this.playNote(1318.51, 0.5, 'triangle', 1.0), 500); // E6
          break;
      }
    };

    playPattern();
    this.loopInterval = setInterval(playPattern, 2300);
  }

  stopAlarm() {
    this.isPlaying = false;
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
  }

  /**
   * Anúncio de voz em Português com fala clara
   */
  speak(text: string, volume: number = 100) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.95; // Ritmo ligeiramente mais calmo para idosos
      utterance.pitch = 1.05; // Pitch ligeiramente elevado para clareza
      utterance.volume = Math.max(0.1, Math.min(1.0, volume / 100));

      // Tenta selecionar voz em Português nativa se disponível
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find((v) => v.lang.includes('pt') || v.lang.includes('BR'));
      if (ptVoice) {
        utterance.voice = ptVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  /**
   * Toca teste rápido do som do alarme
   */
  testSound(
    type: 'soft' | 'standard' | 'loud' | 'harp' | 'siren',
    volume: number = 100,
    boosted: boolean = true
  ) {
    this.unlockAudio();
    this.stopAlarm();
    this.startAlarm(type, volume, boosted);
    setTimeout(() => {
      this.stopAlarm();
    }, 2800);
  }

  /**
   * Vibração tátil no celular (Padrão de alerta forte)
   */
  vibrate(pattern: number[] = [400, 150, 400, 150, 400, 150, 800]) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }

  /**
   * Fallback leve de áudio caso Web Audio esteja temporariamente inacessível
   */
  private playHtmlFallbackTone() {
    try {
      // Pequeno beep em data URI simples
      const audioEl = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU');
      audioEl.volume = 1.0;
      audioEl.play().catch(() => {});
    } catch {}
  }
}

export const audio = new AudioService();
