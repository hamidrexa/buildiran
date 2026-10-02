import React from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';

const CREST_ASPECT = 515 / 361;
const PERSIAN_LOCKUP_ASPECT = 1120 / 778;
const ENGLISH_LOCKUP_ASPECT = 707 / 834;

interface SizedLogoProps {
  width: number;
  style?: StyleProp<ImageStyle>;
}

export function BrandCrest({ width = 52, style }: Partial<SizedLogoProps>) {
  return (
    <Image
      accessibilityLabel="نشان شهریار"
      source={require('../../../assets/images/shahriyar-crest.png')}
      resizeMode="contain"
      style={[{ width, height: width * CREST_ASPECT }, style]}
    />
  );
}

export function PersianBrandLockup({ width, style }: SizedLogoProps) {
  return (
    <Image
      accessibilityLabel="شهریار"
      source={require('../../../assets/images/shahriyar-logo-fa.png')}
      resizeMode="contain"
      style={[{ width, height: width * PERSIAN_LOCKUP_ASPECT }, style]}
    />
  );
}

export function EnglishBrandLockup({ width, style }: SizedLogoProps) {
  return (
    <Image
      accessibilityLabel="Shahriyar"
      source={require('../../../assets/images/shahriyar-logo-en.png')}
      resizeMode="contain"
      style={[{ width, height: width * ENGLISH_LOCKUP_ASPECT }, style]}
    />
  );
}
