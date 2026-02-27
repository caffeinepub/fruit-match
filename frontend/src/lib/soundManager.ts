import { SoundContext, Theme } from '../backend';

const SOUND_ENABLED_KEY = 'fruitMatchSoundEnabled';

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
    // Expose SoundManager lifecycle methods to Android
    FruitMatchAudio?: {
      onPause: () => void;
      onResume: () => void;
      onStop: () => void;
    };
  }
}

class SoundManager {
  private isSoundEnabled: boolean = true;
  private isInitialized: boolean = false;
  private currentTheme: Theme | null = null;
  private wasPlayingBeforePause: boolean = false;
  private isPaused: boolean = false;

  constructor() {
    console.log('[SoundManager] Constructor called - initializing native Android audio bridge');
    
    // Load sound preference from localStorage
    const savedSoundEnabled = localStorage.getItem(SOUND_ENABLED_KEY);
    if (savedSoundEnabled !== null) {
      this.isSoundEnabled = savedSoundEnabled === 'true';
      console.log(`[SoundManager] Loaded sound preference from localStorage: ${this.isSoundEnabled ? 'enabled' : 'disabled'}`);
    } else {
      // Default to enabled
      this.isSoundEnabled = true;
      localStorage.setItem(SOUND_ENABLED_KEY, 'true');
      console.log('[SoundManager] No saved preference, defaulting to enabled');
    }
    
    // Sync mute state with native Android bridge
    this.syncMuteStateWithNative();
    
    // Expose lifecycle methods to Android
    this.exposeLifecycleMethods();
  }

  private exposeLifecycleMethods() {
    // Create global interface for Android to call
    window.FruitMatchAudio = {
      onPause: () => this.handleAndroidPause(),
      onResume: () => this.handleAndroidResume(),
      onStop: () => this.handleAndroidStop(),
    };
    console.log('[SoundManager] Lifecycle methods exposed to Android via window.FruitMatchAudio');
  }

  private handleAndroidPause() {
    console.log('[SoundManager] 🔴 Android onPause() - pausing all audio');
    this.isPaused = true;
    
    // Track if music was playing before pause
    this.wasPlayingBeforePause = this.isSoundEnabled && this.currentTheme !== null;
    
    // Call native pause
    if (window.AndroidAudio?.pauseAllAudio) {
      window.AndroidAudio.pauseAllAudio();
      console.log('[SoundManager] ✓ Native audio paused');
    }
  }

  private handleAndroidResume() {
    console.log('[SoundManager] 🟢 Android onResume() - resuming audio if needed');
    this.isPaused = false;
    
    // Only resume if sound was enabled and music was playing before pause
    if (this.wasPlayingBeforePause && this.isSoundEnabled && this.currentTheme) {
      if (window.AndroidAudio?.resumeAudio) {
        window.AndroidAudio.resumeAudio();
        console.log('[SoundManager] ✓ Native audio resumed');
      }
    } else {
      console.log('[SoundManager] Audio not resumed (wasPlaying: ' + this.wasPlayingBeforePause + ', enabled: ' + this.isSoundEnabled + ')');
    }
  }

  private handleAndroidStop() {
    console.log('[SoundManager] ⛔ Android onStop() - stopping all audio');
    this.isPaused = true;
    this.wasPlayingBeforePause = false;
    
    // Call native stop
    if (window.AndroidAudio?.stopAllAudio) {
      window.AndroidAudio.stopAllAudio();
      console.log('[SoundManager] ✓ Native audio stopped and released');
    }
  }

  private syncMuteStateWithNative() {
    if (window.AndroidAudio?.setMuted) {
      window.AndroidAudio.setMuted(!this.isSoundEnabled);
      console.log(`[SoundManager] Synced mute state with native bridge: ${!this.isSoundEnabled ? 'muted' : 'unmuted'}`);
    }
  }

  async initialize() {
    if (this.isInitialized) {
      console.log('[SoundManager] Already initialized');
      return;
    }
    
    try {
      console.log(`[SoundManager] Initializing native Android audio system (${this.isSoundEnabled ? 'enabled' : 'disabled'})...`);
      
      // Check if AndroidAudio bridge is available
      if (!window.AndroidAudio) {
        console.warn('[SoundManager] ⚠ AndroidAudio bridge not available - running in web mode without sound');
        this.isInitialized = true;
        return;
      }
      
      // Sync initial mute state
      this.syncMuteStateWithNative();
      
      this.isInitialized = true;
      console.log('[SoundManager] ✓ Native Android audio system initialized successfully');
    } catch (error) {
      console.error('[SoundManager] ✗ Failed to initialize:', error);
    }
  }

  async loadAudioFilesFromBackend(actor: any) {
    // No longer needed - all audio files are bundled in APK res/raw
    console.log('[SoundManager] Audio files are bundled in APK - skipping backend loading');
  }

  async playSound(context: SoundContext, world?: Theme) {
    // Don't play if paused or sound disabled
    if (this.isPaused) {
      console.log(`[SoundManager] App is paused, skipping sound: ${context}`);
      return;
    }
    
    if (!this.isSoundEnabled) {
      console.log(`[SoundManager] Sound disabled, skipping: ${context}`);
      return;
    }
    
    if (!window.AndroidAudio) {
      console.warn('[SoundManager] ⚠ AndroidAudio bridge not available');
      return;
    }
    
    try {
      // Map SoundContext to native sound type string
      const soundType = this.mapContextToNativeType(context);
      window.AndroidAudio.playSound(soundType);
      console.log(`[SoundManager] ♪ Playing native sound: ${soundType} (${context})`);
    } catch (error) {
      console.error(`[SoundManager] ✗ Failed to play native sound for context ${context}:`, error);
    }
  }

  async playBackgroundMusic(theme: Theme) {
    // Don't play if paused or sound disabled
    if (this.isPaused) {
      console.log('[SoundManager] App is paused, skipping background music');
      return;
    }
    
    if (!this.isSoundEnabled) {
      console.log('[SoundManager] Sound disabled, skipping background music');
      return;
    }
    
    if (!window.AndroidAudio) {
      console.warn('[SoundManager] ⚠ AndroidAudio bridge not available for background music');
      return;
    }
    
    try {
      // Map Theme to native world string
      const worldName = this.mapThemeToWorldName(theme);
      window.AndroidAudio.changeWorldMusic(worldName);
      this.currentTheme = theme;
      this.wasPlayingBeforePause = true;
      console.log(`[SoundManager] ♫ Native background music changed to: ${worldName} (${theme})`);
    } catch (error) {
      console.error(`[SoundManager] ✗ Failed to change native background music for theme ${theme}:`, error);
    }
  }

  stopBackgroundMusic() {
    // Background music is managed by native MediaPlayer
    console.log('[SoundManager] Background music stop handled by native MediaPlayer');
    this.currentTheme = null;
    this.wasPlayingBeforePause = false;
  }

  // Global sound control - affects ALL audio (music + effects)
  setSoundEnabled(enabled: boolean) {
    console.log(`[SoundManager] Global sound ${enabled ? 'enabled' : 'disabled'}`);
    this.isSoundEnabled = enabled;
    
    // Save to localStorage
    localStorage.setItem(SOUND_ENABLED_KEY, enabled.toString());
    
    // Sync with native Android bridge
    this.syncMuteStateWithNative();
    
    if (!enabled) {
      // Stop background music when muting
      this.stopBackgroundMusic();
      if (window.AndroidAudio?.pauseAllAudio) {
        window.AndroidAudio.pauseAllAudio();
      }
    } else if (this.currentTheme && !this.isPaused) {
      // Resume background music when unmuting (only if not paused by lifecycle)
      this.playBackgroundMusic(this.currentTheme);
    }
  }

  getSoundEnabled(): boolean {
    return this.isSoundEnabled;
  }

  setMusicVolume(volume: number) {
    // Volume control is handled by native MediaPlayer
    console.log(`[SoundManager] Music volume control handled by native MediaPlayer: ${(volume * 100).toFixed(0)}%`);
  }

  async resumeContext() {
    // No AudioContext to resume - native audio is always ready
    console.log('[SoundManager] Native audio system is always ready');
  }

  isContextResumed(): boolean {
    // Native audio is always ready
    return true;
  }

  getLoadedSoundsCount(): number {
    // All sounds are bundled in APK
    return 23; // Updated to include 4 new boss level sounds
  }

  getTotalSoundsCount(): number {
    // All sounds are bundled in APK
    return 23; // Updated to include 4 new boss level sounds
  }

  isPreloadComplete(): boolean {
    // All sounds are bundled in APK
    return true;
  }

  destroy() {
    console.log('[SoundManager] Destroying native audio manager...');
    this.isInitialized = false;
    this.isPaused = false;
    this.wasPlayingBeforePause = false;
    console.log('[SoundManager] ✓ Destroyed');
  }

  // Helper: Map SoundContext enum to native sound type string
  private mapContextToNativeType(context: SoundContext): string {
    const mapping: Record<SoundContext, string> = {
      [SoundContext.tileClick]: 'tileClick',
      [SoundContext.tileMatch]: 'tileMatch',
      [SoundContext.tileClear]: 'tileClear',
      [SoundContext.layerOpen]: 'layerOpen',
      [SoundContext.bomb]: 'bomb',
      [SoundContext.clock]: 'clock',
      [SoundContext.magnifier]: 'magnifier',
      [SoundContext.shuffle]: 'shuffle',
      [SoundContext.levelComplete]: 'levelComplete',
      [SoundContext.starEarned]: 'starEarned',
      [SoundContext.worldUnlock]: 'worldUnlock',
      [SoundContext.buttonClick]: 'buttonClick',
      [SoundContext.rewardClaim]: 'rewardClaim',
      [SoundContext.backgroundMusic]: 'backgroundMusic',
      [SoundContext.bossLevelStart]: 'bossLevelStart',
      [SoundContext.bossVictory]: 'bossVictory',
      [SoundContext.bossDefeat]: 'bossDefeat',
      [SoundContext.bossObjective]: 'bossObjective',
    };
    
    return mapping[context] || 'buttonClick';
  }

  // Helper: Map Theme enum to native world name string
  private mapThemeToWorldName(theme: Theme): string {
    const mapping: Record<Theme, string> = {
      [Theme.garden]: 'garden',
      [Theme.ocean]: 'ocean',
      [Theme.candyland]: 'candyland',
      [Theme.forest]: 'forest',
      [Theme.volcano]: 'volcano',
      [Theme.space]: 'space',
    };
    
    return mapping[theme] || 'garden';
  }
}

// Singleton instance
let soundManagerInstance: SoundManager | null = null;

export function getSoundManager(): SoundManager {
  if (!soundManagerInstance) {
    soundManagerInstance = new SoundManager();
  }
  return soundManagerInstance;
}

export { SoundManager };
