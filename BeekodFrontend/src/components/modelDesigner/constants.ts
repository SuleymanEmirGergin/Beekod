/**
 * Model Designer Constants
 * All static data for the model designer screen
 */

// Asset imports
import zayifBodyImage from 'figma:asset/47763b5513f64acd986685a9d5e10bd4314defe9.png';
import ortaKiloluBodyImage from 'figma:asset/64dc6519a41c808e79b146fe45a387ef0feaa1e3.png';
import kiloluBodyImage from 'figma:asset/9b68cc0466e0009fad17ab706b6d2cbcaef51769.png';
import uzunBoyluImage from 'figma:asset/5fa5209c94af33a11d3aaaf2a174b2cb5272e14c.png';
import ortaBoyImage from 'figma:asset/d9e7858ce1064fa81f9436bd9a9555bab0a0b90e.png';
import kisaBoyImage from 'figma:asset/c0d82a7204c9fe75fd4e1885989d8780eea69d6e.png';
import sariHairImage from 'figma:asset/98dc71e13dc2d35d408fb6e3664ec78513edb19f.png';
import turuncuHairImage from 'figma:asset/dbe268abcfed23a245a6570fcf378fa05c9db1cc.png';
import siyahHairImage from 'figma:asset/bb008c0bb03c26e978fab5b13ab8cd2e1da0615e.png';
import griHairImage from 'figma:asset/fbe0e199ceb6b21d8b5a00808093d52051b5787e.png';
import kahverengiHairImage from 'figma:asset/92e0e858a0272e479083d7ccf22ab26b72269d48.png';
import kizilHairImage from 'figma:asset/268194b97aa6db62a4c4195aacff1fcb0f19f11b.png';

export const GENERATION_COST = 10;

export const models = [
  {
    id: 'female',
    label: 'Female Model',
    image: 'https://images.unsplash.com/photo-1721003080966-423d4017d09d?w=400&h=600&fit=crop',
  },
  {
    id: 'male',
    label: 'Male Model',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
  },
];

export const ethnicities = [
  { id: 'caucasian', label: 'Caucasian', flag: '🇪🇺' },
  { id: 'asian', label: 'Asian', flag: '🇯🇵' },
  { id: 'african', label: 'African', flag: '🇿🇦' },
  { id: 'latin', label: 'Latin', flag: '🇧🇷' },
  { id: 'middle-eastern', label: 'Middle Eastern', flag: '🇦🇪' },
  { id: 'mixed', label: 'Mixed', flag: '🌍' },
];

export const bodyTypes = [
  { id: 'zayif', label: 'Slim', icon: '🧍', image: zayifBodyImage },
  { id: 'orta-kilolu', label: 'Medium', icon: '🧍‍♂️', image: ortaKiloluBodyImage },
  { id: 'kilolu', label: 'Plus Size', icon: '🧍‍♀️', image: kiloluBodyImage },
];

export const hairColors = [
  { id: 'siyah', label: 'Black', color: '#000000', image: siyahHairImage },
  { id: 'kahverengi', label: 'Brown', color: '#4A2511', image: kahverengiHairImage },
  { id: 'sari', label: 'Blonde', color: '#F5D547', image: sariHairImage },
  { id: 'gri', label: 'Gray', color: '#808080', image: griHairImage },
  { id: 'kizil', label: 'Red', color: '#8B0000', image: kizilHairImage },
  { id: 'turuncu', label: 'Auburn', color: '#FF6347', image: turuncuHairImage },
];

export const eyeColors = [
  { id: 'kahverengi', label: 'Brown', color: '#654321', bgPosition: '50% 50%' },
  { id: 'mavi', label: 'Blue', color: '#1E90FF', bgPosition: '50% 0%' },
  { id: 'yesil', label: 'Green', color: '#228B22', bgPosition: '100% 0%' },
  { id: 'ela', label: 'Hazel', color: '#B8860B', bgPosition: '0% 50%' },
  { id: 'gri', label: 'Gray', color: '#808080', bgPosition: '0% 0%' },
  { id: 'siyah', label: 'Black', color: '#000000', bgPosition: '100% 100%' },
];

export const heights = [
  { id: 'kisa', label: 'Short', range: '150-165 cm', image: kisaBoyImage },
  { id: 'orta', label: 'Medium', range: '165-175 cm', image: ortaBoyImage },
  { id: 'uzun', label: 'Tall', range: '175-190 cm', image: uzunBoyluImage },
];

export const poses = [
  { id: 'front', label: 'Front View', icon: '🧍', image: 'https://images.unsplash.com/photo-1640337516270-1c675eee65f2?w=400&h=600&fit=crop' },
  { id: 'side', label: 'Side View', icon: '🚶', image: 'https://images.unsplash.com/photo-1762395271662-2a5a077f9662?w=400&h=600&fit=crop' },
  { id: 'walking', label: 'Walking', icon: '🚶‍♀️', image: 'https://images.unsplash.com/photo-1630243838106-c48c85c5e880?w=400&h=600&fit=crop' },
];

export const garments = [
  { id: 't-shirt', name: 'T-Shirt', category: 'Tops', thumbnail: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop' },
  { id: 'dress', name: 'Summer Dress', category: 'Dresses', thumbnail: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=200&h=200&fit=crop' },
  { id: 'jacket', name: 'Denim Jacket', category: 'Outerwear', thumbnail: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200&h=200&fit=crop' },
  { id: 'jeans', name: 'Jeans', category: 'Bottoms', thumbnail: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=200&h=200&fit=crop' },
  { id: 'sweater', name: 'Knit Sweater', category: 'Tops', thumbnail: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=200&h=200&fit=crop' },
  { id: 'skirt', name: 'Pleated Skirt', category: 'Bottoms', thumbnail: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=200&h=200&fit=crop' },
];

export const styles = [
  { id: 'realistic', label: 'Realistic', icon: '📸', description: 'Photorealistic high-end photography' },
  { id: 'cyberpunk', label: 'Cyberpunk', icon: '🌆', description: 'Neon lights and futuristic aesthetic' },
  { id: 'retro', label: '90s Retro', icon: '📼', description: 'Vintage film look and grain' },
  { id: 'sketch', label: 'Artistic Sketch', icon: '🎨', description: 'Hand-drawn fashion illustration style' },
  { id: 'watercolor', label: 'Watercolor', icon: '🖌️', description: 'Soft artistic watercolor paint effect' },
];

export const scenes = [
  { id: 'minimalist_studio', label: 'Minimalist Studio', icon: '🏠' },
  { id: 'nature_outdoor', label: 'Nature', icon: '🌿' },
  { id: 'paris_street', label: 'Paris', icon: '🗼' },
  { id: 'future_city', label: 'Future City', icon: '🏙️' },
  { id: 'tropical_beach', label: 'Beach', icon: '🏖️' },
];

export const colors = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Yellow', hex: '#F5B800' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Purple', hex: '#9333EA' },
  { name: 'Gray', hex: '#6B7280' },
  { name: 'Navy', hex: '#1E3A8A' },
];

export type ActiveTab = 'model' | 'appearance' | 'pose' | 'product' | 'style' | 'environment';
