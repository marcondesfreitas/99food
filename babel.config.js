// No SDK 57 o `babel-preset-expo` já adiciona o plugin de worklets
// automaticamente quando `react-native-worklets` está instalado (ver
// babel-preset-expo/build/configs/expo.js, "Automatically add worklets or
// reanimated plugin when package is installed").
//
// Por isso NÃO declaramos `react-native-reanimated/plugin` aqui: além de
// redundante, esse caminho hoje é só um shim que reexporta
// `react-native-worklets/plugin` — declará-lo faria o mesmo plugin ser
// aplicado duas vezes. (A instrução de "deixar o plugin do Reanimated por
// último", em `contextos/B00-bootstrap.md`, é anterior ao Reanimated 4.)
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
