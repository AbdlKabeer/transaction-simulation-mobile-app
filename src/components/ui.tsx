import React from 'react';
import { Pressable, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Decision } from '../types';

export const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <View className={`rounded-2xl bg-white p-4 shadow-sm border border-slate-100 ${className}`}>{children}</View>
);

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
}) => {
  const bg = { primary: 'bg-brand-600', ghost: 'bg-slate-100', danger: 'bg-red-600' }[variant];
  const fg = variant === 'ghost' ? 'text-slate-800' : 'text-white';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`items-center rounded-xl py-3.5 active:opacity-80 ${bg} ${disabled ? 'opacity-40' : ''}`}
    >
      <Text className={`text-base font-semibold ${fg}`}>{title}</Text>
    </Pressable>
  );
};

export const Field = ({ label, ...props }: { label: string } & TextInputProps) => (
  <View className="mb-4">
    <Text className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</Text>
    <TextInput
      placeholderTextColor="#94a3b8"
      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900"
      {...props}
    />
  </View>
);

export const Chip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <Pressable
    onPress={onPress}
    className={`mr-2 mb-2 rounded-full border px-3.5 py-2 ${
      active ? 'border-brand-600 bg-brand-600' : 'border-slate-200 bg-white'
    }`}
  >
    <Text className={`text-sm ${active ? 'font-semibold text-white' : 'text-slate-700'}`}>{label}</Text>
  </Pressable>
);

const BADGE: Record<Decision, string[]> = {
  ALLOWED: ['bg-emerald-100', 'text-emerald-700'],
  FLAGGED: ['bg-amber-100', 'text-amber-800'],
  BLOCKED: ['bg-red-100', 'text-red-700'],
};
export const Badge = ({ decision }: { decision: Decision }) => (
  <View className={`rounded-full px-2.5 py-1 ${BADGE[decision][0]}`}>
    <Text className={`text-xs font-bold ${BADGE[decision][1]}`}>{decision}</Text>
  </View>
);

export const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Text className="mb-2 mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500">{children}</Text>
);

export const ScreenHeader = ({ title, onBack, right }: { title: string; onBack?: () => void; right?: React.ReactNode }) => (
  <View className="flex-row items-center bg-white px-4 py-3 border-b border-slate-100">
    {onBack ? (
      <Pressable onPress={onBack} hitSlop={10} className="mr-2 h-9 w-9 items-center justify-center rounded-full bg-slate-100">
        <Ionicons name="chevron-back" size={20} color="#101944" />
      </Pressable>
    ) : null}
    <Text className="flex-1 text-lg font-bold text-brand-900">{title}</Text>
    {right}
  </View>
);

export const IconBubble = ({ name, tint = '#309D92', bg = 'bg-brand-50' }: { name: React.ComponentProps<typeof Ionicons>['name']; tint?: string; bg?: string }) => (
  <View className={`h-12 w-12 items-center justify-center rounded-2xl ${bg}`}>
    <Ionicons name={name} size={22} color={tint} />
  </View>
);

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
export const PinPad = ({ value, onChange, length = 4 }: { value: string; onChange: (v: string) => void; length?: number }) => (
  <View>
    <View className="mb-8 flex-row justify-center gap-4">
      {Array.from({ length }).map((_, i) => (
        <View key={i} className={`h-4 w-4 rounded-full ${i < value.length ? 'bg-brand-600' : 'bg-slate-200'}`} />
      ))}
    </View>
    <View className="flex-row flex-wrap">
      {KEYS.map((k, i) => (
        <View key={i} className="w-1/3 items-center py-1.5">
          {k === '' ? null : (
            <Pressable
              onPress={() => onChange(k === 'del' ? value.slice(0, -1) : (value + k).slice(0, length))}
              className="h-16 w-16 items-center justify-center rounded-full bg-white border border-slate-100 active:bg-slate-100"
            >
              {k === 'del' ? <Ionicons name="backspace-outline" size={24} color="#101944" /> : <Text className="text-2xl font-semibold text-brand-900">{k}</Text>}
            </Pressable>
          )}
        </View>
      ))}
    </View>
  </View>
);
