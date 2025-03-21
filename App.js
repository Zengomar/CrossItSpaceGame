import React, { Suspense, lazy, useState, useEffect } from 'react';
import { I18nManager, Text, View } from 'react-native';

const HomeScreen = lazy(() => import('./HomeScreen'));
const GameScreen = lazy(() => import('./GameScreen'));

const App = () => {
  useEffect(() => {
    I18nManager.forceRTL(false);
    I18nManager.allowRTL(false);
  }, []);

  const [currentScreen, setCurrentScreen] = useState('Home');

  return (
    <View style={{ flex: 1 }}>
      <Suspense fallback={<Text>Loading...</Text>}>
        {currentScreen === 'Home' ? (
          <HomeScreen onStart={() => setCurrentScreen('Game')} />
        ) : (
          <GameScreen onGoHome={() => setCurrentScreen('Home')} />
        )}
      </Suspense>
    </View>
  );
};

export default App;
