// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Linking,
//   Alert,
// } from "react-native";
// import MapView, { Marker, Polyline } from "react-native-maps";
// import LottieView from "lottie-react-native";
// import { LinearGradient } from "expo-linear-gradient";
// import getAccessToken from "../services/getAccessToken";
// import { v4 as uuidv4 } from "uuid";
// import { OLA_API_KEY } from "../services/api";
// import polyline from "@mapbox/polyline";

// const HospitalNavigationScreen = ({ route }) => {
//   const { driverLocation, hospitalLocation, hospitalName } = route.params || {};

//   const [routeCoordinates, setRouteCoordinates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [eta, setEta] = useState(null);
//   const [distance, setDistance] = useState(null);
//   const [accessToken, setAccessToken] = useState(null);

//   useEffect(() => {
//     console.log("Driver Location (HospitalNavigationScreen):", driverLocation);
//     console.log("Hospital Location (HospitalNavigationScreen):", hospitalLocation);

//     if (!hospitalLocation) {
//       Alert.alert("Error", "Missing hospital location data. Please try again.");
//       return;
//     }

//     // Fetch access token for routing API
//     fetchAccessToken();
//   }, []);

//   useEffect(() => {
//     if (!accessToken || !driverLocation || !hospitalLocation) return;

//     // Generate route initially
//     generateRoute(driverLocation, hospitalLocation, accessToken);
//   }, [accessToken]);

//   // Fetch access token for API calls
//   const fetchAccessToken = async () => {
//     try {
//       const token = await getAccessToken();
//       if (token) {
//         setAccessToken(token);
//       } else {
//         createSimpleRoute(driverLocation, hospitalLocation);
//         setLoading(false);
//       }
//     } catch (error) {
//       console.error("Error fetching token:", error);
//       createSimpleRoute(driverLocation, hospitalLocation);
//       setLoading(false);
//     }
//   };

//   // Generate route using OLA Maps API
//   const generateRoute = async (start, end, token) => {
//     if (!token) return;

//     try {
//       const url = `https://api.olamaps.io/routing/v1/directions?origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&api_key=${OLA_API_KEY}`;
//       console.log("API Request URL:", url); // Log the API request URL

//       const response = await fetch(url, {
//         method: "POST",
//         headers: {
//           "X-Request-Id": uuidv4(),
//         },
//       });

//       if (!response.ok) {
//         throw new Error(`API Error: ${response.status}`);
//       }

//       const data = await response.json();
//       console.log("API Response:", data); // Log the API response

//       if (data.routes && data.routes[0]?.legs[0]?.readable_duration) {
//         const polylineString = data.routes[0].overview_polyline;
//         console.log("Polyline:", polylineString); // Log the polyline

//         // Decode the polyline using @mapbox/polyline
//         const coordinates = polyline.decode(polylineString).map(([latitude, longitude]) => ({
//           latitude,
//           longitude,
//         }));
//         console.log("Decoded Coordinates:", coordinates); // Log the decoded coordinates

//         // Ensure the first and last coordinates match the start and end points
//         if (coordinates.length > 0) {
//           coordinates[0] = start; // Ensure the first point matches the driver's location
//           coordinates[coordinates.length - 1] = end; // Ensure the last point matches the hospital's location
//         }

//         console.log("Final Route Coordinates:", coordinates); // Log the final coordinates
//         setRouteCoordinates(coordinates);

//         // Set ETA and distance
//         const leg = data.routes[0].legs[0];
//         const durationInMinutes = leg.readable_duration.replace(/[^0-9]/g, "");
//         setEta(`${durationInMinutes} mins`);

//         const distanceInMetres = leg.distance;
//         if (distanceInMetres < 1000) {
//           setDistance(`${distanceInMetres} m`);
//         } else {
//           setDistance(`${(distanceInMetres / 1000).toFixed(1)} km`);
//         }
//       } else {
//         throw new Error("Invalid route data structure");
//       }
//     } catch (error) {
//       console.error("Route generation failed:", error);
//       createSimpleRoute(start, end);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Create a simple straight-line route when API fails
//   const createSimpleRoute = (start, end) => {
//     if (!start?.latitude || !start?.longitude || !end?.latitude || !end?.longitude) {
//       console.error("Invalid coordinates for simple route");
//       setRouteCoordinates([]);
//       setEta(null);
//       setDistance(null);
//       return;
//     }

//     const simpleRoute = [start, end];
//     setRouteCoordinates(simpleRoute);

//     const R = 6371; // Earth's radius in km
//     const dLat = (end.latitude - start.latitude) * (Math.PI / 180);
//     const dLon = (end.longitude - start.longitude) * (Math.PI / 180);
//     const a =
//       Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//       Math.cos(start.latitude * (Math.PI / 180)) * Math.cos(end.latitude * (Math.PI / 180)) *
//       Math.sin(dLon / 2) * Math.sin(dLon / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     const d = R * c;

//     if (d < 1) {
//       setDistance(`${Math.round(d * 1000)} m`);
//     } else {
//       setDistance(`${d.toFixed(1)} km`);
//     }
//     setEta(`${Math.round((d / 30) * 60)} mins`);
//   };

//   // Open external navigation app
//   const openExternalNavigation = () => {
//     if (hospitalLocation) {
//       const url = `https://www.google.com/maps/dir/?api=1&destination=${hospitalLocation.latitude},${hospitalLocation.longitude}`;
//       Linking.openURL(url).catch(() => {
//         Alert.alert("Navigation Error", "Cannot open external navigation app");
//       });
//     }
//   };

//   return (
//     <View style={styles.container}>
//       {/* ETA Display */}
//       <LinearGradient colors={["#FF6B6B", "#FF4B4B"]} style={styles.etaContainer}>
//         <Text style={styles.etaText}>
//           🚑 ETA: {eta || "Calculating..."} {distance ? ` • ${distance}` : ""}
//         </Text>
//       </LinearGradient>

//       {/* Map View */}
//       <MapView
//         style={styles.map}
//         initialRegion={{
//           latitude: driverLocation.latitude,
//           longitude: driverLocation.longitude,
//           latitudeDelta: 0.05,
//           longitudeDelta: 0.05,
//         }}
//       >
//         {/* Driver's Location Marker */}
//         <Marker
//           coordinate={{
//             latitude: driverLocation.latitude,
//             longitude: driverLocation.longitude,
//           }}
//           title="Driver's Location"
//         >
//           <LottieView
//             source={require("../assets/ambulance.json")}
//             autoPlay
//             loop
//             style={styles.lottie}
//           />
//         </Marker>

//         {/* Hospital Location Marker */}
//         {hospitalLocation && (
//           <Marker
//             coordinate={{
//               latitude: hospitalLocation.latitude,
//               longitude: hospitalLocation.longitude,
//             }}
//             title={hospitalName}
//             pinColor="red"
//           />
//         )}

//         {/* Route Polyline */}
//         {routeCoordinates.length > 0 && (
//           <Polyline
//             coordinates={routeCoordinates}
//             strokeWidth={5}
//             strokeColor="#4285F4"
//           />
//         )}
//       </MapView>

//       {/* Open in Google Maps Button */}
//       <TouchableOpacity style={styles.navButton} onPress={openExternalNavigation}>
//         <Text style={styles.navButtonText}>Open in Google Maps</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f4f4f4",
//   },
//   etaContainer: {
//     position: "absolute",
//     top: 40,
//     left: "10%",
//     right: "10%",
//     padding: 15,
//     borderRadius: 10,
//     alignItems: "center",
//     justifyContent: "center",
//     zIndex: 10,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   etaText: {
//     color: "white",
//     fontSize: 18,
//     fontWeight: "bold",
//     textAlign: "center",
//   },
//   map: {
//     flex: 1,
//   },
//   lottie: {
//     width: 50,
//     height: 50,
//   },
//   navButton: {
//     position: "absolute",
//     bottom: 40,
//     alignSelf: "center",
//     backgroundColor: "#4285F4",
//     paddingVertical: 12,
//     paddingHorizontal: 24,
//     borderRadius: 50,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   navButtonText: {
//     color: "white",
//     fontWeight: "bold",
//     fontSize: 16,
//   },
// });

// export default HospitalNavigationScreen;

// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Linking,
//   Alert,
// } from "react-native";
// import MapView, { Marker, Polyline } from "react-native-maps";
// import LottieView from "lottie-react-native";
// import { LinearGradient } from "expo-linear-gradient";
// import getAccessToken from "../services/getAccessToken";
// import { v4 as uuidv4 } from "uuid";
// import { OLA_API_KEY } from "../services/api";
// import polyline from "@mapbox/polyline";

// const HospitalNavigationScreen = ({ route }) => {
//   const { driverLocation, hospitalLocation, hospitalName } = route.params || {};

//   const [routeCoordinates, setRouteCoordinates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [accessToken, setAccessToken] = useState(null);

//   useEffect(() => {
//     if (!driverLocation || !hospitalLocation) return;

//     // Fetch access token for routing API
//     fetchAccessToken();
//   }, [driverLocation, hospitalLocation]);

//   useEffect(() => {
//     if (!accessToken || !driverLocation || !hospitalLocation) return;

//     // Generate route for the selected driver
//     generateRoute(driverLocation, hospitalLocation, accessToken);
//   }, [accessToken, driverLocation, hospitalLocation]);

//   const fetchAccessToken = async () => {
//     try {
//       const token = await getAccessToken();
//       if (token) {
//         setAccessToken(token);
//       } else {
//         setLoading(false);
//       }
//     } catch (error) {
//       console.error("Error fetching token:", error);
//       setLoading(false);
//     }
//   };

//   const generateRoute = async (start, end, token) => {
//     if (!token) return;

//     try {
//       const url = `https://api.olamaps.io/routing/v1/directions?origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&api_key=${OLA_API_KEY}`;
//       const response = await fetch(url, {
//         method: "POST",
//         headers: {
//           "X-Request-Id": uuidv4(),
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
//       } else {
//         throw new Error("Invalid route data structure");
//       }
//     } catch (error) {
//       console.error("Route generation failed:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const openExternalNavigation = () => {
//     if (hospitalLocation) {
//       const url = `https://www.google.com/maps/dir/?api=1&destination=${hospitalLocation.latitude},${hospitalLocation.longitude}`;
//       Linking.openURL(url).catch(() => {
//         Alert.alert("Navigation Error", "Cannot open external navigation app");
//       });
//     }
//   };

//   return (
//     <View style={styles.container}>
//       {/* Map View */}
//       <MapView
//         style={styles.map}
//         initialRegion={{
//           latitude: driverLocation.latitude,
//           longitude: driverLocation.longitude,
//           latitudeDelta: 0.05,
//           longitudeDelta: 0.05,
//         }}
//       >
//         {/* Driver's Location Marker */}
//         <Marker
//           coordinate={{
//             latitude: driverLocation.latitude,
//             longitude: driverLocation.longitude,
//           }}
//           title="Driver's Location"
//         >
//           <LottieView
//             source={require("../assets/ambulance.json")}
//             autoPlay
//             loop
//             style={styles.lottie}
//           />
//         </Marker>

//         {/* Hospital Location Marker */}
//         {hospitalLocation && (
//           <Marker
//             coordinate={{
//               latitude: hospitalLocation.latitude,
//               longitude: hospitalLocation.longitude,
//             }}
//             title={hospitalName}
//             pinColor="red"
//           />
//         )}

//         {/* Route Polyline */}
//         {routeCoordinates.length > 0 && (
//           <Polyline
//             coordinates={routeCoordinates}
//             strokeWidth={5}
//             strokeColor="#4285F4"
//           />
//         )}
//       </MapView>

//       {/* Open in Google Maps Button */}
//       <TouchableOpacity style={styles.navButton} onPress={openExternalNavigation}>
//         <Text style={styles.navButtonText}>Open in Google Maps</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f4f4f4",
//   },
//   map: {
//     flex: 1,
//   },
//   lottie: {
//     width: 50,
//     height: 50,
//   },
//   navButton: {
//     position: "absolute",
//     bottom: 40,
//     alignSelf: "center",
//     backgroundColor: "#4285F4",
//     paddingVertical: 12,
//     paddingHorizontal: 24,
//     borderRadius: 50,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   navButtonText: {
//     color: "white",
//     fontWeight: "bold",
//     fontSize: 16,
//   },
// });

// export default HospitalNavigationScreen;

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
// import getAccessToken from '../services/getAccessToken';
// import { v4 as uuidv4 } from 'uuid';
// import { OLA_API_KEY } from '../services/api';
// import polyline from '@mapbox/polyline';

// const HospitalNavigationScreen = ({ route }) => {
//   const { driverLocation, hospitalLocation, hospitalName } = route.params || {};

//   const [routeCoordinates, setRouteCoordinates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [accessToken, setAccessToken] = useState(null);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (!driverLocation || !hospitalLocation) {
//       setError('Driver or hospital location is missing.');
//       setLoading(false);
//       return;
//     }

//     // Fetch access token for routing API
//     fetchAccessToken();
//   }, [driverLocation, hospitalLocation]);

//   useEffect(() => {
//     if (!accessToken || !driverLocation || !hospitalLocation) return;

//     // Generate route for the selected driver
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
//           source={require('../assets/ambulance_loading.json')} // Add your ambulance animation file
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
//       {/* Map View */}
//       <MapView
//         style={styles.map}
//         initialRegion={{
//           latitude: driverLocation.latitude,
//           longitude: driverLocation.longitude,
//           latitudeDelta: 0.05,
//           longitudeDelta: 0.05,
//         }}
//       >
//         {/* Driver's Location Marker */}
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

//         {/* Hospital Location Marker */}
//         {hospitalLocation && (
//           <Marker
//             coordinate={{
//               latitude: hospitalLocation.latitude,
//               longitude: hospitalLocation.longitude,
//             }}
//             title={hospitalName}
//             pinColor="red"
//           />
//         )}

//         {/* Route Polyline */}
//         {routeCoordinates.length > 0 && (
//           <Polyline
//             coordinates={routeCoordinates}
//             strokeWidth={5}
//             strokeColor="#4285F4"
//           />
//         )}
//       </MapView>

//       {/* Open in Google Maps Button */}
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
// });

// export default HospitalNavigationScreen;

import React, { useEffect, useState } from 'react';
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
import getAccessToken from '../services/getAccessToken';
import { v4 as uuidv4 } from 'uuid';
import { OLA_API_KEY } from '../services/api';
import polyline from '@mapbox/polyline';

const HospitalNavigationScreen = ({ route }) => {
  const { driverLocation, hospitalLocation, hospitalName } = route.params || {};

  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);
  const [error, setError] = useState(null);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    if (!driverLocation || !hospitalLocation) {
      setError('Driver or hospital location is missing.');
      setLoading(false);
      return;
    }

    // Fetch access token for routing API
    fetchAccessToken();
  }, [driverLocation, hospitalLocation]);

  useEffect(() => {
    if (!accessToken || !driverLocation || !hospitalLocation) return;

    // Generate route for the selected driver
    generateRoute(driverLocation, hospitalLocation, accessToken);
  }, [accessToken, driverLocation, hospitalLocation]);

  const fetchAccessToken = async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        setAccessToken(token);
      } else {
        setError('Failed to fetch access token.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching token:', error);
      setError('Failed to fetch access token.');
      setLoading(false);
    }
  };

  const generateRoute = async (start, end, token) => {
    if (!token) {
      setError('Access token is missing.');
      setLoading(false);
      return;
    }

    try {
      const url = `https://api.olamaps.io/routing/v1/directions?origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&api_key=${OLA_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-Request-Id': uuidv4(),
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

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
        const durationInMinutes = parseInt(leg.readable_duration.replace(/[^0-9]/g, ''), 10); // Parse as integer
        setEta(`${durationInMinutes} mins`);

        const distanceInMetres = leg.distance;
        if (distanceInMetres < 1000) {
          setDistance(`${distanceInMetres} m`);
        } else {
          setDistance(`${(distanceInMetres / 1000).toFixed(1)} km`);
        }
      } else {
        throw new Error('Invalid route data structure');
      }
    } catch (error) {
      console.error('Route generation failed:', error);
      setError('Failed to generate route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openExternalNavigation = () => {
    if (hospitalLocation) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${hospitalLocation.latitude},${hospitalLocation.longitude}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Navigation Error', 'Cannot open external navigation app');
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../assets/ambulance_loading.json')}
          autoPlay
          loop
          style={styles.ambulanceAnimation}
        />
        <Text style={styles.loadingText}>Generating route... Please wait!</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAccessToken}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ETA Display */}
      <LinearGradient colors={['#FF6B6B', '#FF4B4B']} style={styles.etaContainer}>
        <Text style={styles.etaText}>
          🚑 ETA: {eta || 'Calculating...'} {distance ? ` • ${distance}` : ''}
        </Text>
      </LinearGradient>

      {/* Map View */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.02, // Adjusted for better zoom level
          longitudeDelta: 0.02, // Adjusted for better zoom level
        }}
      >
        {/* Driver's Location Marker */}
        <Marker
          coordinate={{
            latitude: driverLocation.latitude,
            longitude: driverLocation.longitude,
          }}
          title="Driver's Location"
        >
          <LottieView
            source={require('../assets/ambulance.json')}
            autoPlay
            loop
            style={styles.lottie}
          />
        </Marker>

        {/* Hospital Location Marker */}
        {hospitalLocation && (
          <Marker
            coordinate={{
              latitude: hospitalLocation.latitude,
              longitude: hospitalLocation.longitude,
            }}
            title={hospitalName}
          >
            <View style={styles.hospitalMarkerContainer}>
              <LottieView
                source={require('../assets/hospital.json')}
                autoPlay
                loop
                style={styles.hospitalLottie}
              />
            </View>
          </Marker>
        )}

        {/* Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={5}
            strokeColor="#4285F4"
          />
        )}
      </MapView>

      {/* Open in Google Maps Button */}
      <TouchableOpacity style={styles.navButton} onPress={openExternalNavigation}>
        <Text style={styles.navButtonText}>Open in Google Maps</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  map: {
    flex: 1,
  },
  lottie: {
    width: 50,
    height: 50,
  },
  hospitalMarkerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white background
    width: 40, // Match the size of the Lottie animation
    height: 40, // Match the size of the Lottie animation
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 0, // No rounded corners
  },
  hospitalLottie: {
    width: 40, // Adjusted size for proper visibility
    height: 40, // Adjusted size for proper visibility
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
  ambulanceAnimation: {
    width: 200,
    height: 200,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#333',
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
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#4285F4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
});

export default HospitalNavigationScreen;