import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import './aws-config'; // Initialize Amplify
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useOfflineSync } from './hooks/useOfflineSync';

import { GameScreen } from './screens/GameScreen';
import { LifeCounterScreen } from './screens/LifeCounterScreen';
import { TournamentDetailScreen } from './screens/TournamentDetailScreen';
import { LeagueListScreen } from './screens/LeagueListScreen';
import { CreateLeagueScreen } from './screens/CreateLeagueScreen';
import { LeagueDetailScreen } from './screens/LeagueDetailScreen';
import { InvitationsScreen } from './screens/InvitationsScreen';
import { SplashScreen } from './screens/SplashScreen';
import { AuthScreen } from './screens/AuthScreen';
import { VerifyEmailScreen } from './screens/VerifyEmailScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { PlayGroupsListScreen } from './screens/PlayGroupsListScreen';
import { CreatePlayGroupScreen } from './screens/CreatePlayGroupScreen';
import { PlayGroupDetailScreen } from './screens/PlayGroupDetailScreen';
import { TournamentListScreen } from './screens/TournamentListScreen';
import { CreateTournamentScreen } from './screens/CreateTournamentScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';

const Stack = createNativeStackNavigator();

// Sends results recorded offline once the connection is back.
function OfflineSync() {
  useOfflineSync();
  return null;
}

const AppContent = () => {
  const { user, loading } = useAuth();
  const [isSplashFinished, setIsSplashFinished] = React.useState(false);

  if (!isSplashFinished) {
    return <SplashScreen onFinish={() => setIsSplashFinished(true)} />;
  }

  if (loading) {
    // Optional: Show a simple loading spinner if auth check takes longer than splash
    return null;
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" hidden />
      {user && <OfflineSync />}
      <Stack.Navigator
        screenOptions={{
          // Every screen draws its own header (title + back button); the stack header doubled it up.
          headerShown: false,
          contentStyle: { backgroundColor: '#1a1a1a' },
        }}
      >
        {user ? (
          // Authenticated Stack
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
            <Stack.Screen name="LeagueList" component={LeagueListScreen} options={{ title: 'Leagues' }} />
            <Stack.Screen name="CreateLeague" component={CreateLeagueScreen} options={{ title: 'Create League' }} />
            <Stack.Screen name="LeagueDetail" component={LeagueDetailScreen} options={{ title: 'League Details' }} />
            <Stack.Screen name="TournamentDetail" component={TournamentDetailScreen} options={{ title: 'Tournament' }} />
            <Stack.Screen name="Game" component={LifeCounterScreen} options={{ title: 'Life Counter', headerShown: false }} />
            <Stack.Screen name="Invitations" component={InvitationsScreen} options={{ title: 'Invitations' }} />
            <Stack.Screen name="TournamentList" component={TournamentListScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CreateTournament" component={CreateTournamentScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PlayGroupsList" component={PlayGroupsListScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CreatePlayGroup" component={CreatePlayGroupScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PlayGroupDetail" component={PlayGroupDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
          </>
        ) : (
          // Authentication Stack
          <>
            <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
