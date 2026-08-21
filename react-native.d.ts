declare module 'react-native' {
  import * as React from 'react'

  export interface StyleProp<T> {}
  export interface TextStyle {
    fontSize?: number
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
    lineHeight?: number
    color?: string
    textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify'
    marginVertical?: number
    marginTop?: number
    marginBottom?: number
    marginRight?: number
    marginLeft?: number
    marginHorizontal?: number
    paddingVertical?: number
    paddingHorizontal?: number
    padding?: number
    paddingTop?: number
    paddingBottom?: number
    paddingLeft?: number
    paddingRight?: number
  }

  export interface ViewStyle {
    flex?: number
    flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
    flexGrow?: number
    flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse'
    alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
    alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
    justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
    padding?: number
    paddingTop?: number
    paddingBottom?: number
    paddingLeft?: number
    paddingRight?: number
    paddingVertical?: number
    paddingHorizontal?: number
    margin?: number
    marginTop?: number
    marginBottom?: number
    marginLeft?: number
    marginRight?: number
    marginHorizontal?: number
    marginVertical?: number
    backgroundColor?: string
    borderRadius?: number
    borderWidth?: number
    borderColor?: string
    borderTopWidth?: number
    borderBottomWidth?: number
    borderLeftWidth?: number
    borderRightWidth?: number
    borderTopColor?: string
    borderBottomColor?: string
    width?: number | string
    height?: number | string
    minWidth?: number | string
    minHeight?: number | string
    maxWidth?: number | string
    maxHeight?: number | string
    position?: 'absolute' | 'relative'
    top?: number
    bottom?: number
    left?: number
    right?: number
    zIndex?: number
    elevation?: number
    shadowColor?: string
    shadowOffset?: { width: number; height: number }
    shadowOpacity?: number
    shadowRadius?: number
    gap?: number
  }

  export interface ImageStyle extends ViewStyle {
    resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center'
  }

  export interface TextProps {
    style?: any
    children?: React.ReactNode
    numberOfLines?: number
    ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip'
    onPress?: () => void
    accessibilityLabel?: string
  }
  export const Text: React.FC<TextProps>

  export interface ViewProps {
    style?: any
    children?: React.ReactNode
    accessibilityLabel?: string
    accessibilityRole?: string
    accessibilityState?: any
  }
  export const View: React.FC<ViewProps>

  export interface TouchableOpacityProps extends ViewProps {
    activeOpacity?: number
    disabled?: boolean
    onPress?: () => void
  }
  export const TouchableOpacity: React.FC<TouchableOpacityProps>

  export interface TextInputProps extends ViewProps {
    value?: string
    defaultValue?: string
    placeholder?: string
    placeholderTextColor?: string
    secureTextEntry?: boolean
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'number-pad'
    multiline?: boolean
    numberOfLines?: number
    maxLength?: number
    autoFocus?: boolean
    onChangeText?: (text: string) => void
    onFocus?: (e?: any) => void
    onBlur?: (e?: any) => void
  }
  export const TextInput: React.ForwardRefExoticComponent<TextInputProps & React.RefAttributes<any>>

  export interface ImageProps extends ViewProps {
    source: any
    style?: any
    resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center'
  }
  export const Image: React.FC<ImageProps>

  export interface ScrollViewProps extends ViewProps {
    ref?: any
    contentContainerStyle?: any
    keyboardShouldPersistTaps?: 'always' | 'never' | 'handled'
    refreshControl?: React.ReactElement
    horizontal?: boolean
    showsHorizontalScrollIndicator?: boolean
    showsVerticalScrollIndicator?: boolean
    onContentSizeChange?: (w?: number, h?: number) => void
  }
  export const ScrollView: React.ForwardRefExoticComponent<ScrollViewProps & React.RefAttributes<any>>

  export interface FlatListProps<T = any> extends ViewProps {
    data: readonly T[] | null | undefined
    keyExtractor: (item: T, index: number) => string
    renderItem: (info: { item: T; index: number }) => React.ReactElement | null
    ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null | (() => React.ReactElement | null)
    ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null | (() => React.ReactElement | null)
    ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null | (() => React.ReactElement | null)
    refreshControl?: React.ReactElement
    onEndReached?: (() => void) | null
    onEndReachedThreshold?: number | null
    contentContainerStyle?: any
    horizontal?: boolean
    showsHorizontalScrollIndicator?: boolean
    showsVerticalScrollIndicator?: boolean
  }
  export const FlatList: <T = any>(props: FlatListProps<T>) => React.ReactElement

  export interface RefreshControlProps {
    refreshing: boolean
    onRefresh?: () => void
    tintColor?: string
  }
  export const RefreshControl: React.FC<RefreshControlProps>

  export interface KeyboardAvoidingViewProps extends ViewProps {
    behavior?: 'height' | 'position' | 'padding'
  }
  export const KeyboardAvoidingView: React.FC<KeyboardAvoidingViewProps>

  export interface SwitchProps extends ViewProps {
    value?: boolean
    onValueChange?: (value: boolean) => void
    disabled?: boolean
    trackColor?: { false?: string; true?: string }
    thumbColor?: string
    ios_backgroundColor?: string
  }
  export const Switch: React.FC<SwitchProps>

  export interface ModalProps extends ViewProps {
    visible?: boolean
    transparent?: boolean
    animationType?: 'none' | 'slide' | 'fade'
    presentationStyle?: 'fullScreen' | 'pageSheet' | 'formSheet' | 'overFullScreen'
    onRequestClose?: () => void
  }
  export const Modal: React.FC<ModalProps>

  export interface ActivityIndicatorProps extends ViewProps {
    size?: 'small' | 'large' | number
    color?: string
  }
  export const ActivityIndicator: React.FC<ActivityIndicatorProps>

  export interface TouchableWithoutFeedbackProps extends ViewProps {
    onPress?: () => void
  }
  export const TouchableWithoutFeedback: React.FC<TouchableWithoutFeedbackProps>

  export const Dimensions: {
    get: (dim: 'window' | 'screen') => { width: number; height: number; scale: number; fontScale: number }
  }

  export const StyleSheet: {
    create: <T extends Record<string, any>>(styles: T) => T
    absoluteFillObject: ViewStyle
  }

  export const Platform: {
    OS: 'ios' | 'android' | 'web' | 'windows' | 'macos'
    select: <T>(specifics: { ios?: T; android?: T; web?: T; default?: T }) => T
  }

  export const Alert: {
    alert: (title: string, message?: string, buttons?: any[]) => void
  }
}

declare module 'react-native-safe-area-context' {
  import * as React from 'react'
  export interface SafeAreaViewProps {
    style?: any
    children?: React.ReactNode
  }
  export const SafeAreaView: React.FC<SafeAreaViewProps>
  export const SafeAreaProvider: React.FC<{ children: React.ReactNode }>
}

declare module 'expo-router' {
  import * as React from 'react'

  export interface Router {
    push: (href: string | { pathname: string; params?: Record<string, any> }) => void
    replace: (href: string | { pathname: string; params?: Record<string, any> }) => void
    back: () => void
  }

  export function useRouter(): Router
  export function useLocalSearchParams<T extends Record<string, any> = Record<string, any>>(): T

  export const Stack: React.FC<{
    screenOptions?: any
    children?: React.ReactNode
  }> & {
    Screen: React.FC<{ name: string; options?: any }>
  }

  export const Tabs: React.FC<{
    screenOptions?: any
    children?: React.ReactNode
  }> & {
    Screen: React.FC<{ name: string; options?: any }>
  }
}

declare module 'expo-status-bar' {
  import * as React from 'react'
  export const StatusBar: React.FC<{ style?: 'auto' | 'inverted' | 'light' | 'dark' }>
}

declare module 'expo-secure-store' {
  export function getItemAsync(key: string): Promise<string | null>
  export function setItemAsync(key: string, value: string): Promise<void>
  export function deleteItemAsync(key: string): Promise<void>
}

declare module 'expo-image-picker' {
  export enum MediaTypeOptions {
    All = 'All',
    Videos = 'Videos',
    Images = 'Images',
  }
  export interface ImagePickerAsset {
    uri: string
    width: number
    height: number
    type?: 'image' | 'video'
    fileName?: string
    fileSize?: number
  }
  export interface ImagePickerResult {
    canceled: boolean
    assets: ImagePickerAsset[]
  }
  export function requestMediaLibraryPermissionsAsync(): Promise<{ status: string; granted: boolean }>
  export function launchImageLibraryAsync(options?: any): Promise<ImagePickerResult>
  export function launchCameraAsync(options?: any): Promise<ImagePickerResult>
}

declare module 'expo-location' {
  export enum Accuracy {
    Lowest = 1,
    Low = 2,
    Balanced = 3,
    High = 4,
    Highest = 5,
    BestForNavigation = 6,
  }
  export enum PermissionStatus {
    GRANTED = 'granted',
    UNDETERMINED = 'undetermined',
    DENIED = 'denied',
  }
  export interface LocationPermissionResponse {
    status: PermissionStatus
    granted: boolean
    canAskAgain: boolean
    expires: 'never' | number
  }
  export interface LocationObjectCoords {
    latitude: number
    longitude: number
    altitude: number | null
    accuracy: number | null
    altitudeAccuracy: number | null
    heading: number | null
    speed: number | null
  }
  export interface LocationObject {
    coords: LocationObjectCoords
    timestamp: number
  }
  export interface LocationGeocodedAddress {
    city: string | null
    district: string | null
    streetNumber: string | null
    street: string | null
    region: string | null
    subregion: string | null
    country: string | null
    postalCode: string | null
    name: string | null
    isoCountryCode: string | null
    timezone: string | null
  }
  export function requestForegroundPermissionsAsync(): Promise<LocationPermissionResponse>
  export function getForegroundPermissionsAsync(): Promise<LocationPermissionResponse>
  export function getLastKnownPositionAsync(options?: any): Promise<LocationObject | null>
  export function getCurrentPositionAsync(options?: any): Promise<LocationObject>
  export function reverseGeocodeAsync(location: { latitude: number; longitude: number }): Promise<LocationGeocodedAddress[]>
}

declare module 'lucide-react-native' {
  import * as React from 'react'
  export interface IconProps {
    color?: string
    fill?: string
    size?: number
    strokeWidth?: number
    style?: any
  }
  export const Home: React.FC<IconProps>
  export const Compass: React.FC<IconProps>
  export const PlusCircle: React.FC<IconProps>
  export const MessageCircle: React.FC<IconProps>
  export const User: React.FC<IconProps>
  export const Check: React.FC<IconProps>
  export const Mail: React.FC<IconProps>
  export const Lock: React.FC<IconProps>
  export const ArrowLeft: React.FC<IconProps>
  export const MapPin: React.FC<IconProps>
  export const Globe: React.FC<IconProps>
  export const Camera: React.FC<IconProps>
  export const Bell: React.FC<IconProps>
  export const Sparkles: React.FC<IconProps>
  export const Users: React.FC<IconProps>
  export const Calendar: React.FC<IconProps>
  export const LogOut: React.FC<IconProps>
  export const RefreshCw: React.FC<IconProps>
  export const Navigation: React.FC<IconProps>
  export const ShieldCheck: React.FC<IconProps>
  export const CheckCircle: React.FC<IconProps>
  export const CheckCircle2: React.FC<IconProps>
  export const Search: React.FC<IconProps>
  export const X: React.FC<IconProps>
  export const Eye: React.FC<IconProps>
  export const EyeOff: React.FC<IconProps>
  export const ChevronRight: React.FC<IconProps>
  export const Palette: React.FC<IconProps>
  export const Gamepad2: React.FC<IconProps>
  export const Dumbbell: React.FC<IconProps>
  export const BookOpen: React.FC<IconProps>
  export const Laptop: React.FC<IconProps>
  export const Music2: React.FC<IconProps>
  export const Plane: React.FC<IconProps>
  export const Rocket: React.FC<IconProps>
  export const Heart: React.FC<IconProps>
  export const TrendingUp: React.FC<IconProps>
  export const Handshake: React.FC<IconProps>
  export const Users2: React.FC<IconProps>
  export const Cross: React.FC<IconProps>
  export const Activity: React.FC<IconProps>
  export const Lightbulb: React.FC<IconProps>
  export const Menu: React.FC<IconProps>
  export const SlidersHorizontal: React.FC<IconProps>
  export const Settings: React.FC<IconProps>
  export const ArrowRight: React.FC<IconProps>
  export const Filter: React.FC<IconProps>
  export const Bookmark: React.FC<IconProps>
  export const MoreHorizontal: React.FC<IconProps>
  export const Shield: React.FC<IconProps>
  export const Zap: React.FC<IconProps>
  export const Star: React.FC<IconProps>
  export const Award: React.FC<IconProps>
  export const ArrowUpDown: React.FC<IconProps>
  export const Share2: React.FC<IconProps>
  export const UploadCloud: React.FC<IconProps>
  export const ChevronDown: React.FC<IconProps>
  export const MessageSquare: React.FC<IconProps>
  export const SquarePen: React.FC<IconProps>
  export const Mic: React.FC<IconProps>
  export const Smile: React.FC<IconProps>
  export const Send: React.FC<IconProps>
  export const Pin: React.FC<IconProps>
  export const Plus: React.FC<IconProps>
  export const CheckCheck: React.FC<IconProps>
  export const Reply: React.FC<IconProps>
  export const Clock: React.FC<IconProps>
  export const Edit3: React.FC<IconProps>
  export const UserPlus: React.FC<IconProps>
  export const UserCheck: React.FC<IconProps>
  export const House: React.FC<IconProps>
  export const User: React.FC<IconProps>
  export const UserRound: React.FC<IconProps>
  export const Crown: React.FC<IconProps>
  export const CircleHelp: React.FC<IconProps>
  export const Info: React.FC<IconProps>
  export const BadgeCheck: React.FC<IconProps>
  export const MailCheck: React.FC<IconProps>
  export const RefreshCw: React.FC<IconProps>
  export const ChevronLeft: React.FC<IconProps>
  export const LocateFixed: React.FC<IconProps>
  export const Video: React.FC<IconProps>
  export const Flame: React.FC<IconProps>
  export const Globe: React.FC<IconProps>
  export const Lock: React.FC<IconProps>
  export const ShieldCheck: React.FC<IconProps>
  export const CheckCircle2: React.FC<IconProps>
  export const FileText: React.FC<IconProps>
  export const Volume2: React.FC<IconProps>
  export const VolumeX: React.FC<IconProps>
  export const Play: React.FC<IconProps>
  export const Pause: React.FC<IconProps>
  export const Eye: React.FC<IconProps>
  export const EyeOff: React.FC<IconProps>
  export const Trash2: React.FC<IconProps>
  export const Flag: React.FC<IconProps>
  export const Ban: React.FC<IconProps>
  export const HelpCircle: React.FC<IconProps>
  export const Hash: React.FC<IconProps>
  export const UserX: React.FC<IconProps>
}
