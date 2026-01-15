import { StyleSheet } from "react-native";
import DesignTokens from "../../../constants/designTokens";

export const challengeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  section: {
    marginBottom: DesignTokens.spacing.sectionMargin,
  },
  sectionTitle: {
    ...DesignTokens.typography.sectionTitle,
    color: DesignTokens.colors.secondary,
    backgroundColor: DesignTokens.colors.sectionBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: DesignTokens.spacing.sectionTitleMargin,
    marginHorizontal: DesignTokens.spacing.sectionPadding,
    alignSelf: "flex-start",
  },
  emptyState: {
    padding: DesignTokens.spacing.emptyStatePadding,
    alignItems: "center",
    backgroundColor: DesignTokens.colors.background,
    borderWidth: DesignTokens.borders.width,
    borderColor: DesignTokens.colors.border,
    marginHorizontal: DesignTokens.spacing.sectionPadding,
  },
  emptyText: {
    ...DesignTokens.typography.cardTitle,
  },
});
