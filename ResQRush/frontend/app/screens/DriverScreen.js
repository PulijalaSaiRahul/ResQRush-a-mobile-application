// import React, { useState, useEffect } from 'react';
// import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Dimensions } from 'react-native';
// import MapView, { Marker } from 'react-native-maps';
// import * as Location from 'expo-location';
// import fetchNearbyHospitals from '../services/fetchNearbyHospitals';
// import { db } from '../firebase/firebaseConnection';
// import { doc, setDoc, onSnapshot } from 'firebase/firestore';

// const DriverScreen = ({ navigation }) => {
//   const [location, setLocation] = useState(null);
//   const [hospitals, setHospitals] = useState([]);
//   const [fetching, setFetching] = useState(false);
//   const [selectedHospital, setSelectedHospital] = useState(null);
//   const [showConfirmation, setShowConfirmation] = useState(false);
//   const [waiting, setWaiting] = useState(false);

//   // Patient Info
//   const [patientName, setPatientName] = useState('');
//   const [patientAge, setPatientAge] = useState('');
//   const [patientCondition, setPatientCondition] = useState('');

//   useEffect(() => {
//     (async () => {
//       let { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== 'granted') {
//         Alert.alert('Permission Denied', 'Allow location access to use this feature.');
//         return;
//       }

//       let loc = await Location.getCurrentPositionAsync({});
//       setLocation(loc.coords);
//     })();
//   }, []);

//   const handleFetchHospitals = async (loadMore = false) => {
//     if (!location) {
//       Alert.alert('Error', 'Unable to get current location.');
//       return;
//     }

//     if (!patientName || !patientAge || !patientCondition) {
//       Alert.alert('Error', 'Please enter patient details before fetching hospitals.');
//       return;
//     }

//     setFetching(true);
//     try {
//       const hospitalData = await fetchNearbyHospitals(
//         location.latitude,
//         location.longitude,
//         loadMore ? hospitals.length : 0
//       );

//       if (loadMore) {
//         setHospitals((prevHospitals) => [...prevHospitals, ...hospitalData]);
//       } else {
//         setHospitals(hospitalData);
//       }
//     } catch (error) {
//       console.error('Error fetching hospitals:', error);
//       Alert.alert('Error', 'Failed to fetch nearby hospitals.');
//     }
//     setFetching(false);
//   };

//   const handleSelectHospital = (hospital) => {
//     setSelectedHospital(hospital);
//     setShowConfirmation(true);
//   };

//   const confirmSelection = async () => {
//     setShowConfirmation(false);
//     setWaiting(true);

//     try {
//       const requestRef = doc(db, 'hospitalRequests', selectedHospital.id);
//       await setDoc(requestRef, {
//         driverId: 'DRIVER_ID',
//         hospitalId: selectedHospital.id,
//         patientName,
//         patientAge,
//         patientCondition,
//         status: 'pending',
//         createdAt: new Date().toISOString(),
//       });

//       const unsubscribe = onSnapshot(requestRef, (doc) => {
//         const data = doc.data();
//         if (data.status === 'accepted') {
//           setWaiting(false);
//           navigation.navigate('ConnectionSuccess', { hospital: selectedHospital });
//         } else if (data.status === 'rejected') {
//           setWaiting(false);
//           Alert.alert('Request Rejected', 'The hospital rejected your request.');
//         }
//       });

//       return () => unsubscribe();
//     } catch (error) {
//       console.error('Error sending request:', error);
//       Alert.alert('Error', 'Failed to send request to the hospital.');
//       setWaiting(false);
//     }
//   };

//   if (!location) {
//     return (
//       <View style={styles.loadingContainer}>
//         <Text>Fetching location...</Text>
//       </View>
//     );
//   }

//   return (
//     <ScrollView contentContainerStyle={styles.container}>
//       <Text style={styles.heading}>🚑 Driver Dashboard</Text>

//       {/* Patient Info Inputs */}
//       <View style={styles.patientInfoContainer}>
//         <Text style={styles.sectionTitle}>Patient Details</Text>
//         <TextInput
//           style={styles.input}
//           placeholder="Patient Name"
//           value={patientName}
//           onChangeText={setPatientName}
//         />
//         <TextInput
//           style={styles.input}
//           placeholder="Patient Age"
//           keyboardType="numeric"
//           value={patientAge}
//           onChangeText={setPatientAge}
//         />
//         <TextInput
//           style={styles.input}
//           placeholder="Condition (e.g., Cardiac, Trauma)"
//           value={patientCondition}
//           onChangeText={setPatientCondition}
//         />
//       </View>

//       {/* Fetch Hospitals Button */}
//       <TouchableOpacity style={styles.button} onPress={() => handleFetchHospitals(false)} disabled={fetching}>
//         <Text style={styles.buttonText}>{fetching ? 'Fetching...' : 'Fetch Nearby Hospitals'}</Text>
//       </TouchableOpacity>

//       {/* Map View */}
//       <View style={styles.mapContainer}>
//         <MapView
//           style={styles.map}
//           initialRegion={{
//             latitude: location.latitude,
//             longitude: location.longitude,
//             latitudeDelta: 0.02,
//             longitudeDelta: 0.02,
//           }}
//         >
//           {/* Driver's Location Marker */}
//           <Marker
//             coordinate={{
//               latitude: location.latitude,
//               longitude: location.longitude,
//             }}
//             title="Your Location"
//             description="Current Position"
//             pinColor="blue"
//           />
//         </MapView>
//       </View>

//       {/* List of Hospitals */}
//       <View style={styles.hospitalsContainer}>
//         <Text style={styles.subheading}>Nearby Hospitals:</Text>
//         {hospitals.length > 0 ? (
//           hospitals.map((hospital, index) => (
//             <TouchableOpacity key={index} style={styles.hospitalCard} onPress={() => handleSelectHospital(hospital)}>
//               <Text style={styles.hospitalName}>{hospital.name}</Text>
//               <Text style={styles.hospitalAddress}>{hospital.address}</Text>
//               <Text style={styles.hospitalDistance}>📍 {hospital.distanceFromDriver} metres away</Text>
//             </TouchableOpacity>
//           ))
//         ) : (
//           <Text style={styles.noHospitals}>No hospitals found. Click the button above to fetch.</Text>
//         )}
//       </View>

//       {/* Load More Button */}
//       {hospitals.length > 0 && (
//         <TouchableOpacity
//           style={[styles.button, styles.loadMoreButton]}
//           onPress={() => handleFetchHospitals(true)}
//           disabled={fetching}
//         >
//           <Text style={styles.buttonText}>{fetching ? 'Loading...' : 'Load More Hospitals'}</Text>
//         </TouchableOpacity>
//       )}

//       {/* Confirmation Modal */}
//       <Modal visible={showConfirmation} transparent animationType="slide">
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Confirm Selection</Text>
//             <Text style={styles.modalText}>Are you sure you want to select {selectedHospital?.name}?</Text>
//             <View style={styles.modalButtons}>
//               <TouchableOpacity style={styles.modalButton} onPress={confirmSelection}>
//                 <Text style={styles.modalButtonText}>Confirm</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={styles.modalButtonCancel} onPress={() => setShowConfirmation(false)}>
//                 <Text style={styles.modalButtonText}>Cancel</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       {/* Waiting Pop-up */}
//       <Modal visible={waiting} transparent animationType="fade">
//         <View style={styles.waitingContainer}>
//           <View style={styles.waitingContent}>
//             <View style={styles.loadingIconContainer}>
//               <Text style={styles.loadingEmoji}>🏥</Text>
//             </View>
//             <Text style={styles.waitingTitle}>Please Wait</Text>
//             <Text style={styles.waitingText}>Waiting for hospital response...</Text>
//             <Text style={styles.waitingSubtext}>This may take a few moments</Text>
//           </View>
//         </View>
//       </Modal>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flexGrow: 1,
//     padding: 20,
//     backgroundColor: '#f4f4f4',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   heading: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     marginBottom: 15,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 10,
//   },
//   patientInfoContainer: {
//     backgroundColor: '#fff',
//     padding: 15,
//     borderRadius: 10,
//     marginBottom: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#D1D5DB',
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 10,
//     backgroundColor: 'white',
//   },
//   mapContainer: {
//     height: 300,
//     marginVertical: 15,
//     borderRadius: 10,
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   map: {
//     flex: 1,
//   },
//   button: {
//     backgroundColor: '#ef4444',
//     paddingVertical: 15,
//     paddingHorizontal: 30,
//     borderRadius: 12,
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   loadMoreButton: {
//     backgroundColor: '#3b82f6',
//     marginTop: 10,
//   },
//   buttonText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   hospitalsContainer: {
//     paddingHorizontal: 10,
//   },
//   subheading: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 10,
//   },
//   hospitalCard: {
//     backgroundColor: '#fff',
//     padding: 15,
//     borderRadius: 8,
//     marginBottom: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   hospitalName: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: 5,
//   },
//   hospitalAddress: {
//     fontSize: 14,
//     color: '#555',
//   },
//   hospitalDistance: {
//     fontSize: 14,
//     color: '#1E90FF',
//     marginTop: 5,
//   },
//   noHospitals: {
//     textAlign: 'center',
//     color: '#888',
//     fontSize: 16,
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   modalContent: {
//     backgroundColor: '#fff',
//     padding: 20,
//     borderRadius: 10,
//     width: '80%',
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 10,
//   },
//   modalText: {
//     fontSize: 16,
//     marginBottom: 20,
//   },
//   modalButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   modalButton: {
//     backgroundColor: '#ef4444',
//     padding: 10,
//     borderRadius: 5,
//     flex: 1,
//     marginRight: 10,
//     alignItems: 'center',
//   },
//   modalButtonCancel: {
//     backgroundColor: '#ccc',
//     padding: 10,
//     borderRadius: 5,
//     flex: 1,
//     alignItems: 'center',
//   },
//   modalButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   waitingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     padding: 20,
//   },
//   waitingContent: {
//     backgroundColor: '#fff',
//     padding: 30,
//     borderRadius: 20,
//     width: '90%',
//     maxWidth: 400,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   loadingIconContainer: {
//     marginBottom: 20,
//   },
//   loadingEmoji: {
//     fontSize: 48,
//     textAlign: 'center',
//   },
//   waitingTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 15,
//     textAlign: 'center',
//     color: '#1a1a1a',
//   },
//   waitingText: {
//     fontSize: 18,
//     marginBottom: 10,
//     textAlign: 'center',
//     color: '#4b5563',
//   },
//   waitingSubtext: {
//     fontSize: 14,
//     textAlign: 'center',
//     color: '#6b7280',
//     marginTop: 5,
//   },
// });

// export default DriverScreen;

// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   Alert,
//   Modal,
// } from "react-native";
// import MapView, { Marker } from "react-native-maps";
// import * as Location from "expo-location";
// import fetchNearbyHospitals from "../services/fetchNearbyHospitals";
// import { db } from "../firebase/firebaseConnection";
// import { doc, setDoc, onSnapshot } from "firebase/firestore";

// const DriverScreen = ({ route, navigation }) => {
//   const { driverId } = route.params || {};
//   const [location, setLocation] = useState(null);
//   const [hospitals, setHospitals] = useState([]);
//   const [fetching, setFetching] = useState(false);
//   const [selectedHospital, setSelectedHospital] = useState(null);
//   const [showConfirmation, setShowConfirmation] = useState(false);
//   const [waiting, setWaiting] = useState(false);

//   // Patient Info
//   const [patientName, setPatientName] = useState("");
//   const [patientAge, setPatientAge] = useState("");
//   const [patientCondition, setPatientCondition] = useState("");

//   // Fetch and store driver's location
//   useEffect(() => {
//     const fetchAndStoreLocation = async () => {
//       let { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== "granted") {
//         Alert.alert("Permission Denied", "Allow location access to use this feature.");
//         return;
//       }

//       // Fetch current location
//       let location = await Location.getCurrentPositionAsync({});
//       const { latitude, longitude } = location.coords;

//       // Store location in Firestore
//       const driverRef = doc(db, "ambulances", driverId);
//       await setDoc(
//         driverRef,
//         {
//           driverId,
//           latitude,
//           longitude,
//           timestamp: new Date().toISOString(),
//         },
//         { merge: true }
//       );

//       // Update local state
//       setLocation({ latitude, longitude });
//     };

//     // Fetch and store location every 20 seconds
//     const interval = setInterval(fetchAndStoreLocation, 20000);
//     fetchAndStoreLocation(); // Initial fetch

//     return () => clearInterval(interval);
//   }, [driverId]);

//   // Handle fetching nearby hospitals
//   const handleFetchHospitals = async (loadMore = false) => {
//     if (!location) {
//       Alert.alert("Error", "Unable to get current location.");
//       return;
//     }

//     if (!patientName || !patientAge || !patientCondition) {
//       Alert.alert("Error", "Please enter patient details before fetching hospitals.");
//       return;
//     }

//     setFetching(true);
//     try {
//       const hospitalData = await fetchNearbyHospitals(
//         location.latitude,
//         location.longitude,
//         loadMore ? hospitals.length : 0
//       );

//       if (loadMore) {
//         setHospitals((prevHospitals) => [...prevHospitals, ...hospitalData]);
//       } else {
//         setHospitals(hospitalData);
//       }
//     } catch (error) {
//       console.error("Error fetching hospitals:", error);
//       Alert.alert("Error", "Failed to fetch nearby hospitals.");
//     }
//     setFetching(false);
//   };

//   // Handle hospital selection
//   const handleSelectHospital = (hospital) => {
//     if (!hospital || !hospital.id) {
//       Alert.alert("Error", "Invalid hospital data. Please try again.");
//       return;
//     }
//     setSelectedHospital(hospital);
//     setShowConfirmation(true);
//   };

//   // Confirm hospital selection and navigate
//   const confirmSelection = async () => {
//     setShowConfirmation(false);
//     setWaiting(true);

//     try {
//       // Ensure all required data is available
//       if (!location || !selectedHospital || !driverId) {
//         Alert.alert("Error", "Missing required data. Please try again.");
//         return;
//       }

//       // Create a request in Firestore
//       const requestRef = doc(db, "hospitalRequests", selectedHospital.id);
//       await setDoc(requestRef, {
//         driverId,
//         hospitalId: selectedHospital.id,
//         patientName,
//         patientAge,
//         patientCondition,
//         status: "pending",
//         createdAt: new Date().toISOString(),
//         latitude: location.latitude,
//         longitude: location.longitude,
//       });

//       // Listen for the hospital's response
//       const unsubscribe = onSnapshot(requestRef, (doc) => {
//         const data = doc.data();
//         if (data && data.status === "accepted") {
//           setWaiting(false);

//           // Navigate to DriverNavigationScreen with driverLocation and hospital details
//           navigation.navigate("DriverNavigation", {
//             driverLocation: {
//               driverId,
//               latitude: location.latitude,
//               longitude: location.longitude,
//             },
//             hospitalLocation: {
//               latitude: selectedHospital.latitude,
//               longitude: selectedHospital.longitude,
//             },
//             hospitalName: selectedHospital.name,
//           });
//         } else if (data && data.status === "rejected") {
//           setWaiting(false);
//           Alert.alert("Request Rejected", "The hospital rejected your request.");
//         }
//       });

//       return () => unsubscribe();
//     } catch (error) {
//       console.error("Error sending request:", error);
//       Alert.alert("Error", "Failed to send request to the hospital.");
//       setWaiting(false);
//     }
//   };

//   if (!location) {
//     return (
//       <View style={styles.loadingContainer}>
//         <Text>Fetching location...</Text>
//       </View>
//     );
//   }

//   return (
//     <ScrollView contentContainerStyle={styles.container}>
//       {/* Patient Info Inputs */}
//       <View style={styles.patientInfoContainer}>
//         <Text style={styles.sectionTitle}>Patient Details</Text>
//         <TextInput
//           style={styles.input}
//           placeholder="Patient Name"
//           value={patientName}
//           onChangeText={setPatientName}
//         />
//         <TextInput
//           style={styles.input}
//           placeholder="Patient Age"
//           keyboardType="numeric"
//           value={patientAge}
//           onChangeText={setPatientAge}
//         />
//         <TextInput
//           style={styles.input}
//           placeholder="Condition (e.g., Cardiac, Trauma)"
//           value={patientCondition}
//           onChangeText={setPatientCondition}
//         />
//       </View>

//       {/* Fetch Hospitals Button */}
//       <TouchableOpacity
//         style={styles.button}
//         onPress={() => handleFetchHospitals(false)}
//         disabled={fetching}
//       >
//         <Text style={styles.buttonText}>
//           {fetching ? "Fetching..." : "Fetch Nearby Hospitals"}
//         </Text>
//       </TouchableOpacity>

//       {/* Map View */}
//       <View style={styles.mapContainer}>
//         <MapView
//           style={styles.map}
//           initialRegion={{
//             latitude: location.latitude,
//             longitude: location.longitude,
//             latitudeDelta: 0.02,
//             longitudeDelta: 0.02,
//           }}
//         >
//           <Marker
//             coordinate={{
//               latitude: location.latitude,
//               longitude: location.longitude,
//             }}
//             title="Your Location"
//             description="Current Position"
//             pinColor="blue"
//           />
//         </MapView>
//       </View>

//       {/* List of Hospitals */}
//       <View style={styles.hospitalsContainer}>
//         <Text style={styles.subheading}>Nearby Hospitals:</Text>
//         {hospitals.length > 0 ? (
//           hospitals.map((hospital, index) => (
//             <TouchableOpacity
//               key={index}
//               style={styles.hospitalCard}
//               onPress={() => handleSelectHospital(hospital)}
//             >
//               <Text style={styles.hospitalName}>{hospital.name}</Text>
//               <Text style={styles.hospitalAddress}>{hospital.address}</Text>
//               <Text style={styles.hospitalDistance}>
//                 📍 {hospital.distanceFromDriver} metres away
//               </Text>
//             </TouchableOpacity>
//           ))
//         ) : (
//           <Text style={styles.noHospitals}>
//             No hospitals found. Click the button above to fetch.
//           </Text>
//         )}
//       </View>

//       {/* Confirmation Modal */}
//       <Modal visible={showConfirmation} transparent animationType="slide">
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Confirm Selection</Text>
//             <Text style={styles.modalText}>
//               Are you sure you want to select {selectedHospital?.name}?
//             </Text>
//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={styles.modalButton}
//                 onPress={confirmSelection}
//               >
//                 <Text style={styles.modalButtonText}>Confirm</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={styles.modalButtonCancel}
//                 onPress={() => setShowConfirmation(false)}
//               >
//                 <Text style={styles.modalButtonText}>Cancel</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       {/* Waiting Pop-up */}
//       <Modal visible={waiting} transparent animationType="fade">
//         <View style={styles.waitingContainer}>
//           <View style={styles.waitingContent}>
//             <View style={styles.loadingIconContainer}>
//               <Text style={styles.loadingEmoji}>🏥</Text>
//             </View>
//             <Text style={styles.waitingTitle}>Please Wait</Text>
//             <Text style={styles.waitingText}>
//               Waiting for hospital response...
//             </Text>
//             <Text style={styles.waitingSubtext}>
//               This may take a few moments
//             </Text>
//           </View>
//         </View>
//       </Modal>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flexGrow: 1,
//     padding: 20,
//     backgroundColor: "#f4f4f4",
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   heading: {
//     fontSize: 22,
//     fontWeight: "bold",
//     textAlign: "center",
//     marginBottom: 15,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     marginBottom: 10,
//   },
//   patientInfoContainer: {
//     backgroundColor: "#fff",
//     padding: 15,
//     borderRadius: 10,
//     marginBottom: 10,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: "#D1D5DB",
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 10,
//     backgroundColor: "white",
//   },
//   mapContainer: {
//     height: 300,
//     marginVertical: 15,
//     borderRadius: 10,
//     overflow: "hidden",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   map: {
//     flex: 1,
//   },
//   button: {
//     backgroundColor: "#ef4444",
//     paddingVertical: 15,
//     paddingHorizontal: 30,
//     borderRadius: 12,
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   buttonText: {
//     color: "white",
//     fontSize: 18,
//     fontWeight: "bold",
//   },
//   hospitalsContainer: {
//     paddingHorizontal: 10,
//   },
//   subheading: {
//     fontSize: 18,
//     fontWeight: "bold",
//     marginBottom: 10,
//   },
//   hospitalCard: {
//     backgroundColor: "#fff",
//     padding: 15,
//     borderRadius: 8,
//     marginBottom: 10,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   hospitalName: {
//     fontSize: 16,
//     fontWeight: "bold",
//     marginBottom: 5,
//   },
//   hospitalAddress: {
//     fontSize: 14,
//     color: "#555",
//   },
//   hospitalDistance: {
//     fontSize: 14,
//     color: "#1E90FF",
//     marginTop: 5,
//   },
//   noHospitals: {
//     textAlign: "center",
//     color: "#888",
//     fontSize: 16,
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//   },
//   modalContent: {
//     backgroundColor: "#fff",
//     padding: 20,
//     borderRadius: 10,
//     width: "80%",
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     marginBottom: 10,
//   },
//   modalText: {
//     fontSize: 16,
//     marginBottom: 20,
//   },
//   modalButtons: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   modalButton: {
//     backgroundColor: "#ef4444",
//     padding: 10,
//     borderRadius: 5,
//     flex: 1,
//     marginRight: 10,
//     alignItems: "center",
//   },
//   modalButtonCancel: {
//     backgroundColor: "#ccc",
//     padding: 10,
//     borderRadius: 5,
//     flex: 1,
//     alignItems: "center",
//   },
//   modalButtonText: {
//     color: "white",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   waitingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(0, 0, 0, 0.7)",
//   },
//   waitingContent: {
//     backgroundColor: "#fff",
//     padding: 30,
//     borderRadius: 20,
//     width: "90%",
//     maxWidth: 400,
//     alignItems: "center",
//   },
//   loadingIconContainer: {
//     marginBottom: 20,
//   },
//   loadingEmoji: {
//     fontSize: 48,
//     textAlign: "center",
//   },
//   waitingTitle: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 15,
//   },
//   waitingText: {
//     fontSize: 18,
//     marginBottom: 10,
//   },
//   waitingSubtext: {
//     fontSize: 14,
//     color: "#666",
//   },
// });

// export default DriverScreen;

// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   Alert,
//   Modal,
// } from "react-native";
// import MapView, { Marker } from "react-native-maps";
// import * as Location from "expo-location";
// import fetchNearbyHospitals from "../services/fetchNearbyHospitals";
// import { db } from "../firebase/firebaseConnection";
// import { doc, setDoc, onSnapshot } from "firebase/firestore";

// const DriverScreen = ({ route, navigation }) => {
//   const { driverId } = route.params || {};
//   const [location, setLocation] = useState(null);
//   const [hospitals, setHospitals] = useState([]);
//   const [fetching, setFetching] = useState(false);
//   const [selectedHospital, setSelectedHospital] = useState(null);
//   const [showConfirmation, setShowConfirmation] = useState(false);
//   const [waiting, setWaiting] = useState(false);

//   // Patient Info
//   const [patientName, setPatientName] = useState("");
//   const [patientAge, setPatientAge] = useState("");
//   const [patientCondition, setPatientCondition] = useState("");

//   // Fetch and store driver's location
//   useEffect(() => {
//     const fetchAndStoreLocation = async () => {
//       let { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== "granted") {
//         Alert.alert("Permission Denied", "Allow location access to use this feature.");
//         return;
//       }

//       // Fetch current location
//       let location = await Location.getCurrentPositionAsync({});
//       const { latitude, longitude } = location.coords;

//       // Store location in Firestore
//       const driverRef = doc(db, "ambulances", driverId);
//       await setDoc(
//         driverRef,
//         {
//           driverId,
//           latitude,
//           longitude,
//           timestamp: new Date().toISOString(),
//         },
//         { merge: true }
//       );

//       // Update local state
//       setLocation({ latitude, longitude });
//     };

//     // Fetch and store location every 20 seconds
//     const interval = setInterval(fetchAndStoreLocation, 20000);
//     fetchAndStoreLocation(); // Initial fetch

//     return () => clearInterval(interval);
//   }, [driverId]);

//   // Handle fetching nearby hospitals
//   const handleFetchHospitals = async (loadMore = false) => {
//     if (!location) {
//       Alert.alert("Error", "Unable to get current location.");
//       return;
//     }

//     if (!patientName || !patientAge || !patientCondition) {
//       Alert.alert("Error", "Please enter patient details before fetching hospitals.");
//       return;
//     }

//     setFetching(true);
//     try {
//       const hospitalData = await fetchNearbyHospitals(
//         location.latitude,
//         location.longitude,
//         loadMore ? hospitals.length : 0
//       );

//       if (loadMore) {
//         setHospitals((prevHospitals) => [...prevHospitals, ...hospitalData]);
//       } else {
//         setHospitals(hospitalData);
//       }
//     } catch (error) {
//       console.error("Error fetching hospitals:", error);
//       Alert.alert("Error", "Failed to fetch nearby hospitals.");
//     }
//     setFetching(false);
//   };

//   // Handle hospital selection
//   const handleSelectHospital = (hospital) => {
//     if (!hospital || !hospital.id) {
//       Alert.alert("Error", "Invalid hospital data. Please try again.");
//       return;
//     }
//     setSelectedHospital(hospital);
//     setShowConfirmation(true);
//   };

//   // Confirm hospital selection and navigate
//   const confirmSelection = async () => {
//     setShowConfirmation(false);
//     setWaiting(true);
  
//     try {
//       // Ensure all required data is available
//       if (!location || !selectedHospital || !driverId) {
//         Alert.alert("Error", "Missing required data. Please try again.");
//         return;
//       }
  
//       // Log coordinates before navigation
//       console.log("Driver Location (DriverScreen):", {
//         latitude: location.latitude,
//         longitude: location.longitude,
//       });
//       console.log("Hospital Location (DriverScreen):", {
//         latitude: selectedHospital.latitude,
//         longitude: selectedHospital.longitude,
//       });
  
//       // Create a request in Firestore
//       const requestRef = doc(db, "hospitalRequests", selectedHospital.id);
//       await setDoc(requestRef, {
//         driverId,
//         hospitalId: selectedHospital.id,
//         patientName,
//         patientAge,
//         patientCondition,
//         status: "pending",
//         createdAt: new Date().toISOString(),
//         latitude: location.latitude,
//         longitude: location.longitude,
//       });
  
//       // Listen for the hospital's response
//       const unsubscribe = onSnapshot(requestRef, (doc) => {
//         const data = doc.data();
//         if (data && data.status === "accepted") {
//           setWaiting(false);
  
//           // Navigate to DriverNavigationScreen with driverLocation and hospital details
//           navigation.navigate("DriverNavigation", {
//             driverLocation: {
//               driverId,
//               latitude: location.latitude,
//               longitude: location.longitude,
//             },
//             hospitalLocation: {
//               latitude: selectedHospital.latitude,
//               longitude: selectedHospital.longitude,
//             },
//             hospitalName: selectedHospital.name,
//           });
//         } else if (data && data.status === "rejected") {
//           setWaiting(false);
//           Alert.alert("Request Rejected", "The hospital rejected your request.");
//         }
//       });
  
//       return () => unsubscribe();
//     } catch (error) {
//       console.error("Error sending request:", error);
//       Alert.alert("Error", "Failed to send request to the hospital.");
//       setWaiting(false);
//     }
//   };

//   if (!location) {
//     return (
//       <View style={styles.loadingContainer}>
//         <Text>Fetching location...</Text>
//       </View>
//     );
//   }

//   return (
//     <ScrollView contentContainerStyle={styles.container}>
//       {/* Patient Info Inputs */}
//       <View style={styles.patientInfoContainer}>
//         <Text style={styles.sectionTitle}>Patient Details</Text>
//         <TextInput
//           style={styles.input}
//           placeholder="Patient Name"
//           value={patientName}
//           onChangeText={setPatientName}
//         />
//         <TextInput
//           style={styles.input}
//           placeholder="Patient Age"
//           keyboardType="numeric"
//           value={patientAge}
//           onChangeText={setPatientAge}
//         />
//         <TextInput
//           style={styles.input}
//           placeholder="Condition (e.g., Cardiac, Trauma)"
//           value={patientCondition}
//           onChangeText={setPatientCondition}
//         />
//       </View>

//       {/* Fetch Hospitals Button */}
//       <TouchableOpacity
//         style={styles.button}
//         onPress={() => handleFetchHospitals(false)}
//         disabled={fetching}
//       >
//         <Text style={styles.buttonText}>
//           {fetching ? "Fetching..." : "Fetch Nearby Hospitals"}
//         </Text>
//       </TouchableOpacity>

//       {/* Map View */}
//       <View style={styles.mapContainer}>
//         <MapView
//           style={styles.map}
//           initialRegion={{
//             latitude: location.latitude,
//             longitude: location.longitude,
//             latitudeDelta: 0.02,
//             longitudeDelta: 0.02,
//           }}
//         >
//           <Marker
//             coordinate={{
//               latitude: location.latitude,
//               longitude: location.longitude,
//             }}
//             title="Your Location"
//             description="Current Position"
//             pinColor="blue"
//           />
//         </MapView>
//       </View>

//       {/* List of Hospitals */}
//       <View style={styles.hospitalsContainer}>
//         <Text style={styles.subheading}>Nearby Hospitals:</Text>
//         {hospitals.length > 0 ? (
//           hospitals.map((hospital, index) => (
//             <TouchableOpacity
//               key={index}
//               style={styles.hospitalCard}
//               onPress={() => handleSelectHospital(hospital)}
//             >
//               <Text style={styles.hospitalName}>{hospital.name}</Text>
//               <Text style={styles.hospitalAddress}>{hospital.address}</Text>
//               <Text style={styles.hospitalDistance}>
//                 📍 {hospital.distanceFromDriver} metres away
//               </Text>
//             </TouchableOpacity>
//           ))
//         ) : (
//           <Text style={styles.noHospitals}>
//             No hospitals found. Click the button above to fetch.
//           </Text>
//         )}
//       </View>

//       {/* Confirmation Modal */}
//       <Modal visible={showConfirmation} transparent animationType="slide">
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Confirm Selection</Text>
//             <Text style={styles.modalText}>
//               Are you sure you want to select {selectedHospital?.name}?
//             </Text>
//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={styles.modalButton}
//                 onPress={confirmSelection}
//               >
//                 <Text style={styles.modalButtonText}>Confirm</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={styles.modalButtonCancel}
//                 onPress={() => setShowConfirmation(false)}
//               >
//                 <Text style={styles.modalButtonText}>Cancel</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       {/* Waiting Pop-up */}
//       <Modal visible={waiting} transparent animationType="fade">
//         <View style={styles.waitingContainer}>
//           <View style={styles.waitingContent}>
//             <View style={styles.loadingIconContainer}>
//               <Text style={styles.loadingEmoji}>🏥</Text>
//             </View>
//             <Text style={styles.waitingTitle}>Please Wait</Text>
//             <Text style={styles.waitingText}>
//               Waiting for hospital response...
//             </Text>
//             <Text style={styles.waitingSubtext}>
//               This may take a few moments
//             </Text>
//           </View>
//         </View>
//       </Modal>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flexGrow: 1,
//     padding: 20,
//     backgroundColor: "#f4f4f4",
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   heading: {
//     fontSize: 22,
//     fontWeight: "bold",
//     textAlign: "center",
//     marginBottom: 15,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     marginBottom: 10,
//   },
//   patientInfoContainer: {
//     backgroundColor: "#fff",
//     padding: 15,
//     borderRadius: 10,
//     marginBottom: 10,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: "#D1D5DB",
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 10,
//     backgroundColor: "white",
//   },
//   mapContainer: {
//     height: 300,
//     marginVertical: 15,
//     borderRadius: 10,
//     overflow: "hidden",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   map: {
//     flex: 1,
//   },
//   button: {
//     backgroundColor: "#ef4444",
//     paddingVertical: 15,
//     paddingHorizontal: 30,
//     borderRadius: 12,
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   buttonText: {
//     color: "white",
//     fontSize: 18,
//     fontWeight: "bold",
//   },
//   hospitalsContainer: {
//     paddingHorizontal: 10,
//   },
//   subheading: {
//     fontSize: 18,
//     fontWeight: "bold",
//     marginBottom: 10,
//   },
//   hospitalCard: {
//     backgroundColor: "#fff",
//     padding: 15,
//     borderRadius: 8,
//     marginBottom: 10,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   hospitalName: {
//     fontSize: 16,
//     fontWeight: "bold",
//     marginBottom: 5,
//   },
//   hospitalAddress: {
//     fontSize: 14,
//     color: "#555",
//   },
//   hospitalDistance: {
//     fontSize: 14,
//     color: "#1E90FF",
//     marginTop: 5,
//   },
//   noHospitals: {
//     textAlign: "center",
//     color: "#888",
//     fontSize: 16,
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//   },
//   modalContent: {
//     backgroundColor: "#fff",
//     padding: 20,
//     borderRadius: 10,
//     width: "80%",
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     marginBottom: 10,
//   },
//   modalText: {
//     fontSize: 16,
//     marginBottom: 20,
//   },
//   modalButtons: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   modalButton: {
//     backgroundColor: "#ef4444",
//     padding: 10,
//     borderRadius: 5,
//     flex: 1,
//     marginRight: 10,
//     alignItems: "center",
//   },
//   modalButtonCancel: {
//     backgroundColor: "#ccc",
//     padding: 10,
//     borderRadius: 5,
//     flex: 1,
//     alignItems: "center",
//   },
//   modalButtonText: {
//     color: "white",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   waitingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(0, 0, 0, 0.7)",
//   },
//   waitingContent: {
//     backgroundColor: "#fff",
//     padding: 30,
//     borderRadius: 20,
//     width: "90%",
//     maxWidth: 400,
//     alignItems: "center",
//   },
//   loadingIconContainer: {
//     marginBottom: 20,
//   },
//   loadingEmoji: {
//     fontSize: 48,
//     textAlign: "center",
//   },
//   waitingTitle: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 15,
//   },
//   waitingText: {
//     fontSize: 18,
//     marginBottom: 10,
//   },
//   waitingSubtext: {
//     fontSize: 14,
//     color: "#666",
//   },
// });

// export default DriverScreen;

// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   Alert,
//   Modal,
// } from 'react-native';
// import MapView, { Marker } from 'react-native-maps';
// import * as Location from 'expo-location';
// import fetchNearbyHospitals from '../services/fetchNearbyHospitals';
// import { db } from '../firebase/firebaseConnection';
// import { doc, setDoc, onSnapshot } from 'firebase/firestore';

// const DriverScreen = ({ route, navigation }) => {
//   const { driverId } = route.params || {};
//   const [location, setLocation] = useState(null);
//   const [hospitals, setHospitals] = useState([]);
//   const [fetching, setFetching] = useState(false);
//   const [selectedHospital, setSelectedHospital] = useState(null);
//   const [showConfirmation, setShowConfirmation] = useState(false);
//   const [waiting, setWaiting] = useState(false);

//   // Patient Info
//   const [patientName, setPatientName] = useState('');
//   const [patientAge, setPatientAge] = useState('');
//   const [patientCondition, setPatientCondition] = useState('');

//   // Fetch and store driver's location
//   useEffect(() => {
//     const fetchAndStoreLocation = async () => {
//       let { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== 'granted') {
//         Alert.alert('Permission Denied', 'Allow location access to use this feature.');
//         return;
//       }

//       // Fetch current location
//       let location = await Location.getCurrentPositionAsync({});
//       const { latitude, longitude } = location.coords;

//       // Store location in Firestore
//       const driverRef = doc(db, 'ambulances', driverId);
//       await setDoc(
//         driverRef,
//         {
//           driverId,
//           latitude,
//           longitude,
//           timestamp: new Date().toISOString(),
//         },
//         { merge: true }
//       );

//       // Update local state
//       setLocation({ latitude, longitude });
//     };

//     // Fetch and store location every 20 seconds
//     const interval = setInterval(fetchAndStoreLocation, 20000);
//     fetchAndStoreLocation(); // Initial fetch

//     return () => clearInterval(interval);
//   }, [driverId]);

//   // Handle fetching nearby hospitals
//   const handleFetchHospitals = async (loadMore = false) => {
//     if (!location) {
//       Alert.alert('Error', 'Unable to get current location.');
//       return;
//     }

//     if (!patientName || !patientAge || !patientCondition) {
//       Alert.alert('Error', 'Please enter patient details before fetching hospitals.');
//       return;
//     }

//     setFetching(true);
//     try {
//       const hospitalData = await fetchNearbyHospitals(
//         location.latitude,
//         location.longitude,
//         loadMore ? hospitals.length : 0
//       );

//       if (loadMore) {
//         setHospitals((prevHospitals) => [...prevHospitals, ...hospitalData]);
//       } else {
//         setHospitals(hospitalData);
//       }
//     } catch (error) {
//       console.error('Error fetching hospitals:', error);
//       Alert.alert('Error', 'Failed to fetch nearby hospitals.');
//     }
//     setFetching(false);
//   };

//   // Handle hospital selection
//   const handleSelectHospital = (hospital) => {
//     if (!hospital || !hospital.id) {
//       Alert.alert('Error', 'Invalid hospital data. Please try again.');
//       return;
//     }
//     setSelectedHospital(hospital);
//     setShowConfirmation(true);
//   };

//   // Confirm hospital selection and navigate
//   const confirmSelection = async () => {
//     setShowConfirmation(false);
//     setWaiting(true);

//     try {
//       // Ensure all required data is available
//       if (!location || !selectedHospital || !driverId) {
//         Alert.alert('Error', 'Missing required data. Please try again.');
//         return;
//       }

//       // Log coordinates before navigation
//       console.log('Driver Location (DriverScreen):', {
//         latitude: location.latitude,
//         longitude: location.longitude,
//       });
//       console.log('Hospital Location (DriverScreen):', {
//         latitude: selectedHospital.latitude,
//         longitude: selectedHospital.longitude,
//       });

//       // Create a request in Firestore
//       const requestRef = doc(db, 'hospitalRequests', driverId); // Use driverId as the document ID
//       await setDoc(requestRef, {
//         driverId,
//         hospitalId: selectedHospital.id,
//         patientName,
//         patientAge,
//         patientCondition,
//         status: 'pending',
//         createdAt: new Date().toISOString(),
//         latitude: location.latitude,
//         longitude: location.longitude,
//       });

//       // Listen for the hospital's response
//       const unsubscribe = onSnapshot(requestRef, (doc) => {
//         const data = doc.data();
//         if (data && data.status === 'accepted') {
//           setWaiting(false);

//           // Navigate to DriverNavigationScreen with driverLocation and hospital details
//           navigation.navigate('DriverNavigation', {
//             driverLocation: {
//               driverId,
//               latitude: location.latitude,
//               longitude: location.longitude,
//             },
//             hospitalLocation: {
//               latitude: selectedHospital.latitude,
//               longitude: selectedHospital.longitude,
//             },
//             hospitalName: selectedHospital.name,
//           });
//         } else if (data && data.status === 'rejected') {
//           setWaiting(false);
//           Alert.alert('Request Rejected', 'The hospital rejected your request.');
//         }
//       });

//       return () => unsubscribe();
//     } catch (error) {
//       console.error('Error sending request:', error);
//       Alert.alert('Error', 'Failed to send request to the hospital.');
//       setWaiting(false);
//     }
//   };

//   if (!location) {
//     return (
//       <View style={styles.loadingContainer}>
//         <Text>Fetching location...</Text>
//       </View>
//     );
//   }

//   return (
//     <ScrollView contentContainerStyle={styles.container}>
//       {/* Patient Info Inputs */}
//       <View style={styles.patientInfoContainer}>
//         <Text style={styles.sectionTitle}>Patient Details</Text>
//         <TextInput
//           style={styles.input}
//           placeholder="Patient Name"
//           value={patientName}
//           onChangeText={setPatientName}
//         />
//         <TextInput
//           style={styles.input}
//           placeholder="Patient Age"
//           keyboardType="numeric"
//           value={patientAge}
//           onChangeText={setPatientAge}
//         />
//         <TextInput
//           style={styles.input}
//           placeholder="Condition (e.g., Cardiac, Trauma)"
//           value={patientCondition}
//           onChangeText={setPatientCondition}
//         />
//       </View>

//       {/* Fetch Hospitals Button */}
//       <TouchableOpacity
//         style={styles.button}
//         onPress={() => handleFetchHospitals(false)}
//         disabled={fetching}
//       >
//         <Text style={styles.buttonText}>
//           {fetching ? 'Fetching...' : 'Fetch Nearby Hospitals'}
//         </Text>
//       </TouchableOpacity>

//       {/* Map View */}
//       <View style={styles.mapContainer}>
//         <MapView
//           style={styles.map}
//           initialRegion={{
//             latitude: location.latitude,
//             longitude: location.longitude,
//             latitudeDelta: 0.02,
//             longitudeDelta: 0.02,
//           }}
//         >
//           <Marker
//             coordinate={{
//               latitude: location.latitude,
//               longitude: location.longitude,
//             }}
//             title="Your Location"
//             description="Current Position"
//             pinColor="blue"
//           />
//         </MapView>
//       </View>

//       {/* List of Hospitals */}
//       <View style={styles.hospitalsContainer}>
//         <Text style={styles.subheading}>Nearby Hospitals:</Text>
//         {hospitals.length > 0 ? (
//           hospitals.map((hospital, index) => (
//             <TouchableOpacity
//               key={index}
//               style={styles.hospitalCard}
//               onPress={() => handleSelectHospital(hospital)}
//             >
//               <Text style={styles.hospitalName}>{hospital.name}</Text>
//               <Text style={styles.hospitalAddress}>{hospital.address}</Text>
//               <Text style={styles.hospitalDistance}>
//                 📍 {hospital.distanceFromDriver} metres away
//               </Text>
//             </TouchableOpacity>
//           ))
//         ) : (
//           <Text style={styles.noHospitals}>
//             No hospitals found. Click the button above to fetch.
//           </Text>
//         )}
//       </View>

//       {/* Confirmation Modal */}
//       <Modal visible={showConfirmation} transparent animationType="slide">
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Confirm Selection</Text>
//             <Text style={styles.modalText}>
//               Are you sure you want to select {selectedHospital?.name}?
//             </Text>
//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={styles.modalButton}
//                 onPress={confirmSelection}
//               >
//                 <Text style={styles.modalButtonText}>Confirm</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={styles.modalButtonCancel}
//                 onPress={() => setShowConfirmation(false)}
//               >
//                 <Text style={styles.modalButtonText}>Cancel</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       {/* Waiting Pop-up */}
//       <Modal visible={waiting} transparent animationType="fade">
//         <View style={styles.waitingContainer}>
//           <View style={styles.waitingContent}>
//             <View style={styles.loadingIconContainer}>
//               <Text style={styles.loadingEmoji}>🏥</Text>
//             </View>
//             <Text style={styles.waitingTitle}>Please Wait</Text>
//             <Text style={styles.waitingText}>
//               Waiting for hospital response...
//             </Text>
//             <Text style={styles.waitingSubtext}>
//               This may take a few moments
//             </Text>
//           </View>
//         </View>
//       </Modal>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flexGrow: 1,
//     padding: 20,
//     backgroundColor: '#f4f4f4',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   heading: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     marginBottom: 15,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 10,
//   },
//   patientInfoContainer: {
//     backgroundColor: '#fff',
//     padding: 15,
//     borderRadius: 10,
//     marginBottom: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#D1D5DB',
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 10,
//     backgroundColor: 'white',
//   },
//   mapContainer: {
//     height: 300,
//     marginVertical: 15,
//     borderRadius: 10,
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   map: {
//     flex: 1,
//   },
//   button: {
//     backgroundColor: '#ef4444',
//     paddingVertical: 15,
//     paddingHorizontal: 30,
//     borderRadius: 12,
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   buttonText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   hospitalsContainer: {
//     paddingHorizontal: 10,
//   },
//   subheading: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 10,
//   },
//   hospitalCard: {
//     backgroundColor: '#fff',
//     padding: 15,
//     borderRadius: 8,
//     marginBottom: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   hospitalName: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: 5,
//   },
//   hospitalAddress: {
//     fontSize: 14,
//     color: '#555',
//   },
//   hospitalDistance: {
//     fontSize: 14,
//     color: '#1E90FF',
//     marginTop: 5,
//   },
//   noHospitals: {
//     textAlign: 'center',
//     color: '#888',
//     fontSize: 16,
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   modalContent: {
//     backgroundColor: '#fff',
//     padding: 20,
//     borderRadius: 10,
//     width: '80%',
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 10,
//   },
//   modalText: {
//     fontSize: 16,
//     marginBottom: 20,
//   },
//   modalButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   modalButton: {
//     backgroundColor: '#ef4444',
//     padding: 10,
//     borderRadius: 5,
//     flex: 1,
//     marginRight: 10,
//     alignItems: 'center',
//   },
//   modalButtonCancel: {
//     backgroundColor: '#ccc',
//     padding: 10,
//     borderRadius: 5,
//     flex: 1,
//     alignItems: 'center',
//   },
//   modalButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   waitingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//   },
//   waitingContent: {
//     backgroundColor: '#fff',
//     padding: 30,
//     borderRadius: 20,
//     width: '90%',
//     maxWidth: 400,
//     alignItems: 'center',
//   },
//   loadingIconContainer: {
//     marginBottom: 20,
//   },
//   loadingEmoji: {
//     fontSize: 48,
//     textAlign: 'center',
//   },
//   waitingTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 15,
//   },
//   waitingText: {
//     fontSize: 18,
//     marginBottom: 10,
//   },
//   waitingSubtext: {
//     fontSize: 14,
//     color: '#666',
//   },
// });

// export default DriverScreen;

// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   Alert,
//   Modal,
// } from 'react-native';
// import MapView, { Marker } from 'react-native-maps';
// import * as Location from 'expo-location';
// import fetchNearbyHospitals from '../services/fetchNearbyHospitals';
// import { db } from '../firebase/firebaseConnection';
// import { doc, setDoc, onSnapshot } from 'firebase/firestore';

// const DriverScreen = ({ route, navigation }) => {
//   const { driverId } = route.params || {};
//   const [location, setLocation] = useState(null);
//   const [allHospitals, setAllHospitals] = useState([]); // Stores all fetched hospitals
//   const [displayedHospitals, setDisplayedHospitals] = useState([]); // Hospitals currently displayed
//   const [fetching, setFetching] = useState(false);
//   const [selectedHospital, setSelectedHospital] = useState(null);
//   const [showConfirmation, setShowConfirmation] = useState(false);
//   const [waiting, setWaiting] = useState(false);
//   const [displayCount, setDisplayCount] = useState(5); // Number of hospitals to display initially

//   // Patient Info
//   const [patientName, setPatientName] = useState('');
//   const [patientAge, setPatientAge] = useState('');
//   const [patientCondition, setPatientCondition] = useState('');

//   // Fetch and store driver's location
//   useEffect(() => {
//     const fetchAndStoreLocation = async () => {
//       let { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== 'granted') {
//         Alert.alert('Permission Denied', 'Allow location access to use this feature.');
//         return;
//       }

//       // Fetch current location
//       let location = await Location.getCurrentPositionAsync({});
//       const { latitude, longitude } = location.coords;

//       // Store location in Firestore
//       const driverRef = doc(db, 'ambulances', driverId);
//       await setDoc(
//         driverRef,
//         {
//           driverId,
//           latitude,
//           longitude,
//           timestamp: new Date().toISOString(),
//         },
//         { merge: true }
//       );

//       // Update local state
//       setLocation({ latitude, longitude });
//     };

//     // Fetch and store location every 20 seconds
//     const interval = setInterval(fetchAndStoreLocation, 20000);
//     fetchAndStoreLocation(); // Initial fetch

//     return () => clearInterval(interval);
//   }, [driverId]);

//   // Handle fetching nearby hospitals
//   const handleFetchHospitals = async () => {
//     if (!location) {
//       Alert.alert('Error', 'Unable to get current location.');
//       return;
//     }

//     if (!patientName || !patientAge || !patientCondition) {
//       Alert.alert('Error', 'Please enter patient details before fetching hospitals.');
//       return;
//     }

//     setFetching(true);
//     try {
//       const hospitalData = await fetchNearbyHospitals(
//         location.latitude,
//         location.longitude
//       );

//       // Sort hospitals by distance
//       const sortedHospitals = hospitalData.sort(
//         (a, b) => a.distanceFromDriver - b.distanceFromDriver
//       );

//       // Store all fetched hospitals
//       setAllHospitals(sortedHospitals);

//       // Display the first 5 hospitals
//       setDisplayedHospitals(sortedHospitals.slice(0, displayCount));
//     } catch (error) {
//       console.error('Error fetching hospitals:', error);
//       Alert.alert('Error', 'Failed to fetch nearby hospitals.');
//     }
//     setFetching(false);
//   };

//   // Handle "Show More Hospitals" button click
//   const handleShowMoreHospitals = () => {
//     const nextDisplayCount = displayCount + 5;
//     setDisplayCount(nextDisplayCount);
//     setDisplayedHospitals(allHospitals.slice(0, nextDisplayCount));
//   };

//   // Handle hospital selection
//   const handleSelectHospital = (hospital) => {
//     if (!hospital || !hospital.id) {
//       Alert.alert('Error', 'Invalid hospital data. Please try again.');
//       return;
//     }
//     setSelectedHospital(hospital);
//     setShowConfirmation(true);
//   };

//   // Confirm hospital selection and navigate
//   const confirmSelection = async () => {
//     setShowConfirmation(false);
//     setWaiting(true);

//     try {
//       // Ensure all required data is available
//       if (!location || !selectedHospital || !driverId) {
//         Alert.alert('Error', 'Missing required data. Please try again.');
//         return;
//       }

//       // Log coordinates before navigation
//       console.log('Driver Location (DriverScreen):', {
//         latitude: location.latitude,
//         longitude: location.longitude,
//       });
//       console.log('Hospital Location (DriverScreen):', {
//         latitude: selectedHospital.latitude,
//         longitude: selectedHospital.longitude,
//       });

//       // Create a request in Firestore
//       const requestRef = doc(db, 'hospitalRequests', driverId); // Use driverId as the document ID
//       await setDoc(requestRef, {
//         driverId,
//         hospitalId: selectedHospital.id,
//         patientName,
//         patientAge,
//         patientCondition,
//         status: 'pending',
//         createdAt: new Date().toISOString(),
//         latitude: location.latitude,
//         longitude: location.longitude,
//       });

//       // Listen for the hospital's response
//       const unsubscribe = onSnapshot(requestRef, (doc) => {
//         const data = doc.data();
//         if (data && data.status === 'accepted') {
//           setWaiting(false);

//           // Navigate to DriverNavigationScreen with driverLocation and hospital details
//           navigation.navigate('DriverNavigation', {
//             driverLocation: {
//               driverId,
//               latitude: location.latitude,
//               longitude: location.longitude,
//             },
//             hospitalLocation: {
//               latitude: selectedHospital.latitude,
//               longitude: selectedHospital.longitude,
//             },
//             hospitalName: selectedHospital.name,
//           });
//         } else if (data && data.status === 'rejected') {
//           setWaiting(false);
//           Alert.alert('Request Rejected', 'The hospital rejected your request.');
//         }
//       });

//       return () => unsubscribe();
//     } catch (error) {
//       console.error('Error sending request:', error);
//       Alert.alert('Error', 'Failed to send request to the hospital.');
//       setWaiting(false);
//     }
//   };

//   if (!location) {
//     return (
//       <View style={styles.loadingContainer}>
//         <Text>Fetching location...</Text>
//       </View>
//     );
//   }

//   return (
//     <ScrollView contentContainerStyle={styles.container}>
//       {/* Patient Info Inputs */}
//       <View style={styles.patientInfoContainer}>
//         <Text style={styles.sectionTitle}>Patient Details</Text>
//         <TextInput
//           style={styles.input}
//           placeholder="Patient Name"
//           value={patientName}
//           onChangeText={setPatientName}
//         />
//         <TextInput
//           style={styles.input}
//           placeholder="Patient Age"
//           keyboardType="numeric"
//           value={patientAge}
//           onChangeText={setPatientAge}
//         />
//         <TextInput
//           style={styles.input}
//           placeholder="Condition (e.g., Cardiac, Trauma)"
//           value={patientCondition}
//           onChangeText={setPatientCondition}
//         />
//       </View>

//       {/* Fetch Hospitals Button */}
//       <TouchableOpacity
//         style={styles.button}
//         onPress={handleFetchHospitals}
//         disabled={fetching}
//       >
//         <Text style={styles.buttonText}>
//           {fetching ? 'Fetching...' : 'Fetch Nearby Hospitals'}
//         </Text>
//       </TouchableOpacity>

//       {/* Map View */}
//       <View style={styles.mapContainer}>
//         <MapView
//           style={styles.map}
//           initialRegion={{
//             latitude: location.latitude,
//             longitude: location.longitude,
//             latitudeDelta: 0.02,
//             longitudeDelta: 0.02,
//           }}
//         >
//           <Marker
//             coordinate={{
//               latitude: location.latitude,
//               longitude: location.longitude,
//             }}
//             title="Your Location"
//             description="Current Position"
//             pinColor="blue"
//           />
//         </MapView>
//       </View>

//       {/* List of Hospitals */}
//       <View style={styles.hospitalsContainer}>
//         <Text style={styles.subheading}>Nearby Hospitals:</Text>
//         {displayedHospitals.length > 0 ? (
//           displayedHospitals.map((hospital, index) => (
//             <TouchableOpacity
//               key={index}
//               style={styles.hospitalCard}
//               onPress={() => handleSelectHospital(hospital)}
//             >
//               <Text style={styles.hospitalName}>{hospital.name}</Text>
//               <Text style={styles.hospitalAddress}>{hospital.address}</Text>
//               <Text style={styles.hospitalDistance}>
//                 📍 {hospital.distanceFromDriver} metres away
//               </Text>
//             </TouchableOpacity>
//           ))
//         ) : (
//           <Text style={styles.noHospitals}>
//             No hospitals found. Click the button above to fetch.
//           </Text>
//         )}
//       </View>

//       {/* Show More Button */}
//       {allHospitals.length > displayedHospitals.length && (
//         <TouchableOpacity
//           style={styles.showMoreButton}
//           onPress={handleShowMoreHospitals}
//           disabled={fetching}
//         >
//           <Text style={styles.showMoreButtonText}>
//             {fetching ? 'Fetching...' : 'Show More Hospitals'}
//           </Text>
//         </TouchableOpacity>
//       )}

//       {/* Confirmation Modal */}
//       <Modal visible={showConfirmation} transparent animationType="slide">
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Confirm Selection</Text>
//             <Text style={styles.modalText}>
//               Are you sure you want to select {selectedHospital?.name}?
//             </Text>
//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={styles.modalButton}
//                 onPress={confirmSelection}
//               >
//                 <Text style={styles.modalButtonText}>Confirm</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={styles.modalButtonCancel}
//                 onPress={() => setShowConfirmation(false)}
//               >
//                 <Text style={styles.modalButtonText}>Cancel</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       {/* Waiting Pop-up */}
//       <Modal visible={waiting} transparent animationType="fade">
//         <View style={styles.waitingContainer}>
//           <View style={styles.waitingContent}>
//             <View style={styles.loadingIconContainer}>
//               <Text style={styles.loadingEmoji}>🏥</Text>
//             </View>
//             <Text style={styles.waitingTitle}>Please Wait</Text>
//             <Text style={styles.waitingText}>
//               Waiting for hospital response...
//             </Text>
//             <Text style={styles.waitingSubtext}>
//               This may take a few moments
//             </Text>
//           </View>
//         </View>
//       </Modal>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flexGrow: 1,
//     padding: 20,
//     backgroundColor: '#f4f4f4',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   heading: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     marginBottom: 15,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 10,
//   },
//   patientInfoContainer: {
//     backgroundColor: '#fff',
//     padding: 15,
//     borderRadius: 10,
//     marginBottom: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#D1D5DB',
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 10,
//     backgroundColor: 'white',
//   },
//   mapContainer: {
//     height: 300,
//     marginVertical: 15,
//     borderRadius: 10,
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   map: {
//     flex: 1,
//   },
//   button: {
//     backgroundColor: '#ef4444',
//     paddingVertical: 15,
//     paddingHorizontal: 30,
//     borderRadius: 12,
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   buttonText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   hospitalsContainer: {
//     paddingHorizontal: 10,
//   },
//   subheading: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 10,
//   },
//   hospitalCard: {
//     backgroundColor: '#fff',
//     padding: 15,
//     borderRadius: 8,
//     marginBottom: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   hospitalName: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: 5,
//   },
//   hospitalAddress: {
//     fontSize: 14,
//     color: '#555',
//   },
//   hospitalDistance: {
//     fontSize: 14,
//     color: '#1E90FF',
//     marginTop: 5,
//   },
//   noHospitals: {
//     textAlign: 'center',
//     color: '#888',
//     fontSize: 16,
//   },
//   showMoreButton: {
//     backgroundColor: '#ef4444',
//     paddingVertical: 15,
//     paddingHorizontal: 30,
//     borderRadius: 12,
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   showMoreButtonText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   modalContent: {
//     backgroundColor: '#fff',
//     padding: 20,
//     borderRadius: 10,
//     width: '80%',
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 10,
//   },
//   modalText: {
//     fontSize: 16,
//     marginBottom: 20,
//   },
//   modalButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   modalButton: {
//     backgroundColor: '#ef4444',
//     padding: 10,
//     borderRadius: 5,
//     flex: 1,
//     marginRight: 10,
//     alignItems: 'center',
//   },
//   modalButtonCancel: {
//     backgroundColor: '#ccc',
//     padding: 10,
//     borderRadius: 5,
//     flex: 1,
//     alignItems: 'center',
//   },
//   modalButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   waitingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//   },
//   waitingContent: {
//     backgroundColor: '#fff',
//     padding: 30,
//     borderRadius: 20,
//     width: '90%',
//     maxWidth: 400,
//     alignItems: 'center',
//   },
//   loadingIconContainer: {
//     marginBottom: 20,
//   },
//   loadingEmoji: {
//     fontSize: 48,
//     textAlign: 'center',
//   },
//   waitingTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 15,
//   },
//   waitingText: {
//     fontSize: 18,
//     marginBottom: 10,
//   },
//   waitingSubtext: {
//     fontSize: 14,
//     color: '#666',
//   },
// });

// export default DriverScreen;

// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   ActivityIndicator,
//   Alert,
//   Modal
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { db, auth } from '../firebase/firebaseConnection';
// import { doc, updateDoc, onSnapshot, collection, query, where, getDoc } from 'firebase/firestore';
// import MapView, { Marker } from 'react-native-maps';
// import { MaterialIcons } from '@expo/vector-icons';

// const DriverScreen = ({ navigation }) => {
//   const [assignedIncident, setAssignedIncident] = useState(null);
//   const [driverLocation, setDriverLocation] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [showAcceptModal, setShowAcceptModal] = useState(false);
//   const [showNavigation, setShowNavigation] = useState(false);
//   const [driverData, setDriverData] = useState({
//     name: '',
//     vehicleNumber: '',
//     contact: '',
//     email: ''
//   });

//   useEffect(() => {
//     const user = auth.currentUser;
//     if (!user) {
//       Alert.alert('Error', 'Driver not authenticated');
//       navigation.navigate('Login');
//       return;
//     }

//     const fetchDriverData = async () => {
//       try {
//         const userDoc = await getDoc(doc(db, 'users', user.uid));
//         const ambulanceDoc = await getDoc(doc(db, 'ambulances', user.uid));

//         if (userDoc.exists() && ambulanceDoc.exists()) {
//           const userData = userDoc.data();
//           const ambulanceData = ambulanceDoc.data();
          
//           setDriverData({
//             name: userData.name || 'Driver',
//             vehicleNumber: ambulanceData.vehicleNumber || 'Unknown',
//             contact: ambulanceData.contact || 'N/A',
//             email: userData.email
//           });

//           if (ambulanceData.latitude && ambulanceData.longitude) {
//             setDriverLocation({
//               latitude: ambulanceData.latitude,
//               longitude: ambulanceData.longitude,
//               driverId: user.uid
//             });
//           }
//         } else {
//           Alert.alert('Error', 'Driver profile not complete');
//         }
//       } catch (error) {
//         console.error('Error fetching driver data:', error);
//         Alert.alert('Error', 'Failed to load driver profile');
//       }
//     };

//     fetchDriverData();

//     const fetchAssignedIncidents = async () => {
//       try {
//         const incidentsRef = collection(db, 'incidents');
//         const q = query(
//           incidentsRef,
//           where('status.driver', '==', 'assigned'),
//           where('availableToAllDrivers', '==', true)
//         );
        
//         const unsubscribe = onSnapshot(q, (snapshot) => {
//           if (!snapshot.empty) {
//             const incidentDoc = snapshot.docs[0];
//             const incidentData = incidentDoc.data();
//             setAssignedIncident({
//               id: incidentDoc.id,
//               ...incidentData
//             });
//           } else {
//             setAssignedIncident(null);
//           }
//           setLoading(false);
//         });

//         const acceptedQuery = query(
//           incidentsRef,
//           where('assignedTo', '==', user.uid),
//           where('status.driver', '==', 'accepted')
//         );
        
//         const acceptedUnsubscribe = onSnapshot(acceptedQuery, (acceptedSnapshot) => {
//           if (!acceptedSnapshot.empty) {
//             const incidentDoc = acceptedSnapshot.docs[0];
//             const incidentData = incidentDoc.data();
//             setAssignedIncident({
//               id: incidentDoc.id,
//               ...incidentData
//             });
//             setShowNavigation(true);
//           }
//         });

//         return () => {
//           unsubscribe();
//           acceptedUnsubscribe();
//         };
//       } catch (error) {
//         console.error('Error fetching incidents:', error);
//         Alert.alert('Error', 'Failed to load incidents');
//         setLoading(false);
//       }
//     };

//     fetchAssignedIncidents();
//   }, [navigation]);

//   const handleAcceptIncident = async () => {
//     if (!auth.currentUser?.uid || !driverData.name) {
//       Alert.alert('Error', 'Driver information incomplete');
//       return;
//     }
    
//     try {
//       setLoading(true);
      
//       const driverInfo = {
//         name: driverData.name,
//         vehicleNumber: driverData.vehicleNumber,
//         contact: driverData.contact,
//         email: driverData.email
//       };

//       const incidentRef = doc(db, 'incidents', assignedIncident.id);
//       await updateDoc(incidentRef, {
//         'status.driver': 'accepted',
//         assignedTo: auth.currentUser.uid,
//         acceptedAt: new Date().toISOString(),
//         driverInfo: driverInfo,
//         availableToAllDrivers: false
//       });

//       await updateDoc(doc(db, 'ambulances', auth.currentUser.uid), {
//         status: 'busy',
//         lastUpdated: new Date().toISOString()
//       });

//       setShowAcceptModal(false);
//       setShowNavigation(true);
//     } catch (error) {
//       console.error('Error accepting incident:', error);
//       Alert.alert('Error', 'Failed to accept incident');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStartNavigation = () => {
//     if (!driverLocation || !assignedIncident) {
//       Alert.alert('Error', 'Location data not available');
//       return;
//     }

//     navigation.navigate('DriverNavigation', {
//       driverLocation,
//       incidentLocation: {
//         latitude: assignedIncident.latitude,
//         longitude: assignedIncident.longitude
//       },
//       incidentAddress: assignedIncident.address,
//       incidentType: assignedIncident.incidentType,
//       incidentId: assignedIncident.id
//     });
//   };

//   const handleCompleteIncident = async () => {
//     try {
//       setLoading(true);
      
//       const incidentRef = doc(db, 'incidents', assignedIncident.id);
//       await updateDoc(incidentRef, {
//         'status.driver': 'completed',
//         completedAt: new Date().toISOString()
//       });

//       await updateDoc(doc(db, 'ambulances', auth.currentUser.uid), {
//         status: 'available',
//         lastUpdated: new Date().toISOString()
//       });

//       setAssignedIncident(null);
//       setShowNavigation(false);
//       Alert.alert('Success', 'Incident marked as completed');
//     } catch (error) {
//       console.error('Error completing incident:', error);
//       Alert.alert('Error', 'Failed to complete incident');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#4285F4" />
//         <Text style={styles.loadingText}>Loading...</Text>
//       </View>
//     );
//   }

//   return (
//     <ScrollView contentContainerStyle={styles.container}>
//       <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.header}>
//         <Text style={styles.headerText}>Ambulance Driver Dashboard</Text>
//         {driverData.name && (
//           <Text style={styles.driverInfo}>
//             {driverData.name} - {driverData.vehicleNumber}
//           </Text>
//         )}
//       </LinearGradient>

//       {!assignedIncident ? (
//         <View style={styles.emptyState}>
//           <MaterialIcons name="assignment" size={50} color="#888" />
//           <Text style={styles.noDataText}>No assigned incidents</Text>
//           <Text style={styles.subText}>Waiting for new assignments...</Text>
//         </View>
//       ) : !showNavigation ? (
//         <>
//           <View style={styles.incidentContainer}>
//             <Text style={styles.incidentType}>{assignedIncident.incidentType}</Text>
//             <Text style={styles.description}>{assignedIncident.description}</Text>
//             <Text style={styles.address}>{assignedIncident.address}</Text>
//             <Text style={styles.time}>
//               Reported: {new Date(assignedIncident.createdAt).toLocaleString()}
//             </Text>
//           </View>

//           <View style={styles.buttonContainer}>
//             <TouchableOpacity
//               style={[styles.button, styles.acceptButton]}
//               onPress={() => setShowAcceptModal(true)}
//               disabled={loading}
//             >
//               {loading ? (
//                 <ActivityIndicator color="white" />
//               ) : (
//                 <Text style={styles.buttonText}>Accept Incident</Text>
//               )}
//             </TouchableOpacity>
//           </View>

//           {driverLocation && (
//             <View style={styles.mapContainer}>
//               <MapView
//                 style={styles.map}
//                 initialRegion={{
//                   latitude: driverLocation.latitude,
//                   longitude: driverLocation.longitude,
//                   latitudeDelta: 0.0922,
//                   longitudeDelta: 0.0421,
//                 }}
//               >
//                 <Marker
//                   coordinate={{
//                     latitude: driverLocation.latitude,
//                     longitude: driverLocation.longitude
//                   }}
//                   title="Your Location"
//                   pinColor="blue"
//                 />
//                 <Marker
//                   coordinate={{
//                     latitude: assignedIncident.latitude,
//                     longitude: assignedIncident.longitude
//                   }}
//                   title="Incident Location"
//                   pinColor="red"
//                 />
//               </MapView>
//             </View>
//           )}
//         </>
//       ) : (
//         <>
//           <View style={styles.navigationContainer}>
//             <Text style={styles.navigationTitle}>Active Incident</Text>
//             <Text style={styles.navigationText}>
//               {assignedIncident.incidentType}
//             </Text>
//             <Text style={styles.address}>{assignedIncident.address}</Text>

//             {driverLocation && (
//               <View style={styles.mapContainer}>
//                 <MapView
//                   style={styles.map}
//                   initialRegion={{
//                     latitude: driverLocation.latitude,
//                     longitude: driverLocation.longitude,
//                     latitudeDelta: 0.0922,
//                     longitudeDelta: 0.0421,
//                   }}
//                 >
//                   <Marker
//                     coordinate={{
//                       latitude: driverLocation.latitude,
//                       longitude: driverLocation.longitude
//                     }}
//                     title="Your Location"
//                     pinColor="blue"
//                   />
//                   <Marker
//                     coordinate={{
//                       latitude: assignedIncident.latitude,
//                       longitude: assignedIncident.longitude
//                     }}
//                     title="Incident Location"
//                     pinColor="red"
//                   />
//                 </MapView>
//               </View>
//             )}

//             <TouchableOpacity
//               style={[styles.button, styles.navigateButton]}
//               onPress={handleStartNavigation}
//             >
//               <Text style={styles.buttonText}>Start Navigation</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[styles.button, styles.completeButton]}
//               onPress={handleCompleteIncident}
//             >
//               <Text style={styles.buttonText}>Mark as Completed</Text>
//             </TouchableOpacity>
//           </View>
//         </>
//       )}

//       <Modal visible={showAcceptModal} transparent animationType="slide">
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Confirm Acceptance</Text>
//             <Text style={styles.modalText}>
//               Are you sure you want to accept this incident?
//             </Text>
//             {assignedIncident && (
//               <>
//                 <Text style={styles.modalIncidentType}>{assignedIncident.incidentType}</Text>
//                 <Text style={styles.modalAddress}>{assignedIncident.address}</Text>
//               </>
//             )}
//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.modalCancelButton]}
//                 onPress={() => setShowAcceptModal(false)}
//                 disabled={loading}
//               >
//                 <Text style={styles.modalButtonText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.modalAcceptButton]}
//                 onPress={handleAcceptIncident}
//                 disabled={loading}
//               >
//                 <Text style={styles.modalButtonText}>
//                   {loading ? 'Accepting...' : 'Accept'}
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flexGrow: 1,
//     backgroundColor: '#f5f5f5',
//     paddingBottom: 20,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#333',
//   },
//   header: {
//     padding: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//   },
//   headerText: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: 'white',
//   },
//   driverInfo: {
//     fontSize: 14,
//     color: 'white',
//     marginTop: 5,
//   },
//   emptyState: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 40,
//   },
//   noDataText: {
//     fontSize: 18,
//     color: '#555',
//     marginTop: 10,
//   },
//   subText: {
//     fontSize: 14,
//     color: '#777',
//     marginTop: 5,
//   },
//   incidentContainer: {
//     backgroundColor: 'white',
//     padding: 20,
//     margin: 20,
//     borderRadius: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   incidentType: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 10,
//   },
//   description: {
//     fontSize: 16,
//     color: '#555',
//     marginBottom: 10,
//   },
//   address: {
//     fontSize: 16,
//     color: '#333',
//     fontWeight: '500',
//     marginBottom: 10,
//   },
//   time: {
//     fontSize: 14,
//     color: '#777',
//     fontStyle: 'italic',
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     paddingHorizontal: 20,
//     marginBottom: 20,
//   },
//   button: {
//     padding: 15,
//     borderRadius: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//     width: '60%',
//   },
//   acceptButton: {
//     backgroundColor: '#34A853',
//   },
//   navigateButton: {
//     backgroundColor: '#4285F4',
//     marginHorizontal: 20,
//     marginTop: 20,
//     width: '90%',
//   },
//   completeButton: {
//     backgroundColor: '#FBBC05',
//     marginHorizontal: 20,
//     marginTop: 10,
//     marginBottom: 20,
//     width: '90%',
//   },
//   buttonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   mapContainer: {
//     height: 300,
//     margin: 20,
//     borderRadius: 10,
//     overflow: 'hidden',
//   },
//   map: {
//     flex: 1,
//   },
//   navigationContainer: {
//     padding: 20,
//   },
//   navigationTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 10,
//     textAlign: 'center',
//   },
//   navigationText: {
//     fontSize: 16,
//     color: '#555',
//     marginBottom: 10,
//     textAlign: 'center',
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   modalContent: {
//     backgroundColor: 'white',
//     padding: 20,
//     borderRadius: 10,
//     width: '80%',
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 15,
//     textAlign: 'center',
//   },
//   modalText: {
//     fontSize: 16,
//     marginBottom: 10,
//     textAlign: 'center',
//   },
//   modalIncidentType: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//     textAlign: 'center',
//     marginVertical: 5,
//   },
//   modalAddress: {
//     fontSize: 14,
//     color: '#555',
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   modalButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   modalButton: {
//     padding: 12,
//     borderRadius: 8,
//     width: '48%',
//     alignItems: 'center',
//   },
//   modalAcceptButton: {
//     backgroundColor: '#34A853',
//   },
//   modalCancelButton: {
//     backgroundColor: '#EA4335',
//   },
//   modalButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// });

// export default DriverScreen;

// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   ActivityIndicator,
//   Alert,
//   Modal
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { db, auth } from '../firebase/firebaseConnection';
// import { doc, updateDoc, onSnapshot, collection, query, where, getDoc } from 'firebase/firestore';
// import MapView, { Marker } from 'react-native-maps';
// import { MaterialIcons } from '@expo/vector-icons';

// const DriverScreen = ({ navigation }) => {
//   const [assignedIncident, setAssignedIncident] = useState(null);
//   const [driverLocation, setDriverLocation] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [showAcceptModal, setShowAcceptModal] = useState(false);
//   const [showNavigation, setShowNavigation] = useState(false);
//   const [driverData, setDriverData] = useState({
//     name: '',
//     vehicleNumber: '',
//     contact: '',
//     email: ''
//   });

//   useEffect(() => {
//     const user = auth.currentUser;
//     if (!user) {
//       Alert.alert('Error', 'Driver not authenticated');
//       navigation.navigate('Login');
//       return;
//     }

//     const fetchDriverData = async () => {
//       try {
//         const userDoc = await getDoc(doc(db, 'users', user.uid));
//         const ambulanceDoc = await getDoc(doc(db, 'ambulances', user.uid));

//         if (userDoc.exists() && ambulanceDoc.exists()) {
//           const userData = userDoc.data();
//           const ambulanceData = ambulanceDoc.data();
          
//           setDriverData({
//             name: userData.name || 'Driver',
//             vehicleNumber: ambulanceData.vehicleNumber || 'Unknown',
//             contact: ambulanceData.contact || 'N/A',
//             email: userData.email
//           });

//           if (ambulanceData.latitude && ambulanceData.longitude) {
//             setDriverLocation({
//               latitude: ambulanceData.latitude,
//               longitude: ambulanceData.longitude,
//               driverId: user.uid
//             });
//           }
//         } else {
//           Alert.alert('Error', 'Driver profile not complete');
//         }
//       } catch (error) {
//         console.error('Error fetching driver data:', error);
//         Alert.alert('Error', 'Failed to load driver profile');
//       }
//     };

//     fetchDriverData();

//     const fetchAssignedIncidents = async () => {
//       try {
//         const incidentsRef = collection(db, 'incidents');
//         const q = query(
//           incidentsRef,
//           where('status.driver', '==', 'assigned'),
//           where('availableToAllDrivers', '==', true)
//         );
        
//         const unsubscribe = onSnapshot(q, (snapshot) => {
//           if (!snapshot.empty) {
//             const incidentDoc = snapshot.docs[0];
//             const incidentData = incidentDoc.data();
//             setAssignedIncident({
//               id: incidentDoc.id,
//               ...incidentData
//             });
//           } else {
//             setAssignedIncident(null);
//           }
//           setLoading(false);
//         });

//         const acceptedQuery = query(
//           incidentsRef,
//           where('assignedTo', '==', user.uid),
//           where('status.driver', '==', 'accepted')
//         );
        
//         const acceptedUnsubscribe = onSnapshot(acceptedQuery, (acceptedSnapshot) => {
//           if (!acceptedSnapshot.empty) {
//             const incidentDoc = acceptedSnapshot.docs[0];
//             const incidentData = incidentDoc.data();
//             setAssignedIncident({
//               id: incidentDoc.id,
//               ...incidentData
//             });
//             setShowNavigation(true);
//           }
//         });

//         return () => {
//           unsubscribe();
//           acceptedUnsubscribe();
//         };
//       } catch (error) {
//         console.error('Error fetching incidents:', error);
//         Alert.alert('Error', 'Failed to load incidents');
//         setLoading(false);
//       }
//     };

//     fetchAssignedIncidents();
//   }, [navigation]);

//   const handleAcceptIncident = async () => {
//     if (!auth.currentUser?.uid || !driverData.name) {
//       Alert.alert('Error', 'Driver information incomplete');
//       return;
//     }
    
//     try {
//       setLoading(true);
      
//       const driverInfo = {
//         name: driverData.name,
//         vehicleNumber: driverData.vehicleNumber,
//         contact: driverData.contact,
//         email: driverData.email
//       };

//       const incidentRef = doc(db, 'incidents', assignedIncident.id);
//       await updateDoc(incidentRef, {
//         'status.driver': 'accepted',
//         assignedTo: auth.currentUser.uid,
//         acceptedAt: new Date().toISOString(),
//         driverInfo: driverInfo,
//         availableToAllDrivers: false
//       });

//       await updateDoc(doc(db, 'ambulances', auth.currentUser.uid), {
//         status: 'busy',
//         lastUpdated: new Date().toISOString()
//       });

//       setShowAcceptModal(false);
//       setShowNavigation(true);
//     } catch (error) {
//       console.error('Error accepting incident:', error);
//       Alert.alert('Error', 'Failed to accept incident');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStartNavigation = () => {
//     if (!driverLocation || !assignedIncident) {
//       Alert.alert('Error', 'Location data not available');
//       return;
//     }

//     navigation.navigate('DriverNavigation', {
//       driverLocation,
//       incidentLocation: {
//         latitude: assignedIncident.latitude,
//         longitude: assignedIncident.longitude
//       },
//       incidentAddress: assignedIncident.address,
//       incidentType: assignedIncident.incidentType,
//       incidentId: assignedIncident.id
//     });
//   };

//   const handleCompleteIncident = async () => {
//     try {
//       setLoading(true);
      
//       const incidentRef = doc(db, 'incidents', assignedIncident.id);
//       await updateDoc(incidentRef, {
//         'status.driver': 'completed',
//         completedAt: new Date().toISOString()
//       });

//       await updateDoc(doc(db, 'ambulances', auth.currentUser.uid), {
//         status: 'available',
//         lastUpdated: new Date().toISOString()
//       });

//       // Navigate to the HospitalSelectionScreen with incident details
//       navigation.navigate('HospitalSelection', {
//         incidentId: assignedIncident.id,
//         incidentDetails: {
//           type: assignedIncident.incidentType,
//           description: assignedIncident.description,
//           address: assignedIncident.address,
//           patientInfo: assignedIncident.patientInfo || {}
//         },
//         driverLocation: {
//           latitude: driverLocation.latitude,
//           longitude: driverLocation.longitude
//         }
//       });

//       setAssignedIncident(null);
//       setShowNavigation(false);
//     } catch (error) {
//       console.error('Error completing incident:', error);
//       Alert.alert('Error', 'Failed to complete incident');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#4285F4" />
//         <Text style={styles.loadingText}>Loading...</Text>
//       </View>
//     );
//   }

//   return (
//     <ScrollView contentContainerStyle={styles.container}>
//       <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.header}>
//         <Text style={styles.headerText}>Ambulance Driver Dashboard</Text>
//         {driverData.name && (
//           <Text style={styles.driverInfo}>
//             {driverData.name} - {driverData.vehicleNumber}
//           </Text>
//         )}
//       </LinearGradient>

//       {!assignedIncident ? (
//         <View style={styles.emptyState}>
//           <MaterialIcons name="assignment" size={50} color="#888" />
//           <Text style={styles.noDataText}>No assigned incidents</Text>
//           <Text style={styles.subText}>Waiting for new assignments...</Text>
//         </View>
//       ) : !showNavigation ? (
//         <>
//           <View style={styles.incidentContainer}>
//             <Text style={styles.incidentType}>{assignedIncident.incidentType}</Text>
//             <Text style={styles.description}>{assignedIncident.description}</Text>
//             <Text style={styles.address}>{assignedIncident.address}</Text>
//             <Text style={styles.time}>
//               Reported: {new Date(assignedIncident.createdAt).toLocaleString()}
//             </Text>
//           </View>

//           <View style={styles.buttonContainer}>
//             <TouchableOpacity
//               style={[styles.button, styles.acceptButton]}
//               onPress={() => setShowAcceptModal(true)}
//               disabled={loading}
//             >
//               {loading ? (
//                 <ActivityIndicator color="white" />
//               ) : (
//                 <Text style={styles.buttonText}>Accept Incident</Text>
//               )}
//             </TouchableOpacity>
//           </View>

//           {driverLocation && (
//             <View style={styles.mapContainer}>
//               <MapView
//                 style={styles.map}
//                 initialRegion={{
//                   latitude: driverLocation.latitude,
//                   longitude: driverLocation.longitude,
//                   latitudeDelta: 0.0922,
//                   longitudeDelta: 0.0421,
//                 }}
//               >
//                 <Marker
//                   coordinate={{
//                     latitude: driverLocation.latitude,
//                     longitude: driverLocation.longitude
//                   }}
//                   title="Your Location"
//                   pinColor="blue"
//                 />
//                 <Marker
//                   coordinate={{
//                     latitude: assignedIncident.latitude,
//                     longitude: assignedIncident.longitude
//                   }}
//                   title="Incident Location"
//                   pinColor="red"
//                 />
//               </MapView>
//             </View>
//           )}
//         </>
//       ) : (
//         <>
//           <View style={styles.navigationContainer}>
//             <Text style={styles.navigationTitle}>Active Incident</Text>
//             <Text style={styles.navigationText}>
//               {assignedIncident.incidentType}
//             </Text>
//             <Text style={styles.address}>{assignedIncident.address}</Text>

//             {driverLocation && (
//               <View style={styles.mapContainer}>
//                 <MapView
//                   style={styles.map}
//                   initialRegion={{
//                     latitude: driverLocation.latitude,
//                     longitude: driverLocation.longitude,
//                     latitudeDelta: 0.0922,
//                     longitudeDelta: 0.0421,
//                   }}
//                 >
//                   <Marker
//                     coordinate={{
//                       latitude: driverLocation.latitude,
//                       longitude: driverLocation.longitude
//                     }}
//                     title="Your Location"
//                     pinColor="blue"
//                   />
//                   <Marker
//                     coordinate={{
//                       latitude: assignedIncident.latitude,
//                       longitude: assignedIncident.longitude
//                     }}
//                     title="Incident Location"
//                     pinColor="red"
//                   />
//                 </MapView>
//               </View>
//             )}

//             <TouchableOpacity
//               style={[styles.button, styles.navigateButton]}
//               onPress={handleStartNavigation}
//             >
//               <Text style={styles.buttonText}>Start Navigation</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[styles.button, styles.completeButton]}
//               onPress={handleCompleteIncident}
//             >
//               <Text style={styles.buttonText}>Mark as Completed</Text>
//             </TouchableOpacity>
//           </View>
//         </>
//       )}

//       <Modal visible={showAcceptModal} transparent animationType="slide">
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Confirm Acceptance</Text>
//             <Text style={styles.modalText}>
//               Are you sure you want to accept this incident?
//             </Text>
//             {assignedIncident && (
//               <>
//                 <Text style={styles.modalIncidentType}>{assignedIncident.incidentType}</Text>
//                 <Text style={styles.modalAddress}>{assignedIncident.address}</Text>
//               </>
//             )}
//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.modalCancelButton]}
//                 onPress={() => setShowAcceptModal(false)}
//                 disabled={loading}
//               >
//                 <Text style={styles.modalButtonText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.modalAcceptButton]}
//                 onPress={handleAcceptIncident}
//                 disabled={loading}
//               >
//                 <Text style={styles.modalButtonText}>
//                   {loading ? 'Accepting...' : 'Accept'}
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flexGrow: 1,
//     backgroundColor: '#f5f5f5',
//     paddingBottom: 20,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#333',
//   },
//   header: {
//     padding: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//   },
//   headerText: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: 'white',
//   },
//   driverInfo: {
//     fontSize: 14,
//     color: 'white',
//     marginTop: 5,
//   },
//   emptyState: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 40,
//   },
//   noDataText: {
//     fontSize: 18,
//     color: '#555',
//     marginTop: 10,
//   },
//   subText: {
//     fontSize: 14,
//     color: '#777',
//     marginTop: 5,
//   },
//   incidentContainer: {
//     backgroundColor: 'white',
//     padding: 20,
//     margin: 20,
//     borderRadius: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   incidentType: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 10,
//   },
//   description: {
//     fontSize: 16,
//     color: '#555',
//     marginBottom: 10,
//   },
//   address: {
//     fontSize: 16,
//     color: '#333',
//     fontWeight: '500',
//     marginBottom: 10,
//   },
//   time: {
//     fontSize: 14,
//     color: '#777',
//     fontStyle: 'italic',
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     paddingHorizontal: 20,
//     marginBottom: 20,
//   },
//   button: {
//     padding: 15,
//     borderRadius: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//     width: '60%',
//   },
//   acceptButton: {
//     backgroundColor: '#34A853',
//   },
//   navigateButton: {
//     backgroundColor: '#4285F4',
//     marginHorizontal: 20,
//     marginTop: 20,
//     width: '90%',
//   },
//   completeButton: {
//     backgroundColor: '#FBBC05',
//     marginHorizontal: 20,
//     marginTop: 10,
//     marginBottom: 20,
//     width: '90%',
//   },
//   buttonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   mapContainer: {
//     height: 300,
//     margin: 20,
//     borderRadius: 10,
//     overflow: 'hidden',
//   },
//   map: {
//     flex: 1,
//   },
//   navigationContainer: {
//     padding: 20,
//   },
//   navigationTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 10,
//     textAlign: 'center',
//   },
//   navigationText: {
//     fontSize: 16,
//     color: '#555',
//     marginBottom: 10,
//     textAlign: 'center',
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   modalContent: {
//     backgroundColor: 'white',
//     padding: 20,
//     borderRadius: 10,
//     width: '80%',
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 15,
//     textAlign: 'center',
//   },
//   modalText: {
//     fontSize: 16,
//     marginBottom: 10,
//     textAlign: 'center',
//   },
//   modalIncidentType: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//     textAlign: 'center',
//     marginVertical: 5,
//   },
//   modalAddress: {
//     fontSize: 14,
//     color: '#555',
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   modalButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   modalButton: {
//     padding: 12,
//     borderRadius: 8,
//     width: '48%',
//     alignItems: 'center',
//   },
//   modalAcceptButton: {
//     backgroundColor: '#34A853',
//   },
//   modalCancelButton: {
//     backgroundColor: '#EA4335',
//   },
//   modalButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// });

// export default DriverScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { db, auth } from '../firebase/firebaseConnection';
import { doc, updateDoc, onSnapshot, collection, query, where, getDoc } from 'firebase/firestore';
import MapView, { Marker } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';

const DriverScreen = ({ navigation }) => {
  const [assignedIncident, setAssignedIncident] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  const [driverData, setDriverData] = useState({
    name: '',
    vehicleNumber: '',
    contact: '',
    email: ''
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'Driver not authenticated');
      navigation.navigate('Login');
      return;
    }

    const fetchDriverData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const ambulanceDoc = await getDoc(doc(db, 'ambulances', user.uid));

        if (userDoc.exists() && ambulanceDoc.exists()) {
          const userData = userDoc.data();
          const ambulanceData = ambulanceDoc.data();
          
          setDriverData({
            name: userData.name || 'Driver',
            vehicleNumber: ambulanceData.vehicleNumber || 'Unknown',
            contact: ambulanceData.contact || 'N/A',
            email: userData.email
          });

          if (ambulanceData.latitude && ambulanceData.longitude) {
            setDriverLocation({
              latitude: ambulanceData.latitude,
              longitude: ambulanceData.longitude,
              driverId: user.uid
            });
          }
        } else {
          Alert.alert('Error', 'Driver profile not complete');
        }
      } catch (error) {
        console.error('Error fetching driver data:', error);
        Alert.alert('Error', 'Failed to load driver profile');
      }
    };

    fetchDriverData();

    const fetchAssignedIncidents = async () => {
      try {
        const incidentsRef = collection(db, 'incidents');
        const q = query(
          incidentsRef,
          where('status.driver', '==', 'assigned'),
          where('availableToAllDrivers', '==', true)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const incidentDoc = snapshot.docs[0];
            const incidentData = incidentDoc.data();
            setAssignedIncident({
              id: incidentDoc.id,
              ...incidentData
            });
          } else {
            setAssignedIncident(null);
          }
          setLoading(false);
        });

        const acceptedQuery = query(
          incidentsRef,
          where('assignedTo', '==', user.uid),
          where('status.driver', '==', 'accepted')
        );
        
        const acceptedUnsubscribe = onSnapshot(acceptedQuery, (acceptedSnapshot) => {
          if (!acceptedSnapshot.empty) {
            const incidentDoc = acceptedSnapshot.docs[0];
            const incidentData = incidentDoc.data();
            setAssignedIncident({
              id: incidentDoc.id,
              ...incidentData
            });
            setShowNavigation(true);
          }
        });

        return () => {
          unsubscribe();
          acceptedUnsubscribe();
        };
      } catch (error) {
        console.error('Error fetching incidents:', error);
        Alert.alert('Error', 'Failed to load incidents');
        setLoading(false);
      }
    };

    fetchAssignedIncidents();
  }, [navigation]);

  const handleAcceptIncident = async () => {
    if (!auth.currentUser?.uid || !driverData.name) {
      Alert.alert('Error', 'Driver information incomplete');
      return;
    }
    
    try {
      setLoading(true);
      
      const driverInfo = {
        name: driverData.name,
        vehicleNumber: driverData.vehicleNumber,
        contact: driverData.contact,
        email: driverData.email
      };

      const incidentRef = doc(db, 'incidents', assignedIncident.id);
      await updateDoc(incidentRef, {
        'status.driver': 'accepted',
        assignedTo: auth.currentUser.uid,
        acceptedAt: new Date().toISOString(),
        driverInfo: driverInfo,
        availableToAllDrivers: false
      });

      await updateDoc(doc(db, 'ambulances', auth.currentUser.uid), {
        status: 'busy',
        lastUpdated: new Date().toISOString()
      });

      setShowAcceptModal(false);
      setShowNavigation(true);
    } catch (error) {
      console.error('Error accepting incident:', error);
      Alert.alert('Error', 'Failed to accept incident');
    } finally {
      setLoading(false);
    }
  };

  const handleStartNavigation = () => {
    if (!driverLocation || !driverLocation.latitude || !driverLocation.longitude) {
      Alert.alert('Error', 'Driver location data not available');
      return;
    }

    if (!assignedIncident || !assignedIncident.latitude || !assignedIncident.longitude) {
      Alert.alert('Error', 'Incident location data not available');
      return;
    }

    navigation.navigate('DriverNavigation', {
      driverLocation: {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        driverId: driverLocation.driverId
      },
      destinationLocation: {
        latitude: assignedIncident.latitude,
        longitude: assignedIncident.longitude,
        address: assignedIncident.address,
        type: 'incident'
      },
      incidentType: assignedIncident.incidentType,
      incidentId: assignedIncident.id,
      isHospitalNavigation: false
    });
  };

  const handleCompleteIncident = async () => {
    try {
      setLoading(true);
      
      const incidentRef = doc(db, 'incidents', assignedIncident.id);
      await updateDoc(incidentRef, {
        'status.driver': 'completed',
        completedAt: new Date().toISOString()
      });

      await updateDoc(doc(db, 'ambulances', auth.currentUser.uid), {
        status: 'available',
        lastUpdated: new Date().toISOString()
      });

      // Navigate to the HospitalSelectionScreen with incident details
      navigation.navigate('HospitalSelection', {
        incidentId: assignedIncident.id,
        incidentDetails: {
          type: assignedIncident.incidentType,
          description: assignedIncident.description,
          address: assignedIncident.address,
          patientInfo: assignedIncident.patientInfo || {}
        },
        driverLocation: {
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          driverId: driverLocation.driverId
        }
      });

      setAssignedIncident(null);
      setShowNavigation(false);
    } catch (error) {
      console.error('Error completing incident:', error);
      Alert.alert('Error', 'Failed to complete incident');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.header}>
        <Text style={styles.headerText}>Ambulance Driver Dashboard</Text>
        {driverData.name && (
          <Text style={styles.driverInfo}>
            {driverData.name} - {driverData.vehicleNumber}
          </Text>
        )}
      </LinearGradient>

      {!assignedIncident ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="assignment" size={50} color="#888" />
          <Text style={styles.noDataText}>No assigned incidents</Text>
          <Text style={styles.subText}>Waiting for new assignments...</Text>
        </View>
      ) : !showNavigation ? (
        <>
          <View style={styles.incidentContainer}>
            <Text style={styles.incidentType}>{assignedIncident.incidentType}</Text>
            <Text style={styles.description}>{assignedIncident.description}</Text>
            <Text style={styles.address}>{assignedIncident.address}</Text>
            <Text style={styles.time}>
              Reported: {new Date(assignedIncident.createdAt).toLocaleString()}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={() => setShowAcceptModal(true)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Accept Incident</Text>
              )}
            </TouchableOpacity>
          </View>

          {driverLocation && assignedIncident.latitude && assignedIncident.longitude && (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: driverLocation.latitude,
                  longitude: driverLocation.longitude,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: driverLocation.latitude,
                    longitude: driverLocation.longitude
                  }}
                  title="Your Location"
                  pinColor="blue"
                />
                <Marker
                  coordinate={{
                    latitude: assignedIncident.latitude,
                    longitude: assignedIncident.longitude
                  }}
                  title="Incident Location"
                  pinColor="red"
                />
              </MapView>
            </View>
          )}
        </>
      ) : (
        <>
          <View style={styles.navigationContainer}>
            <Text style={styles.navigationTitle}>Active Incident</Text>
            <Text style={styles.navigationText}>
              {assignedIncident.incidentType}
            </Text>
            <Text style={styles.address}>{assignedIncident.address}</Text>

            {driverLocation && assignedIncident.latitude && assignedIncident.longitude && (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: driverLocation.latitude,
                    longitude: driverLocation.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: driverLocation.latitude,
                      longitude: driverLocation.longitude
                    }}
                    title="Your Location"
                    pinColor="blue"
                  />
                  <Marker
                    coordinate={{
                      latitude: assignedIncident.latitude,
                      longitude: assignedIncident.longitude
                    }}
                    title="Incident Location"
                    pinColor="red"
                  />
                </MapView>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, styles.navigateButton]}
              onPress={handleStartNavigation}
            >
              <Text style={styles.buttonText}>Navigate to Incident</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.completeButton]}
              onPress={handleCompleteIncident}
            >
              <Text style={styles.buttonText}>Mark as Completed</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Modal visible={showAcceptModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Acceptance</Text>
            <Text style={styles.modalText}>
              Are you sure you want to accept this incident?
            </Text>
            {assignedIncident && (
              <>
                <Text style={styles.modalIncidentType}>{assignedIncident.incidentType}</Text>
                <Text style={styles.modalAddress}>{assignedIncident.address}</Text>
              </>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowAcceptModal(false)}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalAcceptButton]}
                onPress={handleAcceptIncident}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>
                  {loading ? 'Accepting...' : 'Accept'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  driverInfo: {
    fontSize: 14,
    color: 'white',
    marginTop: 5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noDataText: {
    fontSize: 18,
    color: '#555',
    marginTop: 10,
  },
  subText: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },
  incidentContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  incidentType: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
  },
  address: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 10,
  },
  time: {
    fontSize: 14,
    color: '#777',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '60%',
  },
  acceptButton: {
    backgroundColor: '#34A853',
  },
  navigateButton: {
    backgroundColor: '#4285F4',
    marginHorizontal: 20,
    marginTop: 20,
    width: '90%',
  },
  completeButton: {
    backgroundColor: '#FBBC05',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    width: '90%',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mapContainer: {
    height: 300,
    margin: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  navigationContainer: {
    padding: 20,
  },
  navigationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  navigationText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalIncidentType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginVertical: 5,
  },
  modalAddress: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  modalAcceptButton: {
    backgroundColor: '#34A853',
  },
  modalCancelButton: {
    backgroundColor: '#EA4335',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DriverScreen;