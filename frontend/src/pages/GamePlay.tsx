import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Star, Clock, Zap, Trophy, Volume2, VolumeX, MapPin, AlertCircle, Skull } from 'lucide-react';
import GameBoard from '@/components/GameBoard';
import PowerUpPanel from '@/components/PowerUpPanel';
import { generateLevel, type Tile, type Level } from '@/lib/gameLogic';
import { toast } from 'sonner';
import { Theme, SoundContext } from '../backend';
import { getSoundManager } from '../lib/soundManager';
import { useLanguage } from '@/hooks/useLanguage';
import * as LocalStorage from '../lib/localStorageManager';

interface GamePlayProps {
  worldId: number;
  levelId: number;
  onBack: () => void;
  currentTheme: Theme;
}

const WORLD_THEME_COLORS = {
  1: { primary: 'oklch(var(--fruit-garden))', secondary: 'oklch(var(--fruit-garden-light))' },
  2: { primary: 'oklch(var(--fruit-ocean))', secondary: 'oklch(var(--fruit-ocean-light))' },
  3: { primary: 'oklch(var(--fruit-candyland))', secondary: 'oklch(var(--fruit-candyland-light))' },
  4: { primary: 'oklch(var(--fruit-forest))', secondary: 'oklch(var(--fruit-forest-light))' },
  5: { primary: 'oklch(var(--fruit-volcano))', secondary: 'oklch(var(--fruit-volcano-light))' },
  6: { primary: 'oklch(var(--fruit-space))', secondary: 'oklch(var(--fruit-space-light))' },
  7: { primary: 'oklch(var(--fruit-desert))', secondary: 'oklch(var(--fruit-desert-light))' },
  8: { primary: 'oklch(var(--fruit-arctic))', secondary: 'oklch(var(--fruit-arctic-light))' },
  9: { primary: 'oklch(var(--fruit-jungle))', secondary: 'oklch(var(--fruit-jungle-light))' },
  10: { primary: 'oklch(var(--fruit-crystal))', secondary: 'oklch(var(--fruit-crystal-light))' },
  11: { primary: 'oklch(var(--fruit-shadow))', secondary: 'oklch(var(--fruit-shadow-light))' },
  12: { primary: 'oklch(var(--fruit-rainbow))', secondary: 'oklch(var(--fruit-rainbow-light))' },
};

const WORLD_ICONS = {
  1: '/assets/generated/garden-world-icon-transparent.dim_64x64.png',
  2: '/assets/generated/ocean-world-icon-transparent.dim_64x64.png',
  3: '/assets/generated/candyland-world-icon-transparent.dim_64x64.png',
  4: '/assets/generated/forest-world-icon-transparent.dim_64x64.png',
  5: '/assets/generated/volcano-world-icon-transparent.dim_64x64.png',
  6: '/assets/generated/space-world-icon-transparent.dim_64x64.png',
  7: '/assets/generated/desert-world-icon-transparent.dim_64x64.png',
  8: '/assets/generated/arctic-world-icon-transparent.dim_64x64.png',
  9: '/assets/generated/jungle-world-icon-transparent.dim_64x64.png',
  10: '/assets/generated/crystal-world-icon-transparent.dim_64x64.png',
  11: '/assets/generated/shadow-world-icon-transparent.dim_64x64.png',
  12: '/assets/generated/rainbow-world-icon-transparent.dim_64x64.png',
};

// Default fallback level for emergency rendering
function createFallbackLevel(worldId: number, levelId: number): Level {
  const tiles: Tile[] = [];
  const fruitTypes = ['apple', 'orange', 'banana', 'grape'];
  
  // Create 8 pairs (16 tiles) as basic fallback
  for (let i = 0; i < 8; i++) {
    const fruitType = fruitTypes[i % fruitTypes.length];
    tiles.push(
      { id: i * 2, fruitType, matched: false, covered: false },
      { id: i * 2 + 1, fruitType, matched: false, covered: false }
    );
  }
  
  return {
    tiles,
    timeLimit: 120,
    powerUps: [
      { type: 'bomb', count: 2 },
      { type: 'time', count: 2 },
      { type: 'hint', count: 3 },
      { type: 'shuffle', count: 1 }
    ],
    isBoss: levelId === 30
  };
}

export default function GamePlay({ worldId, levelId, onBack, currentTheme }: GamePlayProps) {
  const { t } = useLanguage();
  
  // CRITICAL: Force state initialization to ensure rendering
  const [gameStarted, setGameStarted] = useState(true); // Always true
  const [isPlaying, setIsPlaying] = useState(true); // Always true
  
  // Initialize with fallback to guarantee valid state
  const [levelData, setLevelData] = useState<Level>(() => createFallbackLevel(worldId, levelId));
  const [tiles, setTiles] = useState<Tile[]>(() => createFallbackLevel(worldId, levelId).tiles);
  
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(120);
  const [initialTimeLimit, setInitialTimeLimit] = useState(120);
  const [matchCount, setMatchCount] = useState(0);
  const [powerUpCounts, setPowerUpCounts] = useState<LocalStorage.PowerUpCounts>({ bomb: 0, clock: 0, shuffle: 0, magnifier: 0 });
  const [gameStartTime] = useState(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);
  const [starBreakdown, setStarBreakdown] = useState<string[]>([]);
  const [matchEffects, setMatchEffects] = useState<Array<{ id: string; x: number; y: number }>>([]);
  const timerRef = useRef<number | null>(null);
  const autoCloseTimerRef = useRef<number | null>(null);
  const bossAudioPlayedRef = useRef(false);

  const themeColors = WORLD_THEME_COLORS[worldId as keyof typeof WORLD_THEME_COLORS] || WORLD_THEME_COLORS[1];
  const worldIcon = WORLD_ICONS[worldId as keyof typeof WORLD_ICONS] || WORLD_ICONS[1];
  const soundManager = getSoundManager();
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(soundManager.getSoundEnabled());

  const isBossLevel = levelData.isBoss || levelId === 30;

  useEffect(() => {
    const resumeAudio = async () => {
      await soundManager.resumeContext();
    };
    resumeAudio();
  }, [soundManager]);

  // Play boss level start audio
  useEffect(() => {
    if (isBossLevel && !bossAudioPlayedRef.current) {
      const playBossAudio = async () => {
        await soundManager.playSound(SoundContext.bossLevelStart);
        bossAudioPlayedRef.current = true;
      };
      playBossAudio();
    }
  }, [isBossLevel, soundManager]);

  const toggleSound = async () => {
    await soundManager.resumeContext();
    
    const newState = !isSoundEnabled;
    setIsSoundEnabled(newState);
    soundManager.setSoundEnabled(newState);
  };

  // Initialize level data with comprehensive error handling and fallback
  useEffect(() => {
    console.log(`[GamePlay] Initializing level - World ${worldId}, Level ${levelId}${levelId === 30 ? ' (BOSS)' : ''}`);
    
    // Validate world and level parameters
    if (worldId < 1 || worldId > 12) {
      console.error(`[GamePlay] ✗ Invalid worldId: ${worldId}, using fallback`);
      setLoadError('Geçersiz dünya numarası');
      const fallback = createFallbackLevel(1, 1);
      setLevelData(fallback);
      setTiles(fallback.tiles);
      setTimeLeft(fallback.timeLimit);
      setInitialTimeLimit(fallback.timeLimit);
      return;
    }
    
    if (levelId < 1 || levelId > 30) {
      console.error(`[GamePlay] ✗ Invalid levelId: ${levelId}, using fallback`);
      setLoadError('Geçersiz seviye numarası');
      const fallback = createFallbackLevel(worldId, 1);
      setLevelData(fallback);
      setTiles(fallback.tiles);
      setTimeLeft(fallback.timeLimit);
      setInitialTimeLimit(fallback.timeLimit);
      return;
    }

    try {
      // Generate level data
      const level = generateLevel(worldId, levelId);
      
      // Validate level data structure with fallback
      if (!level || !level.tiles || !Array.isArray(level.tiles) || level.tiles.length === 0) {
        console.error('[GamePlay] ✗ Invalid level data, using fallback');
        setLoadError('Seviye verileri yüklenemedi');
        const fallback = createFallbackLevel(worldId, levelId);
        setLevelData(fallback);
        setTiles(fallback.tiles);
        setTimeLeft(fallback.timeLimit);
        setInitialTimeLimit(fallback.timeLimit);
        return;
      }
      
      if (typeof level.timeLimit !== 'number' || level.timeLimit <= 0) {
        console.error('[GamePlay] ✗ Invalid timeLimit, using default');
        level.timeLimit = 120;
      }
      
      console.log(`[GamePlay] ✓ Level generated successfully with ${level.tiles.length} tiles, ${level.timeLimit}s time limit${level.isBoss ? ' (BOSS LEVEL)' : ''}`);
      
      // Set level data - ALWAYS ensure valid state
      setLevelData(level);
      setTiles(level.tiles);
      setTimeLeft(level.timeLimit);
      setInitialTimeLimit(level.timeLimit);
      setLoadError(null);
      
      // Force game state to playing
      setGameStarted(true);
      setIsPlaying(true);
      
      // Load power-up counts from localStorage
      const counts = LocalStorage.getPowerUpCounts();
      setPowerUpCounts(counts);
      console.log('[GamePlay] ✓ Power-up counts loaded:', counts);
      
    } catch (error) {
      console.error('[GamePlay] ✗ Error generating level:', error);
      setLoadError('Oyun yüklenirken hata oluştu');
      // Use fallback even on error
      const fallback = createFallbackLevel(worldId, levelId);
      setLevelData(fallback);
      setTiles(fallback.tiles);
      setTimeLeft(fallback.timeLimit);
      setInitialTimeLimit(fallback.timeLimit);
    }
  }, [worldId, levelId]);

  useEffect(() => {
    if (isCompleted) return;

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCompleted]);

  useEffect(() => {
    if (isCompleted) {
      autoCloseTimerRef.current = window.setTimeout(() => {
        onBack();
      }, 4000);
    }

    return () => {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    };
  }, [isCompleted, onBack]);

  const handleGameOver = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Play boss defeat sound if it's a boss level
    if (isBossLevel) {
      await soundManager.playSound(SoundContext.bossDefeat);
    }
    
    toast.error(t('time_up'));
    setTimeout(() => onBack(), 2000);
  };

  const createMatchEffect = (tileId: number) => {
    const effectId = `effect-${Date.now()}-${Math.random()}`;
    const tileElement = document.querySelector(`[data-tile-id="${tileId}"]`);
    if (tileElement) {
      const rect = tileElement.getBoundingClientRect();
      setMatchEffects((prev) => [
        ...prev,
        { id: effectId, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
      ]);
      setTimeout(() => {
        setMatchEffects((prev) => prev.filter((e) => e.id !== effectId));
      }, 1000);
    }
  };

  const handleTileClick = useCallback(
    async (tileId: number) => {
      const tile = tiles.find((t) => t.id === tileId);
      if (!tile || tile.matched || tile.covered) return;

      await soundManager.playSound(SoundContext.tileClick);

      if (selectedTile === null) {
        setSelectedTile(tileId);
      } else if (selectedTile === tileId) {
        setSelectedTile(null);
      } else {
        const firstTile = tiles.find((t) => t.id === selectedTile);
        if (firstTile && firstTile.fruitType === tile.fruitType) {
          await soundManager.playSound(SoundContext.tileMatch);
          createMatchEffect(selectedTile);
          createMatchEffect(tileId);

          setTiles((prev) =>
            prev.map((t) => {
              if (t.id === selectedTile || t.id === tileId) {
                return { ...t, matched: true };
              }
              if (t.covered && (t.coveredBy === selectedTile || t.coveredBy === tileId)) {
                soundManager.playSound(SoundContext.layerOpen);
                return { ...t, covered: false, coveredBy: undefined };
              }
              return t;
            })
          );
          
          await soundManager.playSound(SoundContext.tileClear);
          setMatchCount((prev) => prev + 1);
          setSelectedTile(null);

          const remainingTiles = tiles.filter(
            (t) => !t.matched && t.id !== selectedTile && t.id !== tileId
          );
          if (remainingTiles.length === 0) {
            handleLevelComplete();
          }
        } else {
          setSelectedTile(tileId);
        }
      }
    },
    [tiles, selectedTile, soundManager]
  );

  const handleLevelComplete = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    // Play boss victory sound if it's a boss level
    if (isBossLevel) {
      await soundManager.playSound(SoundContext.bossVictory);
    } else {
      await soundManager.playSound(SoundContext.levelComplete);
    }

    const timeTaken = (Date.now() - gameStartTime) / 1000;
    const timeLimit = initialTimeLimit;
    let stars = 1;
    const breakdown: string[] = [];

    const timePercentage = timeTaken / timeLimit;
    
    if (timePercentage < 0.4) {
      stars = 3;
      breakdown.push(`⭐⭐⭐ ${t('very_fast')}`);
    } else if (timePercentage < 0.7) {
      stars = 2;
      breakdown.push(`⭐⭐ ${t('normal_time')}`);
    } else {
      stars = 1;
      breakdown.push(`⭐ ${t('slow_completion')}`);
    }

    for (let i = 0; i < stars; i++) {
      setTimeout(async () => {
        await soundManager.playSound(SoundContext.starEarned);
      }, i * 300);
    }

    breakdown.push(`⏱️ ${t('completion_time')}: ${Math.round(timeTaken)} ${t('seconds')}`);
    breakdown.push(`🎯 ${t('total_matches')}: ${matchCount} ${t('pairs')}`);

    setEarnedStars(stars);
    setStarBreakdown(breakdown);
    
    // Update level progress in localStorage
    LocalStorage.updateLevelProgress(worldId, levelId, stars);
    console.log(`[GamePlay] ✓ Level progress saved to localStorage - World ${worldId}, Level ${levelId}, Stars: ${stars}`);
    
    setIsCompleted(true);
  };

  const activatePowerUp = async (type: string) => {
    const powerUpType = type as keyof LocalStorage.PowerUpCounts;
    
    // Check if power-up is available
    if (powerUpCounts[powerUpType] <= 0) {
      toast.error('Bu güç artırıcı kullanılamıyor!');
      return;
    }

    // Consume power-up from localStorage
    const success = LocalStorage.consumePowerUp(powerUpType);
    if (!success) {
      toast.error('Güç artırıcı kullanılamadı!');
      return;
    }

    // Update local state
    setPowerUpCounts(prev => ({
      ...prev,
      [powerUpType]: prev[powerUpType] - 1
    }));

    switch (type) {
      case 'bomb':
        await soundManager.playSound(SoundContext.bomb);
        const visibleTiles = tiles.filter((t) => !t.matched && !t.covered);
        if (visibleTiles.length > 0) {
          const targetType = visibleTiles[0].fruitType;
          setTiles((prev) =>
            prev.map((t) => (t.fruitType === targetType ? { ...t, matched: true } : t))
          );
          toast.success(t('bomb_used'));
        }
        break;
      case 'clock':
        await soundManager.playSound(SoundContext.clock);
        setTimeLeft((prev) => prev + 10);
        toast.success(t('time_added'));
        break;
      case 'magnifier':
        await soundManager.playSound(SoundContext.magnifier);
        const coveredTile = tiles.find((t) => t.covered && !t.matched);
        if (coveredTile) {
          toast.info(t('hint_showing'));
        }
        break;
      case 'shuffle':
        await soundManager.playSound(SoundContext.shuffle);
        setTiles((prev) => {
          const matched = prev.filter((t) => t.matched);
          const unmatched = prev.filter((t) => !t.matched);
          const shuffled = [...unmatched].sort(() => Math.random() - 0.5);
          return [...matched, ...shuffled];
        });
        toast.success(t('tiles_shuffled'));
        break;
    }
  };

  const totalTiles = tiles.filter((t) => !t.matched).length;
  const progress = totalTiles > 0 ? ((tiles.length - totalTiles) / tiles.length) * 100 : 0;

  const getCurrentStarPrediction = () => {
    if (isCompleted) return earnedStars;
    const timeTaken = (Date.now() - gameStartTime) / 1000;
    const timePercentage = timeTaken / initialTimeLimit;
    
    if (timePercentage < 0.4) return 3;
    if (timePercentage < 0.7) return 2;
    return 1;
  };

  const currentStarPrediction = getCurrentStarPrediction();

  const handleCompletionPopupClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
      onBack();
    }
  };

  const handleRetry = () => {
    // Reload the level by resetting state
    try {
      const level = generateLevel(worldId, levelId);
      if (level && level.tiles && level.tiles.length > 0) {
        setLevelData(level);
        setTiles(level.tiles);
        setTimeLeft(level.timeLimit);
        setInitialTimeLimit(level.timeLimit);
        setLoadError(null);
      } else {
        const fallback = createFallbackLevel(worldId, levelId);
        setLevelData(fallback);
        setTiles(fallback.tiles);
        setTimeLeft(fallback.timeLimit);
        setInitialTimeLimit(fallback.timeLimit);
      }
    } catch (error) {
      console.error('[GamePlay] Error on retry:', error);
      const fallback = createFallbackLevel(worldId, levelId);
      setLevelData(fallback);
      setTiles(fallback.tiles);
      setTimeLeft(fallback.timeLimit);
      setInitialTimeLimit(fallback.timeLimit);
    }
    
    setSelectedTile(null);
    setMatchCount(0);
    setIsCompleted(false);
    setEarnedStars(0);
    setStarBreakdown([]);
    setGameStarted(true);
    setIsPlaying(true);
    bossAudioPlayedRef.current = false;
    
    const counts = LocalStorage.getPowerUpCounts();
    setPowerUpCounts(counts);
  };

  // CRITICAL: Always render the full gameplay layout
  // No conditional returns that prevent GameBoard rendering
  return (
    <div className="gameplay-fullscreen" style={{ opacity: 1, zIndex: 1 }}>
      <div 
        className="gameplay-background"
        style={{
          background: isBossLevel 
            ? `radial-gradient(ellipse at center, ${themeColors.primary}60 0%, ${themeColors.primary}40 50%, rgba(0,0,0,0.8) 100%)`
            : `radial-gradient(ellipse at center, ${themeColors.secondary}40 0%, ${themeColors.primary}20 50%, transparent 100%)`,
          opacity: 1,
          zIndex: 0,
        }}
      />
      
      {isBossLevel && (
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.1, zIndex: 1 }}>
          <img 
            src="/assets/generated/boss-level-background.dim_1024x768.jpg" 
            alt="Boss Background"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="gameplay-ambient-effects" style={{ opacity: 1, zIndex: 1 }}>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20 animate-float"
            style={{
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: themeColors.primary,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${Math.random() * 3 + 4}s`,
            }}
          />
        ))}
      </div>
      
      <button
        onClick={toggleSound}
        className="gameplay-sound-toggle"
        style={{ opacity: 1, zIndex: 50 }}
        aria-label={t('sound_toggle')}
      >
        {isSoundEnabled ? (
          <Volume2 className="w-5 h-5 text-gray-800" />
        ) : (
          <VolumeX className="w-5 h-5 text-gray-800" />
        )}
      </button>
      
      <div className="gameplay-content" style={{ opacity: 1, zIndex: 10 }}>
        <div className="gameplay-top-hud" style={{ opacity: 1, zIndex: 20 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await soundManager.playSound(SoundContext.buttonClick);
              onBack();
            }}
            className="bg-white/95 hover:bg-white backdrop-blur-md shadow-lg border-2 border-white/50 transition-all hover:scale-105 text-sm px-3 py-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t('back')}
          </Button>

          <div className="flex items-center gap-2">
            <Card 
              className="bg-white/95 backdrop-blur-md shadow-xl border-2 transition-all hover:scale-105"
              style={{ borderColor: themeColors.primary, opacity: 1 }}
            >
              <CardContent className="flex items-center gap-2 p-2">
                <Clock className="h-5 w-5" style={{ color: themeColors.primary }} />
                <span className="text-xl font-bold" style={{ color: themeColors.primary }}>
                  {timeLeft}s
                </span>
              </CardContent>
            </Card>

            <Card className="bg-white/95 backdrop-blur-md shadow-xl border-2 border-white/50" style={{ opacity: 1 }}>
              <CardContent className="flex items-center gap-1 p-2">
                <Zap className="h-4 w-4 text-fruit-star" />
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3].map((starNum) => (
                    <Star
                      key={starNum}
                      className={`h-4 w-4 transition-all ${
                        starNum <= currentStarPrediction
                          ? 'fill-fruit-star text-fruit-star animate-pulse'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-md shadow-xl border-2 transition-all hover:scale-105 overflow-hidden ${
                isBossLevel ? 'animate-pulse' : ''
              }`}
              style={{ borderColor: isBossLevel ? '#dc2626' : themeColors.primary, opacity: 1 }}
            >
              <CardContent className="flex items-center gap-2 p-2 relative">
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{ background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})` }}
                />
                <div className="relative flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md"
                    style={{ backgroundColor: isBossLevel ? '#dc2626' : themeColors.primary }}
                  >
                    {isBossLevel ? (
                      <Skull className="w-5 h-5 text-white" />
                    ) : (
                      <img 
                        src={worldIcon} 
                        alt={`${t('world')} ${worldId}`}
                        className="w-5 h-5 object-contain"
                      />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" style={{ color: isBossLevel ? '#dc2626' : themeColors.primary }} />
                      <span 
                        className="text-xs font-bold tracking-wide"
                        style={{ color: isBossLevel ? '#dc2626' : themeColors.primary }}
                      >
                        {isBossLevel ? t('boss_level') : `${t('world')} ${worldId}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-fruit-star text-fruit-star" />
                      <span className="text-xs font-semibold text-gray-700">
                        {t('level')} {levelId}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {isBossLevel && levelData.bossObjective && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30">
            <Card className="bg-red-600/95 backdrop-blur-md shadow-2xl border-2 border-red-800 animate-pulse">
              <CardContent className="p-3 flex items-center gap-2">
                <Skull className="w-5 h-5 text-white" />
                <div className="text-white">
                  <div className="text-xs font-bold">{t('boss_objective')}</div>
                  <div className="text-sm">{levelData.bossObjective.description}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="gameplay-progress-bar" style={{ opacity: 1, zIndex: 20 }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-white drop-shadow-lg">{t('progress')}</span>
            <span className="text-xs font-semibold text-white drop-shadow-lg">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm shadow-inner">
            <div
              className="h-full transition-all duration-500 rounded-full shadow-lg"
              style={{
                width: `${progress}%`,
                background: isBossLevel 
                  ? 'linear-gradient(90deg, #dc2626, #991b1b)'
                  : `linear-gradient(90deg, ${themeColors.primary}, ${themeColors.secondary})`,
              }}
            />
          </div>
        </div>

        {/* CRITICAL: GameBoard always renders with guaranteed visibility */}
        <div className="gameplay-board-container" style={{ opacity: 1, zIndex: 15 }}>
          {loadError ? (
            <Card className="bg-white/95 backdrop-blur-md shadow-2xl border-4 border-yellow-500 max-w-md mx-auto">
              <CardContent className="p-6 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
                <p className="text-lg font-semibold text-gray-800">{loadError}</p>
                <p className="text-sm text-gray-600">Oyun yedek verilerle devam ediyor</p>
                <Button
                  onClick={handleRetry}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Tekrar Dene
                </Button>
              </CardContent>
            </Card>
          ) : null}
          
          {/* GameBoard ALWAYS renders regardless of error state */}
          <GameBoard
            tiles={tiles}
            selectedTile={selectedTile}
            onTileClick={handleTileClick}
            worldId={worldId}
            themeColor={themeColors.primary}
          />
        </div>

        <div className="gameplay-powerups-bottom" style={{ opacity: 1, zIndex: 20 }}>
          <PowerUpPanel
            powerUps={[
              { type: 'bomb', count: powerUpCounts.bomb },
              { type: 'clock', count: powerUpCounts.clock },
              { type: 'magnifier', count: powerUpCounts.magnifier },
              { type: 'shuffle', count: powerUpCounts.shuffle },
            ]}
            onActivate={activatePowerUp}
            themeColor={themeColors.primary}
          />
        </div>

        {matchEffects.map((effect) => (
          <div
            key={effect.id}
            className="fixed pointer-events-none z-50"
            style={{
              left: effect.x,
              top: effect.y,
              transform: 'translate(-50%, -50%)',
              opacity: 1,
            }}
          >
            <img
              src="/assets/generated/sparkle-effect-transparent.dim_128x128.png"
              alt="sparkle"
              className="w-24 h-24 animate-ping"
            />
            <img
              src="/assets/generated/popup-star-effect-transparent.dim_64x64.png"
              alt="star"
              className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 animate-bounce"
            />
          </div>
        ))}

        {isCompleted && (
          <div 
            className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-50 animate-in fade-in duration-300 cursor-pointer"
            style={{ opacity: 1 }}
            onClick={handleCompletionPopupClick}
          >
            <Card 
              className="bg-white p-8 text-center shadow-2xl border-4 max-w-lg mx-4 animate-in zoom-in-95 duration-500 cursor-default"
              style={{ borderColor: isBossLevel ? '#dc2626' : themeColors.primary, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <CardContent className="space-y-6">
                <div className="text-7xl animate-bounce">
                  {isBossLevel ? '👑' : '🎉'}
                </div>
                <h2 
                  className="text-4xl font-bold animate-in slide-in-from-top duration-700"
                  style={{ color: isBossLevel ? '#dc2626' : themeColors.primary }}
                >
                  {isBossLevel ? t('boss_victory') : t('congratulations')}
                </h2>
                <p className="text-xl font-semibold text-gray-700 animate-in slide-in-from-top duration-700 delay-100">
                  {t('level_complete')}
                </p>
                
                <div className="flex justify-center gap-3">
                  {[...Array(3)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-12 w-12 transition-all duration-500 ${
                        i < earnedStars
                          ? 'fill-fruit-star text-fruit-star scale-110 animate-bounce'
                          : 'text-gray-300'
                      }`}
                      style={{
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
                
                <div 
                  className="text-lg font-semibold animate-in slide-in-from-bottom duration-700"
                  style={{ color: isBossLevel ? '#dc2626' : themeColors.primary }}
                >
                  {earnedStars} {t('stars_earned')}
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 space-y-3 text-left border-2 border-gray-200 animate-in slide-in-from-bottom duration-700 delay-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="h-6 w-6" style={{ color: isBossLevel ? '#dc2626' : themeColors.primary }} />
                    <h3 className="text-lg font-bold text-gray-800">{t('star_details')}</h3>
                  </div>
                  {starBreakdown.map((line, index) => (
                    <div 
                      key={index} 
                      className="text-sm font-medium text-gray-700 flex items-start gap-2 animate-in slide-in-from-left duration-500"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <span className="text-lg">{line.split(' ')[0]}</span>
                      <span className="flex-1">{line.substring(line.indexOf(' ') + 1)}</span>
                    </div>
                  ))}
                </div>

                <div className="text-sm text-gray-600 italic animate-in fade-in duration-700 delay-300">
                  {earnedStars === 3 && `🏆 ${t('perfect_performance')}`}
                  {earnedStars === 2 && `👍 ${t('good_job')}`}
                  {earnedStars === 1 && `💪 ${t('can_do_better')}`}
                </div>

                <p className="text-xs text-gray-500 mt-4 animate-in fade-in duration-700 delay-500">
                  {t('auto_close')}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
