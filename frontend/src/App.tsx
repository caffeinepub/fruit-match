import { useState, useEffect } from 'react';
import TitleScreen from './pages/TitleScreen';
import WorldMap from './pages/WorldMap';
import GamePlay from './pages/GamePlay';
import AdminPanel from './pages/AdminPanel';
import PlayerProfile from './pages/PlayerProfile';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { LanguageProvider, useLanguage } from './hooks/useLanguage';
import { useActor } from './hooks/useActor';
import { Theme } from './backend';
import { getSoundManager } from './lib/soundManager';
import * as LocalStorage from './lib/localStorageManager';

export type GameScreen = 'title' | 'worldmap' | 'gameplay' | 'admin' | 'profile';

const THEME_BACKGROUNDS: Record<Theme, string> = {
  [Theme.garden]: '/assets/generated/garden-background-pastel.dim_1024x768.jpg',
  [Theme.ocean]: '/assets/generated/ocean-background.dim_1024x768.jpg',
  [Theme.candyland]: '/assets/generated/candyland-background.dim_1024x768.jpg',
  [Theme.forest]: '/assets/generated/forest-background-lush.dim_1024x768.jpg',
  [Theme.volcano]: '/assets/generated/volcano-background-glow.dim_1024x768.jpg',
  [Theme.space]: '/assets/generated/space-background-neon.dim_1024x768.jpg',
};

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('title');
  const [selectedWorld, setSelectedWorld] = useState<number>(1);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [playerName, setPlayerName] = useState<string>('');
  const [isPlayerRegistered, setIsPlayerRegistered] = useState<boolean>(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>(Theme.garden);
  const [soundManagerInitialized, setSoundManagerInitialized] = useState<boolean>(false);
  const [isLoadingPlayerData, setIsLoadingPlayerData] = useState<boolean>(true);

  const { language, setLanguage: setContextLanguage, t } = useLanguage();
  const { actor, isFetching } = useActor();

  // Initialize native sound manager (no backend loading needed)
  useEffect(() => {
    const initSoundManager = async () => {
      if (soundManagerInitialized) return;
      
      try {
        console.log('[App] Initializing native sound manager...');
        const soundManager = getSoundManager();
        await soundManager.initialize();
        setSoundManagerInitialized(true);
        console.log('[App] ✓ Native sound manager fully initialized');
      } catch (error) {
        console.error('[App] ✗ Failed to initialize native sound manager:', error);
      }
    };
    
    initSoundManager();
  }, [soundManagerInitialized]);

  // Automatically load existing player data from localStorage on mount
  useEffect(() => {
    console.log('[App] Checking for existing player data...');
    const playerData = LocalStorage.loadPlayerData();
    
    if (playerData) {
      // Player data exists - automatically load it and skip registration
      console.log('[App] ✓ Found existing player data, loading saved game state');
      setPlayerName(playerData.username);
      setIsPlayerRegistered(true);
      
      // Load saved theme
      const themeValue = playerData.theme as keyof typeof Theme;
      if (Theme[themeValue]) {
        setCurrentTheme(Theme[themeValue]);
        applyThemeToDocument(Theme[themeValue]);
      }
      
      // Load saved language
      const langValue = playerData.language as keyof typeof LocalStorage.Language;
      if (LocalStorage.Language[langValue]) {
        setContextLanguage(LocalStorage.Language[langValue]);
      }
      
      console.log('[App] ✓ Game state restored successfully for user:', playerData.username);
    } else {
      // No existing data - new player will need to register
      console.log('[App] No existing player data - new user will register');
    }

    setIsLoadingPlayerData(false);

    // Check for admin mode via URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
      console.log('[App] Admin mode activated via URL parameter');
      setCurrentScreen('admin');
    }
  }, []);

  // Play background music when theme changes (using native Android bridge)
  useEffect(() => {
    if (soundManagerInitialized && currentScreen !== 'title' && currentScreen !== 'admin') {
      const soundManager = getSoundManager();
      soundManager.playBackgroundMusic(currentTheme);
    }
  }, [currentTheme, soundManagerInitialized, currentScreen]);

  const applyThemeToDocument = (theme: Theme) => {
    const root = document.documentElement;
    const body = document.body;
    
    root.classList.remove('theme-garden', 'theme-ocean', 'theme-candyland', 'theme-forest', 'theme-volcano', 'theme-space');
    root.classList.add(`theme-${theme}`);
    
    if (currentScreen !== 'admin') {
      const backgroundImage = THEME_BACKGROUNDS[theme];
      body.style.backgroundImage = `url(${backgroundImage})`;
      body.style.backgroundSize = 'cover';
      body.style.backgroundPosition = 'center';
      body.style.backgroundAttachment = 'fixed';
      body.style.backgroundRepeat = 'no-repeat';
    } else {
      body.style.backgroundImage = 'none';
    }
  };

  const handlePlayerRegistration = async (name: string) => {
    console.log('[App] Registering new player:', name);
    
    // Initialize player data in localStorage (only for new players)
    LocalStorage.initializePlayer(name, currentTheme, language);
    
    setPlayerName(name);
    setIsPlayerRegistered(true);
    console.log('[App] ✓ New player registered successfully');
  };

  const handleThemeChange = (theme: Theme) => {
    console.log('[App] Changing theme to:', theme);
    setCurrentTheme(theme);
    applyThemeToDocument(theme);
    
    // Save to localStorage (persists across sessions)
    LocalStorage.updateTheme(theme);
  };

  const handleLanguageChange = (newLanguage: LocalStorage.Language) => {
    console.log('[App] Changing language to:', newLanguage);
    setContextLanguage(newLanguage);
    
    // Save to localStorage (persists across sessions)
    LocalStorage.updateLanguage(newLanguage);
  };

  const handleStartGame = async () => {
    console.log('[App] Starting game');
    setCurrentScreen('worldmap');
    
    if (soundManagerInitialized) {
      const soundManager = getSoundManager();
      await soundManager.playBackgroundMusic(currentTheme);
    }
  };

  const handleSelectLevel = (worldId: number, levelId: number) => {
    console.log(`[App] Selecting level: World ${worldId}, Level ${levelId}`);
    setSelectedWorld(worldId);
    setSelectedLevel(levelId);
    setCurrentScreen('gameplay');
  };

  const handleBackToWorldMap = () => {
    console.log('[App] Returning to world map');
    setCurrentScreen('worldmap');
  };

  const handleBackToTitle = () => {
    console.log('[App] Returning to title screen');
    setCurrentScreen('title');
    
    const soundManager = getSoundManager();
    soundManager.stopBackgroundMusic();
  };

  const handleBackFromAdmin = () => {
    console.log('[App] Exiting admin panel');
    setCurrentScreen('title');
    applyThemeToDocument(currentTheme);
  };

  const handleShowProfile = () => {
    console.log('[App] Navigating to player profile');
    setCurrentScreen('profile');
  };

  useEffect(() => {
    applyThemeToDocument(currentTheme);
  }, [currentScreen]);

  // Show loading state while checking for player data
  if (isLoadingPlayerData) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-fruit-garden-light via-fruit-garden to-fruit-garden-dark">
        <div className="text-white text-2xl font-bold animate-pulse">
          {t('loading')}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-hidden">
      {currentScreen === 'title' && (
        <TitleScreen
          onStart={handleStartGame}
          onPlayerRegister={handlePlayerRegistration}
          onShowProfile={handleShowProfile}
          existingPlayerName={isPlayerRegistered ? playerName : null}
          currentTheme={currentTheme}
          onThemeChange={handleThemeChange}
          onLanguageChange={handleLanguageChange}
        />
      )}
      {currentScreen === 'worldmap' && isPlayerRegistered && (
        <WorldMap
          onSelectLevel={handleSelectLevel}
          onBackToTitle={handleBackToTitle}
          currentTheme={currentTheme}
        />
      )}
      {currentScreen === 'gameplay' && isPlayerRegistered && (
        <GamePlay
          worldId={selectedWorld}
          levelId={selectedLevel}
          onBack={handleBackToWorldMap}
          currentTheme={currentTheme}
        />
      )}
      {currentScreen === 'profile' && isPlayerRegistered && (
        <PlayerProfile
          onBackToTitle={handleBackToTitle}
          currentTheme={currentTheme}
        />
      )}
      {currentScreen === 'admin' && (
        <AdminPanel onBack={handleBackFromAdmin} />
      )}
      <Toaster richColors position="top-center" />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
