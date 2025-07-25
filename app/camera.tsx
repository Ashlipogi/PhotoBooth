"use client"
import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  Platform,
  ScrollView,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Image } from "expo-image"
import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { CameraView, type CameraType, useCameraPermissions } from "expo-camera"
import * as FileSystem from "expo-file-system"

export default function CameraScreen() {
  const { templateId } = useLocalSearchParams()
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([])
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [screenData, setScreenData] = useState(Dimensions.get("window"))
  const [orientation, setOrientation] = useState(screenData.width > screenData.height ? "landscape" : "portrait")
  const [facing, setFacing] = useState<CameraType>("back")
  const [permission, requestPermission] = useCameraPermissions()
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const cameraRef = useRef<CameraView>(null)
  const scrollViewRef = useRef<ScrollView>(null)

  const getPhotoCount = () => {
    const template = templateId as string
    if (template.includes("4")) return 4
    if (template.includes("5")) return 5
    if (template.includes("6")) return 6
    if (template.includes("3")) return 3
    if (template.includes("8")) return 8
    if (template.includes("2")) return 2
    return 4
  }

  const totalPhotos = getPhotoCount()

  useEffect(() => {
    const onChange = (result: { window: any }) => {
      setScreenData(result.window)
      setOrientation(result.window.width > result.window.height ? "landscape" : "portrait")
    }
    const subscription = Dimensions.addEventListener("change", onChange)
    return () => subscription?.remove()
  }, [])

  // Auto-scroll to current photo when it changes
  useEffect(() => {
    if (scrollViewRef.current && currentPhotoIndex > 0) {
      const slotSize = getPhotoSlotSize()
      const gap = orientation === "landscape" ? 8 : 10
      const scrollToX = (slotSize.width + gap) * currentPhotoIndex - screenData.width / 2 + slotSize.width / 2

      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: Math.max(0, scrollToX),
          animated: true,
        })
      }, 100)
    }
  }, [currentPhotoIndex, orientation])

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"))
  }

  const handleGoBack = () => {
    router.push("/")
  }

  const startCountdown = () => {
    if (!permission?.granted) {
      requestPermission()
      return
    }
    if (currentPhotoIndex >= totalPhotos) {
      handleProceedToBackground()
      return
    }
    setCountdown(3)
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countdownInterval)
          takePictureAfterCountdown()
          return null
        }
        return prev ? prev - 1 : null
      })
    }, 1000)
  }

  const takePictureAfterCountdown = async () => {
    if (cameraRef.current && isCameraReady) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          exif: false,
          skipProcessing: false,
        })
        if (photo) {
          let photoUri = photo.uri
          if (photoUri.startsWith("file://")) {
            const fileName = `photo_${Date.now()}_${currentPhotoIndex}.jpg`
            const newPath = `${FileSystem.documentDirectory}${fileName}`
            try {
              await FileSystem.copyAsync({
                from: photoUri,
                to: newPath,
              })
              photoUri = newPath
            } catch (copyError) {
              console.log("Copy failed, using original URI:", copyError)
            }
          }
          const newPhotos = [...capturedPhotos, photoUri]
          setCapturedPhotos(newPhotos)
          setCurrentPhotoIndex(currentPhotoIndex + 1)
        }
      } catch (error) {
        console.error("Camera error:", error)
        Alert.alert("Error", "Failed to take picture. Please try again.")
      }
    }
  }

  const handleProceedToBackground = () => {
    if (capturedPhotos.length === totalPhotos) {
      router.push({
        pathname: "/background-selection",
        params: {
          templateId: templateId as string,
          photos: JSON.stringify(capturedPhotos),
        },
      })
    }
  }

  const formatImageUri = (uri: string) => {
    if (Platform.OS === "android" && !uri.startsWith("file://") && !uri.startsWith("http")) {
      return `file://${uri}`
    }
    return uri
  }

  const getPhotoSlotSize = () => {
    const { width, height } = screenData
    const isLandscape = orientation === "landscape"

    if (isLandscape) {
      // In landscape, make slots wider for better visibility
      return {
        width: 150, 
        height: 90, // Increased proportionally from 72 to 90
      }
    } else {
      // Portrait mode - consistent sizing for scrolling
      return {
        width: 80,
        height: 104,
      }
    }
  }

  const renderPhotoSlot = (index: number) => {
    const slotSize = getPhotoSlotSize()
    const isCurrentSlot = index === currentPhotoIndex
    const isCompleted = index < capturedPhotos.length
    const isDisabled = index > currentPhotoIndex

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.photoSlot,
          {
            width: slotSize.width,
            height: slotSize.height,
          },
          isCurrentSlot && styles.currentPhotoSlot,
          isCompleted && styles.completedPhotoSlot,
          isDisabled && styles.disabledPhotoSlot,
        ]}
        disabled={true}
      >
        {isCompleted ? (
          <Image
            source={{ uri: formatImageUri(capturedPhotos[index]) }}
            style={styles.capturedPhoto}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.emptyPhotoSlot}>
            {isCurrentSlot ? (
              <View style={styles.activeSlotContent}>
                <Ionicons name="camera" size={orientation === "landscape" ? 12 : 16} color="#4CAF50" />
                <Text style={[styles.activeSlotText, orientation === "landscape" && styles.activeSlotTextLandscape]}>
                  Next
                </Text>
              </View>
            ) : (
              <Text style={[styles.photoNumberText, orientation === "landscape" && styles.photoNumberTextLandscape]}>
                {index + 1}
              </Text>
            )}
          </View>
        )}
        {/* Photo number badge */}
        <View style={[styles.photoNumberBadge, orientation === "landscape" && styles.photoNumberBadgeLandscape]}>
          <Text
            style={[styles.photoNumberBadgeText, orientation === "landscape" && styles.photoNumberBadgeTextLandscape]}
          >
            {index + 1}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  // Check if all photos are captured
  useEffect(() => {
    if (capturedPhotos.length === totalPhotos && capturedPhotos.length > 0) {
      // Auto-proceed after a short delay
      setTimeout(() => {
        handleProceedToBackground()
      }, 1500)
    }
  }, [capturedPhotos.length, totalPhotos])

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <LinearGradient colors={["#1a1a1a", "#2d2d2d", "#1a1a1a"]} style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={80} color="#4CAF50" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to take photos for your photo booth session.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <LinearGradient colors={["#4CAF50", "#45a049"]} style={styles.permissionGradient}>
              <Ionicons name="camera" size={20} color="white" />
              <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    )
  }

  const isLandscape = orientation === "landscape"

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Full Screen Camera Background */}
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} onCameraReady={() => setIsCameraReady(true)} />

      {/* Countdown Overlay */}
      {countdown && (
        <View style={styles.countdownOverlay}>
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      )}

      {/* Top Controls - Back button on left, Camera flip button on right */}
      <View style={[styles.topLeftControls, isLandscape && styles.topLeftControlsLandscape]}>
        <TouchableOpacity style={styles.controlButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={[styles.topRightControls, isLandscape && styles.topRightControlsLandscape]}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
          <Ionicons name="camera-reverse" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Bottom Overlay with Capture Button, Progress, and Photo Slots */}
      <View style={[styles.bottomOverlay, isLandscape && styles.bottomOverlayLandscape]}>
        {/* Capture Button */}
        <View style={[styles.captureSection, isLandscape && styles.captureSectionLandscape]}>
          <TouchableOpacity
            style={[
              styles.captureButton,
              isLandscape && styles.captureButtonLandscape,
              (countdown !== null || !isCameraReady || currentPhotoIndex >= totalPhotos) &&
                styles.captureButtonDisabled,
            ]}
            onPress={startCountdown}
            disabled={countdown !== null || !isCameraReady || currentPhotoIndex >= totalPhotos}
          >
            <View style={[styles.captureButtonInner, isLandscape && styles.captureButtonInnerLandscape]}>
              {countdown ? (
                <Text style={[styles.captureButtonCountdown, isLandscape && styles.captureButtonCountdownLandscape]}>
                  {countdown}
                </Text>
              ) : currentPhotoIndex >= totalPhotos ? (
                <Ionicons name="checkmark" size={isLandscape ? 24 : 32} color="#4CAF50" />
              ) : (
                <Ionicons name="camera" size={isLandscape ? 24 : 32} color="#4CAF50" />
              )}
            </View>
          </TouchableOpacity>
          <Text style={[styles.captureInstructionText, isLandscape && styles.captureInstructionTextLandscape]}>
            {countdown
              ? "Get ready..."
              : currentPhotoIndex >= totalPhotos
                ? "All photos captured!"
                : currentPhotoIndex < totalPhotos - 1
                  ? `Tap to capture photo ${currentPhotoIndex + 1}`
                  : "Last photo - tap to finish!"}
          </Text>
        </View>

        {/* Progress Container - Now below capture instruction */}
        <View style={[styles.progressContainer, isLandscape && styles.progressContainerLandscape]}>
          <Text style={[styles.progressText, isLandscape && styles.progressTextLandscape]}>
            {currentPhotoIndex + 0} / {totalPhotos}
          </Text>
          <View style={[styles.progressBar, isLandscape && styles.progressBarLandscape]}>
            <View style={[styles.progressFill, { width: `${(capturedPhotos.length / totalPhotos) * 100}%` }]} />
          </View>
        </View>

        {/* Photo Slots - Now Horizontally Scrollable */}
        <ScrollView
          ref={scrollViewRef}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.photoSlotsScrollContent,
            isLandscape && styles.photoSlotsScrollContentLandscape,
            // Center content in landscape when it fits on screen
            isLandscape && totalPhotos <= 6 && styles.photoSlotsScrollContentCentered,
          ]}
          style={[styles.photoSlotsContainer, isLandscape && styles.photoSlotsContainerLandscape]}
          decelerationRate="fast"
          snapToInterval={orientation === "landscape" ? 83 : 90} // Updated from 68 to 83 (75 + 8 gap)
          snapToAlignment="start"
        >
          {Array.from({ length: totalPhotos }, (_, index) => renderPhotoSlot(index))}
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  countdownOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 30,
  },
  countdownText: {
    fontSize: 80,
    fontWeight: "bold",
    color: "white",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
  },
  topLeftControls: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 20,
  },
  topLeftControlsLandscape: {
    top: 20,
    left: 20,
  },
  topRightControls: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 20,
  },
  topRightControlsLandscape: {
    top: 20,
    right: 20,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    zIndex: 20,
  },
  bottomOverlayLandscape: {
    paddingBottom: 20,
    paddingTop: 15,
  },
  captureSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  captureSectionLandscape: {
    marginBottom: 15,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.5)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonLandscape: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInnerLandscape: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  captureButtonCountdown: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  captureButtonCountdownLandscape: {
    fontSize: 18,
  },
  captureInstructionText: {
    fontSize: 14,
    color: "white",
    textAlign: "center",
    fontWeight: "600",
    marginTop: 10,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  captureInstructionTextLandscape: {
    fontSize: 12,
    marginTop: 8,
  },
  progressContainer: {
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  progressContainerLandscape: {
    marginBottom: 15,
    paddingHorizontal: 40,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  progressTextLandscape: {
    fontSize: 14,
    marginBottom: 6,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    overflow: "hidden",
    width: "100%",
  },
  progressBarLandscape: {
    height: 3,
    width: "80%",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 2,
  },
  photoSlotsContainer: {
    maxHeight: 120, // Constrain height for landscape
  },
  photoSlotsContainerLandscape: {
    maxHeight: 90,
  },
  photoSlotsScrollContent: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    gap: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  photoSlotsScrollContentLandscape: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
  },
  photoSlotsScrollContentCentered: {
    justifyContent: "center",
    flexGrow: 1,
  },
  photoSlot: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
    overflow: "hidden",
    position: "relative",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  currentPhotoSlot: {
    borderColor: "#4CAF50",
    borderWidth: 3,
    backgroundColor: "rgba(76, 175, 80, 0.2)",
  },
  completedPhotoSlot: {
    borderColor: "#4CAF50",
    borderWidth: 2,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
  },
  disabledPhotoSlot: {
    opacity: 0.6,
  },
  capturedPhoto: {
    width: "100%",
    height: "100%",
  },
  emptyPhotoSlot: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  activeSlotContent: {
    alignItems: "center",
    gap: 4,
  },
  activeSlotText: {
    fontSize: 10,
    color: "#4CAF50",
    fontWeight: "600",
  },
  activeSlotTextLandscape: {
    fontSize: 8,
  },
  photoNumberText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "rgba(255, 255, 255, 0.8)",
  },
  photoNumberTextLandscape: {
    fontSize: 14,
  },
  photoNumberBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  photoNumberBadgeLandscape: {
    width: 16,
    height: 16,
    borderRadius: 8,
    top: 2,
    right: 2,
  },
  photoNumberBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "white",
  },
  photoNumberBadgeTextLandscape: {
    fontSize: 8,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 20,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  permissionText: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
    lineHeight: 24,
  },
  permissionButton: {
    borderRadius: 25,
    overflow: "hidden",
    marginTop: 20,
  },
  permissionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 30,
    gap: 10,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
})
