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

  const scoreRef = useRef(score);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const playerX = useRef(new Animated.Value(screenWidth / 2 - 30)).current;
  const playerPos = useRef(screenWidth / 2 - 30);

  const [meteorPositions, setMeteorPositions] = useState(
    Array.from({ length: 5 }).map(() =>
      new Animated.ValueXY({
        x: Math.random() * (screenWidth - 50),
        y: Math.random() * -600,
      })
    )
  );

  useEffect(() => {
    const len = score < 1000 ? 5 : score < 5000 ? 7 : 9;
    if (meteorPositions.length !== len) {
      setMeteorPositions(
        Array.from({ length: len }).map(() =>
          new Animated.ValueXY({
            x: Math.random() * (screenWidth - 50),
            y: Math.random() * -600,
          })
        )
      );
    }
  }, [score]);

  const backgroundMusic = useRef(new Audio.Sound());
  const explosionSound = useRef(new Audio.Sound());
  const gameOverSound = useRef(new Audio.Sound());

  useEffect(() => {
    const loadSounds = async () => {
      try {
        await backgroundMusic.current.loadAsync(require('./assets/spaceship.mp3'), { isLooping: true });
        await explosionSound.current.loadAsync(require('./assets/explosion1.mp3'));
        await gameOverSound.current.loadAsync(require('./assets/gameover.mp3'));
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

  useEffect(() => {
    if (gameOver) return;

    meteorPositions.forEach((meteor, index) => {
      const animateMeteor = () => {
        if (gameOver) return;
        const newX = Math.random() * (screenWidth - 50);
        const newY = -50;
        meteor.setValue({ x: newX, y: newY });

        const duration = 4000; // Set duration to always be 4000 milliseconds

        Animated.timing(meteor.y, {
          toValue: screenHeight,
          duration: duration,
          easing: Easing.linear,
          useNativeDriver: true, // Use native driver for smooth animation
        }).start(() => {
          if (!gameOver) {
            animateMeteor(); // Restart the animation for continuous movement
          }
        });
      };
      animateMeteor();
    });
  }, [meteorPositions, gameOver]);

  useEffect(() => {
    if (gameOver) {
      const fadeOutMusic = async () => {
        let volume = 1.0;
        while (volume > 0) {
          volume -= 0.1;
          await backgroundMusic.current.setVolumeAsync(volume);
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        await backgroundMusic.current.stopAsync();
      };
      fadeOutMusic();
      gameOverSound.current.setPositionAsync(0);
      gameOverSound.current.playAsync();

      // Update high score when game is over
      if (score > highScore) {
        setHighScore(score);
        AsyncStorage.setItem('highScore', score.toString());
      }
    }
  }, [gameOver]);

  useEffect(() => {
    if (gameOver) return;

    const scoreInterval = setInterval(() => {
      setScore((prevScore) => prevScore + 1);
    }, 1000 / 30);

    return () => clearInterval(scoreInterval);
  }, [gameOver, score]); // Added score as a dependency

  useEffect(() => {
    if (gameOver) return;

    const meteorListeners = meteorPositions.map((meteor, index) => {
      const listener = meteor.addListener(({ x, y }) => {
        meteorPositions[index].x._value = x;
        meteorPositions[index].y._value = y;
      });
      return listener;
    });

    const collisionInterval = setInterval(() => {
      meteorPositions.forEach((meteor) => {
        const playerXPos = playerPos.current + 30; // Adjust for player width
        const playerYPos = screenHeight * 0.75 + 40; // Adjust for player height
        const meteorXPos = meteor.x._value + 25; // Adjust for meteor width
        const meteorYPos = meteor.y._value + 25; // Adjust for meteor height
        const dx = meteorXPos - playerXPos;
        const dy = meteorYPos - playerYPos;
        const distance = Math.sqrt(dx * dx + dy * dy);

        console.log(`Meteor Position: (${meteorXPos}, ${meteorYPos})`);
        console.log(`Player Position: (${playerXPos}, ${playerYPos})`);
        console.log(`Distance: ${distance}`);

        if (distance < 50) { // Adjust collision threshold if necessary
          console.log('Collision detected!');
          explosionSound.current.setPositionAsync(0);
          explosionSound.current.playAsync();
          setHealth((prev) => {
            const newHealth = prev - 1;
            if (newHealth <= 0) setGameOver(true);
            return newHealth;
          });
        }
      });
    }, 100);

    return () => {
      clearInterval(collisionInterval);
      meteorListeners.forEach((listener, index) => {
        meteorPositions[index].removeListener(listener);
      });
    };
  }, [meteorPositions, gameOver, playerPos]); // Added playerPos as a dependency

  useEffect(() => {
    const loadHighScore = async () => {
      try {
        const savedHighScore = await AsyncStorage.getItem('highScore');
        if (savedHighScore !== null) {
          setHighScore(parseInt(savedHighScore, 10));
        }
      } catch (error) {
        console.error('Error loading high score:', error);
      }
    };
    loadHighScore();
  }, []);

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
        useNativeDriver: true, // Use native driver for smooth animation
      }).start();
    });
  };

  const handleRestart = () => {
    meteorPositions.forEach((meteor) => {
      meteor.setValue({
        x: Math.random() * (screenWidth - 50),
        y: Math.random() * -600,
      });
    });
    playerX.setValue(screenWidth / 2 - 30);
    playerPos.current = screenWidth / 2 - 30;
    setHealth(100); // Ensure health is reset to 100
    setScore(0);
    setGameOver(false);
  };

  console.log("num-metoers: ", meteorPositions.length);
  return (
    <View style={styles.container}>
      {meteorPositions.map((meteor, index) => (
        <Animated.Image
          key={index} // Use a stable key
          source={meteorImage}
          style={[styles.meteor, { transform: [{ translateX: meteor.x }, { translateY: meteor.y }], zIndex: 1 }]}
        />
      ))}
      <Animated.Image source={playerImage} style={[styles.player, { transform: [{ translateX: playerX }], zIndex: 0 }]} />
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => movePlayer('left')} style={styles.controlButton}>
          <Text style={styles.controlText}>◀</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => movePlayer('right')} style={styles.controlButton}>
          <Text style={styles.controlText}>▶</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.score}>Score: {score}</Text>
      <Text style={styles.health}>Health: {health}%</Text>
      <Text style={styles.highScore}>High Score: {highScore}</Text>
      {gameOver && (
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.tapToRestart} onPress={handleRestart}><Text style={styles.gameOverText}>Restart</Text></TouchableOpacity>
          <TouchableOpacity style={styles.goHomeButton} onPress={onRestart}><Text style={styles.goHomeText}>Go Home</Text></TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  meteor: { position: 'absolute', width: 50, height: 50, zIndex: 1 },
  player: { position: 'absolute', bottom: '25%', width: 60, height: 80, zIndex: 0 },
  controls: { position: 'absolute', bottom: 50, width: '100%', flexDirection: 'row', justifyContent: 'space-around' },
  controlButton: { backgroundColor: 'rgba(255,255,255,0.3)', padding: 20, borderRadius: 10 },
  controlText: { fontSize: 24, color: 'white' },
  score: { position: 'absolute', top: 20, right: 20, fontSize: 24, fontWeight: 'bold', color: '#ffd700' },
  health: { position: 'absolute', top: 20, left: 20, fontSize: 24, fontWeight: 'bold', color: 'red' },
  highScore: { position: 'absolute', top: 60, right: 20, fontSize: 24, fontWeight: 'bold', color: '#ff8c00' },
  overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(26, 25, 25, 0.7)', justifyContent: 'center', alignItems: 'center',zIndex: 2 },
  gameOverContainer: { 
    padding: 30, 
    borderRadius: 10, 
    backgroundColor: '#fff', 
    alignItems: 'center'
  },
  gameOverText: { fontSize: 30, fontWeight: 'bold', color: 'white' },
  finalScore: { fontSize: 24, fontWeight: 'bold', marginTop: 10 },
  tapToRestart: { marginTop: 10, fontSize: 16, fontWeight: 'bold', color: 'white' },
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
    elevation: 5
  },
  goHomeText: { fontSize: 18, color: '#fff' },
});

export default React.memo(GameComponent);