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
import QRCode from "react-native-qrcode-svg"
import * as Sharing from "expo-sharing"

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
  const [showQRCode, setShowQRCode] = useState(false)
  const [shareableUrl, setShareableUrl] = useState("")
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

  useEffect(() => {
    // Generate shareable URL when component mounts
    generateShareableUrl()
  }, [])

  const generateShareableUrl = async () => {
    try {
      // Create a temporary file with the photo data
      const photoData = {
        templateId,
        photos: photoUris,
        background,
        timestamp: Date.now(),
      }
      // In a real app, you would upload this to your server and get a URL
      // For now, we'll create a mock URL that could be handled by your app
      const mockUrl = `https://yourapp.com/download/${Date.now()}?template=${templateId}&bg=${background}`
      setShareableUrl(mockUrl)
    } catch (error) {
      console.error("Error generating shareable URL:", error)
    }
  }

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

  const handleDownloadAllPhotos = async () => {
    try {
      setIsDownloading(true)
      const { status } = await MediaLibrary.requestPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant permission to save photos to your gallery.")
        return
      }

      const savedAssets = []
      for (let i = 0; i < photoUris.length; i++) {
        const asset = await MediaLibrary.createAssetAsync(photoUris[i])
        savedAssets.push(asset)
      }

      if (savedAssets.length > 0) {
        await MediaLibrary.createAlbumAsync("JR Studio All Photos", savedAssets[0], false)
        // Add remaining photos to the album
        for (let i = 1; i < savedAssets.length; i++) {
          const album = await MediaLibrary.getAlbumAsync("JR Studio All Photos")
          if (album) {
            await MediaLibrary.addAssetsToAlbumAsync([savedAssets[i]], album, false)
          }
        }
      }

      Alert.alert(
        "All Photos Downloaded!",
        `${photoUris.length} photos have been saved to your gallery at print quality.`,
        [
          {
            text: "Create Another",
            onPress: () => router.push("/"),
          },
          {
            text: "OK",
            style: "default",
          },
        ],
      )
    } catch (error) {
      console.error("Download error:", error)
      Alert.alert("Error", "Failed to save all photos to gallery.")
    } finally {
      setIsDownloading(false)
    }
  }

  const handleShareQR = async () => {
    try {
      if (shareableUrl) {
        await Sharing.shareAsync(shareableUrl, {
          dialogTitle: "Share Photo Strip",
          mimeType: "text/plain",
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
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
      printWidth = cmToPx(30) // 80mm = 8.0cm
      printHeight = cmToPx(93) // 210mm = 21.0cm
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
    const maxScreenWidth = orientation === "landscape" ? width * 0.5 : width - 100
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
      const exactPhotoWidth = cmToPx(26) // 33.5mm = 3.35cm
      const exactPhotoHeight = cmToPx(18) // 23mm = 2.3cm
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
      const exactPhotoWidth = cmToPx(7.20) // EXACT 77.8mm = 7.78cm
      const exactPhotoHeight = cmToPx(4.20) // EXACT 45.9mm = 4.59cm
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

  const renderActionButtons = () => (
    <View style={[styles.actionButtons, orientation === "landscape" && styles.actionButtonsLandscape]}>
      <TouchableOpacity
        style={[styles.changeBackgroundButton, orientation === "landscape" && styles.changeBackgroundButtonLandscape]}
        onPress={handleChangeBackground}
      >
        <Ionicons name="color-palette" size={orientation === "landscape" ? 18 : 20} color="#4CAF50" />
        <Text
          style={[styles.changeBackgroundText, orientation === "landscape" && styles.changeBackgroundTextLandscape]}
        >
          Change Background
        </Text>
      </TouchableOpacity>

      {/* Download Options Button */}
      <TouchableOpacity
        style={[styles.downloadOptionsButton, orientation === "landscape" && styles.downloadOptionsButtonLandscape]}
        onPress={() => setShowDownloadOptions(!showDownloadOptions)}
      >
        <Ionicons name="download" size={orientation === "landscape" ? 18 : 20} color="#2196F3" />
        <Text style={[styles.downloadOptionsText, orientation === "landscape" && styles.downloadOptionsTextLandscape]}>
          Download Options
        </Text>
        <Ionicons
          name={showDownloadOptions ? "chevron-up" : "chevron-down"}
          size={orientation === "landscape" ? 18 : 20}
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
            <LinearGradient
              colors={["#4CAF50", "#45a049"]}
              style={[styles.downloadGradient, orientation === "landscape" && styles.downloadGradientLandscape]}
            >
              <Ionicons name="document" size={orientation === "landscape" ? 18 : 20} color="white" />
              <Text
                style={[styles.downloadButtonText, orientation === "landscape" && styles.downloadButtonTextLandscape]}
              >
                {isDownloading ? "Saving Strip..." : "Download Photo Strip"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.downloadOption, isDownloading && styles.downloadButtonDisabled]}
            onPress={handleDownloadAllPhotos}
            disabled={isDownloading}
          >
            <LinearGradient
              colors={["#2196F3", "#1976D2"]}
              style={[styles.downloadGradient, orientation === "landscape" && styles.downloadGradientLandscape]}
            >
              <Ionicons name="images" size={orientation === "landscape" ? 18 : 20} color="white" />
              <Text
                style={[styles.downloadButtonText, orientation === "landscape" && styles.downloadButtonTextLandscape]}
              >
                {isDownloading ? "Saving Photos..." : "Download All Photos"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* QR Code Button */}
      <TouchableOpacity
        style={[styles.qrButton, orientation === "landscape" && styles.qrButtonLandscape]}
        onPress={() => setShowQRCode(!showQRCode)}
      >
        <Ionicons name="qr-code" size={orientation === "landscape" ? 18 : 20} color="#FF9800" />
        <Text style={[styles.qrButtonText, orientation === "landscape" && styles.qrButtonTextLandscape]}>
          Share via QR Code
        </Text>
        <Ionicons
          name={showQRCode ? "chevron-up" : "chevron-down"}
          size={orientation === "landscape" ? 18 : 20}
          color="#FF9800"
        />
      </TouchableOpacity>

      {/* QR Code Display */}
      {showQRCode && shareableUrl && (
        <View style={[styles.qrCodeContainer, orientation === "landscape" && styles.qrCodeContainerLandscape]}>
          <Text style={[styles.qrCodeTitle, orientation === "landscape" && styles.qrCodeTitleLandscape]}>
            Scan to Download on Another Device
          </Text>
          <View style={[styles.qrCodeWrapper, orientation === "landscape" && styles.qrCodeWrapperLandscape]}>
            <QRCode
              value={shareableUrl}
              size={orientation === "landscape" ? 120 : 150}
              backgroundColor="white"
              color="black"
            />
          </View>
          <Text style={styles.qrCodeSubtitle}>Others can scan this code to download your photos</Text>
          <TouchableOpacity style={styles.shareUrlButton} onPress={handleShareQR}>
            <Ionicons name="share" size={14} color="#FF9800" />
            <Text style={styles.shareUrlText}>Share Link</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )

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

  if (orientation === "landscape") {
    return (
      <LinearGradient colors={["#1a1a1a", "#2d2d2d", "#1a1a1a"]} style={styles.container}>
        <StatusBar barStyle="light-content" />
        {/* Header */}
        <View style={[styles.header, styles.headerLandscape]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push("/")}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, styles.headerTitleLandscape]}>Final Preview</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Dimensions below header */}
        <View style={styles.dimensionsContainer}>
          <Text style={[styles.previewSubtitle, styles.previewSubtitleLandscape]}>{getTemplateDimensions()}</Text>
        </View>

        {/* Landscape Layout: Frame on Left, Buttons on Right */}
        <View style={styles.landscapeMainContainer}>
          {/* Left Side - Photo Frame */}
          <View style={styles.landscapeFrameContainer}>{renderFinalPhotoStrip()}</View>

          {/* Right Side - Action Buttons */}
          <ScrollView style={styles.landscapeButtonsContainer} showsVerticalScrollIndicator={false}>
            {renderActionButtons()}
          </ScrollView>
        </View>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d", "#1a1a1a"]} style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push("/")}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Final Preview</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Dimensions below header */}
      <View style={styles.dimensionsContainer}>
        <Text style={styles.previewSubtitle}>{getTemplateDimensions()}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Final Photo Strip Preview - Now positioned directly without preview container */}
        <View style={styles.stripContainer}>{renderFinalPhotoStrip()}</View>

        {/* Action Buttons */}
        {renderActionButtons()}
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
  landscapeMainContainer: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 50,
  },
  landscapeFrameContainer: {
    flex: 0.7,
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 10,
  },
  landscapeButtonsContainer: {
    flex: 0.3,
    paddingLeft: 10,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // New container for the strip without preview text
  stripContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 40,
    marginTop: 20,
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

    top: 10,
    flex: 1,
    position: "relative",
  },
  stripPhotosSection: {
    top: -50,
    gap: 5,
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
    width: 190,
    height: 190,
    top: 40,
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
    top: 5,
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
    top: 1,
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
    paddingHorizontal: 0,
    gap: 10,
    alignSelf: "center",
    width: "90%",
    maxWidth: 300,
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
  qrButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 152, 0, 0.1)",
    borderWidth: 1,
    borderColor: "#FF9800",
    paddingVertical: 15,
    borderRadius: 25,
    gap: 10,
  },
  qrButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF9800",
    flex: 1,
    textAlign: "center",
  },
  qrCodeContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    marginTop: 10,
  },
  qrCodeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginBottom: 15,
    textAlign: "center",
  },
  qrCodeWrapper: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  qrCodeSubtitle: {
    fontSize: 12,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 15,
  },
  shareUrlButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 152, 0, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    gap: 5,
  },
  shareUrlText: {
    fontSize: 14,
    color: "#FF9800",
    fontWeight: "600",
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
  changeBackgroundButtonLandscape: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  changeBackgroundTextLandscape: {
    fontSize: 14,
  },
  downloadOptionsButtonLandscape: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  downloadOptionsTextLandscape: {
    fontSize: 14,
  },
  downloadGradientLandscape: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 8,
  },
  downloadButtonTextLandscape: {
    fontSize: 14,
  },
  qrButtonLandscape: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  qrButtonTextLandscape: {
    fontSize: 14,
  },
  qrCodeContainerLandscape: {
    padding: 15,
    marginTop: 8,
  },
  qrCodeTitleLandscape: {
    fontSize: 14,
    marginBottom: 10,
  },
  qrCodeWrapperLandscape: {
    padding: 10,
    marginBottom: 10,
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
  dimensionsContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    top: -25,
  },
})
