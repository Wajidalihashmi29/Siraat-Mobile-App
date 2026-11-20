import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  User,
  Settings2,
  Check,
  Sparkles,
  Volume2,
  RotateCcw,
  LogIn,
  LogOut,
  Sliders,
  Type,
  Bell,
  Moon,
  Cloud,
  RefreshCw,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  MailCheck,
  CircleAlert,
  CircleCheck,
  ShieldCheck,
  Download,
  HardDrive,
  Trash2,
  X,
} from "lucide-react";
import TopNav from "../components/TopNav";
import GoldenSpiral from "../components/GoldenSpiral";
import AyahMedallion from "../components/AyahMedallion";
import QuranText from "../components/QuranText";
import CustomDropdown, { type DropdownOption } from "../components/CustomDropdown";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import { changePassword, forgotPassword, parseApiError, resetPassword } from "../api/authApi";
import { getQuranLineHeightMultiplier, normalizeIndoPakText } from "../utils/quranTypography";
import { QURAN_DEFAULT_FIT_WIDTH } from "../utils/quranScreens";
import { disableClosedAppPrayerAlerts, syncClosedAppPrayerAlertSelection } from "../api/prayerPushApi";
import { formatHijriDate } from "../utils/hijriDate";
import {
  loadSettings,
  saveSettings,
  resetSettings,
  syncCloudSettings,
  TRANSLATION_OPTIONS,
  TAFSEER_OPTIONS,
  RECITERS_OPTIONS,
  CALCULATION_METHODS,
  getStorageKeyForUser,
  type AppSettings,
} from "../utils/settingsStorage";
import { PRAYER_ALERT_NAMES, type PrayerAlertName } from "../utils/prayerAlerts";
import { clearOfflineQuran, getOfflineQuranStorageInfo } from "../utils/quranOffline";
import { deletePersonalData, exportPersonalData } from "../utils/personalLibrary";
import { playPrayerChime, unlockPrayerChimeAudio } from "../utils/prayerChime";
import ChimeTestButton from "../components/ChimeTestButton";
import "./SettingsPage.css";

type TabId = "quran" | "prayer" | "account" | "general";
type ConfirmAction = "reset-settings" | "delete-data" | "remove-offline" | null;

interface SettingsTabConfig {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const SETTINGS_TABS: SettingsTabConfig[] = [
  { id: "quran", label: "Qur'an Preferences", icon: BookOpen },
  { id: "prayer", label: "Prayer Times", icon: Clock },
  { id: "account", label: "Account Profile", icon: User },
  { id: "general", label: "General & Reset", icon: Settings2 },
];

const LANGUAGE_OPTIONS: DropdownOption[] = [
  { id: "en", name: "English (US)", sub: "Application language" },
  { id: "ur", name: "Ø§Ø±Ø¯Ùˆ", sub: "Ø§ÛŒÙ¾ Ú©ÛŒ Ù…Ú©Ù…Ù„ Ø²Ø¨Ø§Ù†" },
  { id: "hi", name: "à¤¹à¤¿à¤¨à¥à¤¦à¥€", sub: "à¤à¤ª à¤•à¥€ à¤­à¤¾à¤·à¤¾" },
];

interface PreviewVerseLine {
  indopak: string;
  uthmani: string;
  ayahNumber?: string;
  translations: Record<string, string>;
}

interface PreviewItem {
  title: string;
  subtitle: string;
  lines: PreviewVerseLine[];
}

function cleanIndoPakScript(text: string): string {
  return normalizeIndoPakText(text);
}

const PREVIEW_VERSES: Record<"fatiha" | "kursi", PreviewItem> = {
  fatiha: {
    title: "Surah Al-Fatiha (1:1-7)",
    subtitle: "Ù…Ú©Ù…Ù„ Ø³ÙˆØ±Ø© Ø§Ù„ÙØ§ØªØ­Ø© â€” Ø³Ø·Ø± Ø¨Û Ø³Ø·Ø± ØªØ±Ø¬Ù…Û (Interlinear Mushaf Layout)",
    lines: [
      {
        indopak: "Ø¨ÙØ³Ù’Ù…Ù Ø§Ù„Ù„Ù‘Ù°Ù‡Ù Ø§Ù„Ø±Ù‘ÙŽØ­Ù’Ù…Ù°Ù†Ù Ø§Ù„Ø±Ù‘ÙŽØ­ÙÛŒÙ’Ù…Ù",
        uthmani: "Ø¨ÙØ³Û¡Ù…Ù Ù±Ù„Ù„Ù‘ÙŽÙ‡Ù Ù±Ù„Ø±Ù‘ÙŽØ­Û¡Ù…ÙŽÙ€Ù°Ù†Ù Ù±Ù„Ø±Ù‘ÙŽØ­ÙÛŒÙ…Ù",
        ayahNumber: "Û±",
        translations: {
          "kanzul-iman-ur": "Ø§Ù„Ù„Û Ú©Û’ Ù†Ø§Ù… Ø³Û’ Ø´Ø±ÙˆØ¹ Ø¬Ùˆ Ø¨ÛØª Ù…ÛØ±Ø¨Ø§Ù† Ø±Ø­Ù…Øª ÙˆØ§Ù„Ø§ØŒ",
          "irfan-ul-quran-ur": "Ø§Ù„Ù„Û Ú©Û’ Ù†Ø§Ù… Ø³Û’ Ø´Ø±ÙˆØ¹ Ø¬Ùˆ Ù†ÛØ§ÛŒØª Ù…ÛØ±Ø¨Ø§Ù† ÛÙ…ÛŒØ´Û Ø±Ø­Ù… ÙØ±Ù…Ø§Ù†Û’ ÙˆØ§Ù„Ø§ ÛÛ’ØŒ",
          "jalandhari-ur": "Ø´Ø±ÙˆØ¹ Ø§Ù„Ù„Û Ú©Ø§ Ù†Ø§Ù… Ù„Û’ Ú©Ø± Ø¬Ùˆ Ø¨Ú‘Ø§ Ù…ÛØ±Ø¨Ø§Ù† Ù†ÛØ§ÛŒØª Ø±Ø­Ù… ÙˆØ§Ù„Ø§ ÛÛ’ØŒ",
          "kanzul-iman-en": "In the name of Allah, the Most Compassionate, Most Merciful.",
          "glorious-quran-en": "In the name of Allah, Most Gracious, Most Merciful.",
          "clear-quran-en": "In the Name of Allahâ€”the Most Compassionate, Most Merciful.",
          "kanzul-iman-hi": "à¤…à¤²à¥à¤²à¤¾à¤¹ à¤•à¥‡ à¤¨à¤¾à¤® à¤¸à¥‡ à¤¶à¥à¤°à¥‚ à¤œà¥‹ à¤¬à¤¹à¥à¤¤ à¤®à¥‡à¤¹à¤°à¤¬à¤¾à¤¨ à¤°à¤¹à¤®à¤¤ à¤µà¤¾à¤²à¤¾,",
          "farooq-khan-hi": "à¤…à¤²à¥à¤²à¤¾à¤¹ à¤•à¥‡ à¤¨à¤¾à¤® à¤¸à¥‡, à¤œà¥‹ à¤…à¤¤à¥à¤¯à¤‚à¤¤ à¤¦à¤¯à¤¾à¤µà¤¾à¤¨à¥, à¤…à¤¸à¥€à¤® à¤¦à¤¯à¤¾ à¤µà¤¾à¤²à¤¾ à¤¹à¥ˆ,",
        },
      },
      {
        indopak: "Ø§ÙŽÙ„Ù’Ø­ÙŽÙ…Ù’Ø¯Ù Ù„ÙÙ„Ù‘Ù°Ù‡Ù Ø±ÙŽØ¨Ù‘Ù Ø§Ù„Ù’Ø¹Ù°Ù„ÙŽÙ…ÙÛŒÙ’Ù†ÙŽ",
        uthmani: "Ù±Ù„Û¡Ø­ÙŽÙ…Û¡Ø¯Ù Ù„ÙÙ„Ù‘ÙŽÙ‡Ù Ø±ÙŽØ¨Ù‘Ù Ù±Ù„Û¡Ø¹ÙŽÙ€Ù°Ù„ÙŽÙ…ÙÛŒÙ†ÙŽ",
        ayahNumber: "Û²",
        translations: {
          "kanzul-iman-ur": "Ø³Ø¨ Ø®ÙˆØ¨ÛŒØ§Úº Ø§Ù„Ù„Û Ú©Ùˆ Ø¬Ùˆ Ù…Ø§Ù„Ú© Ø³Ø§Ø±Û’ Ø¬ÛØ§Ù† ÙˆØ§Ù„ÙˆÚº Ú©Ø§ØŒ",
          "irfan-ul-quran-ur": "Ø³Ø¨ ØªØ¹Ø±ÛŒÙÛŒÚº Ø§Ù„Ù„Û ÛÛŒ Ú©Û’ Ù„Ø¦Û’ ÛÛŒÚº Ø¬Ùˆ ØªÙ…Ø§Ù… Ø¬ÛØ§Ù†ÙˆÚº Ú©ÛŒ Ù¾Ø±ÙˆØ±Ø´ ÙØ±Ù…Ø§Ù†Û’ ÙˆØ§Ù„Ø§ ÛÛ’ØŒ",
          "jalandhari-ur": "Ø³Ø¨ Ø·Ø±Ø­ Ú©ÛŒ ØªØ¹Ø±ÛŒÙ Ø®Ø¯Ø§ ÛÛŒ Ú©Ùˆ (Ø³Ø²Ø§ÙˆØ§Ø±) ÛÛ’ Ø¬Ùˆ ØªÙ…Ø§Ù… Ù…Ø®Ù„ÙˆÙ‚Ø§Øª Ú©Ø§ Ù¾Ø±ÙˆØ±Ø¯Ú¯Ø§Ø± ÛÛ’ØŒ",
          "kanzul-iman-en": "All praise is due to Allah, the Sustainer of all the worlds,",
          "glorious-quran-en": "Praise be to Allah, Lord of the worlds,",
          "clear-quran-en": "All praise is for Allahâ€”Lord of all worlds,",
          "kanzul-iman-hi": "à¤¸à¤¬ à¤–à¥‚à¤¬à¤¿à¤¯à¤¾à¤‚ à¤…à¤²à¥à¤²à¤¾à¤¹ à¤•à¥‹ à¤œà¥‹ à¤®à¤¾à¤²à¤¿à¤• à¤¸à¤¾à¤°à¥‡ à¤œà¤¹à¤¾à¤¨ à¤µà¤¾à¤²à¥‹à¤‚ à¤•à¤¾,",
          "farooq-khan-hi": "à¤¸à¤¬ à¤ªà¥à¤°à¤¶à¤‚à¤¸à¤¾ à¤…à¤²à¥à¤²à¤¾à¤¹ à¤•à¥‡ à¤²à¤¿à¤ à¤¹à¥ˆ, à¤œà¥‹ à¤¸à¤¾à¤°à¥‡ à¤¸à¤‚à¤¸à¤¾à¤° à¤•à¤¾ à¤ªà¤¾à¤²à¤¨à¤¹à¤¾à¤° à¤¹à¥ˆ,",
        },
      },
      {
        indopak: "Ø§Ù„Ø±Ù‘ÙŽØ­Ù’Ù…Ù°Ù†Ù Ø§Ù„Ø±Ù‘ÙŽØ­ÙÛŒÙ’Ù…Ù",
        uthmani: "Ù±Ù„Ø±Ù‘ÙŽØ­Û¡Ù…ÙŽÙ€Ù°Ù†Ù Ù±Ù„Ø±Ù‘ÙŽØ­ÙÛŒÙ…Ù",
        ayahNumber: "Û³",
        translations: {
          "kanzul-iman-ur": "Ø¨ÛØª Ù…ÛØ±Ø¨Ø§Ù† Ø±Ø­Ù…Øª ÙˆØ§Ù„Ø§ØŒ",
          "irfan-ul-quran-ur": "Ù†ÛØ§ÛŒØª Ù…ÛØ±Ø¨Ø§Ù† Ø¨ÛØª Ø±Ø­Ù… ÙØ±Ù…Ø§Ù†Û’ ÙˆØ§Ù„Ø§ ÛÛ’ØŒ",
          "jalandhari-ur": "Ø¨Ú‘Ø§ Ù…ÛØ±Ø¨Ø§Ù† Ù†ÛØ§ÛŒØª Ø±Ø­Ù… ÙˆØ§Ù„Ø§ØŒ",
          "kanzul-iman-en": "The Most Compassionate, the Most Merciful,",
          "glorious-quran-en": "The Beneficent, the Merciful,",
          "clear-quran-en": "the Entirely Merciful, the Especially Merciful,",
          "kanzul-iman-hi": "à¤¬à¤¹à¥à¤¤ à¤®à¥‡à¤¹à¤°à¤¬à¤¾à¤¨ à¤°à¤¹à¤®à¤¤ à¤µà¤¾à¤²à¤¾,",
          "farooq-khan-hi": "à¤¬à¤¡à¤¼à¤¾ à¤¦à¤¯à¤¾à¤µà¤¾à¤¨à¥, à¤…à¤¤à¥à¤¯à¤‚à¤¤ à¤¦à¤¯à¤¾à¤¶à¥€à¤² à¤¹à¥ˆ,",
        },
      },
      {
        indopak: "Ù…Ù°Ù„ÙÙƒÙ ÛŒÙŽÙˆÙ’Ù…Ù Ø§Ù„Ø¯Ù‘ÙÛŒÙ’Ù†Ù",
        uthmani: "Ù…ÙŽÙ€Ù°Ù„ÙÙƒÙ ÛŒÙŽÙˆÛ¡Ù…Ù Ù±Ù„Ø¯Ù‘ÙÛŒÙ†Ù",
        ayahNumber: "Û´",
        translations: {
          "kanzul-iman-ur": "Ø±ÙˆØ²Ù Ø¬Ø²Ø§ Ú©Ø§ Ù…Ø§Ù„Ú©ØŒ",
          "irfan-ul-quran-ur": "Ø±ÙˆØ²Ù Ø¬Ø²Ø§ Ú©Ø§ Ù…Ø§Ù„Ú© ÛÛ’ØŒ",
          "jalandhari-ur": "Ø§Ù†ØµØ§Ù Ú©Û’ Ø¯Ù† Ú©Ø§ Ø­Ø§Ú©Ù…ØŒ",
          "kanzul-iman-en": "Master of the Day of Judgment,",
          "glorious-quran-en": "Master of the Day of Judgment,",
          "clear-quran-en": "Master of the Day of Judgment,",
          "kanzul-iman-hi": "à¤°à¥‹à¤œà¤¼-à¤-à¤œà¤œà¤¼à¤¾ (à¤¬à¤¦à¤²à¥‡ à¤•à¥‡ à¤¦à¤¿à¤¨) à¤•à¤¾ à¤®à¤¾à¤²à¤¿à¤•,",
          "farooq-khan-hi": "à¤¨à¥à¤¯à¤¾à¤¯ à¤•à¥‡ à¤¦à¤¿à¤¨ à¤•à¤¾ à¤¸à¥à¤µà¤¾à¤®à¥€ à¤¹à¥ˆ,",
        },
      },
      {
        indopak: "Ø§ÙÛŒÙ‘ÙŽØ§ÙƒÙŽ Ù†ÙŽØ¹Ù’Ø¨ÙØ¯Ù ÙˆÙŽ Ø§ÙÛŒÙ‘ÙŽØ§ÙƒÙŽ Ù†ÙŽØ³Ù’ØªÙŽØ¹ÙÛŒÙ’Ù†Ù",
        uthmani: "Ø¥ÙÛŒÙ‘ÙŽØ§ÙƒÙŽ Ù†ÙŽØ¹Û¡Ø¨ÙØ¯Ù ÙˆÙŽØ¥ÙÛŒÙ‘ÙŽØ§ÙƒÙŽ Ù†ÙŽØ³Û¡ØªÙŽØ¹ÙÛŒÙ†Ù",
        ayahNumber: "Ûµ",
        translations: {
          "kanzul-iman-ur": "ÛÙ… ØªØ¬Ú¾ÛŒ Ú©Ùˆ Ù¾ÙˆØ¬ÛŒÚº Ø§ÙˆØ± ØªØ¬Ú¾ÛŒ Ø³Û’ Ù…Ø¯Ø¯ Ú†Ø§ÛÛŒÚºØŒ",
          "irfan-ul-quran-ur": "(Ø§Û’ Ø§Ù„Ù„Û!) ÛÙ… ØªÛŒØ±ÛŒ ÛÛŒ Ø¹Ø¨Ø§Ø¯Øª Ú©Ø±ØªÛ’ ÛÛŒÚº Ø§ÙˆØ± ÛÙ… ØªØ¬Ú¾ ÛÛŒ Ø³Û’ Ù…Ø¯Ø¯ Ú†Ø§ÛØªÛ’ ÛÛŒÚºØŒ",
          "jalandhari-ur": "(Ø§Û’ Ù¾Ø±ÙˆØ±Ø¯Ú¯Ø§Ø±!) ÛÙ… ØªÛŒØ±ÛŒ ÛÛŒ Ø¹Ø¨Ø§Ø¯Øª Ú©Ø±ØªÛ’ ÛÛŒÚº Ø§ÙˆØ± ØªØ¬Ú¾ ÛÛŒ Ø³Û’ Ù…Ø¯Ø¯ Ù…Ø§Ù†Ú¯ØªÛ’ ÛÛŒÚºØŒ",
          "kanzul-iman-en": "You alone do we worship, and from You alone do we seek help.",
          "glorious-quran-en": "Thee alone do we worship and Thee alone do we ask for help.",
          "clear-quran-en": "You alone we worship and You alone we ask for help.",
          "kanzul-iman-hi": "à¤¹à¤® à¤¤à¥à¤à¥€ à¤•à¥‹ à¤ªà¥‚à¤œà¥‡à¤‚ à¤”à¤° à¤¤à¥à¤à¥€ à¤¸à¥‡ à¤®à¤¦à¤¦ à¤šà¤¾à¤¹à¥‡à¤‚,",
          "farooq-khan-hi": "à¤¹à¤® à¤¤à¥‡à¤°à¥€ à¤¹à¥€ à¤‡à¤¬à¤¾à¤¦à¤¤ à¤•à¤°à¤¤à¥‡ à¤¹à¥ˆà¤‚ à¤”à¤° à¤¤à¥à¤ à¤¹à¥€ à¤¸à¥‡ à¤®à¤¦à¤¦ à¤®à¤¾à¤à¤—à¤¤à¥‡ à¤¹à¥ˆà¤‚,",
        },
      },
      {
        indopak: "Ø§Ù‡Ù’Ø¯ÙÙ†ÙŽØ§ Ø§Ù„ØµÙ‘ÙØ±ÙŽØ§Ø·ÙŽ Ø§Ù„Ù’Ù…ÙØ³Ù’ØªÙŽÙ‚ÙÛŒÙ’Ù…ÙŽ",
        uthmani: "Ù±Ù‡Û¡Ø¯ÙÙ†ÙŽØ§ Ù±Ù„ØµÙ‘ÙØ±ÙŽâ€ŠÙ°â Ø·ÙŽ Ù±Ù„Û¡Ù…ÙØ³Û¡ØªÙŽÙ‚ÙÛŒÙ…ÙŽ",
        ayahNumber: "Û¶",
        translations: {
          "kanzul-iman-ur": "ÛÙ… Ú©Ùˆ Ø³ÛŒØ¯Ú¾Ø§ Ø±Ø§Ø³ØªÛ Ú†Ù„Ø§ØŒ",
          "irfan-ul-quran-ur": "ÛÙ…ÛŒÚº Ø³ÛŒØ¯Ú¾Ø§ Ø±Ø§Ø³ØªÛ Ø¯Ú©Ú¾Ø§ØŒ",
          "jalandhari-ur": "ÛÙ… Ú©Ùˆ Ø³ÛŒØ¯Ú¾Û’ Ø±Ø³ØªÛ’ Ú†Ù„Ø§ØŒ",
          "kanzul-iman-en": "Guide us upon the Straight Path,",
          "glorious-quran-en": "Show us the straight path,",
          "clear-quran-en": "Guide us along the Straight Pathâ€”",
          "kanzul-iman-hi": "à¤¹à¤® à¤•à¥‹ à¤¸à¥€à¤§à¤¾ à¤°à¤¾à¤¸à¥à¤¤à¤¾ à¤šà¤²à¤¾,",
          "farooq-khan-hi": "à¤¹à¤®à¥‡à¤‚ à¤¸à¥€à¤§à¤¾ à¤°à¤¾à¤¸à¥à¤¤à¤¾ à¤¦à¤¿à¤–à¤¾,",
        },
      },
      {
        indopak: "ØµÙØ±ÙŽØ§Ø·ÙŽ Ø§Ù„Ù‘ÙŽØ°ÙÛŒÙ’Ù†ÙŽ Ø§ÙŽÙ†Ù’Ø¹ÙŽÙ…Ù’ØªÙŽ Ø¹ÙŽÙ„ÙŽÛŒÙ’Ù‡ÙÙ…Ù’ ØºÙŽÛŒÙ’Ø±Ù Ø§Ù„Ù’Ù…ÙŽØºÙ’Ø¶ÙÙˆÙ’Ø¨Ù Ø¹ÙŽÙ„ÙŽÛŒÙ’Ù‡ÙÙ…Ù’ ÙˆÙŽ Ù„ÙŽØ§ Ø§Ù„Ø¶Ù‘ÙŽØ§Ù“Ù„Ù‘ÙÛŒÙ’Ù†ÙŽ",
        uthmani: "ØµÙØ±ÙŽâ€ŠÙ°â Ø·ÙŽ Ù±Ù„Ù‘ÙŽØ°ÙÛŒÙ†ÙŽ Ø£ÙŽÙ†Û¡Ø¹ÙŽÙ…Û¡ØªÙŽ Ø¹ÙŽÙ„ÙŽÛŒÛ¡Ù‡ÙÙ…Û¡ ØºÙŽÛŒÛ¡Ø±Ù Ù±Ù„Û¡Ù…ÙŽØºÛ¡Ø¶ÙÙˆØ¨Ù Ø¹ÙŽÙ„ÙŽÛŒÛ¡Ù‡ÙÙ…Û¡ ÙˆÙŽÙ„ÙŽØ§ Ù±Ù„Ø¶Ù‘ÙŽØ§Û¤Ù„Ù‘ÙÛŒÙ†ÙŽ",
        ayahNumber: "Û·",
        translations: {
          "kanzul-iman-ur": "Ø±Ø§Ø³ØªÛ Ø§Ù† Ú©Ø§ Ø¬Ù† Ù¾Ø± ØªÙˆ Ù†Û’ Ø§Ø­Ø³Ø§Ù† Ú©ÛŒØ§ØŒ Ù†Û Ø§Ù† Ú©Ø§ Ø¬Ù† Ù¾Ø± ØºØ¶Ø¨ ÛÙˆØ§ Ø§ÙˆØ± Ù†Û Ø¨ÛÚ©Û’ ÛÙˆØ¤Úº Ú©Ø§Û”",
          "irfan-ul-quran-ur": "Ø§Ù† Ù„ÙˆÚ¯ÙˆÚº Ú©Ø§ Ø±Ø§Ø³ØªÛ Ø¬Ù† Ù¾Ø± ØªÙˆ Ù†Û’ Ø§Ù†Ø¹Ø§Ù… ÙØ±Ù…Ø§ÛŒØ§ØŒ Ø§Ù† Ù„ÙˆÚ¯ÙˆÚº Ú©Ø§ Ù†ÛÛŒÚº Ø¬Ù† Ù¾Ø± ØºØ¶Ø¨ Ú©ÛŒØ§ Ú¯ÛŒØ§ ÛÛ’ Ø§ÙˆØ± Ù†Û Ú¯Ù…Ø±Ø§ÛÙˆÚº Ú©Ø§Û”",
          "jalandhari-ur": "Ø§Ù† Ù„ÙˆÚ¯ÙˆÚº Ú©Û’ Ø±Ø³ØªÛ’ Ø¬Ù† Ù¾Ø± ØªÙˆ Ø§Ù¾Ù†Ø§ ÙØ¶Ù„ Ùˆ Ú©Ø±Ù… Ú©Ø±ØªØ§ Ø±ÛØ§ØŒ Ù†Û Ø§Ù† Ú©Û’ Ø¬Ù† Ù¾Ø± ØºØµÛ’ ÛÙˆØªØ§ Ø±ÛØ§ Ø§ÙˆØ± Ù†Û Ú¯Ù…Ø±Ø§ÛÙˆÚº Ú©Û’Û”",
          "kanzul-iman-en": "The path of those whom You have favoured, not of those who earned Your anger, nor of those who went astray.",
          "glorious-quran-en": "The path of those whom Thou hast favored; Not the path of those who earn Thine anger nor of those who go astray.",
          "clear-quran-en": "the Path of those You have blessed, not those You are displeased with, or those who are astray.",
          "kanzul-iman-hi": "à¤°à¤¾à¤¸à¥à¤¤à¤¾ à¤‰à¤¨à¤•à¤¾ à¤œà¤¿à¤¨ à¤ªà¤° à¤¤à¥‚à¤¨à¥‡ à¤à¤¹à¤¸à¤¾à¤¨ à¤•à¤¿à¤¯à¤¾, à¤¨ à¤‰à¤¨à¤•à¤¾ à¤œà¤¿à¤¨ à¤ªà¤° à¤—à¤¼à¤œà¤¼à¤¬ à¤¹à¥à¤† à¤”à¤° à¤¨ à¤¬à¤¹à¤•à¥‡ à¤¹à¥à¤“à¤‚ à¤•à¤¾à¥¤",
          "farooq-khan-hi": "à¤‰à¤¨ à¤²à¥‹à¤—à¥‹à¤‚ à¤•à¤¾ à¤°à¤¾à¤¸à¥à¤¤à¤¾, à¤œà¤¿à¤¨ à¤ªà¤° à¤¤à¥‚à¤¨à¥‡ à¤•à¥ƒà¤ªà¤¾ à¤•à¥€, à¤¨ à¤•à¤¿ à¤‰à¤¨à¤•à¤¾ à¤œà¤¿à¤¨ à¤ªà¤° à¤ªà¥à¤°à¤•à¥‹à¤ª à¤¹à¥à¤† à¤”à¤° à¤¨ à¤¬à¤¹Ú©Û’ à¤¹à¥à¤“à¤‚ à¤•à¤¾à¥¤",
        },
      },
    ],
  },
  kursi: {
    title: "Ayat al-Kursi (Surah Al-Baqarah 2:255)",
    subtitle: "Ø¢ÙŠØ© Ø§Ù„ÙƒØ±Ø³ÙŠ â€” Ø³Ø·Ø± Ø¨Û Ø³Ø·Ø± ØªØ±Ø¬Ù…Û (5 Authentic Mushaf Lines)",
    lines: [
      {
        indopak: "Ø§ÙŽÙ„Ù„Ù‘Ù°Ù‡Ù Ù„ÙŽØ§Û¤ Ø§ÙÙ„Ù°Ù‡ÙŽ Ø§ÙÙ„Ù‘ÙŽØ§ Ù‡ÙÙˆÙŽ Ûš Ø§ÙŽÙ„Ù’Ø­ÙŽÛŒÙ‘Ù Ø§Ù„Ù’Ù‚ÙŽÛŒÙ‘ÙÙˆÙ’Ù…Ù Ûš Ù„ÙŽØ§ ØªÙŽØ§Ù’Ø®ÙØ°ÙÙ‡Ù— Ø³ÙÙ†ÙŽØ©ÙŒ ÙˆÙ‘ÙŽÙ„ÙŽØ§ Ù†ÙŽÙˆÙ’Ù…ÙŒ Ø•",
        uthmani: "Ù±Ù„Ù„Ù‘ÙŽÙ‡Ù Ù„ÙŽØ§Ù“ Ø¥ÙÙ„ÙŽÙ€Ù°Ù‡ÙŽ Ø¥ÙÙ„Ù‘ÙŽØ§ Ù‡ÙÙˆÙŽ Ù±Ù„Û¡Ø­ÙŽÙ‰Ù‘Ù Ù±Ù„Û¡Ù‚ÙŽÛŒÙ‘ÙÙˆÙ…ÙÛš Ù„ÙŽØ§ ØªÙŽØ£Û¡Ø®ÙØ°ÙÙ‡ÙÛ¥ Ø³ÙÙ†ÙŽØ©à£± ÙˆÙŽÙ„ÙŽØ§ Ù†ÙŽÙˆÛ¡Ù…à£±Ûš",
        translations: {
          "kanzul-iman-ur": "Ø§Ù„Ù„Û ÛÛ’ Ø¬Ø³ Ú©Û’ Ø³ÙˆØ§ Ú©ÙˆØ¦ÛŒ Ù…Ø¹Ø¨ÙˆØ¯ Ù†ÛÛŒÚºØŒ ÙˆÛ Ø¢Ù¾ Ø²Ù†Ø¯Û Ø§ÙˆØ± Ø§ÙˆØ±ÙˆÚº Ú©Ø§ Ù‚Ø§Ø¦Ù… Ø±Ú©Ú¾Ù†Û’ ÙˆØ§Ù„Ø§ØŒ Ø§Ø³Û’ Ù†Û Ø§ÙˆÙ†Ú¯Ú¾ Ø¢Ø¦Û’ Ù†Û Ù†ÛŒÙ†Ø¯ØŒ",
          "irfan-ul-quran-ur": "Ø§ï·²ØŒ Ø§Ø³ Ú©Û’ Ø³ÙˆØ§ Ú©ÙˆØ¦ÛŒ Ø¹Ø¨Ø§Ø¯Øª Ú©Û’ Ù„Ø§Ø¦Ù‚ Ù†ÛÛŒÚºØŒ ÛÙ…ÛŒØ´Û Ø²Ù†Ø¯Û Ø±ÛÙ†Û’ ÙˆØ§Ù„Ø§ ÛÛ’ (Ø³Ø§Ø±Û’ Ø¹Ø§Ù„Ù… Ú©Ùˆ Ø§Ù¾Ù†ÛŒ ØªØ¯Ø¨ÛŒØ± Ø³Û’) Ù‚Ø§Ø¦Ù… Ø±Ú©Ú¾Ù†Û’ ÙˆØ§Ù„Ø§ ÛÛ’ØŒ Ù†Û Ø§Ø³ Ú©Ùˆ Ø§ÙÙˆÙ†Ú¯Ú¾ Ø¢ØªÛŒ ÛÛ’ Ø§ÙˆØ± Ù†Û Ù†ÛŒÙ†Ø¯ØŒ",
          "jalandhari-ur": "Ø®Ø¯Ø§ (ÙˆÛ Ù…Ø¹Ø¨ÙˆØ¯ Ø¨Ø±Ø­Ù‚ ÛÛ’ Ú©Û) Ø§Ø³ Ú©Û’ Ø³ÙˆØ§ Ú©ÙˆØ¦ÛŒ Ø¹Ø¨Ø§Ø¯Øª Ú©Û’ Ù„Ø§Ø¦Ù‚ Ù†ÛÛŒÚºØŒ Ø²Ù†Ø¯Û ÛÙ…ÛŒØ´Û Ø±ÛÙ†Û’ ÙˆØ§Ù„Ø§ØŒ Ø§Ø³Û’ Ù†Û Ø§ÙˆÙ†Ú¯Ú¾ Ø¢ØªÛŒ ÛÛ’ Ù†Û Ù†ÛŒÙ†Ø¯ØŒ",
          "kanzul-iman-en": "Allahâ€”there is no deity except Him, the Ever-Living, the Sustainer of all existence. Neither drowsiness overtakes Him nor sleep.",
          "glorious-quran-en": "Allah! There is no god but Heâ€”the Living, the Self-subsisting, Eternal. No slumber can seize Him nor sleep.",
          "clear-quran-en": "Allah! There is no god worthy of worship except Him, the Ever-Living, All-Sustaining. Neither drowsiness nor sleep overtakes Him.",
          "kanzul-iman-hi": "à¤…à¤²à¥à¤²à¤¾à¤¹ à¤¹à¥ˆ à¤œà¤¿à¤¸à¤•à¥‡ à¤¸à¤¿à¤µà¤¾ à¤•à¥‹à¤ˆ à¤®à¤¾'à¤¬à¥‚à¤¦ à¤¨à¤¹à¥€à¤‚, à¤µà¤¹ à¤†à¤ª à¤œà¤¼à¤¿à¤‚à¤¦à¤¾ à¤”à¤° à¤”à¤°à¥‹à¤‚ à¤•à¤¾ à¤•à¤¼à¤¾à¤¯à¤® à¤°à¤–à¤¨à¥‡ à¤µà¤¾à¤²à¤¾, à¤‰à¤¸à¥‡ à¤¨ à¤Šà¤‚à¤˜ à¤†à¤ à¤¨ à¤¨à¥€à¤‚à¤¦,",
          "farooq-khan-hi": "à¤…à¤²à¥à¤²à¤¾à¤¹ (à¤µà¤¹ à¤¹à¥ˆ à¤•à¤¿) à¤‰à¤¸à¤•à¥‡ à¤¸à¤¿à¤µà¤¾ à¤•à¥‹à¤ˆ à¤ªà¥‚à¤œà¥à¤¯ à¤¨à¤¹à¥€à¤‚à¥¤ (à¤µà¤¹) à¤œà¥€à¤µà¤¿à¤¤ à¤¹à¥ˆ, à¤¹à¤° à¤šà¥€à¤œà¤¼ à¤•à¥‹ à¤¸à¤à¤­à¤¾à¤²à¤¨à¥‡ à¤µà¤¾à¤²à¤¾ à¤¹à¥ˆà¥¤ à¤¨ à¤‰à¤¸à¥‡ à¤•à¥à¤› à¤Šà¤à¤˜ à¤ªà¤•à¤¡à¤¼à¤¤à¥€ à¤¹à¥ˆ à¤”à¤° à¤¨ à¤¨à¥€à¤‚à¤¦à¥¤",
        },
      },
      {
        indopak: "Ù„ÙŽÙ‡Ù— Ù…ÙŽØ§ ÙÙÛŒ Ø§Ù„Ø³Ù‘ÙŽÙ…Ù°ÙˆÙ°ØªÙ ÙˆÙŽÙ…ÙŽØ§ ÙÙÛŒ Ø§Ù„Ù’Ø§ÙŽØ±Ù’Ø¶Ù Ø• Ù…ÙŽÙ†Ù’ Ø°ÙŽØ§ Ø§Ù„Ù‘ÙŽØ°ÙÛŒÙ’ ÛŒÙŽØ´Ù’ÙÙŽØ¹Ù Ø¹ÙÙ†Ù’Ø¯ÙŽÙ‡Ù—Û¤ Ø§ÙÙ„Ù‘ÙŽØ§ Ø¨ÙØ§ÙØ°Ù’Ù†ÙÙ‡Ù– Ø•",
        uthmani: "Ù„Ù‘ÙŽÙ‡ÙÛ¥ Ù…ÙŽØ§ ÙÙÛŒ Ù±Ù„Ø³Ù‘ÙŽÙ…ÙŽÙ€Ù°ÙˆÙŽâ€ŠÙ°â ØªÙ ÙˆÙŽÙ…ÙŽØ§ ÙÙÛŒ Ù±Ù„Û¡Ø£ÙŽØ±Û¡Ø¶ÙÛ— Ù…ÙŽÙ† Ø°ÙŽØ§ Ù±Ù„Ù‘ÙŽØ°ÙÛŒ ÛŒÙŽØ´Û¡ÙÙŽØ¹Ù Ø¹ÙÙ†Ø¯ÙŽÙ‡ÙÛ¥Û¤ Ø¥ÙÙ„Ù‘ÙŽØ§ Ø¨ÙØ¥ÙØ°Û¡Ù†ÙÙ‡ÙÛ¦Ûš",
        translations: {
          "kanzul-iman-ur": "Ø§Ø³ÛŒ Ú©Ø§ ÛÛ’ Ø¬Ùˆ Ú©Ú†Ú¾ Ø¢Ø³Ù…Ø§Ù†ÙˆÚº Ù…ÛŒÚº ÛÛ’ Ø§ÙˆØ± Ø¬Ùˆ Ú©Ú†Ú¾ Ø²Ù…ÛŒÙ† Ù…ÛŒÚºØŒ ÙˆÛ Ú©ÙˆÙ† ÛÛ’ Ø¬Ùˆ Ø§Ø³ Ú©Û’ ÛŒÛØ§Úº Ø³ÙØ§Ø±Ø´ Ú©Ø±Û’ Ø¨ØºÛŒØ± Ø§Ø³ Ú©Û’ Ø­Ú©Ù… Ú©Û’!",
          "irfan-ul-quran-ur": "Ø¬Ùˆ Ú©Ú†Ú¾ Ø¢Ø³Ù…Ø§Ù†ÙˆÚº Ù…ÛŒÚº ÛÛ’ Ø§ÙˆØ± Ø¬Ùˆ Ú©Ú†Ú¾ Ø²Ù…ÛŒÙ† Ù…ÛŒÚº ÛÛ’ Ø³Ø¨ Ø§Ø³ÛŒ Ú©Ø§ ÛÛ’ØŒ Ú©ÙˆÙ† Ø§ÛŒØ³Ø§ Ø´Ø®Øµ ÛÛ’ Ø¬Ùˆ Ø§Ø³ Ú©Û’ Ø­Ø¶ÙˆØ± Ø§Ø³ Ú©Û’ Ø§ÙØ°Ù† Ú©Û’ Ø¨ØºÛŒØ± Ø³ÙØ§Ø±Ø´ Ú©Ø± Ø³Ú©Û’!",
          "jalandhari-ur": "Ø¬Ùˆ Ú©Ú†Ú¾ Ø¢Ø³Ù…Ø§Ù†ÙˆÚº Ù…ÛŒÚº Ø§ÙˆØ± Ø¬Ùˆ Ú©Ú†Ú¾ Ø²Ù…ÛŒÙ† Ù…ÛŒÚº ÛÛ’ Ø³Ø¨ Ø§Ø³ÛŒ Ú©Ø§ ÛÛ’ØŒ Ú©ÙˆÙ† ÛÛ’ Ø¬Ùˆ Ø§Ø³ Ú©ÛŒ Ø§Ø¬Ø§Ø²Øª Ú©Û’ Ø¨ØºÛŒØ± Ø§Ø³ Ú©Û’ Ù¾Ø§Ø³ Ø³ÙØ§Ø±Ø´ Ú©Ø± Ø³Ú©Û’!",
          "kanzul-iman-en": "To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission?",
          "glorious-quran-en": "His are all things in the heavens and on earth. Who can intercede in His presence except as He permitteth?",
          "clear-quran-en": "To Him belongs whatever is in the heavens and whatever is on the earth. Who could possibly intercede with Him without His permission?",
          "kanzul-iman-hi": "à¤‰à¤¸à¥€ à¤•à¤¾ à¤¹à¥ˆ à¤œà¥‹ à¤•à¥à¤› à¤†à¤¸à¤®à¤¾à¤¨à¥‹à¤‚ à¤®à¥‡à¤‚ à¤¹à¥ˆ à¤”à¤° à¤œà¥‹ à¤•à¥à¤› à¤œà¤¼à¤®à¥€à¤¨ à¤®à¥‡à¤‚, à¤µà¤¹ à¤•à¥Œà¤¨ à¤¹à¥ˆ à¤œà¥‹ à¤‰à¤¸à¤•à¥‡ à¤¯à¤¹à¤¾à¤ à¤¸à¤¿à¤«à¤¼à¤¾à¤°à¤¿à¤¶ à¤•à¤°à¥‡ à¤¬à¥‡ à¤‰à¤¸à¤•à¥‡ à¤¹à¥à¤•à¥à¤® à¤•à¥‡!",
          "farooq-khan-hi": "à¤‰à¤¸à¥€ à¤•à¤¾ à¤¹à¥ˆ à¤œà¥‹ à¤•à¥à¤› à¤†à¤•à¤¾à¤¶à¥‹à¤‚ à¤®à¥‡à¤‚ à¤”à¤° à¤œà¥‹ à¤•à¥à¤› à¤§à¤°à¤¤à¥€ à¤®à¥‡à¤‚ à¤¹à¥ˆà¥¤ à¤•à¥Œà¤¨ à¤¹à¥ˆ, à¤œà¥‹ à¤‰à¤¸à¤•à¥‡ à¤ªà¤¾à¤¸ à¤‰à¤¸à¤•à¥€ à¤…à¤¨à¥à¤®à¤¤à¤¿ à¤•à¥‡ à¤¬à¤¿à¤¨à¤¾ à¤¸à¤¿à¤«à¤¼à¤¾à¤°à¤¿à¤¶ à¤•à¤°à¥‡?",
        },
      },
      {
        indopak: "ÛŒÙŽØ¹Ù’Ù„ÙŽÙ…Ù Ù…ÙŽØ§ Ø¨ÙŽÛŒÙ’Ù†ÙŽ Ø§ÙŽÛŒÙ’Ø¯ÙÛŒÙ’Ù‡ÙÙ…Ù’ ÙˆÙŽÙ…ÙŽØ§ Ø®ÙŽÙ„Ù’ÙÙŽÙ‡ÙÙ…Ù’ Ûš ÙˆÙŽÙ„ÙŽØ§ ÛŒÙØ­ÙÛŒÙ’Ø·ÙÙˆÙ’Ù†ÙŽ Ø¨ÙØ´ÙŽÛŒÙ’Ø¡Ù Ù…Ù‘ÙÙ†Ù’ Ø¹ÙÙ„Ù’Ù…ÙÙ‡Ù–Û¤ Ø§ÙÙ„Ù‘ÙŽØ§ Ø¨ÙÙ…ÙŽØ§ Ø´ÙŽØ§Ù“Ø¡ÙŽ Ûš",
        uthmani: "ÛŒÙŽØ¹Û¡Ù„ÙŽÙ…Ù Ù…ÙŽØ§ Ø¨ÙŽÛŒÛ¡Ù†ÙŽ Ø£ÙŽÛŒÛ¡Ø¯ÙÛŒÙ‡ÙÙ…Û¡ ÙˆÙŽÙ…ÙŽØ§ Ø®ÙŽÙ„Û¡ÙÙŽÙ‡ÙÙ…Û¡Û– ÙˆÙŽÙ„ÙŽØ§ ÛŒÙØ­ÙÛŒØ·ÙÙˆÙ†ÙŽ Ø¨ÙØ´ÙŽÛŒÛ¡Ø¡à£² Ù…Ù‘ÙÙ†Û¡ Ø¹ÙÙ„Û¡Ù…ÙÙ‡ÙÛ¦Û¤ Ø¥ÙÙ„Ù‘ÙŽØ§ Ø¨ÙÙ…ÙŽØ§ Ø´ÙŽØ§Ù“Ø¡ÙŽÛš",
        translations: {
          "kanzul-iman-ur": "Ø¬Ø§Ù†ØªØ§ ÛÛ’ Ø¬Ùˆ Ú©Ú†Ú¾ Ø§Ù† Ú©Û’ Ø¢Ú¯Û’ ÛÛ’ Ø§ÙˆØ± Ø¬Ùˆ Ú©Ú†Ú¾ Ø§Ù† Ú©Û’ Ù¾ÛŒÚ†Ú¾Û’ØŒ Ø§ÙˆØ± ÙˆÛ Ù†ÛÛŒÚº Ù¾Ø§ØªÛ’ Ø§Ø³ Ú©Û’ Ø¹Ù„Ù… Ù…ÛŒÚº Ø³Û’ Ù…Ú¯Ø± Ø¬ØªÙ†Ø§ ÙˆÛ Ú†Ø§ÛÛ’ØŒ",
          "irfan-ul-quran-ur": "Ø¬Ùˆ Ú©Ú†Ú¾ Ù…Ø®Ù„ÙˆÙ‚Ø§Øª Ú©Û’ Ø³Ø§Ù…Ù†Û’ ÛÛ’ Ø§ÙˆØ± Ø¬Ùˆ Ú©Ú†Ú¾ Ø§Ù† Ú©Û’ Ø¨Ø¹Ø¯ ÛÛ’ (ÙˆÛ) Ø³Ø¨ Ø¬Ø§Ù†ØªØ§ ÛÛ’ØŒ Ø§ÙˆØ± ÙˆÛ Ø§Ø³ Ú©ÛŒ Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ù…ÛŒÚº Ø³Û’ Ú©Ø³ÛŒ Ú†ÛŒØ² Ú©Ø§ Ø¨Ú¾ÛŒ Ø§Ø­Ø§Ø·Û Ù†ÛÛŒÚº Ú©Ø± Ø³Ú©ØªÛ’ Ù…Ú¯Ø± Ø¬Ø³ Ù‚Ø¯Ø± ÙˆÛ Ú†Ø§ÛÛ’ØŒ",
          "jalandhari-ur": "Ø¬Ùˆ Ú©Ú†Ú¾ Ù„ÙˆÚ¯ÙˆÚº Ú©Û’ Ø±ÙˆØ¨Ø±Ùˆ ÛÙˆ Ø±ÛØ§ ÛÛ’ Ø§ÙˆØ± Ø¬Ùˆ Ú©Ú†Ú¾ Ø§Ù† Ú©Û’ Ù¾ÛŒÚ†Ú¾Û’ ÛÙˆÚ†Ú©Ø§ ÛÛ’ Ø§Ø³Û’ Ø³Ø¨ Ù…Ø¹Ù„ÙˆÙ… ÛÛ’ØŒ Ø§ÙˆØ± ÙˆÛ Ø§Ø³ Ú©ÛŒ Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ù…ÛŒÚº Ø³Û’ Ú©Ø³ÛŒ Ú†ÛŒØ² Ù¾Ø± Ø¯Ø³ØªØ±Ø³ Ø­Ø§ØµÙ„ Ù†ÛÛŒÚº Ú©Ø± Ø³Ú©ØªÛ’ ÛØ§Úº Ø¬Ø³ Ù‚Ø¯Ø± ÙˆÛ Ú†Ø§ÛÛ’ØŒ",
          "kanzul-iman-en": "He knows what is before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills.",
          "glorious-quran-en": "He knoweth what (appeareth to His creatures as) before or after or behind them. Nor shall they compass aught of His knowledge except as He willeth.",
          "clear-quran-en": "He fully knows what is ahead of them and what is behind them, but no one can grasp any of His knowledgeâ€”except what He wills to reveal.",
          "kanzul-iman-hi": "à¤œà¤¾à¤¨à¤¤à¤¾ à¤¹à¥ˆ à¤œà¥‹ à¤•à¥à¤› à¤‰à¤¨à¤•à¥‡ à¤†à¤—à¥‡ à¤¹à¥ˆ à¤”à¤° à¤œà¥‹ à¤•à¥à¤› à¤‰à¤¨à¤•à¥‡ à¤ªà¥€à¤›à¥‡, à¤”à¤° à¤µà¤¹ à¤¨à¤¹à¥€à¤‚ à¤ªà¤¾à¤¤à¥‡ à¤‰à¤¸à¤•à¥‡ à¤‡à¤²à¥à¤® à¤®à¥‡à¤‚ à¤¸à¥‡ à¤®à¤—à¤° à¤œà¤¿à¤¤à¤¨à¤¾ à¤µà¤¹ à¤šà¤¾à¤¹à¥‡,",
          "farooq-khan-hi": "à¤µà¤¹ à¤œà¤¾à¤¨à¤¤à¤¾ à¤¹à¥ˆ à¤œà¥‹ à¤•à¥à¤› à¤‰à¤¨à¤•à¥‡ à¤¸à¤¾à¤®à¤¨à¥‡ à¤”à¤° à¤œà¥‹ à¤•à¥à¤› à¤‰à¤¨à¤•à¥‡ à¤ªà¥€à¤›à¥‡ à¤¹à¥ˆà¥¤ à¤”à¤° à¤µà¥‡ à¤‰à¤¸à¤•à¥‡ à¤œà¥à¤žà¤¾à¤¨ à¤®à¥‡à¤‚ à¤¸à¥‡ à¤•à¤¿à¤¸à¥€ à¤šà¥€à¤œà¤¼ à¤•à¥‹ à¤¨à¤¹à¥€à¤‚ à¤˜à¥‡à¤° à¤¸à¤•à¤¤à¥‡, à¤ªà¤°à¤‚à¤¤à¥ à¤œà¤¿à¤¤à¤¨à¤¾ à¤µà¤¹ à¤šà¤¾à¤¹à¥‡à¥¤",
        },
      },
      {
        indopak: "ÙˆÙŽØ³ÙØ¹ÙŽ ÙƒÙØ±Ù’Ø³ÙÛŒÙ‘ÙÙ‡Ù Ø§Ù„Ø³Ù‘ÙŽÙ…Ù°ÙˆÙ°ØªÙ ÙˆÙŽØ§Ù„Ù’Ø§ÙŽØ±Ù’Ø¶ÙŽ Ûš ÙˆÙŽÙ„ÙŽØ§ ÛŒÙŽÙ€Ù€Ù€Ù”ÙÙˆÙ’Ø¯ÙÙ‡Ù— Ø­ÙÙÙ’Ø¸ÙÙ‡ÙÙ…ÙŽØ§ Ûš",
        uthmani: "ÙˆÙŽØ³ÙØ¹ÙŽ ÙƒÙØ±Û¡Ø³ÙÛŒÙ‘ÙÙ‡Ù Ù±Ù„Ø³Ù‘ÙŽÙ…ÙŽÙ€Ù°ÙˆÙŽâ€ŠÙ°â ØªÙ ÙˆÙŽÙ±Ù„Û¡Ø£ÙŽØ±Û¡Ø¶ÙŽÛ– ÙˆÙŽÙ„ÙŽØ§ ÛŒÙŽÙ€Ù”ÙÙˆØ¯ÙÙ‡ÙÛ¥ Ø­ÙÙÛ¡Ø¸ÙÙ‡ÙÙ…ÙŽØ§Ûš",
        translations: {
          "kanzul-iman-ur": "Ø§Ø³ Ú©ÛŒ Ú©Ø±Ø³ÛŒ Ù…ÛŒÚº Ø³Ù…Ø§Ø¦Û’ ÛÙˆØ¦Û’ ÛÛŒÚº Ø¢Ø³Ù…Ø§Ù† Ø§ÙˆØ± Ø²Ù…ÛŒÙ†ØŒ Ø§ÙˆØ± Ø§Ø³Û’ Ø¨Ú¾Ø§Ø±ÛŒ Ù†ÛÛŒÚº Ø§Ù† Ú©ÛŒ Ù†Ú¯ÛØ¨Ø§Ù†ÛŒØŒ",
          "irfan-ul-quran-ur": "Ø§Ø³ Ú©ÛŒ Ú©Ø±Ø³ÛŒ ØªÙ…Ø§Ù… Ø¢Ø³Ù…Ø§Ù†ÙˆÚº Ø§ÙˆØ± Ø²Ù…ÛŒÙ† Ú©Ùˆ Ù…Ø­ÛŒØ· ÛÛ’ØŒ Ø§ÙˆØ± Ø§Ø³ Ù¾Ø± Ø§Ù† Ø¯ÙˆÙ†ÙˆÚº Ú©ÛŒ Ø­ÙØ§Ø¸Øª ÛØ±Ú¯Ø² Ø¯Ø´ÙˆØ§Ø± Ù†ÛÛŒÚºØŒ",
          "jalandhari-ur": "Ø§Ø³ Ú©ÛŒ Ø¨Ø§Ø¯Ø´Ø§ÛÛŒ Ø¢Ø³Ù…Ø§Ù† Ø§ÙˆØ± Ø²Ù…ÛŒÙ† Ø³Ø¨ Ù¾Ø± Ø­Ø§ÙˆÛŒ ÛÛ’ØŒ Ø§ÙˆØ± Ø§Ø³Û’ Ø§Ù† Ú©ÛŒ Ø­ÙØ§Ø¸Øª Ú©Ú†Ú¾ Ø¨Ú¾ÛŒ Ø¯Ø´ÙˆØ§Ø± Ù†ÛÛŒÚºØŒ",
          "kanzul-iman-en": "His seat extends over the heavens and the earth, and their preservation tires Him not.",
          "glorious-quran-en": "His Throne doth extend over the heavens and the earth, and He feeleth no fatigue in guarding and preserving them,",
          "clear-quran-en": "His Seat encompasses the heavens and the earth, and the preservation of both does not tire Him.",
          "kanzul-iman-hi": "à¤‰à¤¸à¤•à¥€ à¤•à¥à¤°à¥à¤¸à¥€ à¤®à¥‡à¤‚ à¤¸à¤®à¤¾à¤ à¤¹à¥à¤ à¤¹à¥ˆà¤‚ à¤†à¤¸à¤®à¤¾à¤¨ à¤”à¤° à¤œà¤¼à¤®à¥€à¤¨, à¤”à¤° à¤‰à¤¸à¥‡ à¤­à¤¾à¤°à¥€ à¤¨à¤¹à¥€à¤‚ à¤‰à¤¨à¤•à¥€ à¤¨à¤¿à¤—à¤¹à¤¬à¤¾à¤¨à¥€,",
          "farooq-khan-hi": "à¤‰à¤¸à¤•à¥€ à¤•à¥à¤°à¥à¤¸à¥€ à¤†à¤•à¤¾à¤¶à¥‹à¤‚ à¤”à¤° à¤§à¤°à¤¤à¥€ à¤•à¥‹ à¤µà¥à¤¯à¤¾à¤ªà¥à¤¤ à¤¹à¥ˆ à¤”à¤° à¤‰à¤¨ à¤¦à¥‹à¤¨à¥‹à¤‚ à¤•à¥€ à¤°à¤•à¥à¤·à¤¾ à¤‰à¤¸à¥‡ à¤¨à¤¹à¥€à¤‚ à¤¥à¤•à¤¾à¤¤à¥€à¥¤",
        },
      },
      {
        indopak: "ÙˆÙŽÙ‡ÙÙˆÙŽ Ø§Ù„Ù’Ø¹ÙŽÙ„ÙÛŒÙ‘Ù Ø§Ù„Ù’Ø¹ÙŽØ¸ÙÛŒÙ’Ù…Ù Ø•",
        uthmani: "ÙˆÙŽÙ‡ÙÙˆÙŽ Ù±Ù„Û¡Ø¹ÙŽÙ„ÙÛŒÙ‘Ù Ù±Ù„Û¡Ø¹ÙŽØ¸ÙÛŒÙ…Ù",
        ayahNumber: "Û²ÛµÛµ",
        translations: {
          "kanzul-iman-ur": "Ø§ÙˆØ± ÙˆÛÛŒ ÛÛ’ Ø¨Ù„Ù†Ø¯ Ø¨Ú‘Ø§Ø¦ÛŒ ÙˆØ§Ù„Ø§Û”",
          "irfan-ul-quran-ur": "ÙˆÛÛŒ Ø³Ø¨ Ø³Û’ Ø¨Ù„Ù†Ø¯ Ø±ØªØ¨Û Ø¨Ú‘ÛŒ Ø¹Ø¸Ù…Øª ÙˆØ§Ù„Ø§ ÛÛ’Û”",
          "jalandhari-ur": "ÙˆÛ Ø¨Ú‘Ø§ Ø¹Ø§Ù„ÛŒ Ø±ØªØ¨Û Ø§ÙˆØ± Ø¬Ù„ÛŒÙ„ Ø§Ù„Ù‚Ø¯Ø± ÛÛ’Û”",
          "kanzul-iman-en": "And He is the Most High, the Most Great.",
          "glorious-quran-en": "For He is the Most High, the Supreme (in glory).",
          "clear-quran-en": "For He is the Most High, the Greatest.",
          "kanzul-iman-hi": "à¤”à¤° à¤µà¤¹à¥€ à¤¹à¥ˆ à¤¬à¥à¤²à¤‚à¤¦ à¤¬à¤¡à¤¼à¤¾à¤ˆ à¤µà¤¾à¤²à¤¾à¥¤",
          "farooq-khan-hi": "à¤”à¤° à¤µà¤¹à¥€ à¤¸à¤¬à¤¸à¥‡ à¤Šà¤à¤šà¤¾, à¤¸à¤¬à¤¸à¥‡ à¤®à¤¹à¤¾à¤¨ à¤¹à¥ˆà¥¤",
        },
      },
    ],
  },
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, userIdentifier, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("quran");
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings(userIdentifier));
  const [savedNotice, setSavedNotice] = useState(false);
  const [previewVerseKey, setPreviewVerseKey] = useState<"kursi" | "fatiha">("kursi");
  const [previewPage, setPreviewPage] = useState<HTMLDivElement | null>(null);
  const [previewScale, setPreviewScale] = useState(() =>
    Math.min(1, Math.max(0.25, (window.innerWidth - 62) / QURAN_DEFAULT_FIT_WIDTH)));
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [cloudSyncedNotice, setCloudSyncedNotice] = useState(false);
  const [offlineInfo, setOfflineInfo] = useState({ supported: true, entries: 0, bytes: 0 });
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [actionNotice, setActionNotice] = useState("");
  const actionNoticeTimer = useRef<number | null>(null);

  useEffect(() => {
    if (activeTab !== "quran" || !previewPage) return;
    const updateScale = () => {
      if (previewPage.clientWidth <= 0) return;
      setPreviewScale(Math.min(1, previewPage.clientWidth / QURAN_DEFAULT_FIT_WIDTH));
    };
    const observer = new ResizeObserver(updateScale);
    observer.observe(previewPage);
    updateScale();
    return () => observer.disconnect();
  }, [activeTab, previewPage]);

  useEffect(() => () => {
    if (actionNoticeTimer.current !== null) window.clearTimeout(actionNoticeTimer.current);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    void getOfflineQuranStorageInfo().then(setOfflineInfo);
  }, []);

  // When the authenticated user profile changes (login, logout, or session refresh),
  // automatically load that user's saved preferences
  useEffect(() => {
    const timer = window.setTimeout(() => setSettings(loadSettings(userIdentifier)), 0);
    return () => window.clearTimeout(timer);
  }, [userIdentifier, isAuthenticated]);

  // Listen to cross-tab, cross-component, and cloud database updates
  useEffect(() => {
    const handleSettingsUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.settings) {
        setSettings(detail.settings);
        if (detail.fromCloud) {
          setCloudSyncedNotice(true);
          setTimeout(() => setCloudSyncedNotice(false), 2500);
        }
      }
    };
    window.addEventListener("ic:settingsUpdated", handleSettingsUpdated);
    return () => {
      window.removeEventListener("ic:settingsUpdated", handleSettingsUpdated);
    };
  }, []);

  const handleManualCloudSync = async () => {
    if (!isAuthenticated) return;
    setSyncingCloud(true);
    const result = await syncCloudSettings(userIdentifier);
    if (result) {
      setSettings(result);
    }
    setSyncingCloud(false);
    setCloudSyncedNotice(true);
    setTimeout(() => setCloudSyncedNotice(false), 2500);
  };

  // Security & Password state for logged-in user
  const [isOtpResetMode, setIsOtpResetMode] = useState(false);
  const [resetOtp, setResetOtp] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState("");
  const [passwordChangeError, setPasswordChangeError] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState("");

  // Real-time password validation metrics
  const newPwHasLength = newPassword.length >= 8;
  const newPwHasDigit = /\d/.test(newPassword);
  const newPwHasUpper = /[A-Z]/.test(newPassword);
  const newPwRulesMet = newPwHasLength && newPwHasDigit && newPwHasUpper;

  const hasConfirmValue = confirmNewPassword.length > 0;
  const passwordsMatch = Boolean(newPassword && hasConfirmValue && newPassword === confirmNewPassword);
  const isOtpValid = resetOtp.trim().length === 6;

  const canSubmitPasswordChange =
    (isOtpResetMode ? isOtpValid : Boolean(currentPassword.trim())) &&
    newPwRulesMet &&
    passwordsMatch &&
    !isChangingPassword;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeSuccess("");
    setPasswordChangeError("");

    if (!canSubmitPasswordChange) {
      if (!isOtpResetMode && !currentPassword) {
        setPasswordChangeError("Please enter your current password.");
      } else if (isOtpResetMode && !isOtpValid) {
        setPasswordChangeError("Please enter the 6-digit verification code sent to your email.");
      } else if (!newPwRulesMet) {
        setPasswordChangeError("New password must be at least 8 characters with 1 digit and 1 uppercase letter.");
      } else if (!passwordsMatch) {
        setPasswordChangeError("New password and confirm new password do not match.");
      }
      return;
    }

    setIsChangingPassword(true);
    try {
      if (isOtpResetMode) {
        if (!user?.email) throw new Error("No user email found.");
        const res = await resetPassword({
          email: user.email,
          otp: resetOtp.trim(),
          newPassword,
        });
        setPasswordChangeSuccess(res.data?.message || "Password successfully reset with verification code!");
        setResetOtp("");
        setNewPassword("");
        setConfirmNewPassword("");
        setIsOtpResetMode(false);
      } else {
        const res = await changePassword({ currentPassword, newPassword });
        setPasswordChangeSuccess(res.data?.message || "Password changed successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }
      setTimeout(() => setPasswordChangeSuccess(""), 4500);
    } catch (err) {
      setPasswordChangeError(
        parseApiError(
          err,
          isOtpResetMode
            ? "Invalid or expired verification code. Please request a new code."
            : "Unable to change password. Please verify your current password."
        ).message
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSendLoggedInResetEmail = async () => {
    if (!user?.email) return;
    setIsSendingReset(true);
    setResetEmailSent("");
    setPasswordChangeError("");
    try {
      await forgotPassword(user.email);
      setIsOtpResetMode(true);
      setResetEmailSent(`A 6-digit verification code was sent to ${user.email}. Enter it below.`);
      setTimeout(() => setResetEmailSent(""), 6000);
    } catch (err) {
      setPasswordChangeError(
        parseApiError(err, "Failed to send reset code. Please try again.").message
      );
    } finally {
      setIsSendingReset(false);
    }
  };

  const updateSettings = (updater: (prev: AppSettings) => AppSettings) => {
    setSettings((prev) => {
      const next = updater(prev);
      saveSettings(next, userIdentifier);
      return next;
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const getLiveHijri = (offset: number) =>
    formatHijriDate(new Date(), offset, settings.general.appLanguage);

  const selectedLang =
    settings.quran.preferredTranslation.includes("-ur")
      ? "urdu"
      : settings.quran.preferredTranslation.includes("-hi")
      ? "hindi"
      : "english";

  const translationAvailable = TRANSLATION_OPTIONS.some(
    option => option.id === settings.quran.preferredTranslation && !option.disabled);
  const bismillahTranslation = translationAvailable
    ? PREVIEW_VERSES.fatiha.lines[0].translations[settings.quran.preferredTranslation]
    : "Selected translation unavailable. Choose an available edition.";

  const showActionNotice = (message: string) => {
    if (actionNoticeTimer.current !== null) window.clearTimeout(actionNoticeTimer.current);
    setActionNotice(message);
    actionNoticeTimer.current = window.setTimeout(() => setActionNotice(""), 5000);
  };

  const handleResetDefaults = () => {
    setConfirmAction("reset-settings");
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled && "Notification" in window) {
      const permission = Notification.permission === "default"
        ? await Notification.requestPermission()
        : Notification.permission;
      if (permission !== "granted") {
        showActionNotice("Prayer notifications are blocked. Allow notifications in your browser or device settings, then try again.");
        return;
      }
    }
    if (!enabled) {
      try { await disableClosedAppPrayerAlerts(); }
      catch (error) { console.error("Unable to remove the browser push subscription:", error); }
    }
    updateSettings(prev => ({ ...prev, prayer: { ...prev.prayer, notificationsEnabled: enabled } }));
  };

  const togglePrayerAlert = (prayer: PrayerAlertName) => {
    const prayerNames = settings.prayer.alertPrayers.includes(prayer)
      ? settings.prayer.alertPrayers.filter(name => name !== prayer)
      : PRAYER_ALERT_NAMES.filter(name => settings.prayer.alertPrayers.includes(name) || name === prayer);
    updateSettings(prev => ({
      ...prev,
      prayer: { ...prev.prayer, alertPrayers: prayerNames },
    }));
    if (settings.prayer.notificationsEnabled) {
      void syncClosedAppPrayerAlertSelection(prayerNames).catch(error => {
        console.error("Unable to update closed-app prayer alert selection:", error);
        showActionNotice("Your selection was saved. Closed-app alerts will update after you reopen Prayer Times.");
      });
    }
  };

  const handleExportData = () => {
    const profileKey = getStorageKeyForUser(userIdentifier);
    const blob = new Blob([JSON.stringify(exportPersonalData(profileKey), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `islamic-companion-data-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteData = () => {
    setConfirmAction("delete-data");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleConfirmedAction = async () => {
    if (!confirmAction) return;
    setConfirmBusy(true);
    try {
      if (confirmAction === "reset-settings") {
        const defaults = resetSettings(userIdentifier);
        setSettings(defaults);
        setSavedNotice(true);
        window.setTimeout(() => setSavedNotice(false), 2500);
        showActionNotice("Your settings were restored to the recommended defaults.");
      } else if (confirmAction === "delete-data") {
        deletePersonalData(getStorageKeyForUser(userIdentifier));
        const defaults = resetSettings(userIdentifier);
        setSettings(defaults);
        showActionNotice("This profile's local personal data was deleted from this device.");
      } else {
        await clearOfflineQuran();
        setOfflineInfo(await getOfflineQuranStorageInfo());
        showActionNotice("The offline Quran download was removed.");
      }
      setConfirmAction(null);
    } finally {
      setConfirmBusy(false);
    }
  };

  const confirmCopy = confirmAction === "reset-settings"
    ? {
        title: "Restore recommended settings?",
        message: isAuthenticated && (user?.name || user?.email)
          ? `This will reset the saved preferences for ${user.name || user.email}.`
          : "This will reset the preferences saved in this browser.",
        confirmLabel: "Restore Defaults",
        tone: "warning" as const,
      }
    : confirmAction === "delete-data"
    ? {
        title: "Delete personal data?",
        message: "This removes local settings, bookmarks, recent Hadith, calendar reminders, Azkar favourites, and Quran notes from this device.",
        confirmLabel: "Delete Data",
        tone: "danger" as const,
      }
    : {
        title: "Remove offline Quran download?",
        message: "Downloaded Quran files will be removed from this device. You can download them again later.",
        confirmLabel: "Remove Download",
        tone: "danger" as const,
      };

  return (
    <div className="settings-page">
      <TopNav
        activeView="settings"
        onViewChange={(view) => {
          navigate(view === "dashboard" ? "/" : `/${view}`);
        }}
        onLogout={handleLogout}
        onSettingsClick={() => {}}
      />
      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmCopy.title}
        message={confirmCopy.message}
        confirmLabel={confirmCopy.confirmLabel}
        tone={confirmCopy.tone}
        busy={confirmBusy}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void handleConfirmedAction()}
      />

      <main className="settings-container">
        {/* Hero Banner */}
        <header className="settings-hero">
          <GoldenSpiral className="settings-hero-spiral" showGrid={false} />
          <div className="settings-hero-content">
            <div className="settings-hero-top-row">
              <button
                type="button"
                className="settings-back-btn"
                onClick={() => navigate("/")}
                aria-label="Back to dashboard"
              >
                <ArrowLeft size={18} />
                <span>Back to Dashboard</span>
              </button>
              <div
                className={`settings-autosave-badge ${
                  savedNotice || cloudSyncedNotice || syncingCloud ? "is-pulse" : ""
                } ${isAuthenticated ? "is-user-authenticated" : ""}`}
                role="status"
              >
                <Check size={14} className="autosave-check" />
                <span>
                  {isAuthenticated && (user?.email || user?.name)
                    ? syncingCloud
                      ? "Syncing with Cloud..."
                      : cloudSyncedNotice
                      ? "Cloud Synced Across Devices"
                      : savedNotice
                      ? `Saved to Cloud & Account (${user.email || user.name})`
                      : `Cloud Synced (${user.email || user.name})`
                    : savedNotice
                    ? "Saved to Browser (Guest)"
                    : "Auto-Saved (Guest Profile)"}
                </span>
              </div>
            </div>
            <div className="settings-eyebrow">
              <Sparkles size={14} />
              <span>Preferences & Customization</span>
            </div>
            <h1>Settings & Preferences</h1>
            <p className="settings-hero-subtitle">
              Configure your Qur'an, prayer calculation methods, and in-app experience.
            </p>
          </div>
        </header>
        {actionNotice && (
          <div className="settings-action-notice" role="status" aria-live="polite">
            <CircleAlert size={18} />
            <span>{actionNotice}</span>
            <button type="button" onClick={() => setActionNotice("")} aria-label="Dismiss message">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Tab Selector */}
        <div className="settings-tabs-scroll-container">
          <nav className="settings-tabs" aria-label="Settings categories">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`settings-tab ${activeTab === tab.id ? "is-active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab 1: Quran Preferences */}
        {activeTab === "quran" && (
          <section className="settings-section">
            {/* Card 1: Quran Appearance & Calligraphy */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon">
                  <BookOpen size={22} />
                </div>
                <div>
                  <h2>Quran Appearance & Calligraphy</h2>
                  <p>Configure script styles and text sizing for the fixed whole-page reader.</p>
                </div>
              </div>

              {/* Arabic Script & Font Styles */}
              <div className="settings-field-group">
                <label className="settings-label">
                  <span>Arabic Calligraphy Script</span>
                  <small>Choose between Indo-Pak or Uthmani Madani Naskh</small>
                </label>
                <div className="selection-card-grid">
                  <button
                    type="button"
                    className={`selection-option-card ${settings.quran.arabicScript === "indopak" ? "is-selected" : ""}`}
                    onClick={() =>
                      updateSettings((prev) => ({
                        ...prev,
                        quran: { ...prev.quran, arabicScript: "indopak" },
                      }))
                    }
                  >
                    <div className="selection-card-indicator">
                      <span className="indicator-dot" />
                    </div>
                    <div className="selection-card-body">
                      <div className="selection-card-preview-box">
                        <div
                          className="selection-script-preview font-indopak"
                          style={{ fontSize: `${settings.quran.arabicFontSize}px` }}
                        >
                          <QuranText text="Ø¨ÙØ³Ù’Ù…Ù Ø§Ù„Ù„Ù‘Ù°Ù‡Ù Ø§Ù„Ø±Ù‘ÙŽØ­Ù’Ù…Ù°Ù†Ù Ø§Ù„Ø±Ù‘ÙŽØ­ÙÛŒÙ’Ù…Ù" script="indopak" />
                        </div>
                        <div
                          className={`selection-trans-preview ${selectedLang}`}
                          style={{
                            fontSize: `${Math.min(settings.quran.translationFontSize, 26)}px`,
                          }}
                        >
                          {bismillahTranslation}
                        </div>
                      </div>
                      <div className="selection-card-title">Indo-Pak Calligraphy</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`selection-option-card ${settings.quran.arabicScript === "uthmani" ? "is-selected" : ""}`}
                    onClick={() =>
                      updateSettings((prev) => ({
                        ...prev,
                        quran: { ...prev.quran, arabicScript: "uthmani" },
                      }))
                    }
                  >
                    <div className="selection-card-indicator">
                      <span className="indicator-dot" />
                    </div>
                    <div className="selection-card-body">
                      <div className="selection-card-preview-box">
                        <div
                          className="selection-script-preview font-uthmani"
                          style={{ fontSize: `${settings.quran.arabicFontSize}px` }}
                        >
                          Ø¨ÙØ³Û¡Ù…Ù Ù±Ù„Ù„Ù‘ÙŽÙ‡Ù Ù±Ù„Ø±Ù‘ÙŽØ­Û¡Ù…ÙŽÙ€Ù°Ù†Ù Ù±Ù„Ø±Ù‘ÙŽØ­ÙÛŒÙ…Ù
                        </div>
                        <div
                          className={`selection-trans-preview ${selectedLang}`}
                          style={{
                            fontSize: `${Math.min(settings.quran.translationFontSize, 26)}px`,
                          }}
                        >
                          {bismillahTranslation}
                        </div>
                      </div>
                      <div className="selection-card-title">Uthmani / Madani Naskh Script</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Text Sizing Steppers & Sliders directly in this card */}
              <div className="card-typography-toolbar">
                <div className="typography-stepper-card">
                  <div className="stepper-meta">
                    <div className="stepper-icon-wrap">
                      <Type size={16} />
                    </div>
                    <div className="stepper-meta-text">
                      <span className="stepper-title">Arabic Qur'an Size</span>
                      <span className="stepper-val-pill">{`${settings.quran.arabicFontSize}px`}</span>
                    </div>
                  </div>
                  <div className="stepper-controls-row">
                    <button
                      type="button"
                      className="btn-stepper-step"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateSettings((prev) => ({
                          ...prev,
                          quran: {
                            ...prev.quran,
                            arabicFontSize: Math.max(24, prev.quran.arabicFontSize - 2),
                          },
                        }));
                      }}
                      title="Decrease Arabic font size"
                      aria-label="Decrease Arabic font size"
                    >
                      âˆ’
                    </button>
                    <input
                      type="range"
                      min="24"
                      max="64"
                      step="2"
                      value={settings.quran.arabicFontSize}
                      onChange={(e) =>
                        updateSettings((prev) => ({
                          ...prev,
                          quran: { ...prev.quran, arabicFontSize: Number(e.target.value) },
                        }))
                      }
                      className="stepper-range-slider"
                      aria-label="Arabic Quran Font Size"
                    />
                    <button
                      type="button"
                      className="btn-stepper-step"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateSettings((prev) => ({
                          ...prev,
                          quran: {
                            ...prev.quran,
                            arabicFontSize: Math.min(64, prev.quran.arabicFontSize + 2),
                          },
                        }));
                      }}
                      title="Increase Arabic font size"
                      aria-label="Increase Arabic font size"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="typography-stepper-card">
                  <div className="stepper-meta">
                    <div className="stepper-icon-wrap">
                      <Sliders size={16} />
                    </div>
                    <div className="stepper-meta-text">
                      <span className="stepper-title">Translation Text Size</span>
                      <span className="stepper-val-pill">{`${settings.quran.translationFontSize}px`}</span>
                    </div>
                  </div>
                  <div className="stepper-controls-row">
                    <button
                      type="button"
                      className="btn-stepper-step"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateSettings((prev) => ({
                          ...prev,
                          quran: {
                            ...prev.quran,
                            translationFontSize: Math.max(12, prev.quran.translationFontSize - 2),
                          },
                        }));
                      }}
                      title="Decrease translation font size"
                      aria-label="Decrease translation font size"
                    >
                      âˆ’
                    </button>
                    <input
                      type="range"
                      min="12"
                      max="56"
                      step="1"
                      value={settings.quran.translationFontSize}
                      onChange={(e) =>
                        updateSettings((prev) => ({
                          ...prev,
                          quran: { ...prev.quran, translationFontSize: Number(e.target.value) },
                        }))
                      }
                      className="stepper-range-slider"
                      aria-label="Translation Font Size"
                      aria-valuetext={`${settings.quran.translationFontSize}px`}
                    />
                    <button
                      type="button"
                      className="btn-stepper-step"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateSettings((prev) => ({
                          ...prev,
                          quran: {
                            ...prev.quran,
                            translationFontSize: Math.min(56, prev.quran.translationFontSize + 2),
                          },
                        }));
                      }}
                      title="Increase translation font size"
                      aria-label="Increase translation font size"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Translations & Tafseer */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h2>Sunni Scholar Translations & Commentary</h2>
                  <p>Choose Urdu or English translations and read Sirat-ul-Jinan Tafseer (ØªÙØ³ÛŒØ±).</p>
                </div>
              </div>

              {/* Master Translation Switch */}
              <div className="settings-toggle-row">
                <div className="settings-toggle-text">
                  <strong>Show Interlinear Translation</strong>
                  <p>
                    When enabled, the translation appears directly under every line of Arabic text.
                  </p>
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={settings.quran.showTranslation}
                    onChange={(e) =>
                      updateSettings((prev) => ({
                        ...prev,
                        quran: { ...prev.quran, showTranslation: e.target.checked },
                      }))
                    }
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              {/* Preferred Translation */}
              <div className="settings-field-group">
                <label className="settings-label" htmlFor="preferred-translation-select">
                  <span>Preferred Translation</span>
                </label>
                <CustomDropdown
                  id="preferred-translation-select"
                  value={settings.quran.preferredTranslation}
                  options={TRANSLATION_OPTIONS}
                  onChange={(val) =>
                    updateSettings((prev) => ({
                      ...prev,
                      quran: { ...prev.quran, preferredTranslation: String(val) },
                    }))
                  }
                />
                {!translationAvailable && <p role="alert">This translation is unavailable or no longer offered. Choose Kanzul Iman Urdu/English or Irfan-ul-Quran Urdu; translations are never substituted automatically.</p>}                
              </div>

              {/* Preferred Tafseer */}
              <div className="settings-field-group">
                <label className="settings-label" htmlFor="preferred-tafseer-select">
                  <span>Preferred Tafseer</span>
                </label>
                <CustomDropdown
                  id="preferred-tafseer-select"
                  value={settings.quran.preferredTafseer}
                  options={TAFSEER_OPTIONS}
                  onChange={(val) =>
                    updateSettings((prev) => ({
                      ...prev,
                      quran: { ...prev.quran, preferredTafseer: String(val) },
                    }))
                  }
                />
                <p>Sirat-ul-Jinan by Mufti Muhammad Qasim Attari. Tap an Ayah marker in the reader to read its Urdu Tafseer.</p>
              </div>

              {/* Reciter */}
              <div className="settings-field-group">
                <label className="settings-label" htmlFor="preferred-reciter-select">
                  <span>Default Reciter</span>
                </label>
                <CustomDropdown
                  id="preferred-reciter-select"
                  value={settings.quran.reciter}
                  options={RECITERS_OPTIONS}
                  onChange={(val) =>
                    updateSettings((prev) => ({
                      ...prev,
                      quran: { ...prev.quran, reciter: String(val) },
                    }))
                  }
                />
              </div>
            </div>

            {/* Card 3: Interactive Live Mushaf Preview */}
            <div className="settings-card settings-preview-card">
              <div className="settings-card-header">
                <div className="settings-card-icon">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h2>Fixed-Page Preview</h2>
                  <p>Matches the default whole-page mobile reader with your selected calligraphy and translation.</p>
                </div>
              </div>

              <div className="settings-preview-box">
                <div className="preview-header-bar">
                  <div className="preview-badge">
                    <Sparkles size={13} />
                    <span>Live Fixed-Page Preview</span>
                  </div>
                  <div className="preview-verse-chips">
                    <button
                      type="button"
                      className={`preview-chip ${previewVerseKey === "fatiha" ? "is-active" : ""}`}
                      onClick={() => setPreviewVerseKey("fatiha")}
                    >
                      Surah Al-Fatiha (1:1-7)
                    </button>
                    <button
                      type="button"
                      className={`preview-chip ${previewVerseKey === "kursi" ? "is-active" : ""}`}
                      onClick={() => setPreviewVerseKey("kursi")}
                    >
                      Ayat al-Kursi (2:255)
                    </button>
                  </div>
                </div>

                <div className="mushaf-interlinear-container">
                  <div className="mushaf-page-frame" ref={setPreviewPage}>
                    <div className="mushaf-frame-header">
                      <span className="mushaf-frame-title">{PREVIEW_VERSES[previewVerseKey].title}</span>
                      <span className="mushaf-frame-badge">
                        {`Fixed whole page Â· ${settings.quran.showTranslation ? "Under each line" : "Arabic only"}`}
                      </span>
                    </div>

                    <div className="mushaf-lines-wrapper">
                      {PREVIEW_VERSES[previewVerseKey].lines.map((lineItem, idx) => {
                        const translationText = translationAvailable
                          ? lineItem.translations[settings.quran.preferredTranslation]
                          : "Selected translation unavailable. Choose an available edition.";

                        return (
                          <div key={idx} className="mushaf-line-row">
                            {/* Arabic Quran Line with Ayah Medallion */}
                            <div
                              className={`mushaf-arabic-line ${
                                settings.quran.arabicScript === "indopak" ? "font-indopak" : "font-uthmani"
                              }`}
                              lang="ar"
                              data-no-translate
                              style={{
                                fontSize: `${settings.quran.arabicFontSize * previewScale}px`,
                                lineHeight: `${settings.quran.arabicFontSize *
                                  getQuranLineHeightMultiplier(settings.quran.arabicScript, true) * previewScale}px`,
                              }}
                            >
                              <span className="mushaf-arabic-content" lang="ar">
                                <QuranText text={settings.quran.arabicScript === "indopak"
                                  ? cleanIndoPakScript(lineItem.indopak)
                                  : lineItem.uthmani} script={settings.quran.arabicScript} />
                                {lineItem.ayahNumber && (
                                  <AyahMedallion
                                    number={lineItem.ayahNumber}
                                    isIndoPak={settings.quran.arabicScript === "indopak"}
                                    size={Math.max(32, settings.quran.arabicFontSize) * previewScale}
                                  />
                                )}
                              </span>
                            </div>

                            {/* Interlinear Translation directly under this line */}
                            {settings.quran.showTranslation && (
                              <div
                                className={`mushaf-trans-line ${selectedLang}`}
                                style={{
                                  fontSize: `${settings.quran.translationFontSize * previewScale}px`,
                                }}
                              >
                                {translationText}
                              </div>
                            )}

                            {/* Ornamental Divider Line AFTER the translation separating from the next Ayat */}
                            {idx < PREVIEW_VERSES[previewVerseKey].lines.length - 1 && (
                              <div className="mushaf-interlinear-divider" aria-hidden="true">
                                <span className="mushaf-divider-symbol">Ûž</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tab 2: Prayer Times Preferences */}
        {activeTab === "prayer" && (
          <section className="settings-section">
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon">
                  <Clock size={22} />
                </div>
                <div>
                  <h2>Prayer Times & Schedule</h2>
                  <p>Fine-tune jurisprudence methods, time conventions, and alert notifications.</p>
                </div>
              </div>

              {/* Asr Juristic Method */}
              <div className="settings-field-group">
                <label className="settings-label">
                  <span>Asr Juristic Method</span>
                  <small>Determines shadow length ratio for Asr commencement</small>
                </label>
                <div className="selection-card-grid">
                  <button
                    type="button"
                    className={`selection-option-card ${settings.prayer.asrSchool === "hanafi" ? "is-selected" : ""}`}
                    onClick={() =>
                      updateSettings((prev) => ({
                        ...prev,
                        prayer: { ...prev.prayer, asrSchool: "hanafi" },
                      }))
                    }
                  >
                    <div className="selection-card-indicator">
                      <span className="indicator-dot" />
                    </div>
                    <div className="selection-card-body">
                      <div className="selection-card-title">Hanafi (Standard in South Asia)</div>
                      <div className="selection-card-desc">Asr begins when an object's shadow is twice its height (2x)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`selection-option-card ${settings.prayer.asrSchool === "shafi" ? "is-selected" : ""}`}
                    onClick={() =>
                      updateSettings((prev) => ({
                        ...prev,
                        prayer: { ...prev.prayer, asrSchool: "shafi" },
                      }))
                    }
                  >
                    <div className="selection-card-indicator">
                      <span className="indicator-dot" />
                    </div>
                    <div className="selection-card-body">
                      <div className="selection-card-title">Shafi'i, Maliki, Hanbali</div>
                      <div className="selection-card-desc">Asr begins when an object's shadow equals its height (1x)</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Time Format */}
              <div className="settings-field-group">
                <label className="settings-label">
                  <span>Time Display Format</span>
                  <small>Select preferred digital clock convention</small>
                </label>
                <div className="settings-button-group">
                  <button
                    type="button"
                    className={`btn-choice ${settings.prayer.timeFormat === "12h" ? "is-active" : ""}`}
                    onClick={() =>
                      updateSettings((prev) => ({
                        ...prev,
                        prayer: { ...prev.prayer, timeFormat: "12h" },
                      }))
                    }
                  >
                    12-Hour Clock (e.g. 5:45 PM)
                  </button>
                  <button
                    type="button"
                    className={`btn-choice ${settings.prayer.timeFormat === "24h" ? "is-active" : ""}`}
                    onClick={() =>
                      updateSettings((prev) => ({
                        ...prev,
                        prayer: { ...prev.prayer, timeFormat: "24h" },
                      }))
                    }
                  >
                    24-Hour Clock (e.g. 17:45)
                  </button>
                </div>
              </div>

              {/* Calculation Method */}
              <div className="settings-field-group">
                <label className="settings-label" htmlFor="calculation-method-select">
                  <span>Calculation Authority</span>
                  <small>Standard organization parameters used for Fajr & Isha twilight angles</small>
                </label>
                <CustomDropdown
                  id="calculation-method-select"
                  value={settings.prayer.calculationMethod}
                  options={CALCULATION_METHODS}
                  onChange={(val) =>
                    updateSettings((prev) => ({
                      ...prev,
                      prayer: { ...prev.prayer, calculationMethod: Number(val) },
                    }))
                  }
                />
              </div>

              {/* Alerts & Notifications */}
              <div className="settings-toggle-row">
                <div className="settings-toggle-text">
                  <div className="toggle-title-with-icon">
                    <Bell size={16} />
                    <strong>Prayer Time Notifications</strong>
                  </div>
                  <p>Receive prayer alerts even when the installed app is closed. Enable this, then open Prayer Times and select your location.</p>
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={settings.prayer.notificationsEnabled}
                    onChange={(e) => void handleNotificationToggle(e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              <fieldset className="prayer-alert-selection" disabled={!settings.prayer.notificationsEnabled}>
                <legend>Choose prayer alerts</legend>
                <p>Select the prayers for which you want to receive a notification.</p>
                <div>
                  {PRAYER_ALERT_NAMES.map(prayer => {
                    const selected = settings.prayer.alertPrayers.includes(prayer);
                    return <label className={selected ? "is-selected" : ""} key={prayer}>
                      <input type="checkbox" checked={selected}
                        onChange={() => togglePrayerAlert(prayer)} />
                      <span>{prayer}</span>
                      <Check size={15} aria-hidden="true" />
                    </label>;
                  })}
                </div>
                {settings.prayer.alertPrayers.length === 0 &&
                  <small role="status">No prayer alerts selected.</small>}
              </fieldset>

              <div className="settings-toggle-row">
                <div className="settings-toggle-text">
                  <div className="toggle-title-with-icon">
                    <Volume2 size={16} />
                    <strong>Prayer Alert Chime</strong>
                  </div>
                  <p>Play a gentle alert chime at prayer entrance time.</p>
                  <ChimeTestButton label="Test alert chime" />
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={settings.prayer.soundEnabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      if (enabled) { unlockPrayerChimeAudio(); void playPrayerChime(); }
                      updateSettings((prev) => ({
                        ...prev,
                        prayer: { ...prev.prayer, soundEnabled: enabled },
                      }));
                    }}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          </section>
        )}

        {/* Tab 3: Account Profile */}
        {activeTab === "account" && (
          <section className="settings-section">
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon">
                  <User size={22} />
                </div>
                <div>
                  <h2>Account Profile & Cloud Sync</h2>
                  <p>Manage your account identity, personal details, and synchronized data.</p>
                </div>
              </div>

              {isAuthenticated && user ? (
                <div className="settings-account-authenticated">
                  <div className="account-user-card">
                    <div className="account-avatar">
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="account-info">
                      <h3>{user.name || "Valued Member"}</h3>
                      <p>{user.email || "Registered Account"}</p>
                      <span className="account-badge">
                        <Check size={13} />
                        <span>Saved Preferences Bound to Account</span>
                      </span>
                    </div>
                  </div>

                  <div className="account-cloud-status-card">
                    <div className="cloud-status-left">
                      <div className="cloud-status-icon">
                        <Cloud size={20} />
                      </div>
                      <div>
                        <h4>Cloud Sync Active Across All Devices</h4>
                        <p>
                          Your settings are securely saved in the cloud database. When you sign in from your mobile phone, laptop, or another browser, all your preferences are restored automatically.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-sync-cloud"
                      onClick={handleManualCloudSync}
                      disabled={syncingCloud}
                      title="Sync current preferences with cloud database"
                    >
                      <RefreshCw size={15} className={syncingCloud ? "is-spinning" : ""} />
                      <span>{syncingCloud ? "Syncing..." : "Sync Cloud Now"}</span>
                    </button>
                  </div>                  

                  {/* Account Security & Password Card */}
                  <div className="account-security-card">
                    <div className="security-card-header">
                      <div className="security-card-icon">
                        <ShieldCheck size={18} />
                      </div>
                      <div>
                        <h3>Account Security & Password</h3>
                        <p>Change your account password or request a reset email link.</p>
                      </div>
                    </div>

                    {passwordChangeSuccess && (
                      <div className="alert-security-success" role="status">
                        <CircleCheck size={16} /> <span>{passwordChangeSuccess}</span>
                      </div>
                    )}

                    {passwordChangeError && (
                      <div className="alert-security-error" role="alert">
                        <CircleAlert size={16} /> <span>{passwordChangeError}</span>
                      </div>
                    )}

                    {resetEmailSent && (
                      <div className="alert-security-success" role="status">
                        <MailCheck size={16} /> <span>{resetEmailSent}</span>
                      </div>
                    )}

                    <form className="change-password-form" onSubmit={handleChangePassword}>
                      <div className="password-fields-grid">
                        {isOtpResetMode ? (
                          <div className="password-field-group">
                            <div className="password-label-row">
                              <label>6-Digit Verification Code</label>
                              {isOtpValid && (
                                <span className="password-badge-success">
                                  <Check size={11} /> 6 Digits
                                </span>
                              )}
                            </div>
                            <div className={`password-input-wrapper ${isOtpValid ? "is-match" : ""}`}>
                              <input
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={resetOtp}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                                  setResetOtp(val);
                                  if (passwordChangeError) setPasswordChangeError("");
                                }}
                                placeholder="123456"
                                style={{ letterSpacing: "0.22em", fontFamily: "monospace", fontWeight: 700 }}
                                required
                                disabled={isChangingPassword}
                              />
                              {isOtpValid && (
                                <span className="password-inline-status is-match" title="Code complete">
                                  <Check size={14} />
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="password-field-group">
                            <label>Current Password</label>
                            <div className="password-input-wrapper">
                              <input
                                type={showCurrentPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => {
                                  setCurrentPassword(e.target.value);
                                  if (passwordChangeError) setPasswordChangeError("");
                                }}
                                placeholder="Current password"
                                autoComplete="current-password"
                                required
                                disabled={isChangingPassword}
                              />
                              <button
                                type="button"
                                className="btn-pw-eye"
                                onClick={() => setShowCurrentPassword((v) => !v)}
                                tabIndex={-1}
                                aria-label="Toggle password visibility"
                              >
                                {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="password-field-group">
                          <div className="password-label-row">
                            <label>New Password</label>
                            {newPassword.length > 0 && newPwRulesMet && (
                              <span className="password-badge-success">
                                <Check size={11} /> Valid
                              </span>
                            )}
                          </div>
                          <div
                            className={`password-input-wrapper ${
                              newPassword.length > 0
                                ? newPwRulesMet
                                  ? "is-match"
                                  : ""
                                : ""
                            }`}
                          >
                            <input
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => {
                                setNewPassword(e.target.value);
                                if (passwordChangeError) setPasswordChangeError("");
                              }}
                              placeholder="New password (8+ chars)"
                              autoComplete="new-password"
                              required
                              disabled={isChangingPassword}
                            />
                            {newPassword.length > 0 && newPwRulesMet && (
                              <span className="password-inline-status is-match" title="Requirements met">
                                <Check size={14} />
                              </span>
                            )}
                            <button
                              type="button"
                              className="btn-pw-eye"
                              onClick={() => setShowNewPassword((v) => !v)}
                              tabIndex={-1}
                              aria-label="Toggle password visibility"
                            >
                              {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>

                          {/* Real-time requirements checklist */}
                          {newPassword.length > 0 && (
                            <div className="realtime-rules-list" role="status" aria-label="Password requirements">
                              <span className={`realtime-rule-pill ${newPwHasLength ? "met" : ""}`}>
                                {newPwHasLength ? <Check size={11} /> : <span className="rule-bullet">â€¢</span>} 8+ chars
                              </span>
                              <span className={`realtime-rule-pill ${newPwHasDigit ? "met" : ""}`}>
                                {newPwHasDigit ? <Check size={11} /> : <span className="rule-bullet">â€¢</span>} 1 number
                              </span>
                              <span className={`realtime-rule-pill ${newPwHasUpper ? "met" : ""}`}>
                                {newPwHasUpper ? <Check size={11} /> : <span className="rule-bullet">â€¢</span>} 1 uppercase
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="password-field-group">
                          <div className="password-label-row">
                            <label>Confirm New Password</label>
                            {hasConfirmValue && (
                              <span className={`password-badge-${passwordsMatch ? "success" : "warning"}`}>
                                {passwordsMatch ? <Check size={11} /> : <X size={11} />}
                                {passwordsMatch ? "Matches" : "Mismatch"}
                              </span>
                            )}
                          </div>
                          <div
                            className={`password-input-wrapper ${
                              hasConfirmValue
                                ? passwordsMatch
                                  ? "is-match"
                                  : "is-mismatch"
                                : ""
                            }`}
                          >
                            <input
                              type={showConfirmNewPassword ? "text" : "password"}
                              value={confirmNewPassword}
                              onChange={(e) => {
                                setConfirmNewPassword(e.target.value);
                                if (passwordChangeError) setPasswordChangeError("");
                              }}
                              placeholder="Confirm new password"
                              autoComplete="new-password"
                              required
                              disabled={isChangingPassword}
                            />
                            {hasConfirmValue && (
                              <span
                                className={`password-inline-status ${passwordsMatch ? "is-match" : "is-mismatch"}`}
                                title={passwordsMatch ? "Passwords match" : "Passwords do not match"}
                              >
                                {passwordsMatch ? <Check size={14} /> : <X size={14} />}
                              </span>
                            )}
                            <button
                              type="button"
                              className="btn-pw-eye"
                              onClick={() => setShowConfirmNewPassword((v) => !v)}
                              tabIndex={-1}
                              aria-label="Toggle password visibility"
                            >
                              {showConfirmNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>

                          {/* Real-time match feedback */}
                          {hasConfirmValue && (
                            <div
                              className={`password-feedback-inline ${passwordsMatch ? "is-match" : "is-mismatch"}`}
                              role="status"
                            >
                              {passwordsMatch ? (
                                <>
                                  <Check size={12} />
                                  <span>Passwords match</span>
                                </>
                              ) : (
                                <>
                                  <X size={12} />
                                  <span>Passwords do not match yet</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="security-form-actions">
                        <button
                          type="submit"
                          className="btn-change-password"
                          disabled={!canSubmitPasswordChange}
                        >
                          <KeyRound size={15} />
                          <span>
                            {isChangingPassword
                              ? isOtpResetMode
                                ? "Resetting Password..."
                                : "Updating Password..."
                              : isOtpResetMode
                              ? "Reset Password with Code"
                              : "Update Password"}
                          </span>
                        </button>

                        {isOtpResetMode ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <button
                              type="button"
                              className="btn-forgot-password-inline"
                              onClick={handleSendLoggedInResetEmail}
                              disabled={isSendingReset}
                            >
                              <Mail size={14} />
                              <span>{isSendingReset ? "Sending..." : "Resend Code"}</span>
                            </button>
                            <button
                              type="button"
                              className="btn-forgot-password-inline"
                              onClick={() => {
                                setIsOtpResetMode(false);
                                setResetOtp("");
                                setPasswordChangeError("");
                              }}
                            >
                              <span>Use Current Password instead</span>
                            </button>
                          </div>
                        ) : (
                          user?.email && (
                            <button
                              type="button"
                              className="btn-forgot-password-inline"
                              onClick={handleSendLoggedInResetEmail}
                              disabled={isSendingReset}
                            >
                              <Mail size={14} />
                              <span>
                                {isSendingReset
                                  ? "Sending code..."
                                  : `Forgot password? Send code to ${user.email}`}
                              </span>
                            </button>
                          )
                        )}
                      </div>
                    </form>
                  </div>

                  <div className="account-actions">
                    <button
                      type="button"
                      className="btn-reset"
                      onClick={handleResetDefaults}
                    >
                      <RotateCcw size={16} />
                      <span>Reset Account Preferences</span>
                    </button>
                    <button
                      type="button"
                      className="btn-danger-outline"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      <span>Log Out of Account</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="settings-guest-card">
                  <div className="guest-badge">
                    <Sparkles size={14} />
                    <span>Guest Mode</span>
                  </div>
                  <h3>You are currently browsing as a Guest</h3>
                  <p>
                    All your settings, preferred scholar translations, and bookmarks are safely saved on this browser.
                    Sign in or create a free account to sync them seamlessly across your phone, tablet, and computer.
                  </p>
                  <button
                    type="button"
                    className="btn-primary-gold"
                    onClick={() => navigate("/login")}
                  >
                    <LogIn size={16} />
                    <span>Sign In or Create Account</span>
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Tab 4: General & Reset */}
        {activeTab === "general" && (
          <section className="settings-section">
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon">
                  <Settings2 size={22} />
                </div>
                <div>
                  <h2>General & System Preferences</h2>
                  <p>Adjust calendar parameters, language, or restore recommended defaults.</p>
                </div>
              </div>

              {/* Hijri adjustment */}
              <div className="settings-field-group">
                <label className="settings-label">
                  <span>Hijri Calendar Date Offset</span>
                  <small>Adjust Hijri date by Â±2 days to match your regional moon sighting authority</small>
                </label>
                <div className="settings-button-group">
                  {[-2, -1, 0, 1, 2].map((offset) => (
                    <button
                      key={offset}
                      type="button"
                      className={`btn-choice ${
                        settings.general.hijriAdjustment === offset ? "is-active" : ""
                      }`}
                      onClick={() =>
                        updateSettings((prev) => ({
                          ...prev,
                          general: { ...prev.general, hijriAdjustment: offset },
                        }))
                      }
                    >
                      {offset === 0 ? "Standard (0)" : offset > 0 ? `+${offset} Day` : `${offset} Day`}
                    </button>
                  ))}
                </div>
                <div className="hijri-live-badge">
                  <Moon size={15} />
                  <span>Calculated Hijri Date: <strong>{getLiveHijri(settings.general.hijriAdjustment)}</strong></span>
                </div>
              </div>

              {/* Language */}
              <div className="settings-field-group">
                <label className="settings-label" htmlFor="app-language-select">
                  <span>Application Interface Language</span>
                  <small>Interface labels and headings</small>
                </label>
                <CustomDropdown
                  id="app-language-select"
                  value={settings.general.appLanguage}
                  options={LANGUAGE_OPTIONS}
                  translateOptions={false}
                  onChange={(val) => {
                    const appLanguage = String(val);
                    updateSettings((prev) => ({
                      ...prev,
                      general: { ...prev.general, appLanguage },
                    }));
                  }}
                />
              </div>

              <hr className="settings-divider" />

              <div className="settings-reset-block">
                <div><strong><HardDrive size={16} /> Offline Quran storage</strong>
                  <p>{offlineInfo.entries} cached files{offlineInfo.bytes ? ` Â· ${(offlineInfo.bytes / 1024 / 1024).toFixed(1)} MB reported` : ""}.</p></div>
                <button type="button" className="btn-reset" onClick={() => setConfirmAction("remove-offline")}>
                  Remove download
                </button>
              </div>

              <div className="settings-reset-block">
                <div><strong>Personal data</strong><p>Export your settings, bookmarks, Azkar favourites, calendar reminders, recent Hadith, and Quran page notes, or remove them from this device.</p></div>
                <div className="settings-data-actions">
                  <button type="button" className="btn-choice" onClick={handleExportData}><Download size={16} /> Export</button>
                  <button type="button" className="btn-reset" onClick={handleDeleteData}><Trash2 size={16} /> Delete</button>
                </div>
              </div>

              <hr className="settings-divider" />

              {/* About & Legal */}
              <div className="settings-reset-block">
                <div>
                  <strong>About Siraat & Legal Compliance</strong>
                  <p>Review our privacy policy, terms of service, developer background, and user data rights.</p>
                </div>
                <div className="settings-data-actions" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button type="button" className="btn-choice" onClick={() => navigate("/about")}>About App</button>
                  <button type="button" className="btn-choice" onClick={() => navigate("/privacy")}>Privacy Policy</button>
                  <button type="button" className="btn-choice" onClick={() => navigate("/terms")}>Terms</button>
                  <button type="button" className="btn-choice" onClick={() => navigate("/data-deletion")}>Data Deletion</button>
                </div>
              </div>

              {/* Reset to defaults */}
              <div className="settings-reset-block">
                <div>
                  <strong>
                    {isAuthenticated && (user?.name || user?.email)
                      ? "Reset Account Preferences"
                      : "Reset to Defaults"}
                  </strong>
                  <p>
                    {isAuthenticated && (user?.name || user?.email)
                      ? `Reverts saved settings for ${user.name || user.email} to recommended defaults (Kanzul Iman translation hidden, Indo-Pak script, Sirat-ul-Jinan Tafseer, and Hanafi prayer timing).`
                      : "Reverts all settings on this browser to default preferences (Kanzul Iman translation hidden, Indo-Pak script, Sirat-ul-Jinan Tafseer, and Hanafi prayer timing)."}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-reset"
                  onClick={handleResetDefaults}
                >
                  <RotateCcw size={16} />
                  <span>Restore Defaults</span>
                </button>
              </div>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
