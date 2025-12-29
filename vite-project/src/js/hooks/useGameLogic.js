import { useState, useCallback } from 'react';

const GRAVITY = 0.5;
const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 576;

export default function useGameLogic(images) {
  const [gameState, setGameState] = useState(null);

  const initializeGame = useCallback(() => {
    const platformImage = images?.platform;
    const platformSmallTallImage = images?.platformSmallTall;

    const initialState = {
      player: {
        speed: 10,
        position: { x: 100, y: 100 },
        velocity: { x: 0, y: 1 },
        width: 66,
        height: 150,
        frames: 0,
        currentSprite: 'stand',
        currentCropWidth: 177,
        direction: 'right',
      },
      platforms: [
        { x: -1, y: 470, imageKey: 'platform' },
        { x: platformImage.width - 3, y: 470, imageKey: 'platform' },
        { x: platformImage.width * 2 + 100 - 3, y: 470, imageKey: 'platform' },
        { x: platformImage.width * 3 + 300 - 3, y: 470, imageKey: 'platform' },
        { x: platformImage.width * 4 + 600 - 3, y: 470, imageKey: 'platform' },
        { x: platformImage.width * 5 + 900 - 3, y: 270, imageKey: 'platformSmallTall' },
        {
          x: platformImage.width * 6 + 900 + platformImage.width / 2 - 3,
          y: 470,
          imageKey: 'platform',
        },
      ],
      genericObjects: [
        { x: 0, y: 0, imageKey: 'background' },
        { x: 0, y: 0, imageKey: 'hill' },
      ],
      scrollOffset: 0,
      currentKey: '',
    };

    setGameState(initialState);
    return initialState;
  }, [images]);

  return { gameState, initializeGame };
}
