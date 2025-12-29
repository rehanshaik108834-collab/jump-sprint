import { useState, useEffect } from 'react';

export default function useKeyboardInput() {
  const [keys, setKeys] = useState({
    left: false,
    right: false,
    jump: false,
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.keyCode === 65) {
        // A key
        setKeys(prev => ({ ...prev, left: true }));
      } else if (e.keyCode === 68) {
        // D key
        setKeys(prev => ({ ...prev, right: true }));
      } else if (e.keyCode === 87) {
        // W key
        setKeys(prev => ({ ...prev, jump: true }));
      }
    };

    const handleKeyUp = (e) => {
      if (e.keyCode === 65) {
        setKeys(prev => ({ ...prev, left: false }));
      } else if (e.keyCode === 68) {
        setKeys(prev => ({ ...prev, right: false }));
      } else if (e.keyCode === 87) {
        setKeys(prev => ({ ...prev, jump: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return keys;
}
