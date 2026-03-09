import { SoundContext, Theme } from "../backend";

const SOUND_ENABLED_KEY = "fruitMatchSoundEnabled";

// Declare the AndroidAudio bridge interface
declare global {
  interface Window {
    AndroidAudio?: {
      playSound: (type: string) => void;
      changeWorldMusic: (world: string) => void;
      setMuted: (muted: boolean) => void;
      pauseAllAudio: () => void;
      resumeAudio: () => void;
      stopAllAudio: () => void;
    };
    FruitMatchAudio?: {
      onPause: () => void;
      onResume: () => void;
      onStop: () => void;
    };
  }
}

// ---------------------------------------------------------
// Web Audio API fallback: procedurally generated sounds
// Used when AndroidAudio bridge is not available (web mode)
// ---------------------------------------------------------
class WebAudioFallback {
  private ctx: AudioContext | null = null;
  private bgOscillators: OscillatorNode[] = [];
  private bgGain: GainNode | null = null;
  private bgInterval: number | null = null;
  private currentWorldTheme = "garden";
  private currentWorldId: number | null = null;
  private isMuted = false;

  private getContext(): AudioContext | null {
    try {
      if (!this.ctx || this.ctx.state === "closed") {
        this.ctx = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
      }
      // Auto-resume suspended context (common in browsers requiring user gesture)
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume(); // fire-and-forget
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  async resume() {
    const ctx = this.getContext();
    if (ctx && ctx.state === "suspended") {
      await ctx.resume();
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopBackground();
    }
  }

  // Play a short procedural sound effect
  playEffect(type: string) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const gain = ctx.createGain();
      gain.connect(ctx.destination);

      switch (type) {
        case "tileClick": {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(
            440,
            ctx.currentTime + 0.08,
          );
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
          osc.connect(gain);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.1);
          break;
        }
        case "tileMatch": {
          const tmOffsets = [0, 0.06, 0.12];
          const tmFreqs = [523, 659, 784];
          for (const [i, offset] of tmOffsets.entries()) {
            const osc = ctx.createOscillator();
            osc.type = "triangle";
            osc.frequency.value = tmFreqs[i];
            gain.gain.setValueAtTime(0.2, ctx.currentTime + offset);
            gain.gain.exponentialRampToValueAtTime(
              0.001,
              ctx.currentTime + offset + 0.18,
            );
            osc.connect(gain);
            osc.start(ctx.currentTime + offset);
            osc.stop(ctx.currentTime + offset + 0.2);
          }
          break;
        }
        case "tileClear": {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(600, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(
            1200,
            ctx.currentTime + 0.15,
          );
          gain.gain.setValueAtTime(0.18, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          osc.connect(gain);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.22);
          break;
        }
        case "bomb": {
          const bufferSize = ctx.sampleRate * 0.3;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] =
              (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
          }
          const src = ctx.createBufferSource();
          src.buffer = buffer;
          gain.gain.setValueAtTime(0.4, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          src.connect(gain);
          src.start(ctx.currentTime);
          break;
        }
        case "clock": {
          for (const offset of [0, 0.1]) {
            const osc = ctx.createOscillator();
            osc.type = "square";
            osc.frequency.value = 1047;
            gain.gain.setValueAtTime(0.15, ctx.currentTime + offset);
            gain.gain.exponentialRampToValueAtTime(
              0.001,
              ctx.currentTime + offset + 0.08,
            );
            osc.connect(gain);
            osc.start(ctx.currentTime + offset);
            osc.stop(ctx.currentTime + offset + 0.09);
          }
          break;
        }
        case "shuffle": {
          for (let i = 0; i < 6; i++) {
            const osc = ctx.createOscillator();
            osc.type = "sawtooth";
            osc.frequency.value = 200 + Math.random() * 600;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.04);
            g.gain.exponentialRampToValueAtTime(
              0.001,
              ctx.currentTime + i * 0.04 + 0.06,
            );
            osc.connect(g);
            g.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.04);
            osc.stop(ctx.currentTime + i * 0.04 + 0.07);
          }
          break;
        }
        case "magnifier": {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(400, ctx.currentTime);
          osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.12);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          osc.connect(gain);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.16);
          break;
        }
        case "levelComplete": {
          for (const [i, freq] of [523, 659, 784, 1047].entries()) {
            const osc = ctx.createOscillator();
            osc.type = "sine";
            osc.frequency.value = freq;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.22, ctx.currentTime + i * 0.12);
            g.gain.exponentialRampToValueAtTime(
              0.001,
              ctx.currentTime + i * 0.12 + 0.22,
            );
            osc.connect(g);
            g.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.12);
            osc.stop(ctx.currentTime + i * 0.12 + 0.24);
          }
          break;
        }
        case "starEarned": {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(1047, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(
            2093,
            ctx.currentTime + 0.1,
          );
          gain.gain.setValueAtTime(0.18, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
          osc.connect(gain);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.15);
          break;
        }
        case "worldUnlock": {
          for (const [i, freq] of [392, 494, 587, 784, 988].entries()) {
            const osc = ctx.createOscillator();
            osc.type = "triangle";
            osc.frequency.value = freq;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1);
            g.gain.exponentialRampToValueAtTime(
              0.001,
              ctx.currentTime + i * 0.1 + 0.2,
            );
            osc.connect(g);
            g.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.1);
            osc.stop(ctx.currentTime + i * 0.1 + 0.22);
          }
          break;
        }
        case "buttonClick": {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.value = 660;
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
          osc.connect(gain);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.07);
          break;
        }
        case "rewardClaim": {
          for (const [i, freq] of [523, 659, 784, 1047, 1319].entries()) {
            const osc = ctx.createOscillator();
            osc.type = "triangle";
            osc.frequency.value = freq;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.08);
            g.gain.exponentialRampToValueAtTime(
              0.001,
              ctx.currentTime + i * 0.08 + 0.15,
            );
            osc.connect(g);
            g.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.08);
            osc.stop(ctx.currentTime + i * 0.08 + 0.17);
          }
          break;
        }
        case "layerOpen": {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(300, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(
            600,
            ctx.currentTime + 0.1,
          );
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
          osc.connect(gain);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.13);
          break;
        }
        case "bossLevelStart": {
          // Dramatic low rumble + rising tension
          const blsOffsets = [0, 0.15, 0.3];
          const blsFreqs = [110, 138, 164];
          for (const [i, offset] of blsOffsets.entries()) {
            const osc = ctx.createOscillator();
            osc.type = "sawtooth";
            osc.frequency.value = blsFreqs[i];
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.25, ctx.currentTime + offset);
            g.gain.exponentialRampToValueAtTime(
              0.001,
              ctx.currentTime + offset + 0.35,
            );
            osc.connect(g);
            g.connect(ctx.destination);
            osc.start(ctx.currentTime + offset);
            osc.stop(ctx.currentTime + offset + 0.4);
          }
          // High accent
          setTimeout(() => {
            const ctx2 = this.getContext();
            if (!ctx2 || this.isMuted) return;
            const osc = ctx2.createOscillator();
            osc.type = "square";
            osc.frequency.setValueAtTime(880, ctx2.currentTime);
            osc.frequency.exponentialRampToValueAtTime(
              440,
              ctx2.currentTime + 0.4,
            );
            const g = ctx2.createGain();
            g.gain.setValueAtTime(0.3, ctx2.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 0.5);
            osc.connect(g);
            g.connect(ctx2.destination);
            osc.start(ctx2.currentTime);
            osc.stop(ctx2.currentTime + 0.55);
          }, 500);
          break;
        }
        case "bossVictory": {
          for (const [i, freq] of [
            523, 659, 784, 1047, 1319, 1047, 784, 1319,
          ].entries()) {
            const osc = ctx.createOscillator();
            osc.type = "triangle";
            osc.frequency.value = freq;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.22, ctx.currentTime + i * 0.1);
            g.gain.exponentialRampToValueAtTime(
              0.001,
              ctx.currentTime + i * 0.1 + 0.2,
            );
            osc.connect(g);
            g.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.1);
            osc.stop(ctx.currentTime + i * 0.1 + 0.22);
          }
          break;
        }
        case "bossDefeat": {
          const osc = ctx.createOscillator();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.8);
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
          osc.connect(gain);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 1.0);
          break;
        }
        case "bossObjective": {
          const osc = ctx.createOscillator();
          osc.type = "square";
          osc.frequency.setValueAtTime(220, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(
            440,
            ctx.currentTime + 0.2,
          );
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
          osc.connect(gain);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.28);
          break;
        }
        default: {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.value = 440;
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
          osc.connect(gain);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.12);
        }
      }
    } catch (_err) {
      // Silently fail - audio is non-critical
    }
  }

  // World-themed background music using oscillators
  // Each world has a unique tempo/key/pattern
  playBackground(worldTheme: string, worldId?: number) {
    if (this.isMuted) return;
    // Avoid restarting music if the same world is already playing
    if (worldId !== undefined && worldId === this.currentWorldId) return;
    this.stopBackground();
    this.currentWorldTheme = worldTheme;
    if (worldId !== undefined) {
      this.currentWorldId = worldId;
    }

    const ctx = this.getContext();
    if (!ctx) return;

    const WORLD_MUSIC: Record<
      string,
      {
        bpm: number;
        scale: number[];
        waveform: OscillatorType;
        bassWave: OscillatorType;
      }
    > = {
      garden: {
        bpm: 100,
        scale: [261, 294, 329, 349, 392, 440, 494, 523],
        waveform: "sine",
        bassWave: "sine",
      },
      ocean: {
        bpm: 80,
        scale: [220, 247, 261, 294, 329, 370, 392, 440],
        waveform: "sine",
        bassWave: "sine",
      },
      candyland: {
        bpm: 130,
        scale: [329, 370, 415, 440, 494, 554, 622, 659],
        waveform: "triangle",
        bassWave: "triangle",
      },
      forest: {
        bpm: 90,
        scale: [196, 220, 247, 261, 294, 329, 370, 392],
        waveform: "triangle",
        bassWave: "sine",
      },
      volcano: {
        bpm: 140,
        scale: [185, 208, 233, 247, 277, 311, 349, 370],
        waveform: "sawtooth",
        bassWave: "square",
      },
      space: {
        bpm: 70,
        scale: [174, 195, 220, 233, 261, 293, 329, 349],
        waveform: "sine",
        bassWave: "sawtooth",
      },
      desert: {
        bpm: 95,
        scale: [207, 233, 261, 277, 311, 349, 391, 415],
        waveform: "triangle",
        bassWave: "triangle",
      },
      arctic: {
        bpm: 75,
        scale: [277, 311, 349, 370, 415, 466, 523, 554],
        waveform: "sine",
        bassWave: "sine",
      },
      jungle: {
        bpm: 115,
        scale: [246, 276, 311, 329, 369, 415, 466, 493],
        waveform: "triangle",
        bassWave: "square",
      },
      crystal: {
        bpm: 110,
        scale: [311, 349, 392, 415, 466, 523, 587, 622],
        waveform: "sine",
        bassWave: "sine",
      },
      shadow: {
        bpm: 85,
        scale: [155, 174, 195, 207, 233, 261, 293, 311],
        waveform: "sawtooth",
        bassWave: "sawtooth",
      },
      rainbow: {
        bpm: 120,
        scale: [349, 392, 440, 466, 523, 587, 659, 698],
        waveform: "triangle",
        bassWave: "triangle",
      },
    };

    const music = WORLD_MUSIC[worldTheme] || WORLD_MUSIC.garden;
    const beatInterval = (60 / music.bpm) * 1000;
    let beat = 0;

    const playBeat = () => {
      if (this.isMuted) return;
      const c = this.getContext();
      if (!c) return;

      // Melody note
      const patternIndex = Math.floor(beat / music.scale.length) % 4;
      const patterns = [
        [0, 2, 4, 7],
        [0, 3, 5, 7],
        [0, 2, 5, 6],
        [1, 3, 4, 7],
      ];
      const pattern = patterns[patternIndex];
      const freq = music.scale[pattern[beat % 4]];

      const osc = c.createOscillator();
      osc.type = music.waveform;
      osc.frequency.value = freq;
      const g = c.createGain();
      g.gain.setValueAtTime(0.06, c.currentTime);
      g.gain.exponentialRampToValueAtTime(
        0.001,
        c.currentTime + beatInterval / 900,
      );
      osc.connect(g);
      g.connect(c.destination);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + beatInterval / 850);

      // Bass note every 2 beats
      if (beat % 2 === 0) {
        const bassFreq = music.scale[0] / 2;
        const bassOsc = c.createOscillator();
        bassOsc.type = music.bassWave;
        bassOsc.frequency.value = bassFreq;
        const bassGain = c.createGain();
        bassGain.gain.setValueAtTime(0.04, c.currentTime);
        bassGain.gain.exponentialRampToValueAtTime(
          0.001,
          c.currentTime + beatInterval / 600,
        );
        bassOsc.connect(bassGain);
        bassGain.connect(c.destination);
        bassOsc.start(c.currentTime);
        bassOsc.stop(c.currentTime + beatInterval / 550);
      }

      beat++;
    };

    playBeat();
    this.bgInterval = window.setInterval(playBeat, beatInterval);
  }

  stopBackground() {
    if (this.bgInterval !== null) {
      clearInterval(this.bgInterval);
      this.bgInterval = null;
    }
    this.currentWorldId = null;
  }

  isAvailable(): boolean {
    try {
      return !!(window.AudioContext || (window as any).webkitAudioContext);
    } catch {
      return false;
    }
  }
}

// Singleton fallback instance
const webAudioFallback = new WebAudioFallback();

// ---------------------------------------------------------
// Main SoundManager - uses Android bridge if available,
// falls back to WebAudioFallback on web
// ---------------------------------------------------------
class SoundManager {
  private isSoundEnabled = true;
  private isInitialized = false;
  private currentTheme: Theme | null = null;
  private wasPlayingBeforePause = false;
  private isPaused = false;

  constructor() {
    const savedSoundEnabled = localStorage.getItem(SOUND_ENABLED_KEY);
    if (savedSoundEnabled !== null) {
      this.isSoundEnabled = savedSoundEnabled === "true";
    } else {
      this.isSoundEnabled = true;
      localStorage.setItem(SOUND_ENABLED_KEY, "true");
    }

    this.syncMuteStateWithNative();
    this.exposeLifecycleMethods();
  }

  private isAndroid(): boolean {
    return !!window.AndroidAudio;
  }

  private exposeLifecycleMethods() {
    window.FruitMatchAudio = {
      onPause: () => this.handleAndroidPause(),
      onResume: () => this.handleAndroidResume(),
      onStop: () => this.handleAndroidStop(),
    };
  }

  private handleAndroidPause() {
    this.isPaused = true;
    this.wasPlayingBeforePause =
      this.isSoundEnabled && this.currentTheme !== null;
    if (this.isAndroid()) {
      window.AndroidAudio?.pauseAllAudio?.();
    } else {
      webAudioFallback.stopBackground();
    }
  }

  private handleAndroidResume() {
    this.isPaused = false;
    if (
      this.wasPlayingBeforePause &&
      this.isSoundEnabled &&
      this.currentTheme
    ) {
      if (this.isAndroid()) {
        window.AndroidAudio?.resumeAudio?.();
      } else {
        webAudioFallback.playBackground(
          this.mapThemeToWorldName(this.currentTheme),
        );
      }
    }
  }

  private handleAndroidStop() {
    this.isPaused = true;
    this.wasPlayingBeforePause = false;
    if (this.isAndroid()) {
      window.AndroidAudio?.stopAllAudio?.();
    } else {
      webAudioFallback.stopBackground();
    }
  }

  private syncMuteStateWithNative() {
    if (this.isAndroid()) {
      window.AndroidAudio?.setMuted?.(!this.isSoundEnabled);
    } else {
      webAudioFallback.setMuted(!this.isSoundEnabled);
    }
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      if (this.isAndroid()) {
        this.syncMuteStateWithNative();
        console.log("[SoundManager] Android audio bridge initialized");
      } else {
        webAudioFallback.setMuted(!this.isSoundEnabled);
        console.log("[SoundManager] Web Audio API fallback initialized");
      }
      this.isInitialized = true;
    } catch (error) {
      console.error("[SoundManager] Failed to initialize:", error);
    }
  }

  async loadAudioFilesFromBackend(_actor: any) {
    // No-op: audio is either bundled in APK or generated by WebAudioFallback
  }

  async playSound(context: SoundContext, _world?: Theme) {
    if (this.isPaused || !this.isSoundEnabled) return;

    try {
      const soundType = this.mapContextToNativeType(context);

      if (this.isAndroid()) {
        window.AndroidAudio!.playSound(soundType);
      } else {
        await webAudioFallback.resume();
        webAudioFallback.playEffect(soundType);
      }
    } catch (_error) {
      // Silently fail
    }
  }

  async playBackgroundMusic(theme: Theme) {
    if (this.isPaused || !this.isSoundEnabled) return;

    try {
      const worldName = this.mapThemeToWorldName(theme);

      if (this.isAndroid()) {
        window.AndroidAudio!.changeWorldMusic(worldName);
      } else {
        await webAudioFallback.resume();
        webAudioFallback.playBackground(worldName);
      }

      this.currentTheme = theme;
      this.wasPlayingBeforePause = true;
    } catch (_error) {
      // Silently fail
    }
  }

  // Play music by world ID (1-12). Worlds 7-12 use web audio fallback names directly.
  async playBackgroundMusicByWorldId(worldId: number) {
    if (this.isPaused || !this.isSoundEnabled) return;

    const worldNames: Record<number, string> = {
      1: "garden",
      2: "ocean",
      3: "candyland",
      4: "forest",
      5: "volcano",
      6: "space",
      7: "desert",
      8: "arctic",
      9: "jungle",
      10: "crystal",
      11: "shadow",
      12: "rainbow",
    };
    const worldName = worldNames[worldId] || "garden";

    try {
      if (this.isAndroid()) {
        // Android only has 6 world tracks; map extras to closest
        const androidFallback: Record<number, string> = {
          7: "space",
          8: "ocean",
          9: "forest",
          10: "candyland",
          11: "volcano",
          12: "garden",
        };
        const androidName =
          worldId <= 6 ? worldName : androidFallback[worldId] || "garden";
        window.AndroidAudio!.changeWorldMusic(androidName);
      } else {
        await webAudioFallback.resume();
        // Pass worldId to prevent restarting the same music on re-renders
        webAudioFallback.playBackground(worldName, worldId);
      }
      this.wasPlayingBeforePause = true;
    } catch {
      // Silently fail
    }
  }

  stopBackgroundMusic() {
    this.currentTheme = null;
    this.wasPlayingBeforePause = false;
    if (!this.isAndroid()) {
      webAudioFallback.stopBackground();
    }
  }

  setSoundEnabled(enabled: boolean) {
    this.isSoundEnabled = enabled;
    localStorage.setItem(SOUND_ENABLED_KEY, enabled.toString());
    this.syncMuteStateWithNative();

    if (!enabled) {
      this.stopBackgroundMusic();
      if (this.isAndroid()) {
        window.AndroidAudio?.pauseAllAudio?.();
      }
    } else if (this.currentTheme && !this.isPaused) {
      this.playBackgroundMusic(this.currentTheme);
    }
  }

  getSoundEnabled(): boolean {
    return this.isSoundEnabled;
  }

  setMusicVolume(_volume: number) {
    // Volume control via native or Web Audio
  }

  async resumeContext() {
    if (!this.isAndroid()) {
      await webAudioFallback.resume();
    }
  }

  isContextResumed(): boolean {
    return true;
  }

  getLoadedSoundsCount(): number {
    return 23;
  }

  getTotalSoundsCount(): number {
    return 23;
  }

  isPreloadComplete(): boolean {
    return true;
  }

  destroy() {
    this.isInitialized = false;
    this.isPaused = false;
    this.wasPlayingBeforePause = false;
    if (!this.isAndroid()) {
      webAudioFallback.stopBackground();
    }
  }

  private mapContextToNativeType(context: SoundContext): string {
    const mapping: Record<SoundContext, string> = {
      [SoundContext.tileClick]: "tileClick",
      [SoundContext.tileMatch]: "tileMatch",
      [SoundContext.tileClear]: "tileClear",
      [SoundContext.layerOpen]: "layerOpen",
      [SoundContext.bomb]: "bomb",
      [SoundContext.clock]: "clock",
      [SoundContext.magnifier]: "magnifier",
      [SoundContext.shuffle]: "shuffle",
      [SoundContext.levelComplete]: "levelComplete",
      [SoundContext.starEarned]: "starEarned",
      [SoundContext.worldUnlock]: "worldUnlock",
      [SoundContext.buttonClick]: "buttonClick",
      [SoundContext.rewardClaim]: "rewardClaim",
      [SoundContext.backgroundMusic]: "backgroundMusic",
      [SoundContext.bossLevelStart]: "bossLevelStart",
      [SoundContext.bossVictory]: "bossVictory",
      [SoundContext.bossDefeat]: "bossDefeat",
      [SoundContext.bossObjective]: "bossObjective",
    };
    return mapping[context] || "buttonClick";
  }

  private mapThemeToWorldName(theme: Theme): string {
    const mapping: Record<Theme, string> = {
      [Theme.garden]: "garden",
      [Theme.ocean]: "ocean",
      [Theme.candyland]: "candyland",
      [Theme.forest]: "forest",
      [Theme.volcano]: "volcano",
      [Theme.space]: "space",
    };
    return mapping[theme] || "garden";
  }
}

let soundManagerInstance: SoundManager | null = null;

export function getSoundManager(): SoundManager {
  if (!soundManagerInstance) {
    soundManagerInstance = new SoundManager();
  }
  return soundManagerInstance;
}

export { SoundManager };
