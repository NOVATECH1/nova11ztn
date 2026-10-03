"use client";

import {
  Bookmark,
  Check,
  House,
  Moon,
  Store,
  Sun,
  UserRound,
  Search,
  ShoppingBag,
  Plus,
  Gamepad2,
  Palette,
  Target,
  Zap,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  Menu,
  X,
  SlidersHorizontal,
  Bell,
  Settings,
  LayoutDashboard,
  ReceiptText,
  Users,
  PackageSearch,
  CreditCard,
  WalletCards,
  BadgeCheck,
  Gavel,
  BarChart3,
  FileClock,
  Copy,
  Eye,
  EyeOff,
  Upload,
  Trash2,
  ExternalLink,
  CircleHelp,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  KeyRound,
  ArrowLeft,
  LogOut,
} from "lucide-react";

export const iconMap = {
  Gamepad2,
  Palette,
  Target,
  Zap,
};

export function ThemeIcon({ dark }: { dark: boolean }) {
  return dark ? <Moon size={24} strokeWidth={2} /> : <Sun size={24} strokeWidth={2} />;
}

export function HomeIcon() { return <House size={36} strokeWidth={1.5} />; }
export function StoreIcon() { return <Store size={36} strokeWidth={1} />; }
export function ProfileIcon() { return <UserRound size={36} strokeWidth={1} />; }
export function BookmarkIcon({ saved = false, small = false }: { saved?: boolean; small?: boolean }) {
  return <Bookmark size={small ? 20 : 22} strokeWidth={1.8} fill={saved ? "currentColor" : "none"} />;
}
export const Icons = {
  UserRound, Store, Gamepad2,
  Check, Search, ShoppingBag, Plus, Sparkles, ShieldCheck, ChevronRight, ArrowUpRight, Menu, X,
  SlidersHorizontal, Bell, Settings, LayoutDashboard, ReceiptText, Users, PackageSearch,
  CreditCard, WalletCards, BadgeCheck, Gavel, BarChart3, FileClock, Copy, Eye, EyeOff, Upload,
  Trash2, ExternalLink, CircleHelp, CheckCircle2, Clock3, LockKeyhole, KeyRound, ArrowLeft, LogOut,
};
