# Preferences System Documentation

## Overview

The mifumo-connect application has a comprehensive preferences system that manages user settings across the entire dashboard. This document outlines how Theme, Timezone, Language, and Notification preferences are implemented and how they work together.

## Architecture

### Core Components

#### 1. **usePreferences Hook** (`src/hooks/usePreferences.ts`)
The central hook that manages all user preferences with automatic API persistence and state synchronization.

**Key Features:**
- Auto-loads preferences from API on component mount
- Real-time synchronization with theme and language systems
- Individual update methods for theme, language, timezone, and notifications
- Batch update method for multiple preferences at once
- Automatic error handling and rollback
- Loading and saving states for UI feedback
- Toast notifications for user feedback

**Usage:**
```tsx
const {
  preferences,           // Current preference state (null while loading)
  isLoading,            // True while fetching preferences
  isSaving,             // True while saving changes
  error,                // Error message if loading fails
  updateTheme,          // Update theme: (theme: 'light' | 'dark' | 'system') => Promise<void>
  updateLanguage,       // Update language: (language: 'en' | 'sw') => Promise<void>
  updateTimezone,       // Update timezone: (timezone: string) => Promise<void>
  updateNotifications,  // Update notifications: (type: 'email' | 'sms' | 'marketing', enabled: boolean) => Promise<void>
  fetchPreferences,     // Manually refresh preferences: () => Promise<void>
  updateAllPreferences, // Update multiple at once: (prefs: Partial<UserPreferences>) => Promise<void>
} = usePreferences();
```

#### 2. **ThemeProvider** (via `next-themes`)
Manages visual theme application with support for light, dark, and system modes.

**Location:** App.tsx (line 51)
```tsx
<ThemeProvider attribute="class" defaultTheme="light" enableSystem>
  {/* App content */}
</ThemeProvider>
```

**Attributes:**
- `attribute="class"`: Applies theme via CSS classes
- `defaultTheme="light"`: Initial theme on first load
- `enableSystem`: Respects OS dark mode preference

#### 3. **LanguageContext** (`src/contexts/LanguageContext.tsx`)
Provides language switching and translation functionality.

**Features:**
- 50+ translation keys for all major features
- localStorage persistence
- Real-time UI updates on language change
- useLanguage() hook for component access

**Usage:**
```tsx
const { language, setLanguage, t } = useLanguage();
// t('key') returns translated string
// setLanguage('en' | 'sw') switches language
```

#### 4. **Settings Page** (`src/pages/Settings.tsx`)
Main UI for preference management with dedicated Preferences tab.

**Tab:** "Preferences" (lines 1256-1364)
- Theme selector (Light, Dark, System)
- Language selector (English, Kiswahili)
- Timezone selector (4 African timezones + UTC)
- Notification toggles (Email, SMS, Marketing)
- Real-time synchronization with AppHeader theme toggle

#### 5. **AppHeader** (`src/components/layout/AppHeader.tsx`)
Top navigation bar with quick theme toggle.

**Features:**
- Theme toggle button with sun/moon icons
- Automatically syncs with Settings theme selection via updateTheme()
- Saves theme preference to API
- Updates across entire dashboard in real-time

## Preference Types

### Theme
**Storage:** `next-themes` (localStorage + API)
**Values:** `'light' | 'dark' | 'system'`
**Scope:** Global - affects entire UI
**Persistence:** Survives page reload
**Update Points:**
- AppHeader theme toggle button
- Settings > Preferences > Theme selector

### Language
**Storage:** LanguageContext (localStorage + API)
**Values:** `'en' | 'sw'`
**Scope:** Global - all UI text, translations
**Persistence:** Survives page reload
**Update Points:**
- Settings > Preferences > Language selector
- useLanguage() hook setLanguage() method

### Timezone
**Storage:** API + localStorage (fallback)
**Values:** String timezone ID (e.g., 'Africa/Dar_es_Salaam')
**Scope:** User profile - affects date/time display, reports
**Persistence:** Survives page reload
**Update Points:**
- Settings > Preferences > Timezone selector
- Manual usePreferences().updateTimezone() call
**Available Options:**
- Africa/Dar_es_Salaam (Default)
- Africa/Nairobi
- Africa/Kampala
- UTC

### Notifications
**Storage:** API
**Types:**
- `email_notifications` (boolean)
- `sms_notifications` (boolean)
- `marketing_emails` (boolean)
- `push_notifications` (boolean)

**Scope:** User profile - affects what messages user receives
**Persistence:** Survives page reload
**Update Points:**
- Settings > Preferences > Notification toggles
- Settings > Notifications tab (for detailed settings)
- usePreferences().updateNotifications() method

## Data Flow

### Loading Preferences (On App Start)

```
App.tsx
  └─> usePreferences() hook
       └─> fetchPreferences() called in useEffect
           └─> apiClient.getPreferences()
               └─> Response contains: theme, language, timezone, email_notifications, etc.
                   └─> setTheme() (via next-themes)
                   └─> setLanguage() (via LanguageContext)
                   └─> Update state with timezone, notifications
                       └─> All components now have current preferences
```

### Updating Theme from AppHeader

```
User clicks theme toggle in AppHeader
  └─> handleThemeToggle()
      └─> setTheme() (visual update via next-themes)
      └─> updateTheme() from usePreferences hook
          └─> setTheme() again (visual + API)
          └─> apiClient.updatePreferences()
              └─> API saves theme to database
              └─> Toast notification shows result
```

### Updating Language from Settings

```
User changes language in Settings > Preferences
  └─> updateLanguage('sw')
      └─> setLanguage() (LanguageContext - re-renders all t() calls)
      └─> apiClient.updatePreferences()
          └─> API saves language to database
          └─> All UI immediately reflects new language
          └─> Toast notification confirms change
```

### Updating Timezone from Settings

```
User changes timezone in Settings > Preferences
  └─> updateTimezone('Africa/Nairobi')
      └─> localStorage.setItem('userTimezone')
      └─> apiClient.updatePreferences()
          └─> API saves timezone to database
          └─> Toast notification confirms change
```

### Updating Notifications from Settings

```
User toggles email notifications in Settings > Preferences
  └─> updateNotifications('email', true)
      └─> apiClient.updateNotificationSettings()
          └─> API saves notification preference
          └─> Toast notification confirms change
```

## API Integration

### Endpoints Used

**GET /auth/settings/preferences/**
- Retrieves current user preferences
- Response: `{ language, timezone, date_format, time_format, theme }`
- Called on app startup via usePreferences() hook

**PUT /auth/settings/preferences/**
- Updates language, timezone, date/time format
- Payload: `{ language?, timezone?, date_format?, time_format? }`
- Called by: updateTheme(), updateLanguage(), updateTimezone(), updateAllPreferences()

**PUT /auth/settings/notifications/**
- Updates notification preferences
- Payload: `{ email_notifications?, sms_notifications?, marketing_emails? }`
- Called by: updateNotifications()

## Component Integration Points

### Settings.tsx
**Lines 1256-1364** - Preferences tab rendering
- **Theme Selector:**
  - Calls `updateTheme()` on change
  - Disabled while saving
  - Shows loading state

- **Language Selector:**
  - Calls `updateLanguage()` on change
  - Disabled while saving

- **Timezone Selector:**
  - Calls `updateTimezone()` on change
  - Disabled while saving

- **Notification Toggles:**
  - Calls `updateNotifications()` on change
  - Individual toggles for email, SMS, marketing

**Features:**
- Shows loading state while fetching preferences
- Error message if preferences fail to load
- Disabled inputs while saving
- Automatic toast notifications from usePreferences hook

### AppHeader.tsx
**Lines 76-86** - Theme toggle button
- **handleThemeToggle()** function:
  1. Updates next-themes (visual change)
  2. Calls updateTheme() to save to API
  3. Auto-syncs with Settings theme selector
  4. Persists across page reloads

**Integration:**
- Imports usePreferences hook
- Calls updateTheme() on button click
- No visible loading state (background process)

### Other Components
Any component using language features:
```tsx
const { t } = useLanguage();
// Automatically updates when language changes
return <div>{t('key.name')}</div>
```

Any component needing timezone:
```tsx
const userTimezone = localStorage.getItem('userTimezone') || 'Africa/Dar_es_Salaam';
// Use for date/time formatting
```

## Error Handling

### Automatic Error Recovery

**Theme Update Fails:**
1. Theme reverted to previous value
2. Toast error notification shown
3. User can retry

**Language Update Fails:**
1. Language reverted to previous value
2. Toast error notification shown
3. User can retry

**Timezone Update Fails:**
1. Toast error notification shown
2. Preferences re-fetched to restore correct state

**Notification Update Fails:**
1. Toast error notification shown
2. Preferences re-fetched automatically

### Error States in UI

- Loading indicators while fetching
- Error message if preferences fail to load initially
- Disabled inputs while saving
- Toast notifications for success/failure

## Testing Checklist

### Theme Changes
- [ ] Click theme toggle in AppHeader
- [ ] Verify visual theme changes immediately
- [ ] Go to Settings > Preferences
- [ ] Verify Settings shows selected theme
- [ ] Refresh page - theme persists
- [ ] Check localStorage for theme persistence

### Language Changes
- [ ] Go to Settings > Preferences
- [ ] Change language to Kiswahili
- [ ] Verify all UI text changes immediately
- [ ] Check AppHeader title changes
- [ ] Refresh page - language persists
- [ ] Change back to English

### Timezone Changes
- [ ] Go to Settings > Preferences
- [ ] Change timezone to different option
- [ ] Verify setting saves
- [ ] Refresh page - timezone persists
- [ ] Check localStorage for timezone value

### Notification Changes
- [ ] Go to Settings > Preferences
- [ ] Toggle each notification type
- [ ] Verify toggles save
- [ ] Refresh page - settings persist
- [ ] Check API responses show saved values

### Integration Tests
- [ ] Change theme and language simultaneously
- [ ] Verify both sync correctly
- [ ] Change theme in AppHeader, verify Settings updates
- [ ] Change language in Settings, verify AppHeader updates
- [ ] Load app, change preferences, hard refresh - all persist

## Troubleshooting

### Preferences Not Loading
- Check browser console for API errors
- Verify access_token is present in localStorage
- Check API endpoint /auth/settings/preferences/ is accessible
- Try manual refresh: usePreferences().fetchPreferences()

### Theme Not Syncing Between AppHeader and Settings
- Verify both use usePreferences hook
- Check next-themes is properly initialized
- Verify ThemeProvider wraps entire app
- Check browser DevTools > Elements for class="dark" on html element

### Language Not Changing Globally
- Verify LanguageContext is initialized
- Check all components use useLanguage() hook for text
- Verify translation keys exist in LanguageContext.tsx
- Check setLanguage() is called from updateLanguage()

### Timezone Not Persisting
- Verify updateTimezone() is called
- Check API response for timezone value
- Verify localStorage.setItem('userTimezone') is executed
- Check API endpoint /auth/settings/preferences/ accepts timezone

### Notifications Not Saving
- Verify updateNotifications() is called with correct type
- Check API endpoint /auth/settings/notifications/
- Verify request payload has correct field names
- Check API returns success response

## Performance Notes

- Preferences loaded once on app startup
- Theme changes don't cause full re-render (via next-themes)
- Language changes trigger selective re-renders (via Context)
- Timezone stored in localStorage for quick access
- No polling - updates happen only on user action

## Future Enhancements

1. **Date/Time Format Selection**
   - Add format selector to Settings > Preferences
   - Store in preferences
   - Apply formatting to all dates/times in app

2. **Additional Timezones**
   - Expand timezone list beyond 4 options
   - Support timezone search/filter

3. **Notification Thresholds**
   - Add SMS credit warning thresholds
   - Add campaign notification preferences
   - Per-campaign notification settings

4. **Preference Profiles**
   - Save multiple preference sets
   - Quick-switch between profiles
   - Export/import preferences

5. **Sync Across Devices**
   - Load preferences from API on every app load
   - Add sync indicator
   - Show last updated timestamp
