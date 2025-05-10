// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
// import { collection, onSnapshot, updateDoc, doc, getDoc } from 'firebase/firestore';
// import { db } from '../firebase/firebaseConnection';
// import { useNavigation } from '@react-navigation/native';
// import { auth } from '../firebase/firebaseConnection'; // Import Firebase auth

// const HospitalScreen = ({ route }) => {
//   const [selectedRequest, setSelectedRequest] = useState(null);
//   const [showRequestModal, setShowRequestModal] = useState(false);
//   const [hospitalLocation, setHospitalLocation] = useState(null);
//   const [hospitalName, setHospitalName] = useState('');
//   const [hospitalId, setHospitalId] = useState(null); // Add hospitalId state
//   const navigation = useNavigation();

//   useEffect(() => {
//     // Fetch hospitalId from the user database after login
//     const fetchHospitalId = async () => {
//       const user = auth.currentUser;
//       if (user) {
//         const userRef = doc(db, 'users', user.uid);
//         const userDoc = await getDoc(userRef);

//         if (userDoc.exists()) {
//           const data = userDoc.data();
//           setHospitalId(data.hospitalId); // Set hospitalId from user profile
//           fetchHospitalDetails(data.hospitalId); // Fetch hospital details
//         } else {
//           console.error('User not found:', user.uid);
//         }
//       } else {
//         console.error('User is not logged in');
//       }
//     };

//     fetchHospitalId();

//     // Fetch pending requests for this hospital
//     const requestsUnsub = onSnapshot(collection(db, 'hospitalRequests'), (snapshot) => {
//       snapshot.forEach((doc) => {
//         const data = doc.data();
//         if (data && data.status === 'pending' && data.hospitalId === hospitalId) {
//           setSelectedRequest({ id: doc.id, ...data });
//           setShowRequestModal(true);
//         }
//       });
//     });

//     return () => requestsUnsub();
//   }, [hospitalId]); // Add hospitalId as a dependency

//   // Fetch hospital details from Firestore
//   const fetchHospitalDetails = async (hospitalId) => {
//     if (!hospitalId) {
//       console.error('Hospital ID is missing');
//       return;
//     }

//     try {
//       const hospitalRef = doc(db, 'hospitals', hospitalId);
//       const hospitalDoc = await getDoc(hospitalRef);

//       if (hospitalDoc.exists()) {
//         const data = hospitalDoc.data();
//         setHospitalLocation({ latitude: data.latitude, longitude: data.longitude });
//         setHospitalName(data.name);
//       } else {
//         console.error('Hospital not found:', hospitalId);
//       }
//     } catch (error) {
//       console.error('Error fetching hospital details:', error);
//     }
//   };

//   const handleResponse = async (response) => {
//     try {
//       if (!selectedRequest || !selectedRequest.id) {
//         console.error('Selected request is missing or incomplete');
//         return;
//       }

//       // Update the request status in Firestore
//       await updateDoc(doc(db, 'hospitalRequests', selectedRequest.id), {
//         status: response ? 'accepted' : 'rejected',
//       });

//       setShowRequestModal(false);

//       if (response) {
//         // Log coordinates before navigation
//         console.log("Driver Location (HospitalScreen):", {
//           driverId: selectedRequest.driverId,
//           latitude: selectedRequest.latitude,
//           longitude: selectedRequest.longitude,
//         });
//         console.log("Hospital Location (HospitalScreen):", hospitalLocation);

//         // Navigate to HospitalNavigationScreen with driverLocation and hospital details
//         navigation.navigate('HospitalNavigation', {
//           driverLocation: {
//             driverId: selectedRequest.driverId,
//             latitude: selectedRequest.latitude,
//             longitude: selectedRequest.longitude,
//           },
//           hospitalLocation,
//           hospitalName,
//         });
//       }
//     } catch (error) {
//       console.error('Error updating request:', error);
//       Alert.alert('Error', 'Failed to update request status.');
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>🏥 Hospital Dashboard</Text>

//       {/* Request Modal */}
//       <Modal visible={showRequestModal} transparent animationType="slide">
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>New Request</Text>
//             <Text style={styles.modalText}>
//               Driver {selectedRequest?.driverId} is requesting assistance for {selectedRequest?.patientName}.
//             </Text>
//             <View style={styles.modalButtons}>
//               <TouchableOpacity style={styles.acceptButton} onPress={() => handleResponse(true)}>
//                 <Text style={styles.modalButtonText}>Accept</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={styles.rejectButton} onPress={() => handleResponse(false)}>
//                 <Text style={styles.modalButtonText}>Reject</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     backgroundColor: '#f5f5f5',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//     color: '#333',
//     textAlign: 'center',
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
//     color: '#333',
//     textAlign: 'center',
//   },
//   modalText: {
//     fontSize: 16,
//     color: '#555',
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   modalButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//   },
//   acceptButton: {
//     backgroundColor: '#4CAF50',
//     padding: 10,
//     borderRadius: 5,
//   },
//   rejectButton: {
//     backgroundColor: '#F44336',
//     padding: 10,
//     borderRadius: 5,
//   },
//   modalButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// });

// export default HospitalScreen;

// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, ScrollView } from 'react-native';
// import { collection, onSnapshot, updateDoc, doc, getDoc } from 'firebase/firestore';
// import { db } from '../firebase/firebaseConnection';
// import { useNavigation } from '@react-navigation/native';
// import { auth } from '../firebase/firebaseConnection';
// import { LinearGradient } from 'expo-linear-gradient';

// const HospitalScreen = ({ route }) => {
//   const [selectedRequest, setSelectedRequest] = useState(null);
//   const [showRequestModal, setShowRequestModal] = useState(false);
//   const [hospitalLocation, setHospitalLocation] = useState(null);
//   const [hospitalName, setHospitalName] = useState('');
//   const [hospitalId, setHospitalId] = useState(null);
//   const [pendingRequests, setPendingRequests] = useState([]);
//   const [acceptedRequests, setAcceptedRequests] = useState([]);
//   const [showNavigationForPatient, setShowNavigationForPatient] = useState(null); // Track which patient's navigation is shown
//   const navigation = useNavigation();

//   useEffect(() => {
//     // Fetch hospitalId from the user database after login
//     const fetchHospitalId = async () => {
//       const user = auth.currentUser;
//       if (user) {
//         const userRef = doc(db, 'users', user.uid);
//         const userDoc = await getDoc(userRef);

//         if (userDoc.exists()) {
//           const data = userDoc.data();
//           setHospitalId(data.hospitalId); // Set hospitalId from user profile
//           fetchHospitalDetails(data.hospitalId); // Fetch hospital details
//         } else {
//           console.error('User not found:', user.uid);
//         }
//       } else {
//         console.error('User is not logged in');
//       }
//     };

//     fetchHospitalId();

//     // Fetch all requests for this hospital
//     const requestsUnsub = onSnapshot(collection(db, 'hospitalRequests'), (snapshot) => {
//       const pending = [];
//       const accepted = [];
//       snapshot.forEach((doc) => {
//         const data = doc.data();
//         if (data.hospitalId === hospitalId) {
//           if (data.status === 'pending') {
//             pending.push({ id: doc.id, ...data });
//           } else if (data.status === 'accepted') {
//             accepted.push({ id: doc.id, ...data });
//           }
//         }
//       });
//       setPendingRequests(pending);
//       setAcceptedRequests(accepted);
//     });

//     return () => requestsUnsub();
//   }, [hospitalId]);

//   // Fetch hospital details from Firestore
//   const fetchHospitalDetails = async (hospitalId) => {
//     if (!hospitalId) {
//       console.error('Hospital ID is missing');
//       return;
//     }

//     try {
//       const hospitalRef = doc(db, 'hospitals', hospitalId);
//       const hospitalDoc = await getDoc(hospitalRef);

//       if (hospitalDoc.exists()) {
//         const data = hospitalDoc.data();
//         setHospitalLocation({ latitude: data.latitude, longitude: data.longitude });
//         setHospitalName(data.name);
//       } else {
//         console.error('Hospital not found:', hospitalId);
//       }
//     } catch (error) {
//       console.error('Error fetching hospital details:', error);
//     }
//   };

//   const handleResponse = async (response, requestId) => {
//     try {
//       if (!requestId) {
//         console.error('Request ID is missing');
//         return;
//       }

//       // Update the request status in Firestore
//       await updateDoc(doc(db, 'hospitalRequests', requestId), {
//         status: response ? 'accepted' : 'rejected',
//       });

//       setShowRequestModal(false);

//       if (response) {
//         const selectedRequest = pendingRequests.find((req) => req.id === requestId);
//         if (selectedRequest) {
//           // Log coordinates before navigation
//           console.log("Driver Location (HospitalScreen):", {
//             driverId: selectedRequest.driverId,
//             latitude: selectedRequest.latitude,
//             longitude: selectedRequest.longitude,
//           });
//           console.log("Hospital Location (HospitalScreen):", hospitalLocation);
//         }
//       }
//     } catch (error) {
//       console.error('Error updating request:', error);
//       Alert.alert('Error', 'Failed to update request status.');
//     }
//   };

//   const handleShowNavigation = (patientId) => {
//     setShowNavigationForPatient(patientId === showNavigationForPatient ? null : patientId);
//   };

//   const navigateToHospitalNavigation = (request) => {
//     navigation.navigate('HospitalNavigation', {
//       driverLocation: {
//         driverId: request.driverId,
//         latitude: request.latitude,
//         longitude: request.longitude,
//       },
//       hospitalLocation,
//       hospitalName,
//     });
//   };

//   return (
//     <View style={styles.container}>
//       <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.header}>
//         <Text style={styles.headerText}>🏥 Hospital Dashboard</Text>
//       </LinearGradient>

//       {/* Display Pending Requests */}
//       <ScrollView style={styles.requestsContainer}>
//         <Text style={styles.sectionHeader}>Pending Requests</Text>
//         {pendingRequests.map((request) => (
//           <TouchableOpacity
//             key={request.id}
//             style={styles.requestItem}
//             onPress={() => {
//               setSelectedRequest(request);
//               setShowRequestModal(true);
//             }}
//           >
//             <Text style={styles.patientName}>{request.patientName}</Text>
//             <Text style={styles.patientDetails}>Condition: {request.patientCondition}</Text>
//             <Text style={styles.patientDetails}>Age: {request.patientAge}</Text>
//           </TouchableOpacity>
//         ))}

//         {/* Display Accepted Requests */}
//         <Text style={styles.sectionHeader}>Accepted Requests</Text>
//         {acceptedRequests.map((request) => (
//           <View key={request.id} style={styles.requestItem}>
//             <Text style={styles.patientName}>{request.patientName}</Text>
//             <Text style={styles.patientDetails}>Condition: {request.patientCondition}</Text>
//             <Text style={styles.patientDetails}>Age: {request.patientAge}</Text>
//             <TouchableOpacity
//               style={styles.showNavigationButton}
//               onPress={() => handleShowNavigation(request.id)}
//             >
//               <Text style={styles.showNavigationButtonText}>
//                 {showNavigationForPatient === request.id ? "Hide Navigation" : "Show Navigation"}
//               </Text>
//             </TouchableOpacity>
//             {showNavigationForPatient === request.id && (
//               <TouchableOpacity
//                 style={styles.navigateButton}
//                 onPress={() => navigateToHospitalNavigation(request)}
//               >
//                 <Text style={styles.navigateButtonText}>Navigate to Patient</Text>
//               </TouchableOpacity>
//             )}
//           </View>
//         ))}
//       </ScrollView>

//       {/* Request Modal */}
//       <Modal visible={showRequestModal} transparent animationType="slide">
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Patient Details</Text>
//             {selectedRequest && (
//               <>
//                 <Text style={styles.modalText}>Name: {selectedRequest.patientName}</Text>
//                 <Text style={styles.modalText}>Condition: {selectedRequest.patientCondition}</Text>
//                 <Text style={styles.modalText}>Age: {selectedRequest.patientAge}</Text>
//               </>
//             )}
//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.acceptButton]}
//                 onPress={() => handleResponse(true, selectedRequest?.id)}
//               >
//                 <Text style={styles.modalButtonText}>Accept</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.rejectButton]}
//                 onPress={() => handleResponse(false, selectedRequest?.id)}
//               >
//                 <Text style={styles.modalButtonText}>Reject</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   header: {
//     padding: 20,
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   headerText: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   requestsContainer: {
//     flex: 1,
//     padding: 20,
//   },
//   sectionHeader: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 10,
//     color: '#333',
//   },
//   requestItem: {
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
//   patientName: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   patientDetails: {
//     fontSize: 14,
//     color: '#555',
//     marginTop: 5,
//   },
//   showNavigationButton: {
//     backgroundColor: '#4285F4',
//     padding: 10,
//     borderRadius: 5,
//     marginTop: 10,
//     alignItems: 'center',
//   },
//   showNavigationButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   navigateButton: {
//     backgroundColor: '#34A853',
//     padding: 10,
//     borderRadius: 5,
//     marginTop: 10,
//     alignItems: 'center',
//   },
//   navigateButtonText: {
//     color: '#fff',
//     fontSize: 16,
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
//     color: '#333',
//     textAlign: 'center',
//   },
//   modalText: {
//     fontSize: 16,
//     color: '#555',
//     marginBottom: 10,
//     textAlign: 'center',
//   },
//   modalButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginTop: 20,
//   },
//   modalButton: {
//     padding: 10,
//     borderRadius: 5,
//     width: '40%',
//     alignItems: 'center',
//   },
//   acceptButton: {
//     backgroundColor: '#4CAF50',
//   },
//   rejectButton: {
//     backgroundColor: '#F44336',
//   },
//   modalButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// });

// export default HospitalScreen;

// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Modal,
//   Alert,
//   ScrollView,
//   ActivityIndicator,
// } from 'react-native';
// import {
//   collection,
//   onSnapshot,
//   updateDoc,
//   doc,
//   getDoc,
//   query,
//   where,
// } from 'firebase/firestore';
// import { db } from '../firebase/firebaseConnection';
// import { useNavigation } from '@react-navigation/native';
// import { auth } from '../firebase/firebaseConnection';
// import { LinearGradient } from 'expo-linear-gradient';

// const HospitalScreen = ({ route }) => {
//   const [selectedRequest, setSelectedRequest] = useState(null);
//   const [showRequestModal, setShowRequestModal] = useState(false);
//   const [hospitalLocation, setHospitalLocation] = useState(null);
//   const [hospitalName, setHospitalName] = useState('');
//   const [hospitalId, setHospitalId] = useState(null);
//   const [pendingRequests, setPendingRequests] = useState([]);
//   const [acceptedRequests, setAcceptedRequests] = useState([]);
//   const [showNavigationForPatient, setShowNavigationForPatient] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigation = useNavigation();

//   useEffect(() => {
//     // Fetch hospitalId from the user database after login
//     const fetchHospitalId = async () => {
//       const user = auth.currentUser;
//       if (user) {
//         const userRef = doc(db, 'users', user.uid);
//         const userDoc = await getDoc(userRef);

//         if (userDoc.exists()) {
//           const data = userDoc.data();
//           setHospitalId(data.hospitalId);
//           fetchHospitalDetails(data.hospitalId);
//         } else {
//           console.error('User not found:', user.uid);
//         }
//       } else {
//         console.error('User is not logged in');
//       }
//     };

//     fetchHospitalId();

//     // Fetch all requests for this hospital
//     const requestsUnsub = onSnapshot(
//       query(collection(db, 'hospitalRequests'), where('hospitalId', '==', hospitalId)),
//       (snapshot) => {
//         const pending = [];
//         const accepted = [];
//         snapshot.forEach((doc) => {
//           const data = doc.data();
//           if (data.status === 'pending') {
//             pending.push({ id: doc.id, ...data }); // Use doc.id as the unique key
//           } else if (data.status === 'accepted') {
//             accepted.push({ id: doc.id, ...data }); // Use doc.id as the unique key
//           }
//         });
//         setPendingRequests(pending);
//         setAcceptedRequests(accepted);
//         setLoading(false);
//       }
//     );

//     return () => requestsUnsub();
//   }, [hospitalId]);

//   // Fetch hospital details from Firestore
//   const fetchHospitalDetails = async (hospitalId) => {
//     if (!hospitalId) {
//       console.error('Hospital ID is missing');
//       return;
//     }

//     try {
//       const hospitalRef = doc(db, 'hospitals', hospitalId);
//       const hospitalDoc = await getDoc(hospitalRef);

//       if (hospitalDoc.exists()) {
//         const data = hospitalDoc.data();
//         setHospitalLocation({ latitude: data.latitude, longitude: data.longitude });
//         setHospitalName(data.name);
//       } else {
//         console.error('Hospital not found:', hospitalId);
//       }
//     } catch (error) {
//       console.error('Error fetching hospital details:', error);
//     }
//   };

//   const handleResponse = async (response, requestId) => {
//     try {
//       if (!requestId) {
//         console.error('Request ID is missing');
//         return;
//       }

//       // Find the selected request
//       const selectedRequest = pendingRequests.find((req) => req.id === requestId);
//       if (!selectedRequest) {
//         console.error('Request not found');
//         return;
//       }

//       // Update the request status in Firestore
//       await updateDoc(doc(db, 'hospitalRequests', requestId), {
//         status: response ? 'accepted' : 'rejected',
//       });

//       setShowRequestModal(false);

//       if (response) {
//         // Log coordinates before navigation
//         console.log("Driver Location (HospitalScreen):", {
//           driverId: selectedRequest.driverId,
//           latitude: selectedRequest.latitude,
//           longitude: selectedRequest.longitude,
//         });
//         console.log("Hospital Location (HospitalScreen):", hospitalLocation);
//       }
//     } catch (error) {
//       console.error('Error updating request:', error);
//       Alert.alert('Error', 'Failed to update request status.');
//     }
//   };

//   const handleShowNavigation = (patientId) => {
//     setShowNavigationForPatient(patientId === showNavigationForPatient ? null : patientId);
//   };

//   const navigateToHospitalNavigation = (request) => {
//     navigation.navigate('HospitalNavigation', {
//       driverLocation: {
//         driverId: request.driverId,
//         latitude: request.latitude,
//         longitude: request.longitude,
//       },
//       hospitalLocation,
//       hospitalName,
//     });
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#4285F4" />
//         <Text style={styles.loadingText}>Loading requests...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.header}>
//         <Text style={styles.headerText}>🏥 Hospital Dashboard</Text>
//       </LinearGradient>

//       {/* Display Pending Requests */}
//       <ScrollView style={styles.requestsContainer}>
//         <Text style={styles.sectionHeader}>Pending Requests</Text>
//         {pendingRequests.map((request) => (
//           <TouchableOpacity
//             key={request.id} // Use request.id as the unique key
//             style={styles.requestItem}
//             onPress={() => {
//               setSelectedRequest(request);
//               setShowRequestModal(true);
//             }}
//           >
//             <Text style={styles.patientName}>{request.patientName}</Text>
//             <Text style={styles.patientDetails}>Condition: {request.patientCondition}</Text>
//             <Text style={styles.patientDetails}>Age: {request.patientAge}</Text>
//           </TouchableOpacity>
//         ))}

//         {/* Display Accepted Requests */}
//         <Text style={styles.sectionHeader}>Accepted Requests</Text>
//         {acceptedRequests.map((request) => (
//           <View key={request.id} style={styles.requestItem}>
//             <Text style={styles.patientName}>{request.patientName}</Text>
//             <Text style={styles.patientDetails}>Condition: {request.patientCondition}</Text>
//             <Text style={styles.patientDetails}>Age: {request.patientAge}</Text>
//             <TouchableOpacity
//               style={styles.showNavigationButton}
//               onPress={() => handleShowNavigation(request.id)}
//             >
//               <Text style={styles.showNavigationButtonText}>
//                 {showNavigationForPatient === request.id ? "Hide Navigation" : "Show Navigation"}
//               </Text>
//             </TouchableOpacity>
//             {showNavigationForPatient === request.id && (
//               <TouchableOpacity
//                 style={styles.navigateButton}
//                 onPress={() => navigateToHospitalNavigation(request)}
//               >
//                 <Text style={styles.navigateButtonText}>Navigate to Patient</Text>
//               </TouchableOpacity>
//             )}
//           </View>
//         ))}
//       </ScrollView>

//       {/* Request Modal */}
//       <Modal visible={showRequestModal} transparent animationType="slide">
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Patient Details</Text>
//             {selectedRequest && (
//               <>
//                 <Text style={styles.modalText}>Name: {selectedRequest.patientName}</Text>
//                 <Text style={styles.modalText}>Condition: {selectedRequest.patientCondition}</Text>
//                 <Text style={styles.modalText}>Age: {selectedRequest.patientAge}</Text>
//               </>
//             )}
//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.acceptButton]}
//                 onPress={() => handleResponse(true, selectedRequest?.id)}
//               >
//                 <Text style={styles.modalButtonText}>Accept</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.rejectButton]}
//                 onPress={() => handleResponse(false, selectedRequest?.id)}
//               >
//                 <Text style={styles.modalButtonText}>Reject</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   header: {
//     padding: 20,
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   headerText: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   requestsContainer: {
//     flex: 1,
//     padding: 20,
//   },
//   sectionHeader: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 10,
//     color: '#333',
//   },
//   requestItem: {
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
//   patientName: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   patientDetails: {
//     fontSize: 14,
//     color: '#555',
//     marginTop: 5,
//   },
//   showNavigationButton: {
//     backgroundColor: '#4285F4',
//     padding: 10,
//     borderRadius: 5,
//     marginTop: 10,
//     alignItems: 'center',
//   },
//   showNavigationButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   navigateButton: {
//     backgroundColor: '#34A853',
//     padding: 10,
//     borderRadius: 5,
//     marginTop: 10,
//     alignItems: 'center',
//   },
//   navigateButtonText: {
//     color: '#fff',
//     fontSize: 16,
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
//     color: '#333',
//     textAlign: 'center',
//   },
//   modalText: {
//     fontSize: 16,
//     color: '#555',
//     marginBottom: 10,
//     textAlign: 'center',
//   },
//   modalButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginTop: 20,
//   },
//   modalButton: {
//     padding: 10,
//     borderRadius: 5,
//     width: '40%',
//     alignItems: 'center',
//   },
//   acceptButton: {
//     backgroundColor: '#4CAF50',
//   },
//   rejectButton: {
//     backgroundColor: '#F44336',
//   },
//   modalButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
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
// });

// export default HospitalScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConnection';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../firebase/firebaseConnection';
import { LinearGradient } from 'expo-linear-gradient';

const HospitalScreen = ({ route }) => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [hospitalLocation, setHospitalLocation] = useState(null);
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalId, setHospitalId] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [showNavigationForPatient, setShowNavigationForPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchHospitalId = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setHospitalId(data.hospitalId);
          fetchHospitalDetails(data.hospitalId);
        } else {
          console.error('User not found:', user.uid);
          setLoading(false);
        }
      } else {
        console.error('User is not logged in');
        setLoading(false);
      }
    };

    fetchHospitalId();
  }, []);

  useEffect(() => {
    if (!hospitalId) return;

    const unsubscribe = onSnapshot(
      query(
        collection(db, 'incidents'),
        where('hospitalInfo.id', '==', hospitalId),
        where('status.hospital', 'in', ['requested', 'accepted'])
      ),
      (snapshot) => {
        const pending = [];
        const accepted = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status.hospital === 'requested') {
            pending.push({ 
              id: doc.id,
              ...data,
              patientName: data.patientInfo?.name || 'Unknown',
              patientCondition: data.patientInfo?.condition || 'Not specified',
              patientAge: data.patientInfo?.age || 'Not specified',
              driverId: data.assignedTo
            });
          } else if (data.status.hospital === 'accepted') {
            accepted.push({ 
              id: doc.id,
              ...data,
              patientName: data.patientInfo?.name || 'Unknown',
              patientCondition: data.patientInfo?.condition || 'Not specified',
              patientAge: data.patientInfo?.age || 'Not specified',
              driverId: data.assignedTo
            });
          }
        });

        setPendingRequests(pending);
        setAcceptedRequests(accepted);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [hospitalId]);

  const fetchHospitalDetails = async (hospitalId) => {
    if (!hospitalId) {
      console.error('Hospital ID is missing');
      return;
    }

    try {
      const hospitalRef = doc(db, 'hospitals', hospitalId);
      const hospitalDoc = await getDoc(hospitalRef);

      if (hospitalDoc.exists()) {
        const data = hospitalDoc.data();
        if (!data.latitude || !data.longitude) {
          throw new Error('Hospital location data is incomplete');
        }
        setHospitalLocation({ 
          latitude: data.latitude, 
          longitude: data.longitude 
        });
        setHospitalName(data.name);
      } else {
        console.error('Hospital not found:', hospitalId);
      }
    } catch (error) {
      console.error('Error fetching hospital details:', error);
      Alert.alert('Error', 'Failed to load hospital location data');
    }
  };

  const handleResponse = async (response, requestId) => {
    try {
      if (!requestId) {
        console.error('Request ID is missing');
        return;
      }

      const incidentRef = doc(db, 'incidents', requestId);
      await updateDoc(incidentRef, {
        'status.hospital': response ? 'accepted' : 'rejected',
        hospitalRespondedAt: new Date().toISOString()
      });

      setShowRequestModal(false);

      if (response) {
        // Find the accepted request
        const acceptedRequest = pendingRequests.find(req => req.id === requestId);
        if (acceptedRequest && hospitalLocation) {
          navigation.navigate('HospitalNavigation', {
            driverLocation: {
              latitude: acceptedRequest.latitude,
              longitude: acceptedRequest.longitude,
              driverId: acceptedRequest.driverId
            },
            hospitalLocation: hospitalLocation,
            hospitalName: hospitalName,
            incidentId: requestId
          });
        }
      }
    } catch (error) {
      console.error('Error updating request:', error);
      Alert.alert('Error', 'Failed to update request status.');
    }
  };

  const handleShowNavigation = (requestId) => {
    setShowNavigationForPatient(requestId === showNavigationForPatient ? null : requestId);
  };

  const navigateToHospitalNavigation = (request) => {
    if (!hospitalLocation || !hospitalLocation.latitude || !hospitalLocation.longitude) {
      Alert.alert('Error', 'Hospital location data is missing');
      return;
    }

    if (!request.latitude || !request.longitude) {
      Alert.alert('Error', 'Driver location data is missing');
      return;
    }

    navigation.navigate('HospitalNavigation', {
      driverLocation: {
        latitude: request.latitude,
        longitude: request.longitude,
        driverId: request.driverId
      },
      hospitalLocation: hospitalLocation,
      hospitalName: hospitalName,
      incidentId: request.id
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.header}>
        <Text style={styles.headerText}>🏥 Hospital Dashboard</Text>
      </LinearGradient>

      <ScrollView style={styles.requestsContainer}>
        <Text style={styles.sectionHeader}>Pending Requests</Text>
        {pendingRequests.length > 0 ? (
          pendingRequests.map((request) => (
            <TouchableOpacity
              key={request.id}
              style={styles.requestItem}
              onPress={() => {
                setSelectedRequest(request);
                setShowRequestModal(true);
              }}
            >
              <Text style={styles.patientName}>{request.patientName}</Text>
              <Text style={styles.patientDetails}>Condition: {request.patientCondition}</Text>
              <Text style={styles.patientDetails}>Age: {request.patientAge}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noRequestsText}>No pending requests</Text>
        )}

        <Text style={styles.sectionHeader}>Accepted Requests</Text>
        {acceptedRequests.length > 0 ? (
          acceptedRequests.map((request) => (
            <View key={request.id} style={styles.requestItem}>
              <Text style={styles.patientName}>{request.patientName}</Text>
              <Text style={styles.patientDetails}>Condition: {request.patientCondition}</Text>
              <Text style={styles.patientDetails}>Age: {request.patientAge}</Text>
              <TouchableOpacity
                style={styles.showNavigationButton}
                onPress={() => handleShowNavigation(request.id)}
              >
                <Text style={styles.showNavigationButtonText}>
                  {showNavigationForPatient === request.id ? "Hide Navigation" : "Show Navigation"}
                </Text>
              </TouchableOpacity>
              {showNavigationForPatient === request.id && (
                <TouchableOpacity
                  style={styles.navigateButton}
                  onPress={() => navigateToHospitalNavigation(request)}
                >
                  <Text style={styles.navigateButtonText}>Navigate to Patient</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.noRequestsText}>No accepted requests</Text>
        )}
      </ScrollView>

      <Modal visible={showRequestModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Patient Details</Text>
            {selectedRequest && (
              <>
                <Text style={styles.modalText}>Name: {selectedRequest.patientName}</Text>
                <Text style={styles.modalText}>Condition: {selectedRequest.patientCondition}</Text>
                <Text style={styles.modalText}>Age: {selectedRequest.patientAge}</Text>
              </>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.acceptButton]}
                onPress={() => handleResponse(true, selectedRequest?.id)}
              >
                <Text style={styles.modalButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.rejectButton]}
                onPress={() => handleResponse(false, selectedRequest?.id)}
              >
                <Text style={styles.modalButtonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  requestsContainer: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  requestItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  patientDetails: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  noRequestsText: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 10,
  },
  showNavigationButton: {
    backgroundColor: '#4285F4',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  showNavigationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  navigateButton: {
    backgroundColor: '#34A853',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  navigateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    width: '40%',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
});

export default HospitalScreen;