/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ManagerDashbaordScreen from './src/screens/ManagerDashbaordScreen';
import UserDetailScreen from './src/screens/UserDetailsScreen';
import UserWeeklySummaries from './src/screens/UserWeeklySummaries';

const Stack = createNativeStackNavigator();

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState('');

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const role = await AsyncStorage.getItem('role');
        setRole(role);

        setIsLoggedIn(!!token);
      } catch (error) {
        console.error('Error fetching token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLogin();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="blue" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator >
        {isLoggedIn ? (
          <>
            {
              role === "employee" && (
                <Stack.Screen name="Dashboard"
                  options={{
                    title: 'Employee Dashboard',
                    headerTitleAlign: 'left',
                    headerRight: () => (
                      <TouchableOpacity
                        onPress={async () => {
                          await AsyncStorage.clear()
                          setIsLoggedIn(null);
                        }}
                        style={{ marginRight: 15 }}
                      >
                        <Text style={{ color: 'red', fontSize: 16 }}>Logout</Text>
                      </TouchableOpacity>
                    ),
                  }}
                >
                  {props => <DashboardScreen {...props} setIsLoggedIn={setIsLoggedIn}
                  />}
                </Stack.Screen>
              )
            }
            {
              role === "manager" && (
                <>
                  <Stack.Screen name="ManagerDashboard"
                    options={{
                      title: 'Manager Dashboard',
                      headerTitleAlign: 'left',
                      headerRight: () => (
                        <TouchableOpacity
                          onPress={async () => {
                            await AsyncStorage.clear()
                            setIsLoggedIn(null);
                          }}
                          style={{ marginRight: 15 }}
                        >
                          <Text style={{ color: 'red', fontSize: 16 }}>Logout</Text>
                        </TouchableOpacity>
                      ),
                    }}>
                    {props => <ManagerDashbaordScreen {...props} setIsLoggedIn={setIsLoggedIn} />}
                  </Stack.Screen>
                  <Stack.Screen name="UserDetailScreen" options={{ title: 'User Details', headerTitleAlign: 'center' }} >
                    {props => <UserDetailScreen {...props} setIsLoggedIn={setIsLoggedIn} />}
                  </Stack.Screen>
                  <Stack.Screen name="UserWeeklySummaries" options={{ title: 'User Weekly Timesheet', headerTitleAlign: 'center' }} >
                    {props => <UserWeeklySummaries {...props} setIsLoggedIn={setIsLoggedIn} />}
                  </Stack.Screen>
                </>
              )
            }
          </>

        ) : (
          <>

            <Stack.Screen name="Login" options={{ headerShown: false }} >
              {props => <LoginScreen {...props} setIsLoggedIn={setIsLoggedIn} setRole={setRole} />}
            </Stack.Screen>
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
