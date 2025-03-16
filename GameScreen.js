import React ,{ Suspense } from 'react';
import { View, StyleSheet , StatusBar } from 'react-native';

const GameComponent = React.lazy(() => import('./GameComponent'));
const AnimatedBackground = React.lazy(() => import('./AnimatedBackground'));
import backgroundImage from './assets/back.jpg';
import playerImage from './assets/player.png';
import meteorImage from './assets/meteor.png';

const GameScreen = ({ onGoHome }) => {

  return (
    <View style={styles.container}>
      <Suspense fallback={<Text>Loading...</Text>}>
        <AnimatedBackground backgroundImage={backgroundImage} />
        <GameComponent playerImage={playerImage} meteorImage={meteorImage} onRestart={onGoHome} />
        <StatusBar hidden={true} />
        </Suspense>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' ,direction: 'ltr',},
});

export default GameScreen;
