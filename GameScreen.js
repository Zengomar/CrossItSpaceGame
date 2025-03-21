import React, { Suspense, lazy } from 'react'
import { View, StyleSheet, StatusBar, Text } from 'react-native';

// Use React.lazy to dynamically import components
const GameComponent = lazy(() => import('./GameComponent'));
const AnimatedBackground = lazy(() => import('./AnimatedBackground'));

// Import assets
import backgroundImage from './assets/back.jpg';
import playerImage from './assets/player.png';
import meteorImage from './assets/meteor.png';

const GameScreen = React.memo(({ onGoHome }) => {
  return (
    <View style={styles.container}>
      {/* Suspense handles the loading state while lazy components are fetched */}
      <Suspense fallback={<Text>Loading...</Text>}>
        <AnimatedBackground backgroundImage={backgroundImage} />
        <GameComponent
          playerImage={playerImage}
          meteorImage={meteorImage}
          onRestart={onGoHome}
        />
        <StatusBar hidden={true} />
      </Suspense>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
});

export default GameScreen;
