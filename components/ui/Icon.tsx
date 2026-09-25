// Maps icon names used in /data JSON files to Lucide icons.
// Unknown names fall back to a star, so a typo in data never breaks the build.
import {
  Award, BadgeCheck, BedDouble, Bike, BookOpen, Brain, Building2, CalendarCheck, CalendarDays, Car, Check, ClipboardCheck,
  ClipboardList, CloudRain, Coins, Columns3, Construction, CreditCard, Crown, Eye, Flag, Flame, Footprints, Gamepad2, Gauge,
  Gem, Globe, GraduationCap, House, ListOrdered, MapPin, Medal, MessageSquare, Moon, Mountain, MoveHorizontal, Paintbrush,
  Radar, RotateCw, Route, Scale, ScanEye, School, Shield, ShieldCheck, ShieldPlus, ShoppingBag, Signpost, Sparkles, Split,
  Sprout, SquareParking, Star, Swords, Target, TrafficCone, Trophy, Warehouse, Wine, Zap, ArrowUp, type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  Award, BadgeCheck, BedDouble, Bike, BookOpen, Brain, Building2, CalendarCheck, CalendarDays, Car, Check, ClipboardCheck,
  ClipboardList, CloudRain, Coins, Columns3, Construction, CreditCard, Crown, Eye, Flag, Flame, Footprints, Gamepad2, Gauge,
  Gem, Globe, GraduationCap, House, ListOrdered, MapPin, Medal, MessageSquare, Moon, Mountain, MoveHorizontal, Paintbrush,
  Radar, RotateCw, Route, Scale, ScanEye, School, Shield, ShieldCheck, ShieldPlus, ShoppingBag, Signpost, Sparkles, Split,
  Sprout, SquareParking, Star, Swords, Target, TrafficCone, Trophy, Warehouse, Wine, Zap,
  // aliases used in data files
  Home: House,
  IdCard: CreditCard,
  Globe2: Globe,
  CheckCircle2: Check,
  ArrowUpCircle: ArrowUp,
  Sparkle: Sparkles,
};

export function Icon({ name, className, strokeWidth = 2.2 }: { name: string; className?: string; strokeWidth?: number }) {
  const C = ICONS[name] ?? Star;
  return <C className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}
