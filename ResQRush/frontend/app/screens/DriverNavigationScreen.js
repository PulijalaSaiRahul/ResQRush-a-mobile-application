// import React, { useEffect, useState, useRef } from "react";
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
// import { db } from "../firebase/firebaseConnection";
// import { doc, onSnapshot } from "firebase/firestore";
// import getAccessToken from "../services/getAccessToken";
// import { v4 as uuidv4 } from "uuid";
// import { OLA_API_KEY } from "../services/api";

// const DriverNavigationScreen = ({ route }) => {
//   const { driverLocation, hospitalLocation, hospitalName } = route.params || {};

//   const [routeCoordinates, setRouteCoordinates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [currentDriverLocation, setCurrentDriverLocation] = useState(driverLocation);
//   const [eta, setEta] = useState(null);
//   const [distance, setDistance] = useState(null);
//   const [accessToken, setAccessToken] = useState(null);
//   const lastApiCallTime = useRef(0);

//   useEffect(() => {
//     if (!hospitalLocation) {
//       Alert.alert("Error", "Missing hospital location data. Please try again.");
//       return;
//     }

//     // Fetch access token for routing API
//     fetchAccessToken();
//   }, []);

//   useEffect(() => {
//     console.log("Driver Location (DriverNavigationScreen):", driverLocation);
//     console.log("Hospital Location (DriverNavigationScreen):", hospitalLocation);
  
//     if (!hospitalLocation) {
//       Alert.alert("Error", "Missing hospital location data. Please try again.");
//       return;
//     }
  
//     // Fetch access token for routing API
//     fetchAccessToken();
//   }, []);

//   useEffect(() => {
//     if (!accessToken || !currentDriverLocation || !hospitalLocation) return;

//     // Generate route initially
//     generateRoute(currentDriverLocation, hospitalLocation, accessToken);

//     // Track driver's real-time location
//     const unsubscribe = onSnapshot(doc(db, "ambulances", driverLocation.driverId), (doc) => {
//       const data = doc.data();
//       if (data?.latitude && data?.longitude) {
//         const newLocation = { latitude: data.latitude, longitude: data.longitude };
//         setCurrentDriverLocation(newLocation);

//         // Call API only if 10 seconds have passed since last call
//         const now = Date.now();
//         if (now - lastApiCallTime.current > 10000) {
//           lastApiCallTime.current = now;
//           generateRoute(newLocation, hospitalLocation, accessToken);
//         }
//       }
//     });

//     return () => unsubscribe();
//   }, [accessToken]);

//   // Fetch access token for API calls
//   const fetchAccessToken = async () => {
//     try {
//       const token = await getAccessToken();
//       if (token) {
//         setAccessToken(token);
//       } else {
//         createSimpleRoute(currentDriverLocation, hospitalLocation);
//         setLoading(false);
//       }
//     } catch (error) {
//       console.error("Error fetching token:", error);
//       createSimpleRoute(currentDriverLocation, hospitalLocation);
//       setLoading(false);
//     }
//   };

//   // Generate route using OLA Maps API
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
//         const polyline = data.routes[0].overview_polyline;
//         const coordinates = decodePolyline(polyline);
//         setRouteCoordinates(coordinates);

//         // Set ETA and distance
//         const leg = data.routes[0].legs[0];
//         const durationInMinutes = leg.readable_duration.replace(/[^0-9]/g, ""); // Extract minutes
//         setEta(`${durationInMinutes} mins`); // Show time in minutes only

//         const distanceInMetres = leg.distance;
//         if (distanceInMetres < 1000) {
//           setDistance(`${distanceInMetres} m`); // Show distance in metres
//         } else {
//           setDistance(`${(distanceInMetres / 1000).toFixed(1)} km`); // Show distance in km
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

//   // Decode polyline into coordinates
//   const decodePolyline = (polyline) => {
//     const coordinates = [];
//     let index = 0,
//       lat = 0,
//       lng = 0;

//     while (index < polyline.length) {
//       let b,
//         shift = 0,
//         result = 0;
//       do {
//         b = polyline.charCodeAt(index++) - 63;
//         result |= (b & 0x1f) << shift;
//         shift += 5;
//       } while (b >= 0x20);
//       const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
//       lat += dlat;

//       shift = 0;
//       result = 0;
//       do {
//         b = polyline.charCodeAt(index++) - 63;
//         result |= (b & 0x1f) << shift;
//         shift += 5;
//       } while (b >= 0x20);
//       const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
//       lng += dlng;

//       coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
//     }

//     return coordinates;
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
//       setDistance(`${Math.round(d * 1000)} m`); // Show distance in metres
//     } else {
//       setDistance(`${d.toFixed(1)} km`); // Show distance in km
//     }
//     setEta(`${Math.round((d / 30) * 60)} mins`); // Assume 30 km/h average speed
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
//           latitude: currentDriverLocation.latitude,
//           longitude: currentDriverLocation.longitude,
//           latitudeDelta: 0.05,
//           longitudeDelta: 0.05,
//         }}
//       >
//         {/* Driver's Location Marker */}
//         <Marker
//           coordinate={{
//             latitude: currentDriverLocation.latitude,
//             longitude: currentDriverLocation.longitude,
//           }}
//           title="Your Location"
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

// export default DriverNavigationScreen;

// import React, { useEffect, useState, useRef } from "react";
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
// import { db } from "../firebase/firebaseConnection";
// import { doc, onSnapshot } from "firebase/firestore";
// import getAccessToken from "../services/getAccessToken";
// import { v4 as uuidv4 } from "uuid";
// import { OLA_API_KEY } from "../services/api";

// const DriverNavigationScreen = ({ route }) => {
//   const { driverLocation, hospitalLocation, hospitalName } = route.params || {};

//   const [routeCoordinates, setRouteCoordinates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [currentDriverLocation, setCurrentDriverLocation] = useState(driverLocation);
//   const [eta, setEta] = useState(null);
//   const [distance, setDistance] = useState(null);
//   const [accessToken, setAccessToken] = useState(null);
//   const lastApiCallTime = useRef(0);

//   useEffect(() => {
//     console.log("Driver Location (DriverNavigationScreen):", driverLocation);
//     console.log("Hospital Location (DriverNavigationScreen):", hospitalLocation);

//     if (!hospitalLocation) {
//       Alert.alert("Error", "Missing hospital location data. Please try again.");
//       return;
//     }

//     // Fetch access token for routing API
//     fetchAccessToken();
//   }, []);

//   useEffect(() => {
//     if (!accessToken || !currentDriverLocation || !hospitalLocation) return;

//     // Generate route initially
//     generateRoute(currentDriverLocation, hospitalLocation, accessToken);

//     // Track driver's real-time location
//     const unsubscribe = onSnapshot(doc(db, "ambulances", driverLocation.driverId), (doc) => {
//       const data = doc.data();
//       if (data?.latitude && data?.longitude) {
//         const newLocation = { latitude: data.latitude, longitude: data.longitude };
//         setCurrentDriverLocation(newLocation);

//         // Call API only if 10 seconds have passed since last call
//         const now = Date.now();
//         if (now - lastApiCallTime.current > 10000) {
//           lastApiCallTime.current = now;
//           generateRoute(newLocation, hospitalLocation, accessToken);
//         }
//       }
//     });

//     return () => unsubscribe();
//   }, [accessToken]);

//   // Fetch access token for API calls
//   const fetchAccessToken = async () => {
//     try {
//       const token = await getAccessToken();
//       if (token) {
//         setAccessToken(token);
//       } else {
//         createSimpleRoute(currentDriverLocation, hospitalLocation);
//         setLoading(false);
//       }
//     } catch (error) {
//       console.error("Error fetching token:", error);
//       createSimpleRoute(currentDriverLocation, hospitalLocation);
//       setLoading(false);
//     }
//   };

//   // Generate route using OLA Maps API
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
//       console.log("API Response:", data); // Log the API response

//       if (data.routes && data.routes[0]?.legs[0]?.readable_duration) {
//         const polyline = data.routes[0].overview_polyline;
//         console.log("Polyline:", polyline); // Log the polyline
//         const coordinates = decodePolyline(polyline);
//         console.log("Decoded Coordinates:", coordinates); // Log the decoded coordinates
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

//   // Decode polyline into coordinates
//   const decodePolyline = (polyline) => {
//     const coordinates = [];
//     let index = 0,
//       lat = 0,
//       lng = 0;

//     while (index < polyline.length) {
//       let b,
//         shift = 0,
//         result = 0;
//       do {
//         b = polyline.charCodeAt(index++) - 63;
//         result |= (b & 0x1f) << shift;
//         shift += 5;
//       } while (b >= 0x20);
//       const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
//       lat += dlat;

//       shift = 0;
//       result = 0;
//       do {
//         b = polyline.charCodeAt(index++) - 63;
//         result |= (b & 0x1f) << shift;
//         shift += 5;
//       } while (b >= 0x20);
//       const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
//       lng += dlng;

//       coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
//     }

//     console.log("Decoded Polyline Coordinates:", coordinates); // Log decoded coordinates
//     return coordinates;
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
//           latitude: currentDriverLocation.latitude,
//           longitude: currentDriverLocation.longitude,
//           latitudeDelta: 0.05,
//           longitudeDelta: 0.05,
//         }}
//       >
//         {/* Driver's Location Marker */}
//         <Marker
//           coordinate={{
//             latitude: currentDriverLocation.latitude,
//             longitude: currentDriverLocation.longitude,
//           }}
//           title="Your Location"
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

// export default DriverNavigationScreen;

// import React, { useEffect, useState, useRef } from "react";
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
// import { db } from "../firebase/firebaseConnection";
// import { doc, onSnapshot } from "firebase/firestore";
// import getAccessToken from "../services/getAccessToken";
// import { v4 as uuidv4 } from "uuid";
// import { OLA_API_KEY } from "../services/api";
// import polyline from "@mapbox/polyline";

// const DriverNavigationScreen = ({ route }) => {
//   const { driverLocation, hospitalLocation, hospitalName } = route.params || {};

//   const [routeCoordinates, setRouteCoordinates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [currentDriverLocation, setCurrentDriverLocation] = useState(driverLocation);
//   const [eta, setEta] = useState(null);
//   const [distance, setDistance] = useState(null);
//   const [accessToken, setAccessToken] = useState(null);
//   const lastApiCallTime = useRef(0);

//   useEffect(() => {
//     if (!hospitalLocation) {
//       Alert.alert("Error", "Missing hospital location data. Please try again.");
//       return;
//     }

//     fetchAccessToken();
//   }, []);

//   useEffect(() => {
//     if (!accessToken || !currentDriverLocation || !hospitalLocation) return;

//     // Track driver's real-time location
//     const unsubscribe = onSnapshot(doc(db, "ambulances", driverLocation.driverId), (doc) => {
//       const data = doc.data();
//       if (data?.latitude && data?.longitude) {
//         const newLocation = { latitude: data.latitude, longitude: data.longitude };
//         setCurrentDriverLocation(newLocation);

//         // Call API only if 10 seconds have passed since last call
//         const now = Date.now();
//         if (now - lastApiCallTime.current > 10000) {
//           lastApiCallTime.current = now;
//           generateRoute(newLocation, hospitalLocation, accessToken);
//         }
//       }
//     });

//     return () => unsubscribe();
//   }, [accessToken]);

//   const fetchAccessToken = async () => {
//     try {
//       const token = await getAccessToken();
//       if (token) {
//         setAccessToken(token);
//       } else {
//         createSimpleRoute(currentDriverLocation, hospitalLocation);
//         setLoading(false);
//       }
//     } catch (error) {
//       console.error("Error fetching token:", error);
//       createSimpleRoute(currentDriverLocation, hospitalLocation);
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

//     const R = 6371;
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
//           latitude: currentDriverLocation.latitude,
//           longitude: currentDriverLocation.longitude,
//           latitudeDelta: 0.05,
//           longitudeDelta: 0.05,
//         }}
//       >
//         {/* Driver's Location Marker */}
//         <Marker
//           coordinate={{
//             latitude: currentDriverLocation.latitude,
//             longitude: currentDriverLocation.longitude,
//           }}
//           title="Your Location"
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

// export default DriverNavigationScreen;

// import React, { useEffect, useState, useRef } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Linking,
//   Alert,
// } from 'react-native';
// import MapView, { Marker, Polyline } from 'react-native-maps';
// import LottieView from 'lottie-react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { db } from '../firebase/firebaseConnection';
// import { doc, onSnapshot } from 'firebase/firestore';
// import getAccessToken from '../services/getAccessToken';
// import { v4 as uuidv4 } from 'uuid';
// import { OLA_API_KEY } from '../services/api';
// import polyline from '@mapbox/polyline';

// const DriverNavigationScreen = ({ route }) => {
//   const { driverLocation, hospitalLocation, hospitalName } = route.params || {};

//   const [routeCoordinates, setRouteCoordinates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [currentDriverLocation, setCurrentDriverLocation] = useState(driverLocation);
//   const [eta, setEta] = useState(null);
//   const [distance, setDistance] = useState(null);
//   const [accessToken, setAccessToken] = useState(null);
//   const lastApiCallTime = useRef(0);

//   useEffect(() => {
//     if (!hospitalLocation) {
//       Alert.alert('Error', 'Missing hospital location data. Please try again.');
//       return;
//     }

//     fetchAccessToken();
//   }, []);

//   useEffect(() => {
//     if (!accessToken || !currentDriverLocation || !hospitalLocation) return;

//     // Track driver's real-time location
//     const unsubscribe = onSnapshot(doc(db, 'ambulances', driverLocation.driverId), (doc) => {
//       const data = doc.data();
//       if (data?.latitude && data?.longitude) {
//         const newLocation = { latitude: data.latitude, longitude: data.longitude };
//         setCurrentDriverLocation(newLocation);

//         // Call API only if 10 seconds have passed since last call
//         const now = Date.now();
//         if (now - lastApiCallTime.current > 10000) {
//           lastApiCallTime.current = now;
//           generateRoute(newLocation, hospitalLocation, accessToken);
//         }
//       }
//     });

//     return () => unsubscribe();
//   }, [accessToken]);

//   const fetchAccessToken = async () => {
//     try {
//       const token = await getAccessToken();
//       if (token) {
//         setAccessToken(token);
//       } else {
//         createSimpleRoute(currentDriverLocation, hospitalLocation);
//         setLoading(false);
//       }
//     } catch (error) {
//       console.error('Error fetching token:', error);
//       createSimpleRoute(currentDriverLocation, hospitalLocation);
//       setLoading(false);
//     }
//   };

//   const generateRoute = async (start, end, token) => {
//     if (!token) return;

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
//         const durationInMinutes = leg.readable_duration.replace(/[^0-9]/g, '');
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
//       createSimpleRoute(start, end);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const createSimpleRoute = (start, end) => {
//     if (!start?.latitude || !start?.longitude || !end?.latitude || !end?.longitude) {
//       console.error('Invalid coordinates for simple route');
//       setRouteCoordinates([]);
//       setEta(null);
//       setDistance(null);
//       return;
//     }

//     const simpleRoute = [start, end];
//     setRouteCoordinates(simpleRoute);

//     const R = 6371;
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

//   const openExternalNavigation = () => {
//     if (hospitalLocation) {
//       const url = `https://www.google.com/maps/dir/?api=1&destination=${hospitalLocation.latitude},${hospitalLocation.longitude}`;
//       Linking.openURL(url).catch(() => {
//         Alert.alert('Navigation Error', 'Cannot open external navigation app');
//       });
//     }
//   };

//   return (
//     <View style={styles.container}>
//       {/* ETA Display */}
//       <LinearGradient colors={['#FF6B6B', '#FF4B4B']} style={styles.etaContainer}>
//         <Text style={styles.etaText}>
//           🚑 ETA: {eta || 'Calculating...'} {distance ? ` • ${distance}` : ''}
//         </Text>
//       </LinearGradient>

//       {/* Map View */}
//       <MapView
//         style={styles.map}
//         initialRegion={{
//           latitude: currentDriverLocation.latitude,
//           longitude: currentDriverLocation.longitude,
//           latitudeDelta: 0.05,
//           longitudeDelta: 0.05,
//         }}
//       >
//         {/* Driver's Location Marker */}
//         <Marker
//           coordinate={{
//             latitude: currentDriverLocation.latitude,
//             longitude: currentDriverLocation.longitude,
//           }}
//           title="Your Location"
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
// });

// export default DriverNavigationScreen;

// import React, { useEffect, useState, useRef } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Linking,
//   Alert,
// } from 'react-native';
// import MapView, { Marker, Polyline } from 'react-native-maps';
// import LottieView from 'lottie-react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { db } from '../firebase/firebaseConnection';
// import { doc, onSnapshot } from 'firebase/firestore';
// import getAccessToken from '../services/getAccessToken';
// import { v4 as uuidv4 } from 'uuid';
// import { OLA_API_KEY } from '../services/api';
// import polyline from '@mapbox/polyline';

// const DriverNavigationScreen = ({ route }) => {
//   const { driverLocation, hospitalLocation, hospitalName } = route.params || {};

//   const [routeCoordinates, setRouteCoordinates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [currentDriverLocation, setCurrentDriverLocation] = useState(driverLocation);
//   const [eta, setEta] = useState(null);
//   const [distance, setDistance] = useState(null);
//   const [accessToken, setAccessToken] = useState(null);
//   const lastApiCallTime = useRef(0);

//   useEffect(() => {
//     if (!hospitalLocation) {
//       Alert.alert('Error', 'Missing hospital location data. Please try again.');
//       return;
//     }

//     fetchAccessToken();
//   }, []);

//   useEffect(() => {
//     if (!accessToken || !currentDriverLocation || !hospitalLocation) return;

//     // Track driver's real-time location
//     const unsubscribe = onSnapshot(doc(db, 'ambulances', driverLocation.driverId), (doc) => {
//       const data = doc.data();
//       if (data?.latitude && data?.longitude) {
//         const newLocation = { latitude: data.latitude, longitude: data.longitude };
//         setCurrentDriverLocation(newLocation);

//         // Call API only if 10 seconds have passed since last call
//         const now = Date.now();
//         if (now - lastApiCallTime.current > 10000) {
//           lastApiCallTime.current = now;
//           generateRoute(newLocation, hospitalLocation, accessToken);
//         }
//       }
//     });

//     return () => unsubscribe();
//   }, [accessToken]);

//   const fetchAccessToken = async () => {
//     try {
//       const token = await getAccessToken();
//       if (token) {
//         setAccessToken(token);
//       } else {
//         createSimpleRoute(currentDriverLocation, hospitalLocation);
//         setLoading(false);
//       }
//     } catch (error) {
//       console.error('Error fetching token:', error);
//       createSimpleRoute(currentDriverLocation, hospitalLocation);
//       setLoading(false);
//     }
//   };

//   const generateRoute = async (start, end, token) => {
//     if (!token) return;

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
//         const durationInMinutes = parseInt(leg.readable_duration.replace(/[^0-9]/g, ''), 10); // Parse as integer
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
//       createSimpleRoute(start, end);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const createSimpleRoute = (start, end) => {
//     if (!start?.latitude || !start?.longitude || !end?.latitude || !end?.longitude) {
//       console.error('Invalid coordinates for simple route');
//       setRouteCoordinates([]);
//       setEta(null);
//       setDistance(null);
//       return;
//     }

//     const simpleRoute = [start, end];
//     setRouteCoordinates(simpleRoute);

//     const R = 6371;
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

//   const openExternalNavigation = () => {
//     if (hospitalLocation) {
//       const url = `https://www.google.com/maps/dir/?api=1&destination=${hospitalLocation.latitude},${hospitalLocation.longitude}`;
//       Linking.openURL(url).catch(() => {
//         Alert.alert('Navigation Error', 'Cannot open external navigation app');
//       });
//     }
//   };

//   return (
//     <View style={styles.container}>
//       {/* ETA Display */}
//       <LinearGradient colors={['#FF6B6B', '#FF4B4B']} style={styles.etaContainer}>
//         <Text style={styles.etaText}>
//           🚑 ETA: {eta || 'Calculating...'} {distance ? ` • ${distance}` : ''}
//         </Text>
//       </LinearGradient>

//       {/* Map View */}
//       <MapView
//         style={styles.map}
//         initialRegion={{
//           latitude: currentDriverLocation.latitude,
//           longitude: currentDriverLocation.longitude,
//           latitudeDelta: 0.02, // Adjusted for better zoom level
//           longitudeDelta: 0.02, // Adjusted for better zoom level
//         }}
//       >
//         {/* Driver's Location Marker */}
//         <Marker
//           coordinate={{
//             latitude: currentDriverLocation.latitude,
//             longitude: currentDriverLocation.longitude,
//           }}
//           title="Your Location"
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
//   map: {
//     flex: 1,
//   },
//   lottie: {
//     width: 50,
//     height: 50,
//   },
//   hospitalMarkerContainer: {
//     backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white background
//     width: 40, // Match the size of the Lottie animation
//     height: 40, // Match the size of the Lottie animation
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 0, // No rounded corners
//   },
//   hospitalLottie: {
//     width: 40, // Adjusted size for proper visibility
//     height: 40, // Adjusted size for proper visibility
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
// });

// export default DriverNavigationScreen;

// import React, { useEffect, useState, useRef } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Linking,
//   Alert,
// } from 'react-native';
// import MapView, { Marker, Polyline } from 'react-native-maps';
// import LottieView from 'lottie-react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { db } from '../firebase/firebaseConnection';
// import { doc, onSnapshot } from 'firebase/firestore';
// import getAccessToken from '../services/getAccessToken';
// import { v4 as uuidv4 } from 'uuid';
// import { OLA_API_KEY } from '../services/api';
// import polyline from '@mapbox/polyline';

// const DriverNavigationScreen = ({ route, navigation }) => {
//   const { driverLocation, incidentLocation, incidentAddress, incidentType, incidentId } = route.params || {};
//   const [routeCoordinates, setRouteCoordinates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [currentDriverLocation, setCurrentDriverLocation] = useState(driverLocation);
//   const [eta, setEta] = useState(null);
//   const [distance, setDistance] = useState(null);
//   const [accessToken, setAccessToken] = useState(null);
//   const lastApiCallTime = useRef(0);

//   useEffect(() => {
//     if (!incidentLocation || !driverLocation?.driverId) {
//       Alert.alert('Error', 'Missing required location data');
//       navigation.goBack();
//       return;
//     }

//     fetchAccessToken();
//   }, []);

//   useEffect(() => {
//     if (!accessToken || !currentDriverLocation || !incidentLocation) return;

//     const unsubscribe = onSnapshot(doc(db, 'ambulances', driverLocation.driverId), (doc) => {
//       const data = doc.data();
//       if (data?.latitude && data?.longitude) {
//         const newLocation = { 
//           latitude: data.latitude, 
//           longitude: data.longitude,
//           driverId: driverLocation.driverId
//         };
//         setCurrentDriverLocation(newLocation);

//         const now = Date.now();
//         if (now - lastApiCallTime.current > 10000) {
//           lastApiCallTime.current = now;
//           generateRoute(newLocation, incidentLocation, accessToken);
//         }
//       }
//     });

//     return () => unsubscribe();
//   }, [accessToken]);

//   const fetchAccessToken = async () => {
//     try {
//       const token = await getAccessToken();
//       if (token) {
//         setAccessToken(token);
//       } else {
//         createSimpleRoute(currentDriverLocation, incidentLocation);
//         setLoading(false);
//       }
//     } catch (error) {
//       console.error('Error fetching token:', error);
//       createSimpleRoute(currentDriverLocation, incidentLocation);
//       setLoading(false);
//     }
//   };

//   const generateRoute = async (start, end, token) => {
//     if (!token) return;

//     try {
//       const url = `https://api.olamaps.io/routing/v1/directions?origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&api_key=${OLA_API_KEY}`;
//       const response = await fetch(url, {
//         method: 'POST',
//         headers: {
//           'X-Request-Id': uuidv4(),
//         },
//       });

//       if (!response.ok) throw new Error(`API Error: ${response.status}`);

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
//         setDistance(distanceInMetres < 1000 ? 
//           `${distanceInMetres} m` : 
//           `${(distanceInMetres / 1000).toFixed(1)} km`
//         );
//       } else {
//         throw new Error('Invalid route data');
//       }
//     } catch (error) {
//       console.error('Route generation failed:', error);
//       createSimpleRoute(start, end);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const createSimpleRoute = (start, end) => {
//     if (!start?.latitude || !start?.longitude || !end?.latitude || !end?.longitude) {
//       console.error('Invalid coordinates for simple route');
//       setRouteCoordinates([]);
//       setEta(null);
//       setDistance(null);
//       return;
//     }

//     const simpleRoute = [start, end];
//     setRouteCoordinates(simpleRoute);

//     const R = 6371;
//     const dLat = (end.latitude - start.latitude) * (Math.PI / 180);
//     const dLon = (end.longitude - start.longitude) * (Math.PI / 180);
//     const a =
//       Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//       Math.cos(start.latitude * (Math.PI / 180)) * Math.cos(end.latitude * (Math.PI / 180)) *
//       Math.sin(dLon / 2) * Math.sin(dLon / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     const d = R * c;

//     setDistance(d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`);
//     setEta(`${Math.round((d / 30) * 60)} mins`);
//   };

//   const openExternalNavigation = () => {
//     if (incidentLocation) {
//       const url = `https://www.google.com/maps/dir/?api=1&destination=${incidentLocation.latitude},${incidentLocation.longitude}`;
//       Linking.openURL(url).catch(() => {
//         Alert.alert('Error', 'Could not open navigation app');
//       });
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <LinearGradient colors={['#FF6B6B', '#FF4B4B']} style={styles.etaContainer}>
//         <Text style={styles.etaText}>
//           🚑 {incidentType || 'Incident'} • ETA: {eta || 'Calculating...'} {distance ? ` • ${distance}` : ''}
//         </Text>
//         <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="tail">
//           {incidentAddress || 'Unknown address'}
//         </Text>
//       </LinearGradient>

//       <MapView
//         style={styles.map}
//         initialRegion={{
//           latitude: currentDriverLocation.latitude,
//           longitude: currentDriverLocation.longitude,
//           latitudeDelta: 0.02,
//           longitudeDelta: 0.02,
//         }}
//       >
//         <Marker
//           coordinate={{
//             latitude: currentDriverLocation.latitude,
//             longitude: currentDriverLocation.longitude,
//           }}
//           title="Your Location"
//         >
//           <LottieView
//             source={require('../assets/ambulance.json')}
//             autoPlay
//             loop
//             style={styles.lottie}
//           />
//         </Marker>

//         {incidentLocation && (
//           <Marker
//             coordinate={{
//               latitude: incidentLocation.latitude,
//               longitude: incidentLocation.longitude,
//             }}
//             title="Incident Location"
//           >
//             <View style={styles.incidentMarkerContainer}>
//               <LottieView
//                 source={require('../assets/alert.json')}
//                 autoPlay
//                 loop
//                 style={styles.incidentLottie}
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
//   addressText: {
//     color: 'white',
//     fontSize: 14,
//     marginTop: 5,
//     maxWidth: '90%',
//   },
//   map: {
//     flex: 1,
//   },
//   lottie: {
//     width: 50,
//     height: 50,
//   },
//   incidentMarkerContainer: {
//     backgroundColor: 'rgba(255, 255, 255, 0.8)',
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 20,
//   },
//   incidentLottie: {
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
// });

// export default DriverNavigationScreen;

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator
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

const DriverNavigationScreen = ({ route, navigation }) => {
  const { 
    driverLocation, 
    destinationLocation, 
    incidentType, 
    incidentId,
    isHospitalNavigation,
    hospitalId
  } = route.params || {};
  
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDriverLocation, setCurrentDriverLocation] = useState(driverLocation);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [currentDestination, setCurrentDestination] = useState(destinationLocation);
  const [destinationName, setDestinationName] = useState('');
  const lastApiCallTime = useRef(0);
  const responseTimeoutRef = useRef(null);

  useEffect(() => {
    const initializeNavigation = async () => {
      try {
        // If this is hospital navigation, fetch hospital details from Firestore
        if (isHospitalNavigation && hospitalId) {
          const hospitalRef = doc(db, 'hospitals', hospitalId);
          const hospitalSnap = await getDoc(hospitalRef);
          
          if (hospitalSnap.exists()) {
            const hospitalData = hospitalSnap.data();
            const hospitalLocation = {
              latitude: hospitalData.latitude,
              longitude: hospitalData.longitude,
              address: hospitalData.address,
              name: hospitalData.name,
              type: 'hospital'
            };
            
            setCurrentDestination(hospitalLocation);
            setDestinationName(hospitalData.name);
            
            // Start timeout for hospital response
            responseTimeoutRef.current = setTimeout(() => {
              Alert.alert(
                'No Response',
                'The hospital did not respond in time. Please select another hospital.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            }, 120000); // 2 minutes
          } else {
            throw new Error('Hospital data not found');
          }
        } else if (destinationLocation) {
          // For incident navigation
          setCurrentDestination(destinationLocation);
          setDestinationName('Incident Location');
        } else {
          throw new Error('Destination data is missing');
        }

        // Validate driver location
        if (!driverLocation || !driverLocation.latitude || !driverLocation.longitude) {
          throw new Error('Driver location data is missing');
        }

        fetchAccessToken();
      } catch (error) {
        console.error('Initialization error:', error);
        Alert.alert('Error', error.message || 'Failed to initialize navigation');
        navigation.goBack();
      }
    };

    initializeNavigation();

    // Set up incident listener if we have an incidentId
    let unsubscribeIncident;
    if (incidentId) {
      unsubscribeIncident = onSnapshot(doc(db, 'incidents', incidentId), (doc) => {
        const data = doc.data();
        
        // If hospital accepted, update destination to hospital
        if (data?.status?.hospital === 'accepted' && data.hospitalInfo) {
          if (responseTimeoutRef.current) {
            clearTimeout(responseTimeoutRef.current);
          }
          
          const newHospitalLocation = {
            latitude: data.hospitalInfo.latitude,
            longitude: data.hospitalInfo.longitude,
            address: data.hospitalInfo.address,
            type: 'hospital',
            name: data.hospitalInfo.name
          };
          
          setCurrentDestination(newHospitalLocation);
          setDestinationName(data.hospitalInfo.name);
          
          // Update route to hospital
          if (currentDriverLocation && accessToken) {
            generateRoute(
              currentDriverLocation,
              newHospitalLocation,
              accessToken
            );
          }
        }
      });
    }

    return () => {
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
      }
      if (unsubscribeIncident) {
        unsubscribeIncident();
      }
    };
  }, [incidentId, isHospitalNavigation, hospitalId]);

  useEffect(() => {
    if (!accessToken || !currentDriverLocation || !currentDestination) return;

    const unsubscribeAmbulance = onSnapshot(doc(db, 'ambulances', driverLocation.driverId), (doc) => {
      const data = doc.data();
      if (data?.latitude && data?.longitude) {
        const newLocation = { 
          latitude: data.latitude, 
          longitude: data.longitude,
          driverId: driverLocation.driverId
        };
        setCurrentDriverLocation(newLocation);

        const now = Date.now();
        if (now - lastApiCallTime.current > 10000) { // Throttle API calls to every 10 seconds
          lastApiCallTime.current = now;
          generateRoute(newLocation, currentDestination, accessToken);
        }
      }
    });

    return () => unsubscribeAmbulance();
  }, [accessToken, currentDestination]);

  const fetchAccessToken = async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        setAccessToken(token);
        // Generate initial route once we have the token
        if (currentDriverLocation && currentDestination) {
          generateRoute(currentDriverLocation, currentDestination, token);
        }
      } else {
        throw new Error('Failed to get access token');
      }
    } catch (error) {
      console.error('Error fetching token:', error);
      // Fall back to simple route calculation
      if (currentDriverLocation && currentDestination) {
        createSimpleRoute(currentDriverLocation, currentDestination);
      }
      setLoading(false);
    }
  };

  const generateRoute = async (start, end, token) => {
    if (!token || !start || !end) return;

    try {
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

    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (end.latitude - start.latitude) * (Math.PI / 180);
    const dLon = (end.longitude - start.longitude) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(start.latitude * (Math.PI / 180)) * Math.cos(end.latitude * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km

    setDistance(d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`);
    
    // Estimate ETA (assuming 30km/h average speed in urban areas)
    const estimatedTimeHours = d / 30;
    const estimatedTimeMinutes = Math.round(estimatedTimeHours * 60);
    setEta(`${estimatedTimeMinutes} mins`);
  };

  const openExternalNavigation = () => {
    if (currentDestination) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${currentDestination.latitude},${currentDestination.longitude}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open navigation app');
      });
    }
  };

  if (!currentDestination || !currentDriverLocation) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={{ fontSize: 18 }}>Loading navigation data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={currentDestination?.type === 'hospital' ? ['#4CAF50', '#2E7D32'] : ['#FF6B6B', '#FF4B4B']} 
        style={styles.etaContainer}
      >
        <Text style={styles.etaText}>
          {currentDestination?.type === 'hospital' ? '🏥 Hospital' : '🚑 Incident'} • ETA: {eta || 'Calculating...'} {distance ? ` • ${distance}` : ''}
        </Text>
        <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="tail">
          {destinationName || currentDestination?.address || 'Unknown address'}
        </Text>
      </LinearGradient>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: currentDriverLocation.latitude,
          longitude: currentDriverLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        region={{
          latitude: currentDriverLocation.latitude,
          longitude: currentDriverLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <Marker
          coordinate={{
            latitude: currentDriverLocation.latitude,
            longitude: currentDriverLocation.longitude,
          }}
          title="Your Location"
        >
          <LottieView
            source={require('../assets/ambulance.json')}
            autoPlay
            loop
            style={styles.lottie}
          />
        </Marker>

        <Marker
          coordinate={{
            latitude: currentDestination.latitude,
            longitude: currentDestination.longitude,
          }}
          title={currentDestination.type === 'hospital' ? 'Hospital' : 'Incident'}
          description={currentDestination.address}
        >
          <View style={styles.incidentMarkerContainer}>
            <LottieView
              source={currentDestination.type === 'hospital' ? 
                require('../assets/hospital.json') : 
                require('../assets/alert.json')}
              autoPlay
              loop
              style={styles.incidentLottie}
            />
          </View>
        </Marker>

        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={5}
            strokeColor={currentDestination?.type === 'hospital' ? '#4CAF50' : '#4285F4'}
          />
        )}
      </MapView>

      <TouchableOpacity 
        style={[styles.navButton, currentDestination?.type === 'hospital' && { backgroundColor: '#4CAF50' }]} 
        onPress={openExternalNavigation}
      >
        <Text style={styles.navButtonText}>
          Open in Google Maps {currentDestination?.type === 'hospital' ? '(Hospital)' : '(Incident)'}
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
  lottie: {
    width: 50,
    height: 50,
  },
  incidentMarkerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  incidentLottie: {
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
});

export default DriverNavigationScreen;