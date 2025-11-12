import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mask } from './types';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  BASKET_WIDTH,
  BASKET_HEIGHT,
  BASKET_Y_POSITION,
  BASKET_STEP,
  MASK_SIZE,
  BASE_MASK_SPEED,
  LEVEL_SPEED_INCREASE,
  MASK_SPAWN_INTERVAL,
  POINTS_PER_MASK,
  POINTS_TO_LEVEL_UP,
  MAX_MISSED_MASKS,
  MASK_IMAGES,
  BASKET_IMAGE,
  BACKGROUND_IMAGE,
} from './constants';

const App: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(0);
  const [level, setLevel] = useState(1);
  const [basketX, setBasketX] = useState((GAME_WIDTH - BASKET_WIDTH) / 2);
  const [masks, setMasks] = useState<Mask[]>([]);

  const gameLoopRef = useRef<number | null>(null);
  const maskSpawnerRef = useRef<number | null>(null);
  const movementRef = useRef<number | null>(null);

  const resetGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setMissed(0);
    setLevel(1);
    setBasketX((GAME_WIDTH - BASKET_WIDTH) / 2);
    setMasks([]);
  };

  const moveBasket = useCallback((direction: 'left' | 'right') => {
    setBasketX(prevX => {
      const newX = direction === 'left' ? prevX - BASKET_STEP : prevX + BASKET_STEP;
      return Math.max(0, Math.min(GAME_WIDTH - BASKET_WIDTH, newX));
    });
  }, []);

  const handleMoveStart = useCallback((direction: 'left' | 'right') => {
    if (movementRef.current) clearInterval(movementRef.current);
    moveBasket(direction);
    movementRef.current = window.setInterval(() => {
      moveBasket(direction);
    }, 50);
  }, [moveBasket]);

  const handleMoveEnd = useCallback(() => {
    if (movementRef.current) {
      clearInterval(movementRef.current);
      movementRef.current = null;
    }
  }, []);

  // Game Loop
  useEffect(() => {
    if (!gameStarted || gameOver) {
      return;
    }

    const gameTick = () => {
      setMasks(prevMasks => {
        const newMasks: Mask[] = [];
        let scoreToAdd = 0;
        let missedCount = 0;

        for (const mask of prevMasks) {
          const newY = mask.y + mask.speed;

          // Collision detection
          const maskBottom = newY + MASK_SIZE;
          const basketTop = BASKET_Y_POSITION;
          const basketLeft = basketX;
          const basketRight = basketX + BASKET_WIDTH;
          const maskCenterX = mask.x + MASK_SIZE / 2;

          if (
            maskBottom >= basketTop &&
            maskBottom <= basketTop + BASKET_HEIGHT / 2 &&
            maskCenterX >= basketLeft &&
            maskCenterX <= basketRight
          ) {
            scoreToAdd += POINTS_PER_MASK;
          } else if (newY > GAME_HEIGHT) {
            missedCount++;
          } else {
            newMasks.push({ ...mask, y: newY });
          }
        }

        if (scoreToAdd > 0) setScore(s => s + scoreToAdd);
        if (missedCount > 0) setMissed(m => m + missedCount);

        return newMasks;
      });

      gameLoopRef.current = requestAnimationFrame(gameTick);
    };

    gameLoopRef.current = requestAnimationFrame(gameTick);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameStarted, gameOver, basketX]);

  // Mask Spawner
  useEffect(() => {
    if (!gameStarted || gameOver) {
      return;
    }

    maskSpawnerRef.current = window.setInterval(() => {
      const newMask: Mask = {
        id: Date.now(),
        x: Math.random() * (GAME_WIDTH - MASK_SIZE),
        y: -MASK_SIZE,
        speed: BASE_MASK_SPEED + (level - 1) * LEVEL_SPEED_INCREASE,
        imgSrc: MASK_IMAGES[Math.floor(Math.random() * MASK_IMAGES.length)],
      };
      setMasks(prev => [...prev, newMask]);
    }, MASK_SPAWN_INTERVAL);

    return () => {
      if (maskSpawnerRef.current) clearInterval(maskSpawnerRef.current);
    };
  }, [gameStarted, gameOver, level]);

  // Level Up Check
  useEffect(() => {
    if (score > 0 && score >= level * POINTS_TO_LEVEL_UP) {
      setLevel(l => l + 1);
    }
  }, [score, level]);

  // Game Over Check
  useEffect(() => {
    if (missed >= MAX_MISSED_MASKS) {
      setGameOver(true);
    }
  }, [missed]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      if (e.key === 'ArrowLeft') {
        moveBasket('left');
      } else if (e.key === 'ArrowRight') {
        moveBasket('right');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, moveBasket]);


  const renderOverlay = (title: string, buttonText: string, onButtonClick: () => void) => (
    <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-20">
      <div className="text-white text-center p-8 bg-gray-800 bg-opacity-80 rounded-xl shadow-lg border-2 border-blue-400">
        <h2 className="text-4xl font-bold mb-4 text-yellow-300" style={{ textShadow: '2px 2px #ff0000' }}>{title}</h2>
        {gameOver && <p className="text-2xl mb-6">Final Score: {score}</p>}
        <button
          onClick={onButtonClick}
          className="mt-4 px-8 py-4 bg-green-500 text-white text-xl rounded-lg hover:bg-green-600 active:bg-green-700 transition-transform transform hover:scale-105"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex justify-center items-center p-4">
      <div
        className="relative overflow-hidden bg-cover bg-center shadow-2xl border-4 border-gray-600"
        style={{
          width: `${GAME_WIDTH}px`,
          height: `${GAME_HEIGHT}px`,
          backgroundImage: `url(${BACKGROUND_IMAGE})`,
        }}
      >
        {!gameStarted && renderOverlay('Catch The Mask', 'Start Game', () => setGameStarted(true))}
        {gameOver && renderOverlay('Game Over', 'Restart', resetGame)}

        {gameStarted && (
          <>
            {/* Game UI */}
            <div className="absolute top-0 left-0 right-0 p-3 bg-black bg-opacity-40 flex justify-between text-white text-lg z-10">
              <span>Score: {score}</span>
              <span>Level: {level}</span>
              <span>Missed: {missed}/{MAX_MISSED_MASKS}</span>
            </div>

            {/* Basket */}
            <img
              src={BASKET_IMAGE}
              alt="First-aid kit"
              className="absolute"
              style={{
                left: basketX,
                top: BASKET_Y_POSITION,
                width: BASKET_WIDTH,
                height: BASKET_HEIGHT,
              }}
            />

            {/* Masks */}
            {masks.map(mask => (
              <img
                key={mask.id}
                src={mask.imgSrc}
                alt="Falling mask"
                className="absolute"
                style={{
                  left: mask.x,
                  top: mask.y,
                  width: MASK_SIZE,
                  height: MASK_SIZE,
                }}
              />
            ))}

            {/* On-screen Controls */}
            <div className="absolute bottom-0 left-0 right-0 h-20 flex justify-between items-center z-10">
              <button
                className="w-1/2 h-full text-white text-3xl opacity-30 hover:opacity-50 flex justify-center items-center"
                onMouseDown={() => handleMoveStart('left')}
                onMouseUp={handleMoveEnd}
                onMouseLeave={handleMoveEnd}
                onTouchStart={() => handleMoveStart('left')}
                onTouchEnd={handleMoveEnd}
              >
                ⬅️
              </button>
              <button
                className="w-1/2 h-full text-white text-3xl opacity-30 hover:opacity-50 flex justify-center items-center"
                onMouseDown={() => handleMoveStart('right')}
                onMouseUp={handleMoveEnd}
                onMouseLeave={handleMoveEnd}
                onTouchStart={() => handleMoveStart('right')}
                onTouchEnd={handleMoveEnd}
              >
                ➡️
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
