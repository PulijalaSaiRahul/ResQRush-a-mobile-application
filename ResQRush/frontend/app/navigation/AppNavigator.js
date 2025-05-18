import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MainScreen from '../screens/MainScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DriverScreen from '../screens/DriverScreen';
import HospitalScreen from '../screens/HospitalScreen';
import PoliceScreen from '../screens/PoliceScreen';
import DriverNavigationScreen from '../screens/DriverNavigationScreen';
import HospitalNavigationScreen from '../screens/HospitalNavigationScreen';
import PoliceNavigationScreen from '../screens/PoliceNavigationScreen';
import UserScreen from '../screens/UserScreen';
import HospitalSelectionScreen from '../screens/HospitalSelectionScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Main">
      <Stack.Screen
        name="Main"
        component={MainScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Driver"
        component={DriverScreen}
        options={{
          headerShown: true,
          title: 'Ambulance',
          headerStyle: {
            backgroundColor: '#3b5998',
          },
          headerTintColor: '#fff', 
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen
        name="Hospital"
        component={HospitalScreen}
        options={{
          headerShown: true,
          title: 'Ambulance',
          headerStyle: {
            backgroundColor: '#388E3C',
          },
          headerTintColor: '#fff', 
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen
        name="Police"
        component={PoliceScreen}
        options={{
          headerShown: true,
          title: 'Police Control Room',
          headerStyle: {
            backgroundColor: '#ef4444',
          },
          headerTintColor: '#fff', 
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen
        name="User"
        component={UserScreen}
        options={{
          headerShown: true,
          title: 'Report Emergency',
          headerStyle: {
            backgroundColor: '#3b5998',
          },
          headerTintColor: '#fff', 
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen
        name="DriverNavigation"
        component={DriverNavigationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HospitalSelection"
        component={HospitalSelectionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HospitalNavigation"
        component={HospitalNavigationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PoliceNavigation"
        component={PoliceNavigationScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;