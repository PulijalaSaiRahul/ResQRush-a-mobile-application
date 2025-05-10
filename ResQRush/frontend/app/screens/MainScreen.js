// import React from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
// import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
// import { FontAwesome5 } from '@expo/vector-icons';

// const { height } = Dimensions.get('window');

// const MainScreen = ({ navigation }) => {
//   return (
//     <View style={styles.container}>
//       {/* Background Wave Pattern */}
//       <Svg style={styles.svg} viewBox="0 0 100 100" preserveAspectRatio="none">
//         <Defs>
//           <LinearGradient id="wave-gradient" x1="0" y1="0" x2="0" y2="1">
//             <Stop offset="0%" stopColor="#ef4444" />
//             <Stop offset="100%" stopColor="#b91c1c" />
//           </LinearGradient>
//         </Defs>
//         {/* Decorative Wave Shapes */}
//         <Path d="M0,50 Q25,40 50,50 T100,50 V100 H0 Z" fill="#dc2626" opacity="0.3" />
//         <Path d="M0,70 Q25,60 50,70 T100,70 V100 H0 Z" fill="#b91c1c" opacity="0.2" />
//       </Svg>

//       {/* Main Content */}
//       <View style={styles.content}>
//         {/* Ambulance Icon with Circle Background */}
//         <View style={styles.iconContainer}>
//           <View style={styles.iconBackground}>
//             <FontAwesome5 name="ambulance" size={64} color="white" />
//           </View>
//         </View>

//         {/* Title */}
//         <Text style={styles.title}>ResQRush</Text>

//         {/* Subtitle */}
//         <Text style={styles.subtitle}>
//           Saving Lives Through Smarter Routes and Faster Responses
//         </Text>
//       </View>

//       {/* Auth Buttons (Placed Lower) */}
//       <View style={styles.buttonContainer}>
//         <TouchableOpacity
//           style={styles.authButton}
//           onPress={() => navigation.navigate('Login')}
//         >
//           <Text style={styles.authButtonText}>Login</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[styles.authButton, styles.registerButton]}
//           onPress={() => navigation.navigate('Register')}
//         >
//           <Text style={styles.registerText}>Register</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#ef4444',
//     alignItems: 'center',
//     justifyContent: 'flex-start',
//   },
//   svg: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     width: '100%',
//     height: '100%',
//   },
//   content: {
//     alignItems: 'center',
//     padding: 20,
//     marginTop: height * 0.15,
//   },
//   iconContainer: {
//     backgroundColor: 'rgba(239, 68, 68, 0.3)',
//     padding: 20,
//     borderRadius: 100,
//     marginBottom: 20,
//   },
//   iconBackground: {
//     backgroundColor: 'rgba(239, 68, 68, 0.5)',
//     padding: 15,
//     borderRadius: 100,
//   },
//   title: {
//     fontSize: 32,
//     fontWeight: 'bold',
//     color: 'white',
//     textAlign: 'center',
//   },
//   subtitle: {
//     fontSize: 18,
//     color: 'white',
//     textAlign: 'center',
//     marginBottom: 40,
//   },
//   buttonContainer: {
//     position: 'absolute',
//     bottom: 50,
//     width: '80%',
//   },
//   authButton: {
//     backgroundColor: 'white',
//     paddingVertical: 15,
//     borderRadius: 12,
//     alignItems: 'center',
//     width: '100%',
//     marginBottom: 15,
//   },
//   authButtonText: {
//     color: '#ef4444',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   registerButton: {
//     backgroundColor: 'transparent',
//     borderWidth: 2,
//     borderColor: 'white',
//   },
//   registerText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
// });

// export default MainScreen;

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import LottieView from 'lottie-react-native';

const { height, width } = Dimensions.get('window');

const MainScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Background Wave Pattern */}
      <Svg style={styles.svg} viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="wave-gradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#ef4444" />
            <Stop offset="100%" stopColor="#b91c1c" />
          </LinearGradient>
        </Defs>
        {/* Decorative Wave Shapes */}
        <Path d="M0,50 Q25,40 50,50 T100,50 V100 H0 Z" fill="#dc2626" opacity="0.3" />
        <Path d="M0,70 Q25,60 50,70 T100,70 V100 H0 Z" fill="#b91c1c" opacity="0.2" />
      </Svg>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Lottie Animation */}
        <View style={styles.animationContainer}>
          <LottieView
            source={require('../assets/ambulance_mainscreen.json')}
            autoPlay
            loop
            style={styles.animation}
            resizeMode="contain"
            speed={1}
            hardwareAccelerationAndroid
            colorFilters={[
              {
                keypath: "ambulance",
                color: "#ffffff" // White ambulance body
              },
              {
                keypath: "lights",
                color: "#ff0000" // Red emergency lights
              },
              {
                keypath: "stripes",
                color: "#0000ff" // Blue stripes
              }
            ]}
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>ResQRush</Text>

        {/* Subtitle */}
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>
            Saving Lives Through Smarter Routes{'\n'}
            and Faster Responses
          </Text>
        </View>
      </View>

      {/* Auth Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.authButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.authButtonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.authButton, styles.registerButton]}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerText}>Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  content: {
    alignItems: 'center',
    padding: 20,
    marginTop: height * 0.08,
    width: '100%',
  },
  animationContainer: {
    width: width * 0.9,
    height: width * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
  subtitleContainer: {
    marginTop: 8,
    alignItems: 'center',
    width: '80%',
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    width: '80%',
  },
  authButton: {
    backgroundColor: 'white',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  authButtonText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'white',
  },
  registerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MainScreen;