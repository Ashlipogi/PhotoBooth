"use client"

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ScrollView,
  Platform,
  Alert,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Image } from "expo-image"
import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { CameraView, type CameraType, useCameraPermissions } from "expo-camera"
import * as FileSystem from "expo-file-system"

// Convert cm to pixels at 300 DPI for exact measurements
const cmToPx = (cm: number) => cm * 118.11 // 1cm = 118.11px at 300 DPI

export default function PreviewScreen() {
  const { templateId, photos } = useLocalSearchParams()
  const initialPhotos = photos ? JSON.parse(photos as string) : []
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>(initialPhotos)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(initialPhotos.length)
  const [screenData, setScreenData] = useState(Dimensions.get("window"))
  const [facing, setFacing] = useState<CameraType>("back")
  const [permission, requestPermission] = useCameraPermissions()
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const cameraRef = useRef<CameraView>(null)

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
    }
    const subscription = Dimensions.addEventListener("change", onChange)
    return () => subscription?.remove()
  }, [])

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"))
  }

  const startCountdown = () => {
    if (!permission?.granted) {
      requestPermission()
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

  const handleChooseBackground = () => {
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

  const getPhotoStripSize = () => {
    const template = templateId as string
    let printWidth, printHeight
    if (template === "4-strip") {
      printWidth = cmToPx(30)
      printHeight = cmToPx(93)
    } else if (template === "4-landscape") {
      // New landscape template: 150mm × 113mm
      printWidth = cmToPx(16) // 150mm = 15cm
      printHeight = cmToPx(13) // 113mm = 11.3cm
    } else {
      printWidth = cmToPx(14)
      printHeight = cmToPx(15)
    }

    const { width, height } = screenData
    const maxScreenWidth = width - 100
    const maxScreenHeight = height * 1 // Reduced to make room for camera controls
    const aspectRatio = printWidth / printHeight

    let displayWidth = maxScreenWidth
    let displayHeight = displayWidth / aspectRatio

    if (displayHeight > maxScreenHeight) {
      displayHeight = maxScreenHeight
      displayWidth = displayHeight * aspectRatio
    }

    return {
      width: displayWidth,
      height: displayHeight,
      printWidth,
      printHeight,
      scale: displayWidth / printWidth,
    }
  }

  const formatImageUri = (uri: string) => {
    if (Platform.OS === "android" && !uri.startsWith("file://") && !uri.startsWith("http")) {
      return `file://${uri}`
    }
    return uri
  }

  const renderPhotoSlot = (index: number, photoWidth: number, photoHeight: number) => {
    const isCurrentSlot = index === currentPhotoIndex
    const isCompleted = index < capturedPhotos.length
    const isDisabled = index > currentPhotoIndex

    if (isCurrentSlot && !isCompleted && permission?.granted) {
      // Show camera in current slot
      return (
        <View
          key={index}
          style={[
            styles.photoSlotContainer,
            {
              width: photoWidth,
              height: photoHeight,
            },
            styles.currentPhotoSlot,
          ]}
        >
          <CameraView
            ref={cameraRef}
            style={styles.cameraInSlot}
            facing={facing}
            onCameraReady={() => setIsCameraReady(true)}
          />
          {countdown && (
            <View style={styles.countdownOverlay}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
          )}
        </View>
      )
    }

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.photoSlotContainer,
          {
            width: photoWidth,
            height: photoHeight,
          },
          isCurrentSlot && styles.currentPhotoSlot,
          isDisabled && styles.disabledPhotoSlot,
        ]}
        disabled={isDisabled || isCompleted}
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
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={24} color="#4CAF50" />
                <Text style={styles.readyText}>Ready for photo {index + 1}</Text>
              </View>
            ) : (
              <View style={styles.waitingIcon}>
                <Text style={styles.photoNumberText}>{index + 1}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    )
  }

  const renderPhotoLayout = () => {
    const stripSize = getPhotoStripSize()
    const template = templateId as string

    if (template === "4-strip") {
      const exactPhotoWidth = cmToPx(30)
      const exactPhotoHeight = cmToPx(20)
      const displayPhotoWidth = exactPhotoWidth * stripSize.scale
      const displayPhotoHeight = exactPhotoHeight * stripSize.scale

      return (
        <View style={[styles.photoStrip, { width: stripSize.width, height: stripSize.height }]}>
          <View style={styles.stripLayout}>
            <View style={styles.stripPhotosSection}>
              {Array.from({ length: totalPhotos }, (_, index) =>
                renderPhotoSlot(index, displayPhotoWidth, displayPhotoHeight),
              )}
            </View>
            <View style={styles.stripLogoBottomCenter}>
              <Image source={require("@/app/imgs/design.png")} style={styles.stripLogoImage} contentFit="contain" />
            </View>
          </View>
        </View>
      )
    } else if (template === "4-landscape") {
      // New landscape template: photos 77.8mm × 45.9mm
      const exactPhotoWidth = cmToPx(7.90) // 77.8mm = 7.78cm
      const exactPhotoHeight = cmToPx(4.59) // 45.9mm = 4.59cm
      const displayPhotoWidth = exactPhotoWidth * stripSize.scale
      const displayPhotoHeight = exactPhotoHeight * stripSize.scale

      return (
        <View style={[styles.photoStrip, { width: stripSize.width, height: stripSize.height }]}>
          <View style={styles.landscapeLayout}>
            {/* Photos section - 2x2 grid */}
            <View style={styles.landscapePhotosSection}>
              <View style={styles.landscapePhotoRow}>
                {renderPhotoSlot(0, displayPhotoWidth, displayPhotoHeight)}
                {renderPhotoSlot(1, displayPhotoWidth, displayPhotoHeight)}
              </View>
              <View style={styles.landscapePhotoRow}>
                {renderPhotoSlot(2, displayPhotoWidth, displayPhotoHeight)}
                {renderPhotoSlot(3, displayPhotoWidth, displayPhotoHeight)}
              </View>
            </View>
            {/* Bottom section with logo and contact info */}
            <View style={styles.landscapeBottomSection}>
              <View style={styles.landscapeContactInfo}>
                <Text style={styles.talkToUsText}>Talk to us</Text>
                <View style={styles.contactRow}>
                  <Ionicons name="call" size={12} color="#333" />
                  <Text style={styles.contactText}>09478294412</Text>
                </View>
                <View style={styles.contactRow}>
                  <Ionicons name="logo-facebook" size={12} color="#333" />
                  <Text style={styles.contactText}>JR. Studio</Text>
                </View>
              </View>
              <View style={styles.landscapeLogoCenter}>
                <Image
                  source={require("@/app/imgs/design.png")}
                  style={styles.landscapeLogoImage}
                  contentFit="contain"
                />
              </View>
            </View>
          </View>
        </View>
      )
    } else {
      const exactPhotoWidth = cmToPx(6)
      const exactPhotoHeight = cmToPx(4.5)
      const displayPhotoWidth = exactPhotoWidth * stripSize.scale
      const displayPhotoHeight = exactPhotoHeight * stripSize.scale

      if (template.includes("4") && template.includes("grid")) {
        return (
          <View style={[styles.photoStrip, { width: stripSize.width, height: stripSize.height }]}>
            <View style={styles.mainLayout}>
              <View style={styles.photosSection}>
                <View style={styles.photoColumns}>
                  <View style={styles.photoColumn}>
                    {renderPhotoSlot(0, displayPhotoWidth, displayPhotoHeight)}
                    {renderPhotoSlot(1, displayPhotoWidth, displayPhotoHeight)}
                    {renderPhotoSlot(2, displayPhotoWidth, displayPhotoHeight)}
                  </View>
                  <View style={styles.photoColumn}>{renderPhotoSlot(3, displayPhotoWidth, displayPhotoHeight)}</View>
                </View>
              </View>
              <View style={styles.brandingColumn}>
                <View style={styles.logoBottomRight}>
                  <Image source={require("@/app/imgs/design.png")} style={styles.logoImage} contentFit="contain" />
                </View>
              </View>
            </View>
          </View>
        )
      } else if (template.includes("5")) {
        return (
          <View style={[styles.photoStrip, { width: stripSize.width, height: stripSize.height }]}>
            <View style={styles.mainLayout}>
              <View style={styles.photosSection}>
                <View style={styles.photoColumns}>
                  <View style={styles.photoColumn}>
                    {renderPhotoSlot(0, displayPhotoWidth, displayPhotoHeight)}
                    {renderPhotoSlot(1, displayPhotoWidth, displayPhotoHeight)}
                    {renderPhotoSlot(2, displayPhotoWidth, displayPhotoHeight)}
                  </View>
                  <View style={styles.photoColumn}>
                    {renderPhotoSlot(3, displayPhotoWidth, displayPhotoHeight)}
                    {renderPhotoSlot(4, displayPhotoWidth, displayPhotoHeight)}
                  </View>
                </View>
              </View>
              <View style={styles.brandingColumn}>
                <View style={styles.logoBottomRight}>
                  <Image source={require("@/app/imgs/design.png")} style={styles.logoImage5} contentFit="contain" />
                </View>
              </View>
            </View>
          </View>
        )
      }
    }
  }

  const getTemplateDimensions = () => {
    const template = templateId as string
    if (template === "4-strip") {
      return "80mm × 210mm • Each photo: 33.5mm × 23mm"
    } else if (template === "4-landscape") {
      return "150mm × 113mm • Each photo: 77.8mm × 45.9mm"
    } else {
      return "14.0cm × 15.0cm • Each photo: 4.5cm × 6.0cm"
    }
  }

  const isCurrentSlotCamera = currentPhotoIndex < totalPhotos && permission?.granted

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d", "#1a1a1a"]} style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push("/")}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photo Session</Text>
        {isCurrentSlotCamera && (
          <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse" size={24} color="white" />
          </TouchableOpacity>
        )}
        {!isCurrentSlotCamera && <View style={styles.placeholder} />}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {capturedPhotos.length} of {totalPhotos} photos captured
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(capturedPhotos.length / totalPhotos) * 100}%` }]} />
          </View>
        </View>

        {/* Photo Strip Preview */}
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Your Photo Strip</Text>
          <Text style={styles.previewSubtitle}>{getTemplateDimensions()}</Text>
          {renderPhotoLayout()}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          {currentPhotoIndex < totalPhotos ? (
            <View style={styles.instructionItem}>
              <Ionicons name="camera" size={20} color="#4CAF50" />
              <Text style={styles.instructionText}>
                {permission?.granted
                  ? `Camera is ready for photo ${currentPhotoIndex + 1}. Tap the capture button below when ready.`
                  : `Tap to grant camera permission for photo ${currentPhotoIndex + 1}`}
              </Text>
            </View>
          ) : (
            <View style={styles.instructionItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.instructionText}>All photos captured! Choose a background to continue.</Text>
            </View>
          )}
        </View>

        {/* Camera Permission Request */}
        {!permission?.granted && currentPhotoIndex < totalPhotos && (
          <View style={styles.permissionContainer}>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Ionicons name="camera" size={20} color="white" />
              <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom Controls */}
      {isCurrentSlotCamera && (
        <View style={styles.bottomControls}>
          <LinearGradient colors={["rgba(0,0,0,0.8)", "rgba(0,0,0,0.6)"]} style={styles.controlsContainer}>
            {/* Photo Progress */}
            <View style={styles.photoProgress}>
              {Array.from({ length: totalPhotos }, (_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index < capturedPhotos.length && styles.progressDotCompleted,
                    index === currentPhotoIndex && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>

            {/* Capture Button */}
            <TouchableOpacity
              style={[styles.captureButton, countdown !== null && styles.captureButtonDisabled]}
              onPress={startCountdown}
              disabled={countdown !== null || !isCameraReady}
            >
              <View style={styles.captureButtonInner}>
                {countdown ? (
                  <Text style={styles.captureButtonCountdown}>{countdown}</Text>
                ) : (
                  <Ionicons name="camera" size={32} color="#4CAF50" />
                )}
              </View>
            </TouchableOpacity>

            <Text style={styles.captureInstructionText}>
              {countdown
                ? "Get ready..."
                : currentPhotoIndex < totalPhotos - 1
                  ? `Tap to capture photo ${currentPhotoIndex + 1}`
                  : "Last photo - tap to finish!"}
            </Text>
          </LinearGradient>
        </View>
      )}

      {/* Action Buttons */}
      {capturedPhotos.length === totalPhotos && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.backgroundButton} onPress={handleChooseBackground}>
            <LinearGradient colors={["#4CAF50", "#45a049"]} style={styles.backgroundGradient}>
              <Ionicons name="color-palette" size={20} color="white" />
              <Text style={styles.backgroundButtonText}>Choose Background</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  flipButton: {
    padding: 10,
  },
  placeholder: {
    width: 44,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
    marginBottom: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 2,
  },
  previewContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  previewSubtitle: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 20,
  },
  photoStrip: {
    backgroundColor: "white",
    borderRadius: 0,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  photoSlotContainer: {
    borderRadius: 0,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
    position: "relative",
  },
  currentPhotoSlot: {
    borderColor: "#4CAF50",
    borderWidth: 3,
  },
  disabledPhotoSlot: {
    opacity: 0.5,
  },
  capturedPhoto: {
    width: "100%",
    height: "100%",
  },
  emptyPhotoSlot: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraInSlot: {
    width: "100%",
    height: "100%",
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
    zIndex: 10,
  },
  countdownText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "white",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  cameraIcon: {
    alignItems: "center",
    gap: 5,
  },
  readyText: {
    fontSize: 10,
    color: "#4CAF50",
    fontWeight: "600",
    textAlign: "center",
  },
  waitingIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
  photoNumberText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ccc",
  },
  instructionsContainer: {
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    borderRadius: 10,
    gap: 10,
  },
  instructionText: {
    fontSize: 14,
    color: "white",
    flex: 1,
  },
  permissionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 25,
    gap: 10,
  },
  permissionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  controlsContainer: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
    gap: 20,
  },
  photoProgress: {
    flexDirection: "row",
    gap: 10,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 1,
    borderColor: "white",
  },
  progressDotCompleted: {
    backgroundColor: "#4CAF50",
  },
  progressDotActive: {
    backgroundColor: "white",
    transform: [{ scale: 1.2 }],
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.3)",
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
  captureButtonCountdown: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  captureInstructionText: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
    fontWeight: "500",
  },
  actionButtons: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: "rgba(26, 26, 26, 0.95)",
  },
  backgroundButton: {
    borderRadius: 25,
    overflow: "hidden",
  },
  backgroundGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    gap: 10,
  },
  backgroundButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  // Strip layout styles
  stripLayout: {
    flex: 1,
    backgroundColor: "#F5DEB3",
    position: "relative",
  },
  stripPhotosSection: {
    top: -50,
    gap: 1,
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  stripLogoBottomCenter: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1,
  },
  stripLogoImage: {
    width: 200,
    height: 200,
    top: 50,
  },
  // Landscape layout styles
  landscapeLayout: {
    flex: 1,
    backgroundColor: "#F5DEB3",
    padding: 10,
  },
  landscapePhotosSection: {
    flex: 1,
    gap: 2,
    justifyContent: "center",
  },
  landscapePhotoRow: {
    top: -2,
    flexDirection: "row",
    justifyContent: "center",
  },
  landscapeBottomSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    height: 60,
  },
  landscapeContactInfo: {
    flex: 1,
    paddingLeft: 10,
  },
  talkToUsText: {
    top: 5,
    left: -10,
    fontSize: 10,
    fontWeight: "bold",
    color: "#333",
  },
  contactRow: {
top: 5,
    left:-10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  contactText: {
    fontSize: 8,
    color: "#333",
  },
  landscapeLogoCenter: {
    left: -80,
  },
  landscapeLogoImage: {
    width: 100,
    height: 100,
    
  },
  // Grid layout styles
  mainLayout: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F5DEB3",
  },
  photosSection: {
    flex: 0.7,
    padding: 8,
  },
  photoColumns: {
    flexDirection: "row",
    flex: 1,
    gap: 8,
    justifyContent: "flex-start",
  },
  photoColumn: {
    gap: 8,
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  brandingColumn: {
    flex: 0.3,
    position: "relative",
  },
  logoBottomRight: {
    position: "absolute",
    bottom: 10,
    right: 10,
  },
  logoImage: {
    width: 120,
    top: 30,
    left: 35,
    height: 120,
  },
  logoImage5: {
    width: 120,
    height: 120,
    top: 30,
    left: 35,
  },
})
