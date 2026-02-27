import { Languages } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Language } from '../lib/localStorageManager';
import { useLanguage } from '../hooks/useLanguage';

const LANGUAGE_OPTIONS = [
  { value: Language.tr, label: 'Türkçe', flag: '🇹🇷' },
  { value: Language.en, label: 'English', flag: '🇬🇧' },
  { value: Language.es, label: 'Español', flag: '🇪🇸' },
  { value: Language.fr, label: 'Français', flag: '🇫🇷' },
  { value: Language.de, label: 'Deutsch', flag: '🇩🇪' },
  { value: Language.it, label: 'Italiano', flag: '🇮🇹' },
  { value: Language.pt, label: 'Português', flag: '🇵🇹' },
  { value: Language.ru, label: 'Русский', flag: '🇷🇺' },
  { value: Language.ja, label: '日本語', flag: '🇯🇵' },
  { value: Language.zh, label: '中文', flag: '🇨🇳' },
];

interface LanguageSelectorProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export default function LanguageSelector({ className = '', variant = 'default' }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();

  const currentLanguage = LANGUAGE_OPTIONS.find(opt => opt.value === language);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {variant === 'default' && <Languages className="w-5 h-5" />}
      <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
        <SelectTrigger className="w-[180px] bg-white/90 backdrop-blur-sm border-2 hover:bg-white transition-all">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span className="text-lg">{currentLanguage?.flag}</span>
              <span className="font-medium">{currentLanguage?.label}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {LANGUAGE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{option.flag}</span>
                <span>{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

