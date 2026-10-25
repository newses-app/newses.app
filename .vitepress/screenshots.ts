// The app screenshots in public/screenshots/, written by scripts/screenshots.ts.

export const SCREENS = ['reader', 'article', 'filters', 'settings'] as const;
export const SCHEMES = ['light', 'dark'] as const;

/** CSS pixels of each viewport; phone images are at twice that. */
export const VIEWPORTS = {
  desktop: { width: 1440, height: 900, scale: 1 },
  phone: { width: 412, height: 839, scale: 2 },
} as const;

export type Screen = (typeof SCREENS)[number];
export type Viewport = keyof typeof VIEWPORTS;
export type Scheme = (typeof SCHEMES)[number];

export const fileName = (screen: Screen, viewport: Viewport, scheme: Scheme) =>
  `${screen}-${viewport}-${scheme}.webp`;
