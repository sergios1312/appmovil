import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { Collapsible } from '@/presentation/components/ui/collapsible';
import { ExternalLink } from '@/presentation/components/external-link';
import ParallaxScrollView from '@/presentation/components/parallax-scroll-view';
import { ThemedText } from '@/presentation/components/themed-text';
import { ThemedView } from '@/presentation/components/themed-view';
import { IconSymbol } from '@/presentation/components/ui/icon-symbol';
import { Fonts } from '@/presentation/constants/theme';

export default function TabTwoScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}>
          Explorar
        </ThemedText>
      </ThemedView>
      <ThemedText>Esta aplicación incluye código de ejemplo para ayudarte a comenzar.</ThemedText>
      <Collapsible title="Enrutamiento basado en archivos">
        <ThemedText>
          Esta aplicación tiene varias pantallas:{' '}
          <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> y{' '}
          <ThemedText type="defaultSemiBold">app/(tabs)/explore.tsx</ThemedText>
        </ThemedText>
        <ThemedText>
          El archivo de diseño en <ThemedText type="defaultSemiBold">app/(tabs)/_layout.tsx</ThemedText>{' '}
          configura el navegador de pestañas.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/router/introduction">
          <ThemedText type="link">Más información</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Soporte para Android, iOS y Web">
        <ThemedText>
          Puedes abrir este proyecto en Android, iOS y la web. Para abrir la versión web, presiona{' '}
          <ThemedText type="defaultSemiBold">w</ThemedText> en la terminal que ejecuta este proyecto.
        </ThemedText>
      </Collapsible>
      <Collapsible title="Imágenes">
        <ThemedText>
          Para imágenes estáticas, puedes usar los sufijos <ThemedText type="defaultSemiBold">@2x</ThemedText> y{' '}
          <ThemedText type="defaultSemiBold">@3x</ThemedText> para proporcionar archivos para diferentes densidades de pantalla.
        </ThemedText>
        <Image
          source={require('@/assets/images/react-logo.png')}
          style={{ width: 100, height: 100, alignSelf: 'center' }}
        />
        <ExternalLink href="https://reactnative.dev/docs/images">
          <ThemedText type="link">Más información</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Componentes para modo claro y oscuro">
        <ThemedText>
          Esta plantilla tiene soporte para modo claro y oscuro. El hook{' '}
          <ThemedText type="defaultSemiBold">useColorScheme()</ThemedText> te permite inspeccionar
          cuál es el esquema de color actual del usuario para ajustar los colores de la UI.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
          <ThemedText type="link">Más información</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Arquitectura Limpia">
        <ThemedText>
          El proyecto ha sido organizado siguiendo principios de Arquitectura Limpia:
        </ThemedText>
        <ThemedText type="defaultSemiBold">- src/core:</ThemedText><ThemedText> Entidades e interfaces de dominio.</ThemedText>
        <ThemedText type="defaultSemiBold">- src/data:</ThemedText><ThemedText> Repositorios y fuentes de datos (SQLite).</ThemedText>
        <ThemedText type="defaultSemiBold">- src/infrastructure:</ThemedText><ThemedText> Servicios externos y base de datos.</ThemedText>
        <ThemedText type="defaultSemiBold">- src/presentation:</ThemedText><ThemedText> Componentes de UI, hooks y stores (Zustand).</ThemedText>
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
