import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Volume2, VolumeX, Sparkles, User } from 'lucide-react';
import AnimatedLogo from '@/components/AnimatedLogo';
import { Theme, SoundContext } from '../backend';
import { Language } from '../lib/localStorageManager';
import { getSoundManager } from '../lib/soundManager';
import LanguageSelector from '@/components/LanguageSelector';
import { useLanguage } from '@/hooks/useLanguage';

interface TitleScreenProps {
  onStart: () => void;
  onPlayerRegister: (playerName: string) => void;
  onShowProfile: () => void;
  existingPlayerName: string | null;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  onLanguageChange: (language: Language) => void;
}

const THEME_CONFIG: Record<Theme, { name: string; emoji: string; gradient: string; bgImage: string; description: string }> = {
  [Theme.garden]: { 
    name: 'garden', 
    emoji: '🌿', 
    gradient: 'from-fruit-garden-light via-fruit-garden to-fruit-garden-dark',
    bgImage: '/assets/generated/garden-background-pastel.dim_1024x768.jpg',
    description: 'garden_desc'
  },
  [Theme.ocean]: { 
    name: 'ocean', 
    emoji: '🌊', 
    gradient: 'from-fruit-ocean-light via-fruit-ocean to-fruit-ocean-dark',
    bgImage: '/assets/generated/ocean-background.dim_1024x768.jpg',
    description: 'ocean_desc'
  },
  [Theme.candyland]: { 
    name: 'candyland', 
    emoji: '🍭', 
    gradient: 'from-fruit-candyland-light via-fruit-candyland to-fruit-candyland-dark',
    bgImage: '/assets/generated/candyland-background.dim_1024x768.jpg',
    description: 'candyland_desc'
  },
  [Theme.forest]: { 
    name: 'forest', 
    emoji: '🌲', 
    gradient: 'from-fruit-forest-light via-fruit-forest to-fruit-forest-dark',
    bgImage: '/assets/generated/forest-background-lush.dim_1024x768.jpg',
    description: 'forest_desc'
  },
  [Theme.volcano]: { 
    name: 'volcano', 
    emoji: '🌋', 
    gradient: 'from-fruit-volcano-light via-fruit-volcano to-fruit-volcano-dark',
    bgImage: '/assets/generated/volcano-background-glow.dim_1024x768.jpg',
    description: 'volcano_desc'
  },
  [Theme.space]: { 
    name: 'space', 
    emoji: '🚀', 
    gradient: 'from-fruit-space-light via-fruit-space to-fruit-space-dark',
    bgImage: '/assets/generated/space-background-neon.dim_1024x768.jpg',
    description: 'space_desc'
  },
};

export default function TitleScreen({ onStart, onPlayerRegister, onShowProfile, existingPlayerName, currentTheme, onThemeChange, onLanguageChange }: TitleScreenProps) {
  const [playerName, setPlayerName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showThemeSelector, setShowThemeSelector] = useState<boolean>(false);
  const sparkleCanvasRef = useRef<HTMLCanvasElement>(null);
  const sparkleAnimationRef = useRef<number | undefined>(undefined);

  const { t } = useLanguage();
  
  const soundManager = getSoundManager();
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(soundManager.getSoundEnabled());

  // Determine if we should show name input (only for new users without existing data)
  const showNameInput = !existingPlayerName;

  // Sparkle animation effect
  useEffect(() => {
    const canvas = sparkleCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface Sparkle {
      x: number;
      y: number;
      size: number;
      opacity: number;
      speed: number;
    }

    const sparkles: Sparkle[] = [];
    const sparkleCount = 40;

    for (let i = 0; i < sparkleCount; i++) {
      sparkles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 4 + 1,
        opacity: Math.random(),
        speed: Math.random() * 0.5 + 0.2,
      });
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      sparkles.forEach((sparkle) => {
        sparkle.opacity += sparkle.speed * 0.02;
        if (sparkle.opacity > 1 || sparkle.opacity < 0) {
          sparkle.speed *= -1;
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(sparkle.opacity) * 0.8})`;
        ctx.beginPath();
        ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      sparkleAnimationRef.current = requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (sparkleAnimationRef.current !== undefined) {
        cancelAnimationFrame(sparkleAnimationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const playClickSound = async () => {
    await soundManager.resumeContext();
    await soundManager.playSound(SoundContext.buttonClick);
  };

  const toggleSound = async () => {
    await soundManager.resumeContext();
    
    const newState = !isSoundEnabled;
    setIsSoundEnabled(newState);
    soundManager.setSoundEnabled(newState);
    
    await playClickSound();
  };

  const handleThemeSelect = async (theme: Theme) => {
    await playClickSound();
    onThemeChange(theme);
  };

  const handleRegister = async () => {
    const trimmedName = playerName.trim();
    
    if (!trimmedName) {
      setError(t('name_required'));
      return;
    }
    
    if (trimmedName.length < 2) {
      setError(t('name_min_length'));
      return;
    }
    
    if (trimmedName.length > 20) {
      setError(t('name_max_length'));
      return;
    }
    
    await playClickSound();
    onPlayerRegister(trimmedName);
  };

  const handleStart = async () => {
    await playClickSound();
    await soundManager.resumeContext();
    onStart();
  };

  const handleShowProfile = async () => {
    await playClickSound();
    onShowProfile();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRegister();
    }
  };

  const themeGradient = THEME_CONFIG[currentTheme].gradient;
  const allThemes = [Theme.garden, Theme.ocean, Theme.candyland, Theme.forest, Theme.volcano, Theme.space];

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${themeGradient} opacity-70 transition-all duration-1000`} />
      <div className="absolute inset-0 bg-black/20" />

      <canvas
        ref={sparkleCanvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 2 }}>
        <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white/10 animate-float backdrop-blur-sm" />
        <div className="absolute top-32 right-20 w-16 h-16 rounded-full bg-white/10 animate-float-delayed backdrop-blur-sm" />
        <div className="absolute bottom-20 left-32 w-24 h-24 rounded-full bg-white/10 animate-float backdrop-blur-sm" />
        <div className="absolute bottom-40 right-40 w-20 h-20 rounded-full bg-white/10 animate-float-delayed backdrop-blur-sm" />
      </div>

      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
        <LanguageSelector variant="compact" />
      </div>

      <button
        onClick={toggleSound}
        className="absolute top-6 right-6 z-20 p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200 hover:scale-110 shadow-lg"
        aria-label={t('sound_toggle')}
      >
        {isSoundEnabled ? (
          <Volume2 className="w-6 h-6 text-white" />
        ) : (
          <VolumeX className="w-6 h-6 text-white" />
        )}
      </button>

      <button
        onClick={async () => {
          await playClickSound();
          setShowThemeSelector(!showThemeSelector);
        }}
        className="absolute top-6 left-6 z-20 px-4 py-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200 hover:scale-110 flex items-center gap-2 shadow-lg"
        aria-label={t('select_theme')}
      >
        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        <span className="text-white font-semibold text-xs sm:text-sm">{t('select_theme')}</span>
      </button>

      {existingPlayerName && (
        <button
          onClick={handleShowProfile}
          className="absolute top-20 left-6 z-20 px-4 py-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200 hover:scale-110 flex items-center gap-2 shadow-lg"
          aria-label={t('profile')}
        >
          <User className="w-6 h-6 text-white" />
          <span className="text-white font-semibold text-sm hidden sm:inline">{t('profile')}</span>
        </button>
      )}

      {showThemeSelector && (
        <div className="absolute top-24 left-6 z-30 bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-top-5 duration-300 max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-gray-800">{t('select_theme')}</h3>
            <button
              onClick={() => setShowThemeSelector(false)}
              className="text-gray-500 hover:text-gray-800 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {allThemes.map((theme) => {
              const config = THEME_CONFIG[theme];
              const isSelected = currentTheme === theme;
              
              return (
                <button
                  key={theme}
                  onClick={() => handleThemeSelect(theme)}
                  className={`group relative flex flex-col items-center gap-3 p-5 rounded-2xl transition-all duration-300 hover:scale-105 overflow-hidden ${
                    isSelected
                      ? 'ring-4 ring-white shadow-2xl'
                      : 'hover:shadow-xl'
                  }`}
                  style={{
                    backgroundImage: `url(${config.bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} ${isSelected ? 'opacity-80' : 'opacity-70 group-hover:opacity-80'} transition-opacity duration-300`} />
                  
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <span className="text-5xl drop-shadow-lg">{config.emoji}</span>
                    <span className="text-lg font-bold text-white drop-shadow-md">{t(config.name as any)}</span>
                    <span className="text-xs text-white/90 drop-shadow-sm">{t(config.description as any)}</span>
                  </div>
                  
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow-lg">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center gap-12 px-4">
        <AnimatedLogo />
        
        <h1 className="text-6xl md:text-8xl font-bold text-white drop-shadow-2xl text-center animate-bounce-slow">
          Fruit Match
        </h1>
        
        <p className="text-xl md:text-2xl text-white/95 text-center max-w-md drop-shadow-lg font-semibold">
          {t('match')} • {t('earn_stars')} • {t('unlock_worlds')}
        </p>

        {showNameInput ? (
          <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="playerName" className="text-lg font-semibold text-gray-800">
                  {t('player_name')}
                </Label>
                <Input
                  id="playerName"
                  type="text"
                  placeholder={t('enter_name')}
                  value={playerName}
                  onChange={(e) => {
                    setPlayerName(e.target.value);
                    setError('');
                  }}
                  onKeyPress={handleKeyPress}
                  className="text-lg py-6 border-2 border-gray-300 focus:border-gray-500 rounded-xl"
                  maxLength={20}
                  autoFocus
                />
                {error && (
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                )}
              </div>
              <Button
                onClick={handleRegister}
                size="lg"
                className={`w-full text-xl py-6 rounded-xl text-white shadow-lg hover:scale-105 transition-all duration-200 font-bold bg-gradient-to-r ${themeGradient} hover:opacity-90`}
              >
                {t('register_and_start')}
              </Button>
            </div>
          </div>
        ) : existingPlayerName ? (
          <div className="flex flex-col items-center gap-6">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl px-8 py-4 shadow-xl">
              <p className="text-2xl font-bold text-gray-800 text-center">
                {t('welcome_back')}, {existingPlayerName}! 🎉
              </p>
            </div>
            <Button
              onClick={handleStart}
              size="lg"
              className="text-2xl px-12 py-8 rounded-2xl bg-white text-gray-800 hover:bg-white/90 shadow-2xl hover:scale-105 transition-all duration-200 font-bold"
            >
              {t('start_game')}
            </Button>
          </div>
        ) : null}

        {!showNameInput && (
          <div className="flex gap-6 mt-8">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/20 transition-all duration-200">
              <div className="text-5xl mb-2">🍎</div>
              <p className="text-white font-semibold text-sm drop-shadow-md">{t('match')}</p>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/20 transition-all duration-200">
              <div className="text-5xl mb-2">⭐</div>
              <p className="text-white font-semibold text-sm drop-shadow-md">{t('earn_stars')}</p>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/20 transition-all duration-200">
              <div className="text-5xl mb-2">🌍</div>
              <p className="text-white font-semibold text-sm drop-shadow-md">{t('unlock_worlds')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
