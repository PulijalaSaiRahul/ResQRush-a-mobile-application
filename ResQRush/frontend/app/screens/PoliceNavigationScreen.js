// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Linking,
//   Alert,
//   ActivityIndicator,
// } from 'react-native';
// import MapView, { Marker, Polyline } from 'react-native-maps';
// import LottieView from 'lottie-react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import getAccessToken from '../services/getAccessToken';
// import { v4 as uuidv4 } from 'uuid';
// import { OLA_API_KEY } from '../services/api';
// import polyline from '@mapbox/polyline';

// const PoliceNavigationScreen = ({ route }) => {
//   const { driverLocation, hospitalLocation, hospitalName } = route.params || {};

//   const [routeCoordinates, setRouteCoordinates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [accessToken, setAccessToken] = useState(null);
//   const [error, setError] = useState(null);
//   const [eta, setEta] = useState(null);
//   const [distance, setDistance] = useState(null);

//   useEffect(() => {
//     if (!driverLocation || !hospitalLocation) {
//       setError('Driver or hospital location is missing.');
//       setLoading(false);
//       return;
//     }

//     fetchAccessToken();
//   }, [driverLocation, hospitalLocation]);

//   useEffect(() => {
//     if (!accessToken || !driverLocation || !hospitalLocation) return;
//     generateRoute(driverLocation, hospitalLocation, accessToken);
//   }, [accessToken, driverLocation, hospitalLocation]);

//   const fetchAccessToken = async () => {
//     try {
//       const token = await getAccessToken();
//       if (token) {
//         setAccessToken(token);
//       } else {
//         setError('Failed to fetch access token.');
//         setLoading(false);
//       }
//     } catch (error) {
//       console.error('Error fetching token:', error);
//       setError('Failed to fetch access token.');
//       setLoading(false);
//     }
//   };

//   const generateRoute = async (start, end, token) => {
//     if (!token) {
//       setError('Access token is missing.');
//       setLoading(false);
//       return;
//     }

//     try {
//       const url = `https://api.olamaps.io/routing/v1/directions?origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&api_key=${OLA_API_KEY}`;
//       const response = await fetch(url, {
//         method: 'POST',
//         headers: {
//           'X-Request-Id': uuidv4(),
//         },
//       });

//       if (!response.ok) {
//         throw new Error(`API Error: ${response.status}`);
//       }

//       const data = await response.json();
//       if (data.routes && data.routes[0]?.legs[0]?.readable_duration) {
//         const polylineString = data.routes[0].overview_polyline;
//         const coordinates = polyline.decode(polylineString).map(([latitude, longitude]) => ({
//           latitude,
//           longitude,
//         }));

//         if (coordinates.length > 0) {
//           coordinates[0] = start;
//           coordinates[coordinates.length - 1] = end;
//         }

//         setRouteCoordinates(coordinates);

//         const leg = data.routes[0].legs[0];
//         const durationInMinutes = parseInt(leg.readable_duration.replace(/[^0-9]/g, ''), 10);
//         setEta(`${durationInMinutes} mins`);

//         const distanceInMetres = leg.distance;
//         if (distanceInMetres < 1000) {
//           setDistance(`${distanceInMetres} m`);
//         } else {
//           setDistance(`${(distanceInMetres / 1000).toFixed(1)} km`);
//         }
//       } else {
//         throw new Error('Invalid route data structure');
//       }
//     } catch (error) {
//       console.error('Route generation failed:', error);
//       setError('Failed to generate route. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const openExternalNavigation = () => {
//     if (hospitalLocation) {
//       const url = `https://www.google.com/maps/dir/?api=1&destination=${hospitalLocation.latitude},${hospitalLocation.longitude}`;
//       Linking.openURL(url).catch(() => {
//         Alert.alert('Navigation Error', 'Cannot open external navigation app');
//       });
//     }
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <LottieView
//           source={require('../assets/ambulance_loading.json')}
//           autoPlay
//           loop
//           style={styles.ambulanceAnimation}
//         />
//         <Text style={styles.loadingText}>Generating route... Please wait!</Text>
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.errorContainer}>
//         <Text style={styles.errorText}>{error}</Text>
//         <TouchableOpacity style={styles.retryButton} onPress={fetchAccessToken}>
//           <Text style={styles.retryButtonText}>Retry</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <LinearGradient colors={['#FF6B6B', '#FF4B4B']} style={styles.etaContainer}>
//         <Text style={styles.etaText}>
//           🚑 ETA: {eta || 'Calculating...'} {distance ? ` • ${distance}` : ''}
//         </Text>
//       </LinearGradient>

//       <MapView
//         style={styles.map}
//         initialRegion={{
//           latitude: driverLocation.latitude,
//           longitude: driverLocation.longitude,
//           latitudeDelta: 0.02,
//           longitudeDelta: 0.02,
//         }}
//       >
//         <Marker
//           coordinate={{
//             latitude: driverLocation.latitude,
//             longitude: driverLocation.longitude,
//           }}
//           title="Driver's Location"
//         >
//           <LottieView
//             source={require('../assets/ambulance.json')}
//             autoPlay
//             loop
//             style={styles.lottie}
//           />
//         </Marker>

//         {hospitalLocation && (
//           <Marker
//             coordinate={{
//               latitude: hospitalLocation.latitude,
//               longitude: hospitalLocation.longitude,
//             }}
//             title={hospitalName}
//           >
//             <View style={styles.hospitalMarkerContainer}>
//               <LottieView
//                 source={require('../assets/hospital.json')}
//                 autoPlay
//                 loop
//                 style={styles.hospitalLottie}
//               />
//             </View>
//           </Marker>
//         )}

//         {routeCoordinates.length > 0 && (
//           <Polyline
//             coordinates={routeCoordinates}
//             strokeWidth={5}
//             strokeColor="#4285F4"
//           />
//         )}
//       </MapView>

//       <TouchableOpacity style={styles.navButton} onPress={openExternalNavigation}>
//         <Text style={styles.navButtonText}>Open in Google Maps</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f4f4f4',
//   },
//   map: {
//     flex: 1,
//   },
//   lottie: {
//     width: 50,
//     height: 50,
//   },
//   hospitalMarkerContainer: {
//     backgroundColor: 'rgba(255, 255, 255, 0.8)',
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 0,
//   },
//   hospitalLottie: {
//     width: 40,
//     height: 40,
//   },
//   navButton: {
//     position: 'absolute',
//     bottom: 40,
//     alignSelf: 'center',
//     backgroundColor: '#4285F4',
//     paddingVertical: 12,
//     paddingHorizontal: 24,
//     borderRadius: 50,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   navButtonText: {
//     color: 'white',
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//   },
//   ambulanceAnimation: {
//     width: 200,
//     height: 200,
//   },
//   loadingText: {
//     marginTop: 20,
//     fontSize: 18,
//     color: '#333',
//     fontWeight: 'bold',
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//     backgroundColor: '#fff',
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#FF0000',
//     textAlign: 'center',
//   },
//   retryButton: {
//     marginTop: 20,
//     backgroundColor: '#4285F4',
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 5,
//   },
//   retryButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   etaContainer: {
//     position: 'absolute',
//     top: 40,
//     left: '10%',
//     right: '10%',
//     padding: 15,
//     borderRadius: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//     zIndex: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   etaText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: 'bold',
//     textAlign: 'center',
//   },
// });

// export default PoliceNavigationScreen;


import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../firebase/firebaseConnection';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import getAccessToken from '../services/getAccessToken';
import { v4 as uuidv4 } from 'uuid';
import { OLA_API_KEY } from '../services/api';
import polyline from '@mapbox/polyline';
import * as Location from 'expo-location';

const PoliceNavigationScreen = ({ route, navigation }) => {
  const { incidentId } = route.params;
  
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [error, setError] = useState(null);
  const [destination, setDestination] = useState(null);
  const [incidentData, setIncidentData] = useState(null);
  const [hospitalData, setHospitalData] = useState(null);
  const [isGoingToHospital, setIsGoingToHospital] = useState(false);
  const lastApiCallTime = useRef(0);
  const unsubscribeRef = useRef(null);
  const locationSubscription = useRef(null);

  const fetchHospitalData = async (hospitalId) => {
    try {
      const hospitalRef = doc(db, 'hospitals', hospitalId);
      const hospitalSnap = await getDoc(hospitalRef);
      
      if (hospitalSnap.exists()) {
        return hospitalSnap.data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching hospital data:', error);
      return null;
    }
  };

  const switchToHospitalNavigation = async (hospitalId) => {
    try {
      const hospitalData = await fetchHospitalData(hospitalId);
      if (hospitalData) {
        setHospitalData(hospitalData);
        setDestination({
          latitude: hospitalData.latitude,
          longitude: hospitalData.longitude,
          address: hospitalData.address,
          name: hospitalData.name,
          type: 'hospital'
        });
        setIsGoingToHospital(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error switching to hospital navigation:', error);
      return false;
    }
  };

  useEffect(() => {
    const initializeNavigation = async () => {
      try {
        if (!incidentId) {
          throw new Error('Incident ID not provided');
        }

        // Get current device location
        await requestLocationPermission();
        startLocationTracking();

        // Fetch incident data
        const incidentRef = doc(db, 'incidents', incidentId);
        const incidentSnap = await getDoc(incidentRef);

        if (!incidentSnap.exists()) {
          throw new Error('Incident not found in database');
        }

        const data = incidentSnap.data();
        setIncidentData(data);

        // Determine initial destination based on status
        if (data.status?.driver === 'completed' && data.status?.hospital === 'accepted' && data.hospitalInfo?.id) {
          await switchToHospitalNavigation(data.hospitalInfo.id);
        } else {
          // Navigate to incident location
          setDestination({
            latitude: data.latitude,
            longitude: data.longitude,
            address: data.address,
            type: 'incident'
          });
          setIsGoingToHospital(false);
        }

        // Set up listener for incident updates
        unsubscribeRef.current = onSnapshot(incidentRef, async (doc) => {
          const updatedData = doc.data();
          setIncidentData(updatedData);

          // Check if we should switch to hospital navigation
          if (updatedData.status?.driver === 'completed' && 
              updatedData.status?.hospital === 'accepted' &&
              updatedData.hospitalInfo?.id &&
              !isGoingToHospital) {
            await switchToHospitalNavigation(updatedData.hospitalInfo.id);
          }
        });

        fetchAccessToken();
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err.message || 'Failed to initialize navigation');
        setLoading(false);
      }
    };

    initializeNavigation();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, [incidentId]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      throw error;
    }
  };

  const startLocationTracking = async () => {
    try {
      // Get initial location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Subscribe to location updates
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      );
    } catch (error) {
      console.error('Error getting location:', error);
      throw error;
    }
  };

  const fetchAccessToken = async () => {
    try {
      const token = await getAccessToken();
      setAccessToken(token);
    } catch (error) {
      console.error('Error fetching access token:', error);
      createSimpleRoute(currentLocation, destination);
      setLoading(false);
    }
  };

  const generateRoute = async (start, end, token) => {
    if (!start?.latitude || !start?.longitude || !end?.latitude || !end?.longitude) {
      console.error('Invalid coordinates for route generation');
      createSimpleRoute(start, end);
      return;
    }

    if (!token) {
      createSimpleRoute(start, end);
      return;
    }

    try {
      const now = Date.now();
      if (now - lastApiCallTime.current < 10000) return;
      lastApiCallTime.current = now;

      const url = `https://api.olamaps.io/routing/v1/directions?origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&api_key=${OLA_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-Request-Id': uuidv4(),
        },
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      if (data.routes && data.routes[0]?.legs[0]?.readable_duration) {
        const polylineString = data.routes[0].overview_polyline;
        const coordinates = polyline.decode(polylineString).map(([latitude, longitude]) => ({
          latitude,
          longitude,
        }));

        if (coordinates.length > 0) {
          coordinates[0] = start;
          coordinates[coordinates.length - 1] = end;
        }

        setRouteCoordinates(coordinates);

        const leg = data.routes[0].legs[0];
        const durationInMinutes = parseInt(leg.readable_duration.replace(/[^0-9]/g, ''), 10);
        setEta(`${durationInMinutes} mins`);

        const distanceInMetres = leg.distance;
        setDistance(distanceInMetres < 1000 ? 
          `${distanceInMetres} m` : 
          `${(distanceInMetres / 1000).toFixed(1)} km`
        );
      } else {
        throw new Error('Invalid route data');
      }
    } catch (error) {
      console.error('Route generation failed:', error);
      createSimpleRoute(start, end);
    } finally {
      setLoading(false);
    }
  };

  const createSimpleRoute = (start, end) => {
    if (!start?.latitude || !start?.longitude || !end?.latitude || !end?.longitude) {
      console.error('Invalid coordinates for simple route');
      setRouteCoordinates([]);
      setEta(null);
      setDistance(null);
      return;
    }

    const simpleRoute = [start, end];
    setRouteCoordinates(simpleRoute);

    const R = 6371;
    const dLat = (end.latitude - start.latitude) * (Math.PI / 180);
    const dLon = (end.longitude - start.longitude) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(start.latitude * (Math.PI / 180)) * Math.cos(end.latitude * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;

    setDistance(d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`);
    
    const estimatedTimeHours = d / 30;
    const estimatedTimeMinutes = Math.round(estimatedTimeHours * 60);
    setEta(`${estimatedTimeMinutes} mins`);
  };

  const openExternalNavigation = () => {
    if (destination) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open navigation app');
      });
    }
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    fetchAccessToken();
  };

  useEffect(() => {
    if (accessToken && currentLocation && destination) {
      generateRoute(currentLocation, destination, accessToken);
    }
  }, [accessToken, currentLocation, destination]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF0000" />
        <Text style={styles.loadingText}>Generating route...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.retryButton, { marginTop: 10, backgroundColor: '#FF0000' }]} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentLocation || !destination) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Location data not available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={isGoingToHospital ? ['#4CAF50', '#2E7D32'] : ['#FF0000', '#CC0000']} 
        style={styles.etaContainer}
      >
        <Text style={styles.etaText}>
          {isGoingToHospital ? '🏥 Hospital' : '🚨 Incident'} • ETA: {eta || 'Calculating...'} {distance ? ` • ${distance}` : ''}
        </Text>
        <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="tail">
          {isGoingToHospital ? 
            (hospitalData?.name || hospitalData?.address || 'Hospital') : 
            (incidentData?.address || 'Incident Location')}
        </Text>
      </LinearGradient>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        region={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <Marker
          coordinate={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
          title="Your Location"
        >
          <View style={styles.policeMarkerContainer}>
            <LottieView
              source={require('../assets/ambulance.json')}
              autoPlay
              loop
              style={styles.policeLottie}
            />
          </View>
        </Marker>

        <Marker
          coordinate={{
            latitude: destination.latitude,
            longitude: destination.longitude,
          }}
          title={isGoingToHospital ? 'Hospital' : 'Incident'}
          description={destination.address}
        >
          <View style={styles.targetMarkerContainer}>
            <LottieView
              source={isGoingToHospital ? 
                require('../assets/hospital.json') : 
                require('../assets/alert.json')}
              autoPlay
              loop
              style={styles.targetLottie}
            />
          </View>
        </Marker>

        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={5}
            strokeColor={isGoingToHospital ? '#4CAF50' : '#4285F4'}
          />
        )}
      </MapView>

      <TouchableOpacity 
        style={[styles.navButton, isGoingToHospital && { backgroundColor: '#4CAF50' }]} 
        onPress={openExternalNavigation}
      >
        <Text style={styles.navButtonText}>
          Open in Google Maps {isGoingToHospital ? '(Hospital)' : '(Incident)'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  etaContainer: {
    position: 'absolute',
    top: 40,
    left: '10%',
    right: '10%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  etaText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  addressText: {
    color: 'white',
    fontSize: 14,
    marginTop: 5,
    maxWidth: '90%',
  },
  map: {
    flex: 1,
  },
  policeMarkerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  policeLottie: {
    width: 50,
    height: 50,
  },
  targetMarkerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  targetLottie: {
    width: 40,
    height: 40,
  },
  navButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  navButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#FF0000',
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#FF0000',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PoliceNavigationScreen;