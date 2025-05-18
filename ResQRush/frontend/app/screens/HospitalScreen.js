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
import app from "../firebase/firebaseConnection";
import { getAuth, signOut } from "firebase/auth";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
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
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
          <FontAwesome5 name="sign-out-alt" size={24} color={"#ffffff"} />
        </TouchableOpacity>
      ),
    });
    fetchHospitalId();
  }, [navigation]);

  const handleLogout = async () => {
    try {
      const auth = getAuth(app);
      await signOut(auth);
      navigation.replace("Login");
      console.log("User logged out");
    } catch (error) {
      Alert.alert("Logout Error", error.message);
    }
  };
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