import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import DesignTokens from '../../../constants/designTokens';

interface TimelineActionsProps {
  item: {
    id: string;
    content: string;
    imageUrls?: string[];
    createdAt: string;
    author?: {
      name: string;
      avatar?: string;
      emotion?: string;
    };
  };
  onEdit?: (item: any) => void;
  onDelete?: (itemId: string) => void;
}

export const TimelineActions: React.FC<TimelineActionsProps> = ({
  item,
  onEdit,
  onDelete,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [buttonLayout, setButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const handleEdit = () => {
    setIsMenuOpen(false);
    onEdit?.(item);
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    onDelete?.(item.id);
  };

  const handleButtonPress = (event: any) => {
    event.target.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
      setButtonLayout({ x: pageX, y: pageY, width, height });
      setIsMenuOpen(true);
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={handleButtonPress}
      >
        <Text style={styles.menuIcon}>⋮</Text>
      </TouchableOpacity>

      <Modal
        visible={isMenuOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsMenuOpen(false)}
        >
          <View style={[styles.menuContainer, {
            top: buttonLayout.y + buttonLayout.height + 5,
            right: Dimensions.get('window').width - (buttonLayout.x + buttonLayout.width)
          }]}>
            {onEdit && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleEdit}
              >
                <Text style={styles.editText}>수정</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleDelete}
              >
                <Text style={styles.deleteText}>삭제</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 16,
    color: DesignTokens.colors.gray,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: DesignTokens.colors.background,
    paddingVertical: 4,
    minWidth: 100,
    shadowColor: DesignTokens.colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.lightGray,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  editText: {
    fontSize: 16,
    color: DesignTokens.colors.darkGray,
    textAlign: 'center',
  },
  deleteText: {
    fontSize: 16,
    color: DesignTokens.colors.alert,
    textAlign: 'center',
  },
});