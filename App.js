import React, {Suspense , useState , useEffect} from 'react';
import { I18nManager } from 'react-native';
import { View } from 'react-native';
const HomeScreen = React.lazy(() => import('./HomeScreen'));
const GameScreen = React.lazy(() => import('./GameScreen'));

const App = () => {

  useEffect(() => {
    I18nManager.forceRTL(false);
    I18nManager.allowRTL(false);
  }, []);

  const [currentScreen, setCurrentScreen] = useState('Home');

  return (
    <View style={{ flex: 1 }}>
      <Suspense fallback={<Text>Loading Media...</Text>}>
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
