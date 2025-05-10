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

// const PoliceScreen = ({ route }) => {
//   const [selectedRequest, setSelectedRequest] = useState(null);
//   const [showRequestModal, setShowRequestModal] = useState(false);
//   const [hospitalLocation, setHospitalLocation] = useState(null);
//   const [hospitalName, setHospitalName] = useState('');
//   const [hospitalId, setHospitalId] = useState(null);
//   const [presentCases, setPresentCases] = useState([]);
//   const [pastCases, setPastCases] = useState([]);
//   const [showNavigationForPatient, setShowNavigationForPatient] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigation = useNavigation();

//   useEffect(() => {
//     const fetchRequestsAndHospitalId = async () => {
//       const user = auth.currentUser;
//       if (!user) {
//         Alert.alert('Error', 'You are not logged in. Please log in to continue.');
//         setLoading(false);
//         return;
//       }

//       const requestsUnsub = onSnapshot(
//         collection(db, 'hospitalRequests'),
//         (snapshot) => {
//           if (snapshot.empty) {
//             Alert.alert('Info', 'No requests found');
//             setLoading(false);
//             return;
//           }

//           // Get hospitalId from first request
//           const firstRequest = snapshot.docs[0].data();
//           const hospitalIdFromRequest = firstRequest.hospitalId;

//           if (!hospitalIdFromRequest) {
//             Alert.alert('Error', 'No hospital ID found in requests');
//             setLoading(false);
//             return;
//           }

//           setHospitalId(hospitalIdFromRequest);
//           fetchHospitalDetails(hospitalIdFromRequest);

//           // Process requests
//           const today = new Date().toISOString().split('T')[0];
//           const present = [];
//           const past = [];

//           snapshot.forEach((doc) => {
//             const data = doc.data();
//             if (data.hospitalId === hospitalIdFromRequest) {
//               let requestDate;
//               try {
//                 requestDate = data.timestamp?.toDate()?.toISOString()?.split('T')[0];
//               } catch (error) {
//                 console.error('Error processing timestamp:', error);
//               }

//               if (requestDate === today) {
//                 present.push({ id: doc.id, ...data });
//               } else {
//                 past.push({ id: doc.id, ...data });
//               }
//             }
//           });

//           setPresentCases(present);
//           setPastCases(past);
//           setLoading(false);
//         },
//         (error) => {
//           console.error('Error fetching requests:', error);
//           Alert.alert('Error', 'Failed to fetch requests');
//           setLoading(false);
//         }
//       );

//       return () => requestsUnsub();
//     };

//     fetchRequestsAndHospitalId();
//   }, []);

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
//         setHospitalLocation({ 
//           latitude: data.latitude || 0,
//           longitude: data.longitude || 0 
//         });
//         setHospitalName(data.name || 'Hospital');
//       } else {
//         console.error('Hospital not found:', hospitalId);
//         Alert.alert('Error', 'Hospital details not found');
//       }
//     } catch (error) {
//       console.error('Error fetching hospital details:', error);
//       Alert.alert('Error', 'Failed to load hospital details');
//     }
//   };

//   const handleResponse = async (response, requestId) => {
//     try {
//       if (!requestId) {
//         console.error('Request ID is missing');
//         return;
//       }

//       const selectedRequest = presentCases.find((req) => req.id === requestId);
//       if (!selectedRequest) {
//         console.error('Request not found');
//         return;
//       }

//       await updateDoc(doc(db, 'hospitalRequests', requestId), {
//         status: response ? 'accepted' : 'rejected',
//       });

//       setShowRequestModal(false);

//       if (response) {
//         console.log("Navigation data:", {
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
//       Alert.alert('Error', 'Failed to update request status');
//     }
//   };

//   const handleShowNavigation = (patientId) => {
//     setShowNavigationForPatient(patientId === showNavigationForPatient ? null : patientId);
//   };

//   const navigateToPoliceNavigation = (request) => {
//     if (!request.latitude || !request.longitude) {
//       Alert.alert('Error', 'Invalid location data for this request');
//       return;
//     }

//     navigation.navigate('PoliceNavigation', {
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
//         <ActivityIndicator size="large" color="#FF0000" />
//         <Text style={styles.loadingText}>Loading cases...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <LinearGradient colors={['#FF0000', '#CC0000', '#990000']} style={styles.header}>
//         <Text style={styles.headerText}>🚓 Police Dashboard</Text>
//       </LinearGradient>

//       <ScrollView style={styles.requestsContainer}>
//         <Text style={styles.sectionHeader}>Present Cases</Text>
//         {presentCases.map((request) => (
//           <TouchableOpacity
//             key={request.id}
//             style={styles.requestItem}
//             onPress={() => {
//               setSelectedRequest(request);
//               setShowRequestModal(true);
//             }}
//           >
//             <Text style={styles.patientName}>{request.patientName || 'Unknown Patient'}</Text>
//             <Text style={styles.patientDetails}>Condition: {request.patientCondition || 'Not specified'}</Text>
//             <Text style={styles.patientDetails}>Age: {request.patientAge || 'Unknown'}</Text>
//           </TouchableOpacity>
//         ))}

//         <Text style={styles.sectionHeader}>Past Cases</Text>
//         {pastCases.map((request) => (
//           <View key={request.id} style={styles.requestItem}>
//             <Text style={styles.patientName}>{request.patientName || 'Unknown Patient'}</Text>
//             <Text style={styles.patientDetails}>Condition: {request.patientCondition || 'Not specified'}</Text>
//             <Text style={styles.patientDetails}>Age: {request.patientAge || 'Unknown'}</Text>
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
//                 onPress={() => navigateToPoliceNavigation(request)}
//               >
//                 <Text style={styles.navigateButtonText}>Navigate to Hospital</Text>
//               </TouchableOpacity>
//             )}
//           </View>
//         ))}
//       </ScrollView>

//       <Modal visible={showRequestModal} transparent animationType="slide">
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Patient Details</Text>
//             {selectedRequest && (
//               <>
//                 <Text style={styles.modalText}>Name: {selectedRequest.patientName || 'Unknown'}</Text>
//                 <Text style={styles.modalText}>Condition: {selectedRequest.patientCondition || 'Not specified'}</Text>
//                 <Text style={styles.modalText}>Age: {selectedRequest.patientAge || 'Unknown'}</Text>
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
//     backgroundColor: '#4285F4', // Blue color from HospitalScreen
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
//     backgroundColor: '#34A853', // Green color from HospitalScreen
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

// export default PoliceScreen;


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
//   doc,
//   getDoc,
//   Timestamp,
// } from 'firebase/firestore';
// import { db } from '../firebase/firebaseConnection';
// import { useNavigation } from '@react-navigation/native';
// import { auth } from '../firebase/firebaseConnection';
// import { LinearGradient } from 'expo-linear-gradient';

// const PoliceScreen = ({ route }) => {
//   const [selectedRequest, setSelectedRequest] = useState(null);
//   const [showRequestModal, setShowRequestModal] = useState(false);
//   const [hospitalLocation, setHospitalLocation] = useState(null);
//   const [hospitalName, setHospitalName] = useState('');
//   const [hospitalId, setHospitalId] = useState(null);
//   const [presentCases, setPresentCases] = useState([]);
//   const [pastCases, setPastCases] = useState([]);
//   const [showNavigationForPatient, setShowNavigationForPatient] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigation = useNavigation();

//   useEffect(() => {
//     const fetchRequestsAndHospitalId = async () => {
//       const user = auth.currentUser;
//       if (!user) {
//         Alert.alert('Error', 'You are not logged in. Please log in to continue.');
//         setLoading(false);
//         return;
//       }

//       const requestsUnsub = onSnapshot(
//         collection(db, 'hospitalRequests'),
//         (snapshot) => {
//           if (snapshot.empty) {
//             Alert.alert('Info', 'No requests found');
//             setLoading(false);
//             return;
//           }

//           // Get hospitalId from first request
//           const firstRequest = snapshot.docs[0].data();
//           const hospitalIdFromRequest = firstRequest.hospitalId;

//           if (!hospitalIdFromRequest) {
//             Alert.alert('Error', 'No hospital ID found in requests');
//             setLoading(false);
//             return;
//           }

//           setHospitalId(hospitalIdFromRequest);
//           fetchHospitalDetails(hospitalIdFromRequest);

//           // Process requests
//           const today = new Date();
//           today.setHours(0, 0, 0, 0);
          
//           const present = [];
//           const past = [];

//           snapshot.forEach((doc) => {
//             const data = doc.data();
//             if (data.hospitalId === hospitalIdFromRequest) {
//               try {
//                 // Handle both Timestamp objects and string timestamps
//                 let requestDate;
//                 const timestamp = data.timestamp || data.createdAt;
                
//                 if (timestamp instanceof Timestamp) {
//                   requestDate = timestamp.toDate();
//                 } else if (typeof timestamp === 'string') {
//                   requestDate = new Date(timestamp);
//                 } else if (timestamp?.toDate) {
//                   requestDate = timestamp.toDate();
//                 } else {
//                   console.warn('Unknown timestamp format:', timestamp);
//                   requestDate = new Date();
//                 }

//                 // Reset time portion for date comparison
//                 const normalizedRequestDate = new Date(requestDate);
//                 normalizedRequestDate.setHours(0, 0, 0, 0);

//                 if (normalizedRequestDate.getTime() === today.getTime()) {
//                   present.push({ id: doc.id, ...data });
//                 } else {
//                   past.push({ id: doc.id, ...data });
//                 }
//               } catch (error) {
//                 console.error('Error processing request date:', error);
//                 past.push({ id: doc.id, ...data });
//               }
//             }
//           });

//           setPresentCases(present);
//           setPastCases(past);
//           setLoading(false);
//         },
//         (error) => {
//           console.error('Error fetching requests:', error);
//           Alert.alert('Error', 'Failed to fetch requests');
//           setLoading(false);
//         }
//       );

//       return () => requestsUnsub();
//     };

//     fetchRequestsAndHospitalId();
//   }, []);

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
//         setHospitalLocation({ 
//           latitude: data.latitude || 0,
//           longitude: data.longitude || 0 
//         });
//         setHospitalName(data.name || 'Hospital');
//       } else {
//         console.error('Hospital not found:', hospitalId);
//         Alert.alert('Error', 'Hospital details not found');
//       }
//     } catch (error) {
//       console.error('Error fetching hospital details:', error);
//       Alert.alert('Error', 'Failed to load hospital details');
//     }
//   };

//   const handleShowNavigation = (patientId) => {
//     setShowNavigationForPatient(patientId === showNavigationForPatient ? null : patientId);
//   };

//   const navigateToPoliceNavigation = (request) => {
//     if (!request.latitude || !request.longitude) {
//       Alert.alert('Error', 'Invalid location data for this request');
//       return;
//     }

//     navigation.navigate('PoliceNavigation', {
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
//         <ActivityIndicator size="large" color="#FF0000" />
//         <Text style={styles.loadingText}>Loading cases...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <LinearGradient colors={['#FF0000', '#CC0000', '#990000']} style={styles.header}>
//         <Text style={styles.headerText}>🚓 Police Dashboard</Text>
//       </LinearGradient>

//       <ScrollView style={styles.requestsContainer}>
//         <Text style={styles.sectionHeader}>Present Cases</Text>
//         {presentCases.length > 0 ? (
//           presentCases.map((request) => (
//             <View key={request.id} style={styles.requestItem}>
//               <Text style={styles.patientName}>{request.patientName || 'Unknown Patient'}</Text>
//               <Text style={styles.patientDetails}>Condition: {request.patientCondition || 'Not specified'}</Text>
//               <Text style={styles.patientDetails}>Age: {request.patientAge || 'Unknown'}</Text>
//               <Text style={styles.patientDetails}>Status: {request.status || 'pending'}</Text>
//               <TouchableOpacity
//                 style={styles.showNavigationButton}
//                 onPress={() => handleShowNavigation(request.id)}
//               >
//                 <Text style={styles.showNavigationButtonText}>
//                   {showNavigationForPatient === request.id ? "Hide Navigation" : "Show Navigation"}
//                 </Text>
//               </TouchableOpacity>
//               {showNavigationForPatient === request.id && (
//                 <TouchableOpacity
//                   style={styles.navigateButton}
//                   onPress={() => navigateToPoliceNavigation(request)}
//                 >
//                   <Text style={styles.navigateButtonText}>Navigate to Hospital</Text>
//                 </TouchableOpacity>
//               )}
//             </View>
//           ))
//         ) : (
//           <Text style={styles.noCasesText}>No present cases today</Text>
//         )}

//         <Text style={styles.sectionHeader}>Past Cases</Text>
//         {pastCases.length > 0 ? (
//           pastCases.map((request) => (
//             <View key={request.id} style={styles.requestItem}>
//               <Text style={styles.patientName}>{request.patientName || 'Unknown Patient'}</Text>
//               <Text style={styles.patientDetails}>Condition: {request.patientCondition || 'Not specified'}</Text>
//               <Text style={styles.patientDetails}>Age: {request.patientAge || 'Unknown'}</Text>
//               <Text style={styles.patientDetails}>Status: {request.status || 'unknown'}</Text>
//               <TouchableOpacity
//                 style={styles.showNavigationButton}
//                 onPress={() => handleShowNavigation(request.id)}
//               >
//                 <Text style={styles.showNavigationButtonText}>
//                   {showNavigationForPatient === request.id ? "Hide Navigation" : "Show Navigation"}
//                 </Text>
//               </TouchableOpacity>
//               {showNavigationForPatient === request.id && (
//                 <TouchableOpacity
//                   style={styles.navigateButton}
//                   onPress={() => navigateToPoliceNavigation(request)}
//                 >
//                   <Text style={styles.navigateButtonText}>Navigate to Hospital</Text>
//                 </TouchableOpacity>
//               )}
//             </View>
//           ))
//         ) : (
//           <Text style={styles.noCasesText}>No past cases found</Text>
//         )}
//       </ScrollView>

//       {/* Removed the accept/reject modal since it's no longer needed */}
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
//   noCasesText: {
//     fontSize: 16,
//     color: '#777',
//     textAlign: 'center',
//     marginVertical: 10,
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

// export default PoliceScreen;

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
import { collection, onSnapshot, doc, updateDoc, query, where, getDocs, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/firebaseConnection';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';

const PoliceScreen = () => {
  const [activeTab, setActiveTab] = useState('incidents');
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showIncidentDetails, setShowIncidentDetails] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You are not logged in. Please log in to continue.');
        setLoading(false);
        return;
      }

      try {
        const incidentsRef = collection(db, 'incidents');
        const incidentsQuery = query(incidentsRef);
        
        const unsubscribe = onSnapshot(incidentsQuery, (snapshot) => {
          const incidentList = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            incidentList.push({
              id: doc.id,
              ...data
            });
          });
          setIncidents(incidentList);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const assignToAllDrivers = async (incident) => {
    try {
      setLoading(true);
      
      const usersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'driver')
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      if (usersSnapshot.empty) {
        Alert.alert('Error', 'No drivers found');
        return;
      }

      const incidentRef = doc(db, 'incidents', incident.id);
      await updateDoc(incidentRef, {
        'status.driver': 'assigned',
        assignedAt: new Date().toISOString(),
        availableToAllDrivers: true
      });

      const batch = [];
      usersSnapshot.forEach((userDoc) => {
        const notificationRef = doc(collection(db, 'users', userDoc.id, 'notifications'));
        batch.push(setDoc(notificationRef, {
          incidentId: incident.id,
          incidentType: incident.incidentType,
          address: incident.address,
          location: {
            latitude: incident.latitude,
            longitude: incident.longitude
          },
          createdAt: new Date().toISOString(),
          status: 'pending',
          read: false
        }));
      });

      await Promise.all(batch);
      Alert.alert('Success', 'Incident has been sent to all available drivers');
    } catch (error) {
      console.error('Error assigning to drivers:', error);
      Alert.alert('Error', 'Failed to assign incident to drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveIncident = async (incidentId) => {
    try {
      setLoading(true);
      const incidentRef = doc(db, 'incidents', incidentId);
      const incidentDoc = await getDoc(incidentRef);
      const incidentData = incidentDoc.data();
      
      await updateDoc(incidentRef, {
        'status.driver': 'resolved',
        resolvedAt: new Date().toISOString()
      });
      
      if (incidentData.assignedTo) {
        await updateDoc(doc(db, 'ambulances', incidentData.assignedTo), {
          status: 'available'
        });
      }
      
      setIncidents(prev => prev.filter(inc => inc.id !== incidentId));
    } catch (error) {
      console.error('Error resolving incident:', error);
      Alert.alert('Error', 'Failed to resolve incident');
    } finally {
      setLoading(false);
    }
  };

  const navigateToIncident = (incident) => {
    if (!incident.latitude || !incident.longitude) {
      Alert.alert('Error', 'Invalid incident location data');
      return;
    }

    navigation.navigate('PoliceNavigation', {
      incidentId: incident.id,
      isIncident: true
    });
  };

  const renderIncidentDetailsModal = () => (
    <Modal visible={showIncidentDetails} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Incident Details</Text>
          
          {selectedIncident && (
            <>
              <Text style={styles.incidentType}>{selectedIncident.incidentType}</Text>
              <Text style={styles.details}>{selectedIncident.description}</Text>
              <Text style={styles.address}>{selectedIncident.address}</Text>
              
              {selectedIncident.assignedTo && (
                <>
                  <Text style={styles.sectionTitle}>Assigned Driver:</Text>
                  <Text style={styles.details}>Name: {selectedIncident.driverInfo?.name}</Text>
                  <Text style={styles.details}>Vehicle: {selectedIncident.driverInfo?.vehicleNumber}</Text>
                </>
              )}
              
              <View style={styles.mapContainerSmall}>
                <MapView
                  style={styles.mapSmall}
                  initialRegion={{
                    latitude: selectedIncident.latitude,
                    longitude: selectedIncident.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: selectedIncident.latitude,
                      longitude: selectedIncident.longitude
                    }}
                    title="Incident Location"
                    pinColor="red"
                  />
                  {selectedIncident.driverLocation && (
                    <Marker
                      coordinate={{
                        latitude: selectedIncident.driverLocation.latitude,
                        longitude: selectedIncident.driverLocation.longitude
                      }}
                      title="Driver Location"
                      pinColor="blue"
                    />
                  )}
                  {selectedIncident.hospitalInfo && (
                    <Marker
                      coordinate={{
                        latitude: selectedIncident.hospitalInfo.latitude,
                        longitude: selectedIncident.hospitalInfo.longitude
                      }}
                      title="Hospital"
                      pinColor="green"
                    />
                  )}
                </MapView>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => setShowIncidentDetails(false)}
                >
                  <Text style={styles.modalButtonText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalNavigateButton]}
                  onPress={() => {
                    setShowIncidentDetails(false);
                    navigateToIncident(selectedIncident);
                  }}
                >
                  <Text style={styles.modalButtonText}>Navigate</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderIncidentsScreen = () => (
    <View style={styles.screenContainer}>
      <LinearGradient colors={['#FF0000', '#CC0000', '#990000']} style={styles.header}>
        <Text style={styles.headerText}>🚨 Incident Management</Text>
      </LinearGradient>

      <ScrollView style={styles.contentContainer}>
        {incidents.length > 0 ? (
          incidents.map((incident) => (
            <View key={incident.id} style={[
              styles.incidentItem,
              incident.status.driver === 'assigned' && styles.assignedIncident,
              incident.status.driver === 'accepted' && styles.acceptedIncident,
              incident.status.driver === 'completed' && styles.completedIncident
            ]}>
              <Text style={styles.details}>{incident.description}</Text>
              <Text style={styles.address}>{incident.address}</Text>
              
              {incident.assignedTo && (
                <Text style={styles.driverAssigned}>
                  Driver: {incident.driverInfo?.name || 'Unknown'} ({incident.driverInfo?.vehicleNumber || 'Unknown'})
                </Text>
              )}
              
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.detailsButton]}
                  onPress={() => {
                    setSelectedIncident(incident);
                    setShowIncidentDetails(true);
                  }}
                >
                  <MaterialIcons name="info" size={18} color="white" />
                  <Text style={styles.actionButtonText}> Details</Text>
                </TouchableOpacity>
                
                {incident.status.driver === 'pending' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.assignButton]}
                    onPress={() => assignToAllDrivers(incident)}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <MaterialIcons name="directions-car" size={18} color="white" />
                        <Text style={styles.actionButtonText}> Assign</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                
                {incident.status.driver !== 'completed' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.resolveButton]}
                    onPress={() => handleResolveIncident(incident.id)}
                  >
                    <MaterialIcons name="check" size={18} color="white" />
                    <Text style={styles.actionButtonText}> Resolve</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="error-outline" size={50} color="#888" />
            <Text style={styles.noDataText}>No incidents found</Text>
          </View>
        )}
      </ScrollView>
      
      {renderIncidentDetailsModal()}
    </View>
  );

  const renderDashboardScreen = () => (
    <View style={styles.screenContainer}>
      <LinearGradient colors={['#FF0000', '#CC0000', '#990000']} style={styles.header}>
        <Text style={styles.headerText}>🚓 Police Dashboard</Text>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {incidents.filter(i => i.status.driver === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {incidents.filter(i => i.status.driver === 'assigned').length}
          </Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {incidents.filter(i => i.status.driver === 'accepted').length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF0000" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {activeTab === 'incidents' ? renderIncidentsScreen() : renderDashboardScreen()}
      
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab('incidents')}
        >
          <MaterialIcons 
            name="warning" 
            size={24} 
            color={activeTab === 'incidents' ? '#FF0000' : '#888'} 
          />
          <Text style={[
            styles.tabButtonText,
            activeTab === 'incidents' && styles.activeTabText
          ]}>
            Incidents
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab('dashboard')}
        >
          <FontAwesome5 
            name="shield-alt" 
            size={20} 
            color={activeTab === 'dashboard' ? '#FF0000' : '#888'} 
          />
          <Text style={[
            styles.tabButtonText,
            activeTab === 'dashboard' && styles.activeTabText
          ]}>
            Dashboard
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  screenContainer: {
    flex: 1,
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
  contentContainer: {
    flex: 1,
    padding: 20,
    marginBottom: 70,
  },
  incidentItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assignedIncident: {
    borderLeftWidth: 5,
    borderLeftColor: '#4285F4',
  },
  acceptedIncident: {
    borderLeftWidth: 5,
    borderLeftColor: '#34A853',
  },
  completedIncident: {
    borderLeftWidth: 5,
    borderLeftColor: '#FBBC05',
  },
  details: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  address: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginVertical: 5,
  },
  driverAssigned: {
    fontSize: 13,
    color: '#4285F4',
    fontStyle: 'italic',
    marginVertical: 5,
  },
  noDataText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginTop: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  detailsButton: {
    backgroundColor: '#4285F4',
  },
  assignButton: {
    backgroundColor: '#34A853',
  },
  resolveButton: {
    backgroundColor: '#EA4335',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  tabBar: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    height: 70,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  tabButtonText: {
    fontSize: 12,
    marginTop: 5,
    color: '#888',
  },
  activeTabText: {
    color: '#FF0000',
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
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#FF0000',
  },
  incidentType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
  },
  mapContainerSmall: {
    height: 200,
    marginVertical: 15,
    borderRadius: 10,
    overflow: 'hidden',
  },
  mapSmall: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#EA4335',
  },
  modalNavigateButton: {
    backgroundColor: '#4285F4',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF0000',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
});

export default PoliceScreen;