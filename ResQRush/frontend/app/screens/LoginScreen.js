// import React, { useState } from 'react';
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
// import { auth, db } from '../firebase/firebaseConnection'; // Import Firebase Auth and Firestore
// import { signInWithEmailAndPassword } from 'firebase/auth'; // Firebase Auth method
// import { collection, query, where, getDocs } from 'firebase/firestore'; // Firestore methods

// const LoginScreen = ({ navigation }) => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');

//   const handleLogin = async () => {
//     if (!email || !password) {
//       Alert.alert('Error', 'Please enter both email and password.');
//       return;
//     }

//     try {
//       console.log('Logging in user:', email);

//       // 🔹 Sign in with Firebase Authentication
//       const userCredential = await signInWithEmailAndPassword(auth, email, password);
//       const user = userCredential.user;
//       console.log('User logged in successfully:', user.uid);

//       // 🔹 Query Firestore for a document where `uid` field matches the logged-in user
//       const usersRef = collection(db, 'users');
//       const q = query(usersRef, where('uid', '==', user.uid));
//       const querySnapshot = await getDocs(q);

//       if (!querySnapshot.empty) {
//         const userData = querySnapshot.docs[0].data();
//         console.log('Retrieved user data:', userData);

//         if (userData.role) {
//           console.log('User role:', userData.role);
//           Alert.alert('Success', 'Login successful!', [
//             {
//               text: 'OK',
//               onPress: () => {
//                 if (userData.role === 'driver') {
//                   navigation.navigate('Driver');
//                 } else if (userData.role === 'hospital') {
//                   navigation.navigate('Hospital');
//                 } else if (userData.role === 'police') {
//                   navigation.navigate('Police');
//                 } else {
//                   Alert.alert('Error', 'Invalid role detected.');
//                 }
//               },
//             },
//           ]);
//         } else {
//           console.log('Role field is missing:', userData);
//           Alert.alert('Error', 'User role not found in Firestore.');
//         }
//       } else {
//         console.log('No matching user document found.');
//         Alert.alert('Error', 'User role not found.');
//       }
//     } catch (error) {
//       console.error('Login error:', error);
//       Alert.alert('Error', error.message);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Login</Text>
//       <TextInput
//         style={styles.input}
//         placeholder="Email"
//         keyboardType="email-address"
//         autoCapitalize="none"
//         value={email}
//         onChangeText={setEmail}
//       />
//       <TextInput
//         style={styles.input}
//         placeholder="Password"
//         secureTextEntry
//         value={password}
//         onChangeText={setPassword}
//       />
//       <TouchableOpacity style={styles.button} onPress={handleLogin}>
//         <Text style={styles.buttonText}>Login</Text>
//       </TouchableOpacity>
//       <TouchableOpacity onPress={() => navigation.navigate('Register')}>
//         <Text style={styles.link}>Don't have an account? Register</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//   },
//   input: {
//     width: '100%',
//     height: 40,
//     borderColor: '#ccc',
//     borderWidth: 1,
//     borderRadius: 5,
//     paddingHorizontal: 10,
//     marginBottom: 15,
//   },
//   button: {
//     backgroundColor: '#ef4444',
//     paddingVertical: 15,
//     paddingHorizontal: 30,
//     borderRadius: 12,
//     width: '100%',
//     alignItems: 'center',
//   },
//   buttonText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   link: {
//     marginTop: 15,
//     color: '#ef4444',
//     fontSize: 16,
//   },
// });

// export default LoginScreen;

// import React, { useState } from 'react';
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
// import { auth, db } from '../firebase/firebaseConnection';
// import { signInWithEmailAndPassword } from 'firebase/auth';
// import { collection, query, where, getDocs } from 'firebase/firestore';

// const LoginScreen = ({ navigation }) => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');

//   const handleLogin = async () => {
//     if (!email || !password) {
//       Alert.alert('Error', 'Please enter both email and password.');
//       return;
//     }

//     try {
//       console.log('Logging in user:', email);

//       // 🔹 Sign in with Firebase Authentication
//       const userCredential = await signInWithEmailAndPassword(auth, email, password);
//       const user = userCredential.user;
//       console.log('User logged in successfully:', user.uid);

//       // 🔹 Query Firestore for a document where `uid` field matches the logged-in user
//       const usersRef = collection(db, 'users');
//       const q = query(usersRef, where('uid', '==', user.uid));
//       const querySnapshot = await getDocs(q);

//       if (!querySnapshot.empty) {
//         const userData = querySnapshot.docs[0].data();
//         console.log('Retrieved user data:', userData);

//         if (userData.role) {
//           console.log('User role:', userData.role);
//           Alert.alert('Success', 'Login successful!', [
//             {
//               text: 'OK',
//               onPress: () => {
//                 if (userData.role === 'driver') {
//                   // Pass DRIVER_ID to DriverScreen
//                   navigation.navigate('Driver', { driverId: user.uid });
//                 } else if (userData.role === 'hospital') {
//                   navigation.navigate('Hospital');
//                 } else if (userData.role === 'police') {
//                   navigation.navigate('Police');
//                 } else {
//                   Alert.alert('Error', 'Invalid role detected.');
//                 }
//               },
//             },
//           ]);
//         } else {
//           console.log('Role field is missing:', userData);
//           Alert.alert('Error', 'User role not found in Firestore.');
//         }
//       } else {
//         console.log('No matching user document found.');
//         Alert.alert('Error', 'User role not found.');
//       }
//     } catch (error) {
//       console.error('Login error:', error);
//       Alert.alert('Error', error.message);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Login</Text>
//       <TextInput
//         style={styles.input}
//         placeholder="Email"
//         keyboardType="email-address"
//         autoCapitalize="none"
//         value={email}
//         onChangeText={setEmail}
//       />
//       <TextInput
//         style={styles.input}
//         placeholder="Password"
//         secureTextEntry
//         value={password}
//         onChangeText={setPassword}
//       />
//       <TouchableOpacity style={styles.button} onPress={handleLogin}>
//         <Text style={styles.buttonText}>Login</Text>
//       </TouchableOpacity>
//       <TouchableOpacity onPress={() => navigation.navigate('Register')}>
//         <Text style={styles.link}>Don't have an account? Register</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//   },
//   input: {
//     width: '100%',
//     height: 40,
//     borderColor: '#ccc',
//     borderWidth: 1,
//     borderRadius: 5,
//     paddingHorizontal: 10,
//     marginBottom: 15,
//   },
//   button: {
//     backgroundColor: '#ef4444',
//     paddingVertical: 15,
//     paddingHorizontal: 30,
//     borderRadius: 12,
//     width: '100%',
//     alignItems: 'center',
//   },
//   buttonText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   link: {
//     marginTop: 15,
//     color: '#ef4444',
//     fontSize: 16,
//   },
// });

// export default LoginScreen;

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
  Modal
} from 'react-native';
import { auth, db } from '../firebase/firebaseConnection';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      console.log('Logging in user:', email);

      // Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('User logged in successfully:', user.uid);

      // Query Firestore for the user document
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', '==', user.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        console.log('Retrieved user data:', userData);

        if (userData.role) {
          console.log('User role:', userData.role);
          Alert.alert('Success', 'Login successful!', [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to appropriate screen based on role
                setLoading(false);
                switch (userData.role) {
                  case 'driver':
                    navigation.navigate('Driver', { driverId: user.uid });
                    break;
                  case 'hospital':
                    navigation.navigate('Hospital');
                    break;
                  case 'police':
                    navigation.navigate('Police');
                    break;
                  case 'user':
                    navigation.navigate('User');
                    break;
                  default:
                    Alert.alert('Error', 'Invalid role detected.');
                }
              },
            },
          ]);
        } else {
          setLoading(false);
          console.log('Role field is missing:', userData);
          Alert.alert('Error', 'User role not found in Firestore.');
        }
      } else {
        setLoading(false);
        console.log('No matching user document found.');
        Alert.alert('Error', 'User data not found.');
      }
    } catch (error) {
      setLoading(false);
      console.error('Login error:', error);
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Don't have an account? Register</Text>
      </TouchableOpacity>

      <Modal transparent={true} animationType="fade" visible={loading}>
  <View style={styles.loadingOverlay}>
    <View style={styles.spinnerContent}>
      <ActivityIndicator size="large" color="#ef4444" />
      <Text style={styles.loadingText}>Logging you in...</Text>
    </View>
  </View>
</Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#ef4444',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    color: '#ef4444',
    fontSize: 16,
  },
  loadingOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.3)',
  justifyContent: 'center',
  alignItems: 'center',
},
spinnerContent: {
  backgroundColor: 'white',
  padding: 25,
  borderRadius: 10,
  alignItems: 'center',
  elevation: 5,
},
loadingText: {
  marginTop: 10,
  fontSize: 16,
  color: '#333',
},

});

export default LoginScreen;