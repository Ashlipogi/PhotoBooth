"use client"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, Dimensions, StatusBar } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Image } from "expo-image"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from "react-native-reanimated"

export default function SplashScreen() {
  const [screenData, setScreenData] = useState(Dimensions.get("window"))
  
  // Calculate if device is in landscape mode
  const isLandscape = screenData.width > screenData.height
  const { width, height } = screenData
  
  // Responsive calculations
  const responsiveSize = (size: number) => {
    const scale = Math.min(width / 375, height / 812) // Base on iPhone X dimensions
    return Math.max(size * scale, size * 0.8) // Minimum 80% of original size
  }
  
  // Animation values
  const logoOpacity = useSharedValue(0)
  const logoScale = useSharedValue(0.5)
  const titleOpacity = useSharedValue(0)
  const titleTranslateY = useSharedValue(30)
  const subtitleOpacity = useSharedValue(0)
  const subtitleTranslateY = useSharedValue(30)
  const studioInfoOpacity = useSharedValue(0)
  const studioInfoTranslateY = useSharedValue(50)

  useEffect(() => {
    const onChange = (result: { window: any }) => {
      setScreenData(result.window)
    }
    const subscription = Dimensions.addEventListener("change", onChange)
    return () => subscription?.remove()
  }, [])

  useEffect(() => {
    // Start animations sequence
    const startAnimations = () => {
      // Logo animation
      logoOpacity.value = withTiming(1, { duration: 800 })
      logoScale.value = withTiming(1, { duration: 800 })
      
      // Title animation (delayed)
      titleOpacity.value = withDelay(400, withTiming(1, { duration: 600 }))
      titleTranslateY.value = withDelay(400, withTiming(0, { duration: 600 }))
      
      // Subtitle animation (delayed)
      subtitleOpacity.value = withDelay(800, withTiming(1, { duration: 600 }))
      subtitleTranslateY.value = withDelay(800, withTiming(0, { duration: 600 }))
      
      // Studio info animation (delayed)
      studioInfoOpacity.value = withDelay(1200, withTiming(1, { duration: 600 }))
      studioInfoTranslateY.value = withDelay(1200, withTiming(0, { duration: 600 }))
      
      // Navigate to main screen after all animations
      setTimeout(() => {
        router.replace("/(tabs)")
      }, 3000)
    }

    startAnimations()
  }, [])

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }))

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }))

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }))

  const studioInfoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: studioInfoOpacity.value,
    transform: [{ translateY: studioInfoTranslateY.value }],
  }))

  // Dynamic styles based on orientation
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: isLandscape ? 'row' : 'column',
      justifyContent: isLandscape ? 'space-around' : 'space-between',
      alignItems: 'center',
      paddingHorizontal: isLandscape ? responsiveSize(40) : responsiveSize(20),
      paddingVertical: isLandscape ? responsiveSize(20) : responsiveSize(40),
    },
    centerContent: {
      flex: isLandscape ? 0.6 : 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: responsiveSize(20),
      minHeight: isLandscape ? '100%' : 'auto',
    },
    logoContainer: {
      width: responsiveSize(isLandscape ? 80 : 120),
      height: responsiveSize(isLandscape ? 80 : 120),
      marginBottom: responsiveSize(isLandscape ? 15 : 30),
    },
    title: {
      fontSize: responsiveSize(isLandscape ? 28 : 42),
      fontWeight: "bold",
      color: "white",
      letterSpacing: isLandscape ? 2 : 3,
      marginBottom: responsiveSize(isLandscape ? 5 : 10),
      textAlign: "center",
    },
    subtitle: {
      fontSize: responsiveSize(isLandscape ? 14 : 18),
      color: "#ccc",
      fontStyle: "italic",
      textAlign: "center",
    },
    studioInfoContainer: {
      flex: isLandscape ? 0.4 : 0,
      paddingHorizontal: isLandscape ? 0 : responsiveSize(20),
      paddingBottom: isLandscape ? 0 : responsiveSize(50),
      width: isLandscape ? 'auto' : '100%',
      justifyContent: 'center',
    },
    infoCard: {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderRadius: responsiveSize(16),
      padding: responsiveSize(isLandscape ? 15 : 20),
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
      gap: responsiveSize(isLandscape ? 8 : 12),
      maxWidth: isLandscape ? responsiveSize(300) : '100%',
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: responsiveSize(isLandscape ? 8 : 12),
    },
    infoText: {
      fontSize: responsiveSize(isLandscape ? 11 : 13),
      color: "#ddd",
      flex: 1,
      fontWeight: "500",
      lineHeight: responsiveSize(isLandscape ? 16 : 18),
    },
  })

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d", "#1a1a1a"]} style={dynamicStyles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Main Content - Centered */}
      <View style={dynamicStyles.centerContent}>
        {/* Logo */}
        <Animated.View style={[dynamicStyles.logoContainer, logoAnimatedStyle]}>
          <Image 
            source={require("@/app/imgs/design3.png")} 
            style={styles.logo} 
            contentFit="contain" 
          />
        </Animated.View>
        
        {/* Title */}
        <Animated.View style={titleAnimatedStyle}>
          <Text style={dynamicStyles.title}>JR.STUDIO</Text>
        </Animated.View>
        
        {/* Subtitle */}
        <Animated.View style={subtitleAnimatedStyle}>
          <Text style={dynamicStyles.subtitle}>Photo Booth Experience</Text>
        </Animated.View>
      </View>

      {/* Studio Info - Bottom or Right side in landscape */}
      <Animated.View style={[dynamicStyles.studioInfoContainer, studioInfoAnimatedStyle]}>
        <View style={dynamicStyles.infoCard}>
          <View style={dynamicStyles.infoRow}>
            <Ionicons name="location" size={responsiveSize(18)} color="#4CAF50" />
            <Text style={dynamicStyles.infoText}>TINAGO MALIWONO SUBIGAO DEL NORTE</Text>
          </View>
          <View style={dynamicStyles.infoRow}>
            <Ionicons name="call" size={responsiveSize(18)} color="#4CAF50" />
            <Text style={dynamicStyles.infoText}>09700261974</Text>
          </View>
          <View style={dynamicStyles.infoRow}>
            <Ionicons name="logo-facebook" size={responsiveSize(18)} color="#4CAF50" />
            <Text style={dynamicStyles.infoText}>JOHN REMBERT CATURAN PEDRAJITA</Text>
          </View>
        </View>
      </Animated.View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  logo: {
    width: "100%",
    height: "100%",
  },
})