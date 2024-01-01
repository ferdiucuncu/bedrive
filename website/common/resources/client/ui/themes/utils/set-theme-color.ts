import {themeEl} from '@common/core/root-el';

export function setThemeColor(key: string, value: string) {
  themeEl?.style.setProperty(key, value);
}
