import React, { useState } from 'react';
import { View } from 'react-native';
import HomeScreen from './HomeScreen';
import GameScreen from './GameScreen';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('Home');

  return (
    <View style={{ flex: 1 }}>
      {currentScreen === 'Home' ? (
        <HomeScreen onStart={() => setCurrentScreen('Game')} />
      ) : (
        <GameScreen onGoHome={() => setCurrentScreen('Home')} />
      )}
    </View>
  );
};

export default App;
