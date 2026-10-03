import React, { createContext, useContext } from 'react';
import { Text as RNText, TextInput as RNTextInput, TextInputProps, TextProps } from 'react-native';

/**
 * Drop-in Text/TextInput that use Plus Jakarta Sans. React Native can't pick a weight
 * from a custom family, so the font-medium/semibold/bold/extrabold classes are swapped
 * for the matching font file (see tailwind.config.js `fontFamily`).
 */
const WEIGHTS: Record<string, string> = {
  'font-medium': 'font-jakarta-medium',
  'font-semibold': 'font-jakarta-semibold',
  'font-bold': 'font-jakarta-bold',
  'font-extrabold': 'font-jakarta-extrabold',
};
const WEIGHT_RE = /(^|\s)(font-(?:medium|semibold|bold|extrabold))(?=\s|$)/;

const resolve = (className: string | undefined, nested: boolean) => {
  const cn = className ?? '';
  const m = cn.match(WEIGHT_RE);
  if (m) return cn.replace(WEIGHT_RE, `$1${WEIGHTS[m[2]]}`);
  // Nested text inherits its parent's family; only top-level text gets the regular file.
  return nested ? cn : `${cn} font-jakarta`;
};

const InText = createContext(false);

export const Text = ({ className, ...props }: TextProps & { className?: string }) => {
  const nested = useContext(InText);
  return (
    <InText.Provider value>
      <RNText {...props} {...({ className: resolve(className, nested) } as object)} />
    </InText.Provider>
  );
};

export const TextInput = ({ className, ...props }: TextInputProps & { className?: string }) => (
  <RNTextInput {...props} {...({ className: `${resolve(className, false)} outline-none` } as object)} />
);
