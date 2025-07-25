"use client"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar, ScrollView, Platform } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Image } from "expo-image"
import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"

// Convert cm to pixels at 300 DPI for exact measurements
const cmToPx = (cm: number) => cm * 118.11 // 1cm = 118.11px at 300 DPI

export default function PreviewScreen() {
  const { templateId, photos } = useLocalSearchParams()
  const photoUris = photos ? JSON.parse(photos as string) : []
  const [screenData, setScreenData] = useState(Dimensions.get("window"))

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

  const handleChooseBackground = () => {
    router.push({
      pathname: "/background-selection",
      params: {
        templateId: templateId as string,
        photos: JSON.stringify(photoUris),
      },
    })
  }

  const getPhotoStripSize = () => {
    const template = templateId as string
    let printWidth, printHeight

    if (template === "4-strip") {
      printWidth = cmToPx(30)
      printHeight = cmToPx(93)
    } else if (template === "4-landscape") {
      printWidth = cmToPx(16)
      printHeight = cmToPx(13)
    } else {
      printWidth = cmToPx(14)
      printHeight = cmToPx(15)
    }

    const { width, height } = screenData
    const maxScreenWidth = width - 100
    const maxScreenHeight = height * 0.6

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
    return (
      <View
        key={index}
        style={[
          styles.photoSlotContainer,
          {
            width: photoWidth,
            height: photoHeight,
          },
        ]}
      >
        {index < photoUris.length ? (
          <Image
            source={{ uri: formatImageUri(photoUris[index]) }}
            style={styles.capturedPhoto}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.emptyPhotoSlot}>
            <Text style={styles.photoNumberText}>{index + 1}</Text>
          </View>
        )}
      </View>
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
      const exactPhotoWidth = cmToPx(7.9)
      const exactPhotoHeight = cmToPx(4.59)
      const displayPhotoWidth = exactPhotoWidth * stripSize.scale
      const displayPhotoHeight = exactPhotoHeight * stripSize.scale

      return (
        <View style={[styles.photoStrip, { width: stripSize.width, height: stripSize.height }]}>
          <View style={styles.landscapeLayout}>
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

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d", "#1a1a1a"]} style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push("/")}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photo Preview</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Photo Strip Preview */}
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Your Photo Strip</Text>
          <Text style={styles.previewSubtitle}>{getTemplateDimensions()}</Text>
          {renderPhotoLayout()}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.backgroundButton} onPress={handleChooseBackground}>
            <LinearGradient colors={["#4CAF50", "#45a049"]} style={styles.backgroundGradient}>
              <Ionicons name="color-palette" size={20} color="white" />
              <Text style={styles.backgroundButtonText}>Choose Background</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  placeholder: {
    width: 44,
  },
  scrollContent: {
    paddingBottom: 40,
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
    overflow: "hidden",
    position: "relative",
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
  photoNumberText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ccc",
  },
  actionButtons: {
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 30,
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
  // Layout styles remain the same as original
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
    left: -10,
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
