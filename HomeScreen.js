import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ImageBackground } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = ({ onStart }) => {
  const [highScore, setHighScore] = useState(0);
  const [lastScore, setLastScore] = useState(0);

  useEffect(() => {
    const loadScores = async () => {
      try {
        const savedHighScore = await AsyncStorage.getItem('highScore');

        if (savedHighScore !== null) {
          setHighScore(parseInt(savedHighScore, 10));
        }
      } catch (error) {
        console.error('Failed to load scores:', error);
      }
    };
    loadScores();
  }, []);

  return (
    <ImageBackground source={require('./assets/back.jpg')} style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to Space Adventure</Text>
        <Text style={styles.scoreText}>High Score: {highScore}</Text>
        <Button title="Start Game" onPress={onStart} />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    direction: 'ltr',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 18,
    color: 'white',
    marginBottom: 10,
  },
});

export default HomeScreen;
