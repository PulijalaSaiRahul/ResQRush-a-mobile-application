// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TextInput,
//   TouchableOpacity,
//   Alert,
//   ActivityIndicator,
//   ScrollView,
//   KeyboardAvoidingView,
//   Platform,
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import * as Location from 'expo-location';
// import { db } from '../firebase/firebaseConnection';
// import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// const UserScreen = ({ navigation }) => {
//   const [incidentType, setIncidentType] = useState('');
//   const [description, setDescription] = useState('');
//   const [location, setLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [locationLoading, setLocationLoading] = useState(false);
//   const [errorMsg, setErrorMsg] = useState(null);

//   const incidentTypes = [
//     'Accident',
//     'Medical Emergency',
//     'Fire',
//     'Crime',
//     'Natural Disaster',
//     'Other',
//   ];

//   useEffect(() => {
//     (async () => {
//       setLocationLoading(true);
//       let { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== 'granted') {
//         setErrorMsg('Permission to access location was denied');
//         setLocationLoading(false);
//         return;
//       }

//       try {
//         let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
//         setLocation(location.coords);
        
//         // Get readable address
//         let geocode = await Location.reverseGeocodeAsync(location.coords);
//         if (geocode[0]) {
//           const { street, city, region, postalCode, country } = geocode[0];
//           const readableAddress = `${street ? street + ', ' : ''}${city ? city + ', ' : ''}${region ? region + ' ' : ''}${postalCode || ''}, ${country || ''}`;
//           setAddress(readableAddress);
//         }
//       } catch (error) {
//         setErrorMsg('Error getting location: ' + error.message);
//       } finally {
//         setLocationLoading(false);
//       }
//     })();
//   }, []);

//   const handleSubmit = async () => {
//     if (!incidentType) {
//       Alert.alert('Error', 'Please select an incident type');
//       return;
//     }

//     if (!description) {
//       Alert.alert('Error', 'Please provide a description');
//       return;
//     }

//     if (!location) {
//       Alert.alert('Error', 'Location not available. Please try again.');
//       return;
//     }

//     setLoading(true);

//     try {
//       // Save report to Firestore
//       const docRef = await addDoc(collection(db, 'incidents'), {
//         incidentType,
//         description,
//         location: {
//           latitude: location.latitude,
//           longitude: location.longitude,
//         },
//         address,
//         status: 'pending',
//         createdAt: serverTimestamp(),
//       });

//       console.log('Report submitted with ID: ', docRef.id);
      
//       // Navigate to confirmation or pass data to PoliceScreen
//       navigation.navigate('PoliceScreen', {
//         incidentLocation: {
//           latitude: location.latitude,
//           longitude: location.longitude,
//         },
//         incidentDetails: {
//           type: incidentType,
//           description,
//           address,
//         },
//       });
//     } catch (error) {
//       console.error('Error submitting report: ', error);
//       Alert.alert('Error', 'Failed to submit report. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       style={styles.container}
//     >
//       <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.header}>
//         <Text style={styles.headerText}>Report Emergency</Text>
//       </LinearGradient>

//       <ScrollView contentContainerStyle={styles.scrollContainer}>
//         <View style={styles.formContainer}>
//           {/* Location Display */}
//           <View style={styles.locationContainer}>
//             <Text style={styles.sectionTitle}>Your Location</Text>
//             {locationLoading ? (
//               <ActivityIndicator size="small" color="#3b5998" />
//             ) : errorMsg ? (
//               <Text style={styles.errorText}>{errorMsg}</Text>
//             ) : location ? (
//               <>
//                 <Text style={styles.locationText}>
//                   Latitude: {location.latitude.toFixed(6)}
//                 </Text>
//                 <Text style={styles.locationText}>
//                   Longitude: {location.longitude.toFixed(6)}
//                 </Text>
//                 {address ? (
//                   <Text style={styles.addressText}>{address}</Text>
//                 ) : null}
//               </>
//             ) : (
//               <Text style={styles.errorText}>Location not available</Text>
//             )}
//           </View>

//           {/* Incident Type Selection */}
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Incident Type</Text>
//             <View style={styles.incidentTypeContainer}>
//               {incidentTypes.map((type) => (
//                 <TouchableOpacity
//                   key={type}
//                   style={[
//                     styles.incidentTypeButton,
//                     incidentType === type && styles.selectedIncidentType,
//                   ]}
//                   onPress={() => setIncidentType(type)}
//                 >
//                   <Text
//                     style={[
//                       styles.incidentTypeText,
//                       incidentType === type && styles.selectedIncidentTypeText,
//                     ]}
//                   >
//                     {type}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           </View>

//           {/* Description Input */}
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Description</Text>
//             <TextInput
//               style={styles.descriptionInput}
//               placeholder="Provide details about the incident..."
//               placeholderTextColor="#999"
//               multiline
//               numberOfLines={4}
//               value={description}
//               onChangeText={setDescription}
//             />
//           </View>

//           {/* Additional Details */}
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Additional Information</Text>
//             <TextInput
//               style={styles.additionalInput}
//               placeholder="Any other relevant information (optional)..."
//               placeholderTextColor="#999"
//               multiline
//               numberOfLines={2}
//             />
//           </View>
//         </View>
//       </ScrollView>

//       {/* Submit Button */}
//       <View style={styles.buttonContainer}>
//         <TouchableOpacity
//           style={styles.submitButton}
//           onPress={handleSubmit}
//           disabled={loading || locationLoading}
//         >
//           {loading ? (
//             <ActivityIndicator color="white" />
//           ) : (
//             <Text style={styles.submitButtonText}>Submit Report</Text>
//           )}
//         </TouchableOpacity>
//       </View>
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     paddingBottom: 20,
//   },
//   header: {
//     paddingTop: 50,
//     paddingBottom: 20,
//     paddingHorizontal: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   headerText: {
//     color: 'white',
//     fontSize: 24,
//     fontWeight: 'bold',
//   },
//   formContainer: {
//     padding: 20,
//   },
//   section: {
//     marginBottom: 25,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     marginBottom: 10,
//     color: '#333',
//   },
//   locationContainer: {
//     backgroundColor: '#fff',
//     padding: 15,
//     borderRadius: 10,
//     marginBottom: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 2,
//   },
//   locationText: {
//     fontSize: 14,
//     color: '#555',
//     marginBottom: 3,
//   },
//   addressText: {
//     fontSize: 14,
//     color: '#333',
//     fontWeight: '500',
//     marginTop: 5,
//   },
//   errorText: {
//     color: 'red',
//     fontSize: 14,
//   },
//   incidentTypeContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },
//   incidentTypeButton: {
//     backgroundColor: '#f0f0f0',
//     padding: 12,
//     borderRadius: 8,
//     marginBottom: 10,
//     width: '48%',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#ddd',
//   },
//   selectedIncidentType: {
//     backgroundColor: '#3b5998',
//     borderColor: '#3b5998',
//   },
//   incidentTypeText: {
//     color: '#333',
//     fontWeight: '500',
//   },
//   selectedIncidentTypeText: {
//     color: 'white',
//   },
//   descriptionInput: {
//     backgroundColor: '#fff',
//     minHeight: 100,
//     borderRadius: 10,
//     padding: 15,
//     fontSize: 16,
//     textAlignVertical: 'top',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 2,
//   },
//   additionalInput: {
//     backgroundColor: '#fff',
//     minHeight: 60,
//     borderRadius: 10,
//     padding: 15,
//     fontSize: 16,
//     textAlignVertical: 'top',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 2,
//   },
//   buttonContainer: {
//     padding: 20,
//   },
//   submitButton: {
//     backgroundColor: '#3b5998',
//     padding: 16,
//     borderRadius: 10,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   submitButtonText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
// });

// export default UserScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { db } from '../firebase/firebaseConnection';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const UserScreen = ({ navigation }) => {
  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState('');

  const incidentTypes = [
    'Accident',
    'Medical Emergency',
    'Fire',
    'Crime',
    'Natural Disaster',
    'Other',
  ];

  useEffect(() => {
    (async () => {
      setLocationLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLocationLoading(false);
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setLocation(location.coords);
        
        // Get readable address
        let geocode = await Location.reverseGeocodeAsync(location.coords);
        if (geocode[0]) {
          const { street, city, region, postalCode, country } = geocode[0];
          const readableAddress = `${street ? street + ', ' : ''}${city ? city + ', ' : ''}${region ? region + ' ' : ''}${postalCode || ''}, ${country || ''}`;
          setAddress(readableAddress);
        }
      } catch (error) {
        setErrorMsg('Error getting location: ' + error.message);
      } finally {
        setLocationLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!incidentType) {
      Alert.alert('Error', 'Please select an incident type');
      return;
    }

    if (!description) {
      Alert.alert('Error', 'Please provide a description');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Location not available. Please try again.');
      return;
    }

    setLoading(true);

    try {
      // Save report to Firestore with the new status structure
      const docRef = await addDoc(collection(db, 'incidents'), {
        createdAt: new Date().toISOString(),
        incidentType,
        description,
        latitude: location.latitude,
        longitude: location.longitude,
        status: {
          driver: 'pending',  // Initial status for driver
          hospital: 'pending' // Initial status for hospital
        },
        address: address || null,
      });

      console.log('Report submitted with ID: ', docRef.id);
      Alert.alert('Success', 'Emergency report submitted successfully!');
      
      // Reset form after successful submission
      setIncidentType('');
      setDescription('');
      setAdditionalInfo('');
    } catch (error) {
      console.error('Error submitting report: ', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.header}>
        <Text style={styles.headerText}>Report Emergency</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          {/* Location Display */}
          <View style={styles.locationContainer}>
            <Text style={styles.sectionTitle}>Your Location</Text>
            {locationLoading ? (
              <ActivityIndicator size="small" color="#3b5998" />
            ) : errorMsg ? (
              <Text style={styles.errorText}>{errorMsg}</Text>
            ) : location ? (
              <>
                <Text style={styles.locationText}>
                  Latitude: {location.latitude.toFixed(6)}
                </Text>
                <Text style={styles.locationText}>
                  Longitude: {location.longitude.toFixed(6)}
                </Text>
                {address ? (
                  <Text style={styles.addressText}>{address}</Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.errorText}>Location not available</Text>
            )}
          </View>

          {/* Incident Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Incident Type</Text>
            <View style={styles.incidentTypeContainer}>
              {incidentTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.incidentTypeButton,
                    incidentType === type && styles.selectedIncidentType,
                  ]}
                  onPress={() => setIncidentType(type)}
                >
                  <Text
                    style={[
                      styles.incidentTypeText,
                      incidentType === type && styles.selectedIncidentTypeText,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Provide details about the incident..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Additional Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            <TextInput
              style={styles.additionalInput}
              placeholder="Any other relevant information (optional)..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={2}
              value={additionalInfo}
              onChangeText={setAdditionalInfo}
            />
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading || locationLoading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Report</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  headerText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  formContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  locationContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  locationText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 3,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginTop: 5,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
  },
  incidentTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  incidentTypeButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedIncidentType: {
    backgroundColor: '#3b5998',
    borderColor: '#3b5998',
  },
  incidentTypeText: {
    color: '#333',
    fontWeight: '500',
  },
  selectedIncidentTypeText: {
    color: 'white',
  },
  descriptionInput: {
    backgroundColor: '#fff',
    minHeight: 100,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  additionalInput: {
    backgroundColor: '#fff',
    minHeight: 60,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonContainer: {
    padding: 20,
  },
  submitButton: {
    backgroundColor: '#3b5998',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default UserScreen;