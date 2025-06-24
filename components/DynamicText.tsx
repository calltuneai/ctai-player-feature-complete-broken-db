import React from 'react';
import { Text, TextStyle, TextProps, Platform } from 'react-native';

interface DynamicTextProps extends TextProps {
  style?: TextStyle | TextStyle[];
  size?: number;
  adjustsFontSizeToFit?: boolean;
  numberOfLines?: number;
}

const DynamicText: React.FC<DynamicTextProps> = ({
  children,
  style,
  size = 16,
  adjustsFontSizeToFit = false,
  numberOfLines,
  ...props
}) => {
  const scaledSize = Platform.select({
    ios: size * 0.9,
    android: size * 0.95,
    default: size,
  });

  return (
    <Text
      style={[{ fontSize: scaledSize }, style]}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      numberOfLines={numberOfLines}
      {...props}
    >
      {children}
    </Text>
  );
};

export default DynamicText;