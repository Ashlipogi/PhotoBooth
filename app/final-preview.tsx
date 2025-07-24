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
  Alert,
  Platform,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Image } from "expo-image"
import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import * as MediaLibrary from "expo-media-library"
import { captureRef } from "react-native-view-shot"

// Convert cm to pixels at 300 DPI for exact measurements
const cmToPx = (cm: number) => cm * 118.11 // 1cm = 118.11px at 300 DPI

const backgroundImages = {
  nature1: require("./imgs/backgrounds/bg1.png"),
  nature2: require("./imgs/backgrounds/bg2.png"),
  beach: require("./imgs/backgrounds/bg3.png"),
}

const backgroundColors = {
  blue: "#4A90E2",
  pink: "#F5A9B8",
  green: "#5CB85C",
  purple: "#9B59B6",
  orange: "#FF8C42",
  teal: "#1ABC9C",
}

export default function FinalPreviewScreen() {
  const { templateId, photos, background } = useLocalSearchParams()
  const photoUris = photos ? JSON.parse(photos as string) : []
  const [screenData, setScreenData] = useState(Dimensions.get("window"))
  const [orientation, setOrientation] = useState(screenData.width > screenData.height ? "landscape" : "portrait")
  const [isDownloading, setIsDownloading] = useState(false)
  const [showDownloadOptions, setShowDownloadOptions] = useState(false)
  const viewRef = useRef<View>(null)
  const stripRef = useRef<View>(null)

  useEffect(() => {
    const onChange = (result: { window: any }) => {
      setScreenData(result.window)
      setOrientation(result.window.width > result.window.height ? "landscape" : "portrait")
    }
    const subscription = Dimensions.addEventListener("change", onChange)
    return () => subscription?.remove()
  }, [])

  const formatImageUri = (uri: string) => {
    // Ensure proper URI format for both platforms
    if (Platform.OS === "android" && !uri.startsWith("file://") && !uri.startsWith("http")) {
      return `file://${uri}`
    }
    return uri
  }

  const handleDownloadStrip = async () => {
    try {
      setIsDownloading(true)
      const { status } = await MediaLibrary.requestPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant permission to save photos to your gallery.")
        return
      }

      if (viewRef.current) {
        const stripSize = getPhotoStripSize()
        const uri = await captureRef(viewRef.current, {
          format: "jpg",
          quality: 1.0,
          width: stripSize.printWidth,
          height: stripSize.printHeight,
        })

        const asset = await MediaLibrary.createAssetAsync(uri)
        await MediaLibrary.createAlbumAsync("JR Studio Photo Booth", asset, false)

        const template = templateId as string
        const dimensions = getTemplateDimensions()

        Alert.alert("Strip Downloaded!", `Your photo strip has been saved at ${dimensions}`, [
          {
            text: "Create Another",
            onPress: () => router.push("/"),
          },
          {
            text: "OK",
            style: "default",
          },
        ])
      }
    } catch (error) {
      console.error("Download error:", error)
      Alert.alert("Error", "Failed to save photo strip to gallery.")
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDownloadIndividualPhotos = async () => {
    try {
      setIsDownloading(true)
      const { status } = await MediaLibrary.requestPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant permission to save photos to your gallery.")
        return
      }

      // Save each individual photo at print quality
      const template = templateId as string
      let photoWidth, photoHeight

      if (template === "4-strip") {
        photoWidth = cmToPx(3.35) // 33.5mm
        photoHeight = cmToPx(2.3) // 23mm
      } else if (template === "4-landscape") {
        photoWidth = cmToPx(7.78) // 77.8mm
        photoHeight = cmToPx(4.59) // 45.9mm
      } else {
        // Grid templates
        photoWidth = cmToPx(6) // 6cm
        photoHeight = cmToPx(4.5) // 4.5cm
      }

      const savedAssets = []
      for (let i = 0; i < photoUris.length; i++) {
        // Create a temporary view for each photo
        const photoView = (
          <View style={{ width: photoWidth, height: photoHeight }}>
            <Image
              source={{ uri: formatImageUri(photoUris[i]) }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          </View>
        )

        // For individual photos, we'll save the original URIs at print quality
        const asset = await MediaLibrary.createAssetAsync(photoUris[i])
        savedAssets.push(asset)
      }

      if (savedAssets.length > 0) {
        await MediaLibrary.createAlbumAsync("JR Studio Individual Photos", savedAssets[0], false)
        // Add remaining photos to the album
        for (let i = 1; i < savedAssets.length; i++) {
          const album = await MediaLibrary.getAlbumAsync("JR Studio Individual Photos")
          if (album) {
            await MediaLibrary.addAssetsToAlbumAsync([savedAssets[i]], album, false)
          }
        }
      }

      Alert.alert(
        "Individual Photos Downloaded!",
        `${photoUris.length} individual photos have been saved to your gallery at print quality.`,
        [
          {
            text: "Create Another",
            onPress: () => router.push("/"),
          },
          {
            text: "OK",
            style: "default",
          },
        ]
      )
    } catch (error) {
      console.error("Download error:", error)
      Alert.alert("Error", "Failed to save individual photos to gallery.")
    } finally {
      setIsDownloading(false)
    }
  }

  const handleChangeBackground = () => {
    router.back()
  }

  const getPhotoStripSize = () => {
    const template = templateId as string
    let printWidth, printHeight

    if (template === "4-strip") {
      // Vertical Strip template: 80mm × 210mm
      printWidth = cmToPx(8.0) // 80mm = 8.0cm
      printHeight = cmToPx(21.0) // 210mm = 21.0cm
    } else if (template === "4-landscape") {
      // Landscape template: EXACT 150mm × 113mm
      printWidth = cmToPx(15.0) // 150mm = 15.0cm
      printHeight = cmToPx(11.3) // 113mm = 11.3cm
    } else {
      // Grid templates: 14cm × 15cm (EXACT as requested)
      printWidth = cmToPx(14.0) // 14cm
      printHeight = cmToPx(15.0) // 15cm
    }

    // Scale down for screen display while maintaining aspect ratio
    const { width, height } = screenData
    const maxScreenWidth = orientation === "landscape" ? width * 0.6 : width - 100
    const maxScreenHeight = orientation === "landscape" ? height * 0.8 : height * 0.6

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

  const renderBackgroundElement = () => {
    const backgroundKey = background as string
    // Check if it's a hex color (custom color or predefined)
    if (backgroundKey.startsWith("#")) {
      return <View style={[styles.backgroundImage, { backgroundColor: backgroundKey }]} />
    }

    if (backgroundImages[backgroundKey as keyof typeof backgroundImages]) {
      return (
        <Image
          source={backgroundImages[backgroundKey as keyof typeof backgroundImages]}
          style={styles.backgroundImage}
          contentFit="cover"
        />
      )
    } else if (backgroundColors[backgroundKey as keyof typeof backgroundColors]) {
      return (
        <View
          style={[
            styles.backgroundImage,
            { backgroundColor: backgroundColors[backgroundKey as keyof typeof backgroundColors] },
          ]}
        />
      )
    }

    // Fallback to default background
    return <View style={[styles.backgroundImage, { backgroundColor: "#F5DEB3" }]} />
  }

  const renderFinalPhotoStrip = () => {
    const stripSize = getPhotoStripSize()
    const template = templateId as string

    if (template === "4-strip") {
      // Vertical Strip template: 80mm × 210mm, photos 33.5mm × 23mm
      const exactPhotoWidth = cmToPx(3.35) // 33.5mm = 3.35cm
      const exactPhotoHeight = cmToPx(2.3) // 23mm = 2.3cm
      const displayPhotoWidth = exactPhotoWidth * stripSize.scale
      const displayPhotoHeight = exactPhotoHeight * stripSize.scale

      return (
        <View style={[styles.photoStrip, { width: stripSize.width, height: stripSize.height }]} ref={viewRef}>
          {/* Background */}
          {renderBackgroundElement()}
          <View style={styles.stripLayout}>
            {/* Photos Section - Vertical layout */}
            <View style={styles.stripPhotosSection}>
              {photoUris.map((uri: string, index: number) => (
                <Image
                  key={index}
                  source={{ uri: formatImageUri(uri) }}
                  style={[
                    styles.stripPhotoSlot,
                    {
                      width: displayPhotoWidth,
                      height: displayPhotoHeight,
                    },
                  ]}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  placeholder="Loading..."
                />
              ))}
            </View>
            {/* Logo positioned at bottom center for strip template */}
            <View style={styles.stripLogoBottomCenter}>
              <Image source={require("@/app/imgs/design.png")} style={styles.stripLogoImage} contentFit="contain" />
            </View>
          </View>
        </View>
      )
    } else if (template === "4-landscape") {
      // EXACT landscape template: 150mm × 113mm, photos 77.8mm × 45.9mm
      const exactPhotoWidth = cmToPx(7.78) // EXACT 77.8mm = 7.78cm
      const exactPhotoHeight = cmToPx(4.59) // EXACT 45.9mm = 4.59cm
      const displayPhotoWidth = exactPhotoWidth * stripSize.scale
      const displayPhotoHeight = exactPhotoHeight * stripSize.scale

      // Calculate spacing for proper layout within 150mm × 113mm
      const totalWidth = stripSize.width
      const totalHeight = stripSize.height
      const photosAreaHeight = totalHeight * 0.75 // 75% for photos, 25% for bottom section
      const bottomSectionHeight = totalHeight * 0.25

      // Calculate gaps between photos
      const horizontalGap = (totalWidth - displayPhotoWidth * 2) / 3 // Space between and around photos
      const verticalGap = (photosAreaHeight - displayPhotoHeight * 2) / 3 // Space between and around photos

      return (
        <View style={[styles.photoStrip, { width: stripSize.width, height: stripSize.height }]} ref={viewRef}>
          {/* Background */}
          {renderBackgroundElement()}
          <View style={styles.landscapeLayout}>
            {/* Photos section - 2x2 grid with exact measurements */}
            <View style={[styles.landscapePhotosSection, { height: photosAreaHeight }]}>
              <View style={[styles.landscapePhotoRow, { marginBottom: verticalGap }]}>
                <View style={{ marginLeft: horizontalGap, marginRight: horizontalGap / 2 }}>
                  <Image
                    source={{ uri: formatImageUri(photoUris[0]) }}
                    style={[
                      {
                        width: displayPhotoWidth,
                        height: displayPhotoHeight,
                      },
                    ]}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    placeholder="Loading..."
                  />
                </View>
                <View style={{ marginLeft: horizontalGap / 2, marginRight: horizontalGap }}>
                  <Image
                    source={{ uri: formatImageUri(photoUris[1]) }}
                    style={[
                      {
                        width: displayPhotoWidth,
                        height: displayPhotoHeight,
                      },
                    ]}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    placeholder="Loading..."
                  />
                </View>
              </View>
              <View style={styles.landscapePhotoRow}>
                <View style={{ marginLeft: horizontalGap, marginRight: horizontalGap / 2 }}>
                  <Image
                    source={{ uri: formatImageUri(photoUris[2]) }}
                    style={[
                      {
                        width: displayPhotoWidth,
                        height: displayPhotoHeight,
                      },
                    ]}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    placeholder="Loading..."
                  />
                </View>
                <View style={{ marginLeft: horizontalGap / 2, marginRight: horizontalGap }}>
                  <Image
                    source={{ uri: formatImageUri(photoUris[3]) }}
                    style={[
                      {
                        width: displayPhotoWidth,
                        height: displayPhotoHeight,
                      },
                    ]}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    placeholder="Loading..."
                  />
                </View>
              </View>
            </View>
            {/* Bottom section with logo and contact info */}
            <View style={[styles.landscapeBottomSection, { height: bottomSectionHeight }]}>
              <View style={styles.landscapeContactInfo}>
                <Text style={[styles.talkToUsText, { fontSize: Math.max(8, stripSize.scale * 10) }]}>Talk to us</Text>
                <View style={styles.contactRow}>
                  <Ionicons name="call" size={Math.max(10, stripSize.scale * 12)} color="#333" />
                  <Text style={[styles.contactText, { fontSize: Math.max(6, stripSize.scale * 8) }]}>09478294412</Text>
                </View>
                <View style={styles.contactRow}>
                  <Ionicons name="logo-facebook" size={Math.max(10, stripSize.scale * 12)} color="#333" />
                  <Text style={[styles.contactText, { fontSize: Math.max(6, stripSize.scale * 8) }]}>JR. Studio</Text>
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
      // Grid templates: EXACT 14cm × 15cm with photos 6cm × 4.5cm
      const exactPhotoWidth = cmToPx(6.0) // 6cm width
      const exactPhotoHeight = cmToPx(4.5) // 4.5cm height
      const displayPhotoWidth = exactPhotoWidth * stripSize.scale
      const displayPhotoHeight = exactPhotoHeight * stripSize.scale

      if (template.includes("4") && template.includes("grid")) {
        // 4 Photos Grid with background
        return (
          <View style={[styles.photoStrip, { width: stripSize.width, height: stripSize.height }]} ref={viewRef}>
            {/* Background */}
            {renderBackgroundElement()}
            <View style={styles.mainLayout}>
              {/* Left side - Photos in 2 columns */}
              <View style={styles.photosSection}>
                <View style={styles.photoColumns}>
                  {/* First column - 3 photos */}
                  <View style={styles.photoColumn}>
                    <Image
                      source={{ uri: formatImageUri(photoUris[0]) }}
                      style={[
                        styles.photoSlot,
                        {
                          width: displayPhotoWidth,
                          height: displayPhotoHeight,
                        },
                      ]}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      placeholder="Loading..."
                    />
                    <Image
                      source={{ uri: formatImageUri(photoUris[1]) }}
                      style={[
                        styles.photoSlot,
                        {
                          width: displayPhotoWidth,
                          height: displayPhotoHeight,
                        },
                      ]}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      placeholder="Loading..."
                    />
                    <Image
                      source={{ uri: formatImageUri(photoUris[2]) }}
                      style={[
                        styles.photoSlot,
                        {
                          width: displayPhotoWidth,
                          height: displayPhotoHeight,
                        },
                      ]}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      placeholder="Loading..."
                    />
                  </View>
                  {/* Second column - 1 photo */}
                  <View style={styles.photoColumn}>
                    <Image
                      source={{ uri: formatImageUri(photoUris[3]) }}
                      style={[
                        styles.photoSlot,
                        {
                          width: displayPhotoWidth,
                          height: displayPhotoHeight,
                        },
                      ]}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      placeholder="Loading..."
                    />
                  </View>
                </View>
              </View>
              {/* Right side - Branding */}
              <View style={styles.brandingColumn}>
                <View style={styles.logoBottomRight}>
                  <Image source={require("@/app/imgs/design.png")} style={styles.logoImage} contentFit="contain" />
                </View>
              </View>
            </View>
          </View>
        )
      } else if (template.includes("5")) {
        // 5 Photos Collage with background
        return (
          <View style={[styles.photoStrip, { width: stripSize.width, height: stripSize.height }]} ref={viewRef}>
            {renderBackgroundElement()}
            <View style={styles.mainLayout}>
              {/* Left side - Photos in 2 columns */}
              <View style={styles.photosSection}>
                <View style={styles.photoColumns}>
                  {/* First column - 3 photos */}
                  <View style={styles.photoColumn}>
                    <Image
                      source={{ uri: formatImageUri(photoUris[0]) }}
                      style={[
                        styles.photoSlot,
                        {
                          width: displayPhotoWidth,
                          height: displayPhotoHeight,
                        },
                      ]}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      placeholder="Loading..."
                    />
                    <Image
                      source={{ uri: formatImageUri(photoUris[1]) }}
                      style={[
                        styles.photoSlot,
                        {
                          width: displayPhotoWidth,
                          height: displayPhotoHeight,
                        },
                      ]}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      placeholder="Loading..."
                    />
                    <Image
                      source={{ uri: formatImageUri(photoUris[2]) }}
                      style={[
                        styles.photoSlot,
                        {
                          width: displayPhotoWidth,
                          height: displayPhotoHeight,
                        },
                      ]}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      placeholder="Loading..."
                    />
                  </View>
                  {/* Second column - 2 photos */}
                  <View style={styles.photoColumn}>
                    <Image
                      source={{ uri: formatImageUri(photoUris[3]) }}
                      style={[
                        styles.photoSlot,
                        {
                          width: displayPhotoWidth,
                          height: displayPhotoHeight,
                        },
                      ]}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      placeholder="Loading..."
                    />
                    <Image
                      source={{ uri: formatImageUri(photoUris[4]) }}
                      style={[
                        styles.photoSlot,
                        {
                          width: displayPhotoWidth,
                          height: displayPhotoHeight,
                        },
                      ]}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      placeholder="Loading..."
                    />
                  </View>
                </View>
              </View>
              {/* Right side - Branding */}
              <View style={styles.brandingColumn}>
                <View style={styles.logoSection}>
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
      return "8.0cm × 21.0cm (Each photo: 3.35cm × 2.3cm)"
    } else if (template === "4-landscape") {
      return "15.0cm × 11.3cm (Each photo: 7.78cm × 4.59cm)"
    } else {
      return "14.0cm × 15.0cm (Each photo: 6.0cm × 4.5cm)"
    }
  }

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d", "#1a1a1a"]} style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, orientation === "landscape" && styles.headerLandscape]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push("/")}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, orientation === "landscape" && styles.headerTitleLandscape]}>
          Final Preview
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, orientation === "landscape" && styles.scrollContentLandscape]}
        showsVerticalScrollIndicator={false}
      >
        {/* Final Photo Strip Preview */}
        <View style={[styles.previewContainer, orientation === "landscape" && styles.previewContainerLandscape]}>
          <Text style={[styles.previewTitle, orientation === "landscape" && styles.previewTitleLandscape]}>
            Your Final Photo Strip
          </Text>
          <Text style={[styles.previewSubtitle, orientation === "landscape" && styles.previewSubtitleLandscape]}>
            {getTemplateDimensions()}
          </Text>
          {renderFinalPhotoStrip()}
        </View>

        {/* Action Buttons */}
        <View style={[styles.actionButtons, orientation === "landscape" && styles.actionButtonsLandscape]}>
          <TouchableOpacity style={styles.changeBackgroundButton} onPress={handleChangeBackground}>
            <Ionicons name="color-palette" size={20} color="#4CAF50" />
            <Text style={styles.changeBackgroundText}>Change Background</Text>
          </TouchableOpacity>

          {/* Download Options Button */}
          <TouchableOpacity
            style={styles.downloadOptionsButton}
            onPress={() => setShowDownloadOptions(!showDownloadOptions)}
          >
            <Ionicons name="download" size={20} color="#2196F3" />
            <Text style={styles.downloadOptionsText}>Download Options</Text>
            <Ionicons 
              name={showDownloadOptions ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#2196F3" 
            />
          </TouchableOpacity>

          {/* Download Options */}
          {showDownloadOptions && (
            <View style={styles.downloadOptionsContainer}>
              <TouchableOpacity
                style={[styles.downloadOption, isDownloading && styles.downloadButtonDisabled]}
                onPress={handleDownloadStrip}
                disabled={isDownloading}
              >
                <LinearGradient colors={["#4CAF50", "#45a049"]} style={styles.downloadGradient}>
                  <Ionicons name="document" size={20} color="white" />
                  <Text style={styles.downloadButtonText}>
                    {isDownloading ? "Saving Strip..." : "Download Photo Strip"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.downloadOption, isDownloading && styles.downloadButtonDisabled]}
                onPress={handleDownloadIndividualPhotos}
                disabled={isDownloading}
              >
                <LinearGradient colors={["#2196F3", "#1976D2"]} style={styles.downloadGradient}>
                  <Ionicons name="images" size={20} color="white" />
                  <Text style={styles.downloadButtonText}>
                    {isDownloading ? "Saving Photos..." : "Download Individual Photos"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
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
  headerLandscape: {
    paddingTop: 40,
    paddingBottom: 15,
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
  headerTitleLandscape: {
    fontSize: 18,
  },
  placeholder: {
    width: 44,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  scrollContentLandscape: {
    paddingBottom: 20,
  },
  previewContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  previewContainerLandscape: {
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  previewTitleLandscape: {
    fontSize: 20,
    marginBottom: 3,
  },
  previewSubtitle: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 20,
    textAlign: "center",
  },
  previewSubtitleLandscape: {
    fontSize: 12,
    marginBottom: 15,
  },
  photoStrip: {
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
    position: "relative",
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  // Strip layout styles
  stripLayout: {
    flex: 1,
    position: "relative",
  },
  stripPhotosSection: {
    top: -50,
    gap: 2,
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  stripPhotoSlot: {
    borderRadius: 0,
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
  // Landscape layout styles - FIXED AND RESPONSIVE
  landscapeLayout: {
    flex: 1,
    padding: 10,
  },
  landscapePhotosSection: {
    flex: 1,
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
  // Grid layout styles
  photosSection: {
    flex: 0.7,
    padding: 8,
  },
  actionButtons: {
    paddingHorizontal: 20,
    gap: 15,
  },
  actionButtonsLandscape: {
    paddingHorizontal: 40,
    gap: 10,
  },
  changeBackgroundButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderWidth: 1,
    borderColor: "#4CAF50",
    paddingVertical: 15,
    borderRadius: 25,
    gap: 10,
  },
  changeBackgroundText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4CAF50",
  },
  downloadOptionsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(33, 150, 243, 0.1)",
    borderWidth: 1,
    borderColor: "#2196F3",
    paddingVertical: 15,
    borderRadius: 25,
    gap: 10,
  },
  downloadOptionsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2196F3",
    flex: 1,
    textAlign: "center",
  },
  downloadOptionsContainer: {
    gap: 10,
    paddingTop: 10,
  },
  downloadOption: {
    borderRadius: 25,
    overflow: "hidden",
  },
  downloadGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    gap: 10,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  downloadButtonDisabled: {
    opacity: 0.6,
  },
  mainLayout: {
    flex: 1,
    flexDirection: "row",
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
  photoSlot: {
    borderRadius: 0,
  },
  brandingColumn: {
    flex: 0.3,
    position: "relative",
  },
  logoSection: {
    justifyContent: "center",
    alignItems: "center",
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
    top: 268,
    left: 20,
  },
  logoBottomRight: {
    position: "absolute",
    bottom: 10,
    right: 10,
  },
})