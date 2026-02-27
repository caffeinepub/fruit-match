import { Tile } from '@/lib/gameLogic';

interface GameBoardProps {
  tiles: Tile[];
  selectedTile: number | null;
  onTileClick: (tileId: number) => void;
  worldId: number;
  themeColor: string;
}

const FRUIT_IMAGES: Record<string, string> = {
  apple: '/assets/generated/apple-tile-transparent.dim_128x128.png',
  orange: '/assets/generated/orange-tile-transparent.dim_128x128.png',
  banana: '/assets/generated/banana-tile-transparent.dim_128x128.png',
  grape: '/assets/generated/grape-tile-transparent.dim_128x128.png',
  strawberry: '/assets/generated/strawberry-tile-transparent.dim_128x128.png',
  cherry: '/assets/generated/cherry-tile-transparent.dim_128x128.png',
  watermelon: '/assets/generated/watermelon-tile-transparent.dim_128x128.png',
  pineapple: '/assets/generated/pineapple-tile-transparent.dim_128x128.png',
};

export default function GameBoard({ tiles, selectedTile, onTileClick, worldId, themeColor }: GameBoardProps) {
  // CRITICAL: Always filter and render tiles, never return null or empty
  const visibleTiles = tiles && tiles.length > 0 ? tiles.filter((t) => !t.matched) : [];

  // CRITICAL: Always render the board container with guaranteed visibility
  return (
    <div 
      className="flex justify-center items-center min-h-[500px] py-8"
      style={{ opacity: 1, zIndex: 10 }}
    >
      <div 
        className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4 p-6 md:p-8 rounded-3xl shadow-2xl backdrop-blur-xl border-4 border-white/30 transition-all"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
          opacity: 1,
          zIndex: 10,
        }}
      >
        {visibleTiles.length > 0 ? (
          visibleTiles.map((tile) => {
            const isSelected = tile.id === selectedTile;
            const isCovered = tile.covered;
            const isIceFrozen = worldId === 4 && tile.frozen;

            return (
              <button
                key={tile.id}
                data-tile-id={tile.id}
                onClick={() => onTileClick(tile.id)}
                disabled={isCovered || tile.matched}
                className={`
                  relative w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-2xl transition-all duration-300
                  ${isSelected ? 'scale-110 z-10' : 'hover:scale-105'}
                  ${isCovered ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                  ${tile.matched ? 'opacity-0 scale-0' : ''}
                  shadow-lg hover:shadow-2xl
                `}
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, ${themeColor}40, ${themeColor}20)`
                    : 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,248,248,1) 100%)',
                  boxShadow: isSelected
                    ? `0 0 0 4px ${themeColor}, 0 8px 24px rgba(0,0,0,0.2)`
                    : '0 4px 12px rgba(0,0,0,0.1)',
                  transform: isSelected ? 'scale(1.1) rotate(2deg)' : undefined,
                  opacity: 1,
                  zIndex: isSelected ? 20 : 10,
                }}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 to-transparent pointer-events-none" />
                
                <img
                  src={FRUIT_IMAGES[tile.fruitType] || FRUIT_IMAGES.apple}
                  alt={tile.fruitType}
                  className={`w-full h-full object-contain p-2 transition-all duration-300 ${
                    isSelected ? 'scale-110' : ''
                  }`}
                  style={{ opacity: 1 }}
                />
                
                {isCovered && (
                  <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-black/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <span className="text-3xl drop-shadow-lg">🔒</span>
                  </div>
                )}
                
                {isIceFrozen && (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-200/50 to-blue-300/30 rounded-2xl pointer-events-none border-2 border-blue-300/50">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjMiLz48L3N2Zz4=')] opacity-50" />
                  </div>
                )}

                {/* Shine effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </button>
            );
          })
        ) : (
          // Fallback: Show placeholder tiles if no tiles available
          <div className="col-span-full text-center py-8">
            <p className="text-gray-600 text-lg font-semibold">Seviye yükleniyor...</p>
          </div>
        )}
      </div>
    </div>
  );
}
