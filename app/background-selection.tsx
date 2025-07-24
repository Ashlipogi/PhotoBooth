"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar, ScrollView, TextInput } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Image } from "expo-image"
import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"

const backgrounds = [
  // Image backgrounds
  { id: "nature1", name: "Background 1", type: "image", image: require("./imgs/backgrounds/bg1.png") },
  { id: "nature2", name: "Background 2", type: "image", image: require("./imgs/backgrounds/bg2.png") },
  { id: "beach", name: "Background 3", type: "image", image: require("./imgs/backgrounds/bg3.png") },
  // Predefined color backgrounds
  { id: "blue", name: "Ocean Blue", type: "color", color: "#4A90E2" },
  { id: "pink", name: "Soft Pink", type: "color", color: "#F5A9B8" },
  { id: "green", name: "Forest Green", type: "color", color: "#5CB85C" },
  { id: "purple", name: "Royal Purple", type: "color", color: "#9B59B6" },
  { id: "orange", name: "Sunset Orange", type: "color", color: "#FF8C42" },
  { id: "teal", name: "Tropical Teal", type: "color", color: "#1ABC9C" },
]

export default function BackgroundSelectionScreen() {
  const { templateId, photos } = useLocalSearchParams()
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null)
  const [screenData, setScreenData] = useState(Dimensions.get("window"))
  const [orientation, setOrientation] = useState(screenData.width > screenData.height ? "landscape" : "portrait")
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [customColor, setCustomColor] = useState("#FF0000")

  useEffect(() => {
    const onChange = (result: { window: any }) => {
      setScreenData(result.window)
      setOrientation(result.window.width > result.window.height ? "landscape" : "portrait")
    }
    const subscription = Dimensions.addEventListener("change", onChange)
    return () => subscription?.remove()
  }, [])

  const handleBackgroundSelect = (backgroundId: string) => {
    setSelectedBackground(backgroundId)
    setShowColorPicker(false)
  }

  const handleCustomColorSelect = () => {
    const customId = `custom-${customColor.replace("#", "")}`
    setSelectedBackground(customId)
    setShowColorPicker(false)
  }

  const handleProceed = () => {
    if (selectedBackground) {
      let backgroundValue = selectedBackground

      // If it's a custom color, pass the hex value
      if (selectedBackground.startsWith("custom-")) {
        backgroundValue = customColor
      }

      router.push({
        pathname: "/final-preview",
        params: {
          templateId: templateId as string,
          photos: photos as string,
          background: backgroundValue,
        },
      })
    }
  }

  const getBackgroundPreviewSize = () => {
    const { width } = screenData
    const padding = 40
    const gap = 15
    if (orientation === "portrait") {
      const availableWidth = width - padding - gap
      const backgroundWidth = availableWidth / 2
      return {
        width: backgroundWidth,
        height: backgroundWidth * 0.8,
      }
    } else {
      const availableWidth = width - padding - gap * 2
      const backgroundWidth = availableWidth / 3
      return {
        width: backgroundWidth,
        height: backgroundWidth * 0.8,
      }
    }
  }

  const renderBackground = (background: any) => {
    const previewSize = getBackgroundPreviewSize()
    return (
      <TouchableOpacity
        key={background.id}
        style={[
          styles.backgroundContainer,
          {
            width: previewSize.width,
            height: previewSize.height,
          },
          selectedBackground === background.id && styles.selectedBackground,
        ]}
        onPress={() => handleBackgroundSelect(background.id)}
      >
        {background.type === "image" ? (
          <Image source={background.image} style={styles.backgroundImage} contentFit="cover" />
        ) : (
          <View style={[styles.colorBackground, { backgroundColor: background.color }]} />
        )}
        <View style={styles.backgroundOverlay}>
          <Text style={styles.backgroundName}>{background.name}</Text>
          {selectedBackground === background.id && (
            <View style={styles.selectedIcon}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  const renderCustomColorPicker = () => {
    const previewSize = getBackgroundPreviewSize()
    return (
      <TouchableOpacity
        style={[
          styles.backgroundContainer,
          {
            width: previewSize.width,
            height: previewSize.height,
          },
          selectedBackground?.startsWith("custom-") && styles.selectedBackground,
        ]}
        onPress={() => setShowColorPicker(!showColorPicker)}
      >
        <View style={[styles.colorBackground, { backgroundColor: customColor }]} />
        <View style={styles.backgroundOverlay}>
          <Text style={styles.backgroundName}>Custom Color</Text>
          <Ionicons name="color-palette" size={20} color="white" />
        </View>
        {selectedBackground?.startsWith("custom-") && (
          <View style={styles.selectedIconAbsolute}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          </View>
        )}
      </TouchableOpacity>
    )
  }

  const renderBackgroundsInRows = () => {
    const columns = orientation === "portrait" ? 2 : 3
    const allBackgrounds = [...backgrounds]
    const rows = []

    for (let i = 0; i < allBackgrounds.length; i += columns) {
      const rowBackgrounds = allBackgrounds.slice(i, i + columns)
      rows.push(
        <View key={i} style={styles.backgroundRow}>
          {rowBackgrounds.map(renderBackground)}
          {rowBackgrounds.length < columns &&
            Array.from({ length: columns - rowBackgrounds.length }, (_, index) => (
              <View key={`empty-${index}`} style={{ width: getBackgroundPreviewSize().width }} />
            ))}
        </View>,
      )
    }

    // Add custom color picker row
    rows.push(
      <View key="custom" style={styles.backgroundRow}>
        {renderCustomColorPicker()}
        {Array.from({ length: columns - 1 }, (_, index) => (
          <View key={`custom-empty-${index}`} style={{ width: getBackgroundPreviewSize().width }} />
        ))}
      </View>,
    )

    return rows
  }

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d", "#1a1a1a"]} style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Background</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Background Selection */}
        <View style={styles.backgroundSection}>
          <Text style={styles.sectionTitle}>Select Your Background</Text>
          <Text style={styles.sectionSubtitle}>Choose a beautiful background or customize your own color</Text>
          <View style={styles.backgroundsContainer}>{renderBackgroundsInRows()}</View>
        </View>

        {/* Color Picker */}
        {showColorPicker && (
          <View style={styles.colorPickerSection}>
            <Text style={styles.colorPickerTitle}>Custom Color</Text>
            <View style={styles.colorPickerContainer}>
              <TextInput
                style={styles.colorInput}
                value={customColor}
                onChangeText={setCustomColor}
                placeholder="#FF0000"
                placeholderTextColor="#999"
                maxLength={7}
              />
              <TouchableOpacity style={styles.applyColorButton} onPress={handleCustomColorSelect}>
                <Text style={styles.applyColorText}>Apply</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.colorPreview}>
              <View style={[styles.colorPreviewBox, { backgroundColor: customColor }]} />
              <Text style={styles.colorPreviewText}>Preview</Text>
            </View>
          </View>
        )}

        {/* Proceed Button */}
        {selectedBackground && (
          <TouchableOpacity style={styles.proceedButton} onPress={handleProceed}>
            <LinearGradient colors={["#4CAF50", "#45a049"]} style={styles.proceedGradient}>
              <Ionicons name="eye" size={24} color="white" />
              <Text style={styles.proceedText}>Preview Final Result</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
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
  backgroundSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 25,
  },
  backgroundsContainer: {
    gap: 15,
  },
  backgroundRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },
  backgroundContainer: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "transparent",
    position: "relative",
  },
  selectedBackground: {
    borderColor: "#4CAF50",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  colorBackground: {
    width: "100%",
    height: "100%",
  },
  backgroundOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backgroundName: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  selectedIcon: {
    backgroundColor: "white",
    borderRadius: 12,
  },
  selectedIconAbsolute: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "white",
    borderRadius: 12,
  },
  colorPickerSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
  },
  colorPickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 15,
    textAlign: "center",
  },
  colorPickerContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },
  colorInput: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  applyColorButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: "center",
  },
  applyColorText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  colorPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  colorPreviewBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "white",
  },
  colorPreviewText: {
    color: "white",
    fontSize: 16,
  },
  proceedButton: {
    marginHorizontal: 20,
    borderRadius: 25,
    overflow: "hidden",
  },
  proceedGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 30,
    gap: 10,
  },
  proceedText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
})
