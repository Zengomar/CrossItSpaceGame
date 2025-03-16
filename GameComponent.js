import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const GameComponent = ({ playerImage, meteorImage, onRestart }) => {
  const [health, setHealth] = useState(100);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Keep a ref copy of score if needed for immediate access
  const scoreRef = useRef(score);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // Player horizontal position
  const playerX = useRef(new Animated.Value(screenWidth / 2 - 30)).current;
  const playerPos = useRef(screenWidth / 2 - 30);

  // Determine meteor count based on score thresholds.
  // (If you want dynamic meteor count, consider storing them in state.)
  let len = score < 1000 ? 5 : score < 5000 ? 7 : 9;

  // Create meteor animated values only once.
  const meteorPositions = useRef(
    Array.from({ length: len }).map(() =>
      new Animated.ValueXY({
        x: Math.random() * (screenWidth - 50),
        y: Math.random() * -600,
      })
    )
  ).current;

  // We use listeners on the animated values to update positions live
  const [meteorPositionsState, setMeteorPositionsState] = useState(
    Array.from({ length: len }, () => ({ x: 0, y: 0 }))
  );

  useEffect(() => {
    const listeners = meteorPositions.map((meteor, index) =>
      meteor.addListener(({ x, y }) => {
        setMeteorPositionsState((prev) => {
          const newState = [...prev];
          newState[index] = { x, y };
          return newState;
        });
      })
    );

    return () => {
      // Remove listeners on cleanup
      meteorPositions.forEach((meteor) => meteor.removeAllListeners());
    };
  }, [meteorPositions]);

  // Audio Setup
  const backgroundMusic = useRef(new Audio.Sound());
  const explosionSound = useRef(new Audio.Sound());
  const gameOverSound = useRef(new Audio.Sound());

  useEffect(() => {
    const loadSounds = async () => {
      try {
        await backgroundMusic.current.loadAsync(
          require('./assets/spaceship.mp3'),
          { isLooping: true }
        );
        await explosionSound.current.loadAsync(
          require('./assets/explosion1.mp3')
        );
        await gameOverSound.current.loadAsync(
          require('./assets/gameover.mp3')
        );
        await backgroundMusic.current.playAsync();
      } catch (error) {
        console.error('Error loading sounds:', error);
      }
    };
    loadSounds();

    return () => {
      backgroundMusic.current.unloadAsync();
      explosionSound.current.unloadAsync();
      gameOverSound.current.unloadAsync();
    };
  }, []);

  // Load high score on startup
  useEffect(() => {
    const loadHighScore = async () => {
      try {
        const savedHighScore = await AsyncStorage.getItem('highScore');
        if (savedHighScore !== null) {
          setHighScore(parseInt(savedHighScore, 10));
        }
      } catch (error) {
        console.error('Failed to load high score:', error);
      }
    };
    loadHighScore();
  }, []);

  // Save high score when the game is over and the current score beats the previous record
  useEffect(() => {
    const updateHighScore = async () => {
      if (gameOver && score > highScore) {
        try {
          await AsyncStorage.setItem('highScore', score.toString());
          setHighScore(score);
        } catch (error) {
          console.error('Failed to save high score:', error);
        }
      }
    };
    updateHighScore();
  }, [gameOver, score, highScore]);

  // Animate meteors continuously; adapt speed based on score.
  useEffect(() => {
    if (gameOver) return;
    meteorPositions.forEach((meteor) => {
      const animateMeteor = () => {
        if (gameOver) return;
        // Reset position to top with a new random horizontal position.
        meteor.setValue({
          x: Math.random() * (screenWidth - 50),
          y: -50,
        });

        // Adjust duration with score thresholds
        const duration = score < 1000 ? 4000 : score < 5000 ? 3000 : 2000;

        Animated.timing(meteor.y, {
          toValue: screenHeight,
          duration: duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(() => {
          // Increment score as a meteor completes its travel
          setScore((prevScore) => prevScore + 10);
          if (!gameOver) {
            animateMeteor();
          }
        });
      };
      animateMeteor();
    });
  }, [meteorPositions, gameOver, score]);

  // Fade out background music and play game-over sound when game ends.
  useEffect(() => {
    if (gameOver) {
      const fadeOutMusic = async () => {
        let volume = 1.0;
        while (volume > 0) {
          volume = Math.max(0, volume - 0.1);
          await backgroundMusic.current.setVolumeAsync(volume);
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        await backgroundMusic.current.stopAsync();
      };
      fadeOutMusic();
      gameOverSound.current.setPositionAsync(0);
      gameOverSound.current.playAsync();
    }
  }, [gameOver]);

  // Collision detection via an interval
  useEffect(() => {
    if (gameOver) return;
    const collisionInterval = setInterval(() => {
      meteorPositionsState.forEach((meteor) => {
        // Compute distance from meteor to player.
        const dx = meteor.x - (playerPos.current + 30);
        // Player is positioned 25% from the bottom; adjust offset (here 40 is an experimental offset)
        const dy = meteor.y - (screenHeight * 0.75 + 40);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 50) {
          explosionSound.current.setPositionAsync(0);
          explosionSound.current.playAsync();
          setHealth((prev) => {
            const newHealth = prev - 20;
            if (newHealth <= 0) {
              setGameOver(true);
            }
            return newHealth;
          });
        }
      });
    }, 100);

    return () => clearInterval(collisionInterval);
  }, [meteorPositionsState, gameOver]);

  // Move player left or right
  const movePlayer = (direction) => {
    if (gameOver) return;

    playerX.stopAnimation((currentValue) => {
      const moveStep = 20;
      const newX =
        direction === 'left'
          ? Math.max(0, currentValue - moveStep)
          : Math.min(screenWidth - 60, currentValue + moveStep);
      playerPos.current = newX;
      Animated.timing(playerX, {
        toValue: newX,
        duration: 100,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    });
  };

  // Restart game: reset meteors, player position, score, health, and restart background music.
  const handleRestart = () => {
    meteorPositions.forEach((meteor) => {
      meteor.setValue({
        x: Math.random() * (screenWidth - 50),
        y: Math.random() * -600,
      });
    });
    playerX.setValue(screenWidth / 2 - 30);
    playerPos.current = screenWidth / 2 - 30;
    setHealth(100);
    setScore(0);
    setGameOver(false);
    backgroundMusic.current.replayAsync();
  };

  return (
    <View style={styles.container}>
      {meteorPositions.map((meteor, index) => (
        <Animated.Image
          key={index}
          source={meteorImage}
          style={[
            styles.meteor,
            {
              transform: [
                { translateX: meteor.x },
                { translateY: meteor.y },
              ],
            },
          ]}
        />
      ))}
      <Animated.Image
        source={playerImage}
        style={[styles.player, { left: playerX }]}
      />
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={() => movePlayer('left')}
          style={styles.controlButton}
        >
          <Text style={styles.controlText}>◀</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => movePlayer('right')}
          style={styles.controlButton}
        >
          <Text style={styles.controlText}>▶</Text>
        </TouchableOpacity>
      </View>
      {gameOver && (
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.gameOverContainer}
            onPress={handleRestart}
          >
            <Text style={styles.gameOverText}>Game Over</Text>
            <Text style={styles.finalScore}>Final Score: {score}</Text>
            <Text style={styles.tapToRestart}>Tap to Restart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.goHomeButton} onPress={onRestart}>
            <Text style={styles.goHomeText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.scoreContainer}>
        <Text style={styles.score}>Score: {score}</Text>
        <Text style={styles.health}>Health: {health}</Text>
        <Text style={styles.highScore}>High Score: {highScore}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  meteor: { position: 'absolute', width: 50, height: 50 },
  player: { position: 'absolute', bottom: '25%', width: 60, height: 80 },
  controls: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  controlButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    padding: 20,
    borderRadius: 10,
  },
  controlText: { fontSize: 24, color: 'white' },
  scoreContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  score: { fontSize: 24, fontWeight: 'bold', color: '#ffd700' },
  health: { fontSize: 24, fontWeight: 'bold', color: 'red' },
  highScore: { fontSize: 24, fontWeight: 'bold', color: '#ff8c00' },
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverContainer: {
    padding: 30,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  gameOverText: { fontSize: 30, fontWeight: 'bold', color: 'red' },
  finalScore: { fontSize: 24, fontWeight: 'bold', marginTop: 10 },
  tapToRestart: { marginTop: 10, fontSize: 16, color: 'gray' },
  goHomeButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 5,
  },
  goHomeText: { fontSize: 18, color: '#fff' },
});

export default GameComponent;
