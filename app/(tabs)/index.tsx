"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar, ScrollView } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Image } from "expo-image"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"

interface Template {
  id: string
  name: string
  photoCount: number
  layout: "grid" | "strip" | "collage" | "landscape"
  description: string
}

const templates: Template[] = [
  { id: "4-grid", name: "4 Photos Grid", photoCount: 4, layout: "grid", description: "Classic 2x2 grid layout" },
  {
    id: "5-collage",
    name: "5 Photos Collage",
    photoCount: 5,
    layout: "collage",
    description: "Creative collage style",
  },
  { id: "4-strip", name: "4 Photos Strip", photoCount: 4, layout: "strip", description: "Vertical photo strip" },
  {
    id: "4-landscape",
    name: "4 Photos Landscape",
    photoCount: 4,
    layout: "landscape",
    description: "Horizontal landscape layout",
  },
]

export default function HomeScreen() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [screenData, setScreenData] = useState(Dimensions.get("window"))
  const [orientation, setOrientation] = useState(screenData.width > screenData.height ? "landscape" : "portrait")

  useEffect(() => {
    const onChange = (result: { window: any }) => {
      setScreenData(result.window)
      setOrientation(result.window.width > result.window.height ? "landscape" : "portrait")
    }
    const subscription = Dimensions.addEventListener("change", onChange)
    return () => subscription?.remove()
  }, [])

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
  }

  const handleProceed = () => {
    if (selectedTemplate) {
      router.push({
        pathname: "/preview",
        params: { templateId: selectedTemplate },
      })
    }
  }

  const getTemplatePreviewSize = () => {
    const { width } = screenData
    const padding = 40
    const gap = 20
    if (orientation === "portrait") {
      const availableWidth = width - padding - gap
      const templateWidth = availableWidth / 2
      return {
        width: templateWidth,
        height: templateWidth * 1.3,
      }
    } else {
      const availableWidth = width - padding - gap * 2
      const templateWidth = availableWidth / 3
      return {
        width: templateWidth,
        height: templateWidth * 1.3,
      }
    }
  }

  const renderPhotoSlots = (template: Template) => {
    if (template.layout === "grid" && template.id === "4-grid") {
      // 4 Photos Grid: 1st column 3 photos, 2nd column 1 photo
      return (
        <View style={styles.gridLayout}>
          <View style={styles.gridRow}>
            {/* First column - 3 photos stacked vertically */}
            <View style={styles.gridColumn}>
              <View style={styles.photoSlot}>
                <Ionicons name="image-outline" size={12} color="#999" />
              </View>
              <View style={styles.photoSlot}>
                <Ionicons name="image-outline" size={12} color="#999" />
              </View>
              <View style={styles.photoSlot}>
                <Ionicons name="image-outline" size={12} color="#999" />
              </View>
            </View>
            {/* Second column - 1 photo */}
            <View style={styles.gridColumn}>
              <View style={[styles.photoSlot, styles.singlePhotoSlot]}>
                <Ionicons name="image-outline" size={12} color="#999" />
              </View>
              <View style={[styles.photoSlot, styles.singlePhotoSlot, { opacity: 0 }]}>
                {/* Still rendered, but invisible */}
                <Ionicons name="image-outline" size={12} color="#999" />
              </View>
              <View style={[styles.photoSlot, styles.singlePhotoSlot, { opacity: 0 }]}>
                <Ionicons name="image-outline" size={12} color="#999" />
              </View>
            </View>
          </View>
        </View>
      )
    } else if (template.layout === "collage" && template.id === "5-collage") {
      // 5 Photos Collage: 1st column 3 photos, 2nd column 2 photos
      return (
        <View style={styles.gridLayout}>
          <View style={styles.gridRow}>
            {/* First column - 3 photos stacked vertically */}
            <View style={styles.gridColumn}>
              <View style={styles.photoSlot}>
                <Ionicons name="image-outline" size={12} color="#999" />
              </View>
              <View style={styles.photoSlot}>
                <Ionicons name="image-outline" size={12} color="#999" />
              </View>
              <View style={styles.photoSlot}>
                <Ionicons name="image-outline" size={12} color="#999" />
              </View>
            </View>
            {/* Second column - 2 photos stacked vertically */}
            <View style={styles.gridColumn}>
              <View style={styles.photoSlot}>
                <Ionicons name="image-outline" size={14} color="#999" />
              </View>
              <View style={styles.photoSlot}>
                <Ionicons name="image-outline" size={14} color="#999" />
              </View>
              <View style={[styles.photoSlot, styles.singlePhotoSlot, { opacity: 0 }]}>
                <Ionicons name="image-outline" size={14} color="#999" />
              </View>
            </View>
          </View>
        </View>
      )
    } else if (template.layout === "landscape" && template.id === "4-landscape") {
      // 4 Photos Landscape: 2x2 grid layout
      return (
        <View style={styles.landscapeLayout}>
          <View style={styles.landscapeRow}>
            <View style={styles.photoSlot}>
              <Ionicons name="image-outline" size={12} color="#999" />
            </View>
            <View style={styles.photoSlot}>
              <Ionicons name="image-outline" size={12} color="#999" />
            </View>
          </View>
          <View style={styles.landscapeRow}>
            <View style={styles.photoSlot}>
              <Ionicons name="image-outline" size={12} color="#999" />
            </View>
            <View style={styles.photoSlot}>
              <Ionicons name="image-outline" size={12} color="#999" />
            </View>
          </View>
        </View>
      )
    } else if (template.layout === "strip") {
      // 4 Photos Strip: vertical layout
      const slots = []
      for (let i = 0; i < template.photoCount; i++) {
        slots.push(
          <View key={i} style={styles.photoSlots}>
            <Ionicons name="image-outline" size={14} color="#999" />
          </View>,
        )
      }
      return <View style={styles.stripLayout}>{slots}</View>
    }
    // Fallback for any other layouts
    const slots = []
    for (let i = 0; i < template.photoCount; i++) {
      slots.push(
        <View key={i} style={styles.photoSlot}>
          <Ionicons name="image-outline" size={14} color="#999" />
        </View>,
      )
    }
    return <View style={styles.collageLayout}>{slots}</View>
  }

  const renderTemplate = (template: Template) => {
    const previewSize = getTemplatePreviewSize()
    const isSelected = selectedTemplate === template.id
    return (
      <TouchableOpacity
        key={template.id}
        style={[
          styles.templateContainer,
          {
            width: previewSize.width,
          },
          isSelected && styles.selectedTemplate,
        ]}
        onPress={() => handleTemplateSelect(template.id)}
        activeOpacity={0.8}
      >
        {/* Selection indicator */}
        {isSelected && (
          <View style={styles.selectionIndicator}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          </View>
        )}

        {/* Template preview */}
        <View style={[styles.templatePreview, { height: previewSize.height * 0.55 }]}>
          {renderPhotoSlots(template)}
        </View>

        {/* Template info */}
        <View style={styles.templateInfo}>
          <Text style={styles.templateName}>{template.name}</Text>
          <Text style={styles.templateDescription}>{template.description}</Text>
        </View>

        {/* Photo count badge */}
        <View style={styles.photoCountBadge}>
          <Text style={styles.photoCountText}>{template.photoCount}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  const renderTemplatesInRows = () => {
    const columns = orientation === "portrait" ? 2 : 3
    const rows = []
    for (let i = 0; i < templates.length; i += columns) {
      const rowTemplates = templates.slice(i, i + columns)
      rows.push(
        <View key={i} style={styles.templateRow}>
          {rowTemplates.map(renderTemplate)}
          {rowTemplates.length < columns &&
            Array.from({ length: columns - rowTemplates.length }, (_, index) => (
              <View key={`empty-${index}`} style={{ width: getTemplatePreviewSize().width }} />
            ))}
        </View>,
      )
    }
    return rows
  }

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d", "#1a1a1a"]} style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={[styles.header, orientation === "landscape" && styles.headerLandscape]}>
        <View style={styles.logoContainer}>
          <Image source={require("@/app/imgs/design3.png")} style={styles.logo} contentFit="contain" />
        </View>
        <Text style={[styles.title, orientation === "landscape" && styles.titleLandscape]}>JR.STUDIO</Text>
        <Text style={[styles.subtitle, orientation === "landscape" && styles.subtitleLandscape]}>
          Photo Booth Experience
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, orientation === "landscape" && styles.scrollContentLandscape]}
        showsVerticalScrollIndicator={false}
      >
        {/* Template Selection */}
        <View style={styles.templateSection}>
          <Text style={[styles.sectionTitle, orientation === "landscape" && styles.sectionTitleLandscape]}>
            Choose Your Template
          </Text>
          <Text style={styles.sectionSubtitle}>Select the number of photos and layout style</Text>
          <View style={styles.templatesContainer}>{renderTemplatesInRows()}</View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {/* Template Info Button */}
          {selectedTemplate && (
            <TouchableOpacity style={styles.infoButton} activeOpacity={0.8}>
              <Ionicons name="information-circle-outline" size={20} color="#4CAF50" />
              <Text style={styles.infoButtonText}>
                {templates.find((t) => t.id === selectedTemplate)?.name} Selected
              </Text>
            </TouchableOpacity>
          )}

          {/* Proceed Button */}
          {selectedTemplate && (
            <TouchableOpacity
              style={[styles.proceedButton, orientation === "landscape" && styles.proceedButtonLandscape]}
              onPress={handleProceed}
              activeOpacity={0.9}
            >
              <LinearGradient colors={["#4CAF50", "#45a049"]} style={styles.proceedGradient}>
                <Ionicons name="camera" size={24} color="white" />
                <Text style={styles.proceedText}>Start Photo Session</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Studio Info */}
        <View style={[styles.studioInfo, orientation === "landscape" && styles.studioInfoLandscape]}>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={18} color="#4CAF50" />
              <Text style={styles.infoText}>TINAGO MALIWONO SUBIGAO DEL NORTE</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={18} color="#4CAF50" />
              <Text style={styles.infoText}>09700261974</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="logo-facebook" size={18} color="#4CAF50" />
              <Text style={styles.infoText}>JOHN REMBERT CATURAN PEDRAJITA</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  scrollContentLandscape: {
    paddingBottom: 20,
  },
  header: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerLandscape: {
    paddingTop: 40,
    paddingBottom: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    marginBottom: 15,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    letterSpacing: 2,
    marginBottom: 5,
  },
  titleLandscape: {
    fontSize: 24,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 16,
    color: "#ccc",
    fontStyle: "italic",
  },
  subtitleLandscape: {
    fontSize: 14,
  },
  templateSection: {
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
  sectionTitleLandscape: {
    fontSize: 20,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 25,
  },
  templatesContainer: {
    gap: 20,
  },
  templateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
  },
  templateContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
    position: "relative",
  },
  selectedTemplate: {
    borderColor: "#4CAF50",
    backgroundColor: "rgba(76, 175, 80, 0.15)",
    shadowColor: "#4CAF50",
    shadowOpacity: 0.4,
  },
  selectionIndicator: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 2,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 2,
  },
  templatePreview: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  templateInfo: {
    alignItems: "center",
    marginBottom: 8,
  },
  gridLayout: {
    flex: 1,
    gap: 4,
  },
  gridRow: {
    flex: 1,
    flexDirection: "row",
    gap: 4,
  },
  stripLayout: {
    flex: 1,
    gap: 3,
  },
  collageLayout: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  landscapeLayout: {
    flex: 1,
    gap: 3,
  },
  landscapeRow: {
    flex: 1,
    flexDirection: "row",
    gap: 3,
  },
  photoSlot: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 24,
    minWidth: 24,
  },
  photoSlots: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    borderRadius: 6,
    borderWidth: 1.5,
    top: -5,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 24,
    minWidth: 24,
  },
  templateName: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 11,
    color: "#bbb",
    textAlign: "center",
  },
  photoCountBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#4CAF50",
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  photoCountText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  actionButtons: {
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 30,
  },
  infoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderWidth: 1,
    borderColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
  },
  infoButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
  },
  proceedButton: {
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#4CAF50",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  proceedButtonLandscape: {
    marginHorizontal: 20,
  },
  proceedGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 30,
    gap: 12,
  },
  proceedText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    flex: 1,
    textAlign: "center",
  },
  studioInfo: {
    paddingHorizontal: 20,
  },
  studioInfoLandscape: {
    paddingHorizontal: 40,
  },
  infoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    fontSize: 13,
    color: "#ddd",
    flex: 1,
    fontWeight: "500",
  },
  // Add these new styles to the existing styles object
  gridColumn: {
    flex: 1,
    gap: 3,
    justifyContent: "flex-start",
  },
  singlePhotoSlot: {
    flex: 3, // Make the single photo slot larger to fill the space
  },
})
