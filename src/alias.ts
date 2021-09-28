import moduleAlias from 'module-alias';
import path from 'path';

export const modulePathInit = (): void => {
  moduleAlias.addAliases({
    '@app': __dirname,
    '@comp': path.resolve(__dirname, './components'),
    '@api': path.resolve(__dirname, './api'),
    '@env': path.resolve(__dirname, './environments'),
  });
};
