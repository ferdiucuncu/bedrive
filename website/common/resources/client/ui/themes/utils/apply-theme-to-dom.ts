import {CssTheme} from '../css-theme';
import {setThemeColor} from './set-theme-color';
import {themeEl} from '@common/core/root-el';

export function applyThemeToDom(theme: CssTheme) {
  Object.entries(theme.colors).forEach(([key, value]) => {
    setThemeColor(key, value);
  });
  if (theme.is_dark) {
    themeEl.classList.add('dark');
  } else {
    themeEl.classList.remove('dark');
  }
}
