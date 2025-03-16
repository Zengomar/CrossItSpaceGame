import React from 'react';
import { View, StyleSheet , StatusBar } from 'react-native';
// import { StatusBar } from 'expo-status-bar';
import GameComponent from './GameComponent'; // Adjust the path if necessary

import AnimatedBackground from './AnimatedBackground'; // Adjust the path as needed
import backgroundImage from './assets/back.jpg';
import playerImage from './assets/player.png';
import meteorImage from './assets/meteor.png';

const GameScreen = ({ onGoHome }) => {

  return (
    <View style={styles.container}>
        <>
          <AnimatedBackground backgroundImage={backgroundImage} />
          <GameComponent playerImage={playerImage} meteorImage={meteorImage} onRestart={onGoHome} />
        </>
       <StatusBar hidden={true} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' ,direction: 'ltr',},
});

export default GameScreen;
