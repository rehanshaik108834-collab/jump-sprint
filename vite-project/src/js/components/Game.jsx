import React, { useEffect, useRef, useState } from 'react';

import platform from '../../img/platform.png';
import hill from '../../img/hills.png';
import background from '../../img/background.png';
import platformSmallTall from '../../img/platformSmallTall.png';
import spriteRunLeft from '../../img/spriteRunLeft.png';
import spriteRunRight from '../../img/spriteRunRight.png';
import spriteStandLeft from '../../img/spriteStandLeft.png';
import spriteStandRight from '../../img/spriteStandRight.png';

const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 576;

export default function Game() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState(null);
  const keysRef = useRef({
    left: false,
    right: false,
    // jumpPressed is set true on keydown and consumed once by the loop
    jumpPressed: false,
  });
  const gameLoopRef = useRef(null);

  // Setup keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.keyCode === 65) {
        keysRef.current.left = true;
      } else if (e.keyCode === 68) {
        keysRef.current.right = true;
      } else if (e.keyCode === 87) {
        // mark a jump press; it will be consumed once by the game loop
        keysRef.current.jumpPressed = true;
      }
    };

    const handleKeyUp = (e) => {
      if (e.keyCode === 65) {
        keysRef.current.left = false;
      } else if (e.keyCode === 68) {
        keysRef.current.right = false;
      } else if (e.keyCode === 87) {
        // releasing jump just clears the pressed flag (prevents repeated triggers)
        keysRef.current.jumpPressed = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Initialize game
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Create images
    const images = {
      platform: new Image(),
      platformSmallTall: new Image(),
      background: new Image(),
      hill: new Image(),
      spriteStandRight: new Image(),
      spriteStandLeft: new Image(),
      spriteRunRight: new Image(),
      spriteRunLeft: new Image(),
    };

    images.platform.src = platform;
    images.platformSmallTall.src = platformSmallTall;
    images.background.src = background;
    images.hill.src = hill;
    images.spriteStandRight.src = spriteStandRight;
    images.spriteStandLeft.src = spriteStandLeft;
    images.spriteRunRight.src = spriteRunRight;
    images.spriteRunLeft.src = spriteRunLeft;

    let loadedCount = 0;
    const onLoad = () => {
      loadedCount++;
      if (loadedCount === Object.keys(images).length) {
        initializeGame();
      }
    };

    Object.values(images).forEach(img => {
      img.onload = onLoad;
    });

    function getInitialState() {
      return {
        player: {
          position: { x: 100, y: 320 },
          velocity: { x: 0, y: 0 },
          width: 66,
          height: 150,
          speed: 12,
          jumpCount: 0,
          frameIndex: 0,
          frameElapsed: 0,
          currentSprite: 'standRight',
          currentCropWidth: 177,
          isJumping: false,
          lastDirection: 'right',
        },
        platforms: [
          { x: -1, y: 470, image: 'platform' },
          { x: images.platform.width - 3, y: 470, image: 'platform' },
          { x: images.platform.width * 2 + 100 - 3, y: 370, image: 'platform' },
          { x: images.platform.width * 3 + 300 - 3, y: 270, image: 'platform' },
          { x: images.platform.width * 4 + 600 - 3, y: 470, image: 'platform' },
          { x: images.platform.width * 5 + 900 - 3, y: 270, image: 'platformSmallTall' },
          { x: images.platform.width * 6 + 900 + images.platform.width / 2 - 3, y: 470, image: 'platform' },
        ],
        genericObjects: [
          { x: 0, y: 0, image: 'background' },
          { x: 0, y: 0, image: 'hill' },
        ],
        scrollOffset: 0,
        gameOver: false,
        won: false,
      };
    }

    function initializeGame() {
      const initialState = getInitialState();
      setGameState(initialState);
      startGameLoop(initialState, ctx, images, canvas, getInitialState);
    }

    function startGameLoop(initialState, ctx, images, canvas, getInitialState) {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }

      let state = JSON.parse(JSON.stringify(initialState));
      let gameRunning = true;

      const gameLoop = () => {
        if (!gameRunning) return;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        state.genericObjects.forEach(obj => {
          const img = images[obj.image];
          ctx.drawImage(img, obj.x, obj.y);
        });

        state.platforms.forEach(platform => {
          const img = images[platform.image];
          ctx.drawImage(img, platform.x, platform.y);
        });

        state.player.velocity.y += 0.5;

        let isOnGround = false;
        state.platforms.forEach(platform => {
          const platformImg = images[platform.image];
          if (
            state.player.position.y + state.player.height <= platform.y + 5 &&
            state.player.position.y + state.player.height + state.player.velocity.y >= platform.y &&
            state.player.position.x + state.player.width > platform.x &&
            state.player.position.x < platform.x + platformImg.width
          ) {
            isOnGround = true;
            state.player.velocity.y = 0;
            state.player.position.y = platform.y - state.player.height;
            state.player.isJumping = false;
          }
        });

        state.player.position.x += state.player.velocity.x;
        state.player.position.y += state.player.velocity.y;

        const playerImg = images[getSpriteKey(state.player.currentSprite)];
        ctx.drawImage(
          playerImg,
          state.player.currentCropWidth * (state.player.frameIndex || 0),
          0,
          state.player.currentCropWidth,
          400,
          state.player.position.x,
          state.player.position.y,
          state.player.width,
          state.player.height
        );

        // Update animation frames with per-sprite timing to avoid flicker
        const spriteMeta = {
          // slightly faster idle animation
          stand: { frames: 60, speed: 8 },
          // faster run animation (lower speed value = faster frame advance)
          run: { frames: 30, speed: 1 },
        };
        const currentType = state.player.currentSprite.includes('stand') ? 'stand' : 'run';
        state.player.frameElapsed = (state.player.frameElapsed || 0) + 1;
        if (state.player.frameElapsed >= spriteMeta[currentType].speed) {
          state.player.frameElapsed = 0;
          state.player.frameIndex = ((state.player.frameIndex || 0) + 1) % spriteMeta[currentType].frames;
        }

        if (keysRef.current.right && state.player.position.x < 400) {
          state.player.velocity.x = state.player.speed;
        } else if (
          (keysRef.current.left && state.player.position.x > 100) ||
          (keysRef.current.left && state.scrollOffset === 0 && state.player.position.x > 0)
        ) {
          state.player.velocity.x = -state.player.speed;
        } else {
          state.player.velocity.x = 0;
          if (keysRef.current.right) {
            state.scrollOffset += state.player.speed;
            state.platforms.forEach(p => {
              p.x -= state.player.speed;
            });
            state.genericObjects.forEach(obj => {
              obj.x -= state.player.speed * 0.66;
            });
          } else if (keysRef.current.left && state.scrollOffset > 0) {
            state.scrollOffset -= state.player.speed;
            state.platforms.forEach(p => {
              p.x += state.player.speed;
            });
            state.genericObjects.forEach(obj => {
              obj.x += state.player.speed * 0.66;
            });
          }
        }

        // Jump handling: support a double-jump with a stronger mid-air boost
        const MAX_JUMPS = 2;
        // reset jumpCount when touching ground
        if (isOnGround) {
          state.player.jumpCount = 0;
        }

        if (keysRef.current.jumpPressed) {
          if (isOnGround) {
            state.player.velocity.y = -15; // primary jump
            state.player.isJumping = true;
            state.player.jumpCount = 1;
          } else if ((state.player.jumpCount || 0) < MAX_JUMPS) {
            // mid-air boost (stronger jump when attempted in air)
            state.player.velocity.y = -18;
            state.player.jumpCount = (state.player.jumpCount || 0) + 1;
          }
          // consume the press so holding doesn't retrigger
          keysRef.current.jumpPressed = false;
        }

        // Handle sprite changes - only update when movement state actually changes
        const isMoving = keysRef.current.right || keysRef.current.left;
        
        if (keysRef.current.right) {
          if (state.player.currentSprite !== 'runRight') {
            state.player.frameIndex = 0;
            state.player.frameElapsed = 0;
            state.player.currentSprite = 'runRight';
            state.player.currentCropWidth = 341;
            state.player.width = 120;
          }
          state.player.lastDirection = 'right';
        } else if (keysRef.current.left) {
          if (state.player.currentSprite !== 'runLeft') {
            state.player.frameIndex = 0;
            state.player.frameElapsed = 0;
            state.player.currentSprite = 'runLeft';
            state.player.currentCropWidth = 341;
            state.player.width = 120;
          }
          state.player.lastDirection = 'left';
        } else {
          // Not moving - set standing sprite based on last direction, only if it's different
          if (state.player.lastDirection === 'right') {
              if (state.player.currentSprite !== 'standRight') {
              state.player.currentSprite = 'standRight';
              state.player.currentCropWidth = 177;
              state.player.width = 66;
              state.player.frameIndex = 0;
              state.player.frameElapsed = 0;
            }
          } else {
              if (state.player.currentSprite !== 'standLeft') {
              state.player.currentSprite = 'standLeft';
              state.player.currentCropWidth = 177;
              state.player.width = 66;
              state.player.frameIndex = 0;
              state.player.frameElapsed = 0;
            }
          }
        }

        const platformImg = images['platform'];
        if (
          state.scrollOffset >
          platformImg.width * 6 + 900 + platformImg.width / 2 - 3
        ) {
          // Immediately restart the game without showing a win message
          const newState = getInitialState();
          startGameLoop(newState, ctx, images, canvas, getInitialState);
          return;
        }

        if (state.player.position.y > CANVAS_HEIGHT) {
          state.gameOver = true;
          gameRunning = false;
          setGameState({ ...state });
          setTimeout(() => {
            const newState = getInitialState();
            startGameLoop(newState, ctx, images, canvas, getInitialState);
          }, 2000);
          return;
        }

        setGameState({ ...state });
        gameLoopRef.current = requestAnimationFrame(gameLoop);
      };

      gameLoop();
    }
  }, []);

  return (
    <div style={{ textAlign: 'center' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{ border: '2px solid white', display: 'block', margin: '0 auto' }}
      />
      <div style={{ color: 'white', marginTop: '20px' }}>
        <p><strong>Use WASD keys to move and jump</strong></p>
        <p style={{ fontSize: '14px', color: '#aaa' }}>A - Left | D - Right | W - Jump</p>
        {gameState?.won && (
          <p style={{ color: 'gold', fontSize: '24px', fontWeight: 'bold' }}>
            🎉 You Win! Restarting...
          </p>
        )}
        {gameState?.gameOver && (
          <p style={{ color: 'red', fontSize: '24px', fontWeight: 'bold' }}>
            💀 Game Over! Restarting...
          </p>
        )}
      </div>
    </div>
  );
}

function getSpriteKey(sprite) {
  const spriteMap = {
    standRight: 'spriteStandRight',
    standLeft: 'spriteStandLeft',
    runRight: 'spriteRunRight',
    runLeft: 'spriteRunLeft',
  };
  return spriteMap[sprite];
}
