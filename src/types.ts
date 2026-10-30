export interface ResolvedLink {
  id: string;
  originalUrl: string;
  resolvedUrl: string;
  cleanUrl: string;
  status: 'pending' | 'resolved' | 'fallback' | 'error';
  isSuccess: boolean;
  type?: 'video' | 'photo' | 'unknown';
  videoId?: string | null;
  author?: string | null;
  authorUrl?: string | null;
  title?: string | null;
  thumbnail?: string | null;
  intentUrl: string;
  method: string;
  timestamp: number;
}

export type AndroidTab = 'resolver' | 'embeds' | 'intents' | 'history' | 'android-project';

export type EmbedFormat = 'option1' | 'option2' | 'option3';

export interface AndroidSettings {
  cleanTracking: boolean;
  showPhoneFrame: boolean;
  navigationMode: 'gesture' | 'buttons';
  openInAppByDefault: boolean;
  hapticFeedback: boolean;
}
