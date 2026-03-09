import type { Tile } from "@/lib/gameLogic";
import { useEffect, useRef } from "react";

interface GameBoardProps {
  tiles: Tile[];
  selectedTile: number | null;
  onTileClick: (tileId: number) => void;
  worldId: number;
  themeColor: string;
  hintTileIds?: number[];
  currentChainGroup?: number;
}

const FRUIT_IMAGES: Record<string, string> = {
  apple: "/assets/generated/apple-tile-transparent.dim_128x128.png",
  orange: "/assets/generated/orange-tile-transparent.dim_128x128.png",
  banana: "/assets/generated/banana-tile-transparent.dim_128x128.png",
  grape: "/assets/generated/grape-tile-transparent.dim_128x128.png",
  strawberry: "/assets/generated/strawberry-tile-transparent.dim_128x128.png",
  cherry: "/assets/generated/cherry-tile-transparent.dim_128x128.png",
  watermelon: "/assets/generated/watermelon-tile-transparent.dim_128x128.png",
  pineapple: "/assets/generated/pineapple-tile-transparent.dim_128x128.png",
};

const SPECIAL_OVERLAYS: Record<string, string> = {
  bomb: "💣",
  rainbow: "🌈",
  freeze: "❄️",
};

export default function GameBoard({
  tiles,
  selectedTile,
  onTileClick,
  worldId,
  themeColor,
  hintTileIds = [],
  currentChainGroup = 0,
}: GameBoardProps) {
  // Track which tile IDs are "new" (appeared after previous render)
  const prevTileIdsRef = useRef<Set<number>>(new Set());
  const visibleTiles =
    tiles && tiles.length > 0 ? tiles.filter((t) => !t.matched) : [];

  const currentIds = new Set(visibleTiles.map((t) => t.id));
  const newTileIds = new Set(
    visibleTiles
      .filter(
        (t) =>
          !prevTileIdsRef.current.has(t.id) && prevTileIdsRef.current.size > 0,
      )
      .map((t) => t.id),
  );

  useEffect(() => {
    prevTileIdsRef.current = currentIds;
  });

  // Calculate column index for stagger delay
  const COLS = 6;
  const tileColIndex = visibleTiles.reduce<Record<number, number>>(
    (acc, tile, idx) => {
      acc[tile.id] = idx % COLS;
      return acc;
    },
    {},
  );

  return (
    <div
      className="flex justify-center items-center min-h-[500px] py-8"
      style={{ opacity: 1, zIndex: 10 }}
    >
      <div
        className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4 p-6 md:p-8 rounded-3xl shadow-2xl backdrop-blur-xl border-4 border-white/30 transition-all"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
          opacity: 1,
          zIndex: 10,
        }}
      >
        {visibleTiles.length > 0 ? (
          visibleTiles.map((tile) => {
            const isSelected = tile.id === selectedTile;
            const isCovered = tile.covered;
            const isIceFrozen = worldId === 4 && tile.frozen;
            const isHinted = hintTileIds.includes(tile.id);
            const isNew = newTileIds.has(tile.id);
            const colIdx = tileColIndex[tile.id] ?? 0;

            const isChained = tile.chained && !isCovered;
            const chainGroupVal = tile.chainGroup ?? 0;
            const isChainLocked =
              isChained && chainGroupVal > currentChainGroup;
            const isChainActive =
              isChained && chainGroupVal === currentChainGroup;

            const specialOverlay = tile.special
              ? SPECIAL_OVERLAYS[tile.special]
              : null;

            return (
              <button
                type="button"
                key={tile.id}
                data-tile-id={tile.id}
                onClick={() => onTileClick(tile.id)}
                disabled={isCovered || tile.matched || isChainLocked}
                className={`
                  relative w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-2xl transition-all duration-300
                  ${isNew ? "tile-drop-in" : "tile-fall"}
                  ${isSelected ? "scale-110 z-10" : isChainLocked ? "" : "hover:scale-105"}
                  ${isCovered || isChainLocked ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                  ${tile.matched ? "opacity-0 scale-0" : ""}
                  shadow-lg hover:shadow-2xl
                `}
                style={{
                  animationDelay: isNew ? `${colIdx * 50}ms` : undefined,
                  background: isSelected
                    ? `linear-gradient(135deg, ${themeColor}40, ${themeColor}20)`
                    : tile.special === "bomb"
                      ? "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(255,255,255,1) 100%)"
                      : tile.special === "rainbow"
                        ? "linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(255,255,255,1) 100%)"
                        : tile.special === "freeze"
                          ? "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(255,255,255,1) 100%)"
                          : "linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,248,248,1) 100%)",
                  boxShadow: isHinted
                    ? "0 0 0 4px #facc15, 0 0 16px 4px #fde047, 0 8px 24px rgba(0,0,0,0.15)"
                    : isSelected
                      ? `0 0 0 4px ${themeColor}, 0 8px 24px rgba(0,0,0,0.2)`
                      : tile.special === "bomb"
                        ? "0 0 0 3px rgba(239,68,68,0.6), 0 4px 12px rgba(0,0,0,0.1)"
                        : tile.special === "rainbow"
                          ? "0 0 0 3px rgba(168,85,247,0.6), 0 4px 12px rgba(0,0,0,0.1)"
                          : tile.special === "freeze"
                            ? "0 0 0 3px rgba(59,130,246,0.6), 0 4px 12px rgba(0,0,0,0.1)"
                            : "0 4px 12px rgba(0,0,0,0.1)",
                  transform: isSelected ? "scale(1.1) rotate(2deg)" : undefined,
                  opacity: isChainLocked ? 0.4 : 1,
                  zIndex: isSelected ? 20 : 10,
                }}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 to-transparent pointer-events-none" />

                {isHinted && (
                  <div className="absolute inset-0 rounded-2xl pointer-events-none animate-pulse border-4 border-yellow-400 shadow-[0_0_12px_4px_rgba(250,204,21,0.7)]" />
                )}

                <img
                  src={FRUIT_IMAGES[tile.fruitType] || FRUIT_IMAGES.apple}
                  alt={tile.fruitType}
                  className={`w-full h-full object-contain p-2 transition-all duration-300 ${
                    isSelected ? "scale-110" : ""
                  }`}
                  style={{ opacity: 1 }}
                />

                {specialOverlay && !isCovered && (
                  <div className="absolute top-0.5 right-0.5 text-base leading-none drop-shadow-lg z-10 animate-pulse">
                    {specialOverlay}
                  </div>
                )}

                {isCovered && (
                  <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-black/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <span className="text-3xl drop-shadow-lg">🔒</span>
                  </div>
                )}

                {isChainLocked && (
                  <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 border-4 border-gray-500/60 rounded-2xl" />
                    <div
                      className="absolute inset-0 opacity-25"
                      style={{
                        background:
                          "repeating-linear-gradient(45deg, rgba(100,100,100,0.4) 0px, rgba(100,100,100,0.4) 3px, transparent 3px, transparent 10px)",
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl drop-shadow-lg">🔒</span>
                    </div>
                    <span className="absolute bottom-0.5 right-0.5 text-sm leading-none drop-shadow">
                      ⛓️
                    </span>
                  </div>
                )}

                {isChainActive && (
                  <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 border-4 border-red-500/70 rounded-2xl animate-pulse" />
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        background:
                          "repeating-linear-gradient(45deg, rgba(180,0,0,0.4) 0px, rgba(180,0,0,0.4) 3px, transparent 3px, transparent 10px)",
                      }}
                    />
                    <span className="absolute bottom-0.5 right-0.5 text-sm leading-none drop-shadow">
                      ⛓️
                    </span>
                  </div>
                )}

                {isIceFrozen && (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-200/50 to-blue-300/30 rounded-2xl pointer-events-none border-2 border-blue-300/50">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjMiLz48L3N2Zz4=')] opacity-50" />
                  </div>
                )}

                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </button>
            );
          })
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-600 text-lg font-semibold">
              Seviye yükleniyor...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
