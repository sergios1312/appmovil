# 📱 AppMovil — Aplicación Móvil Corporativa con React Native & Expo

Este proyecto es una aplicación móvil nativa multiplataforma (iOS y Android) desarrollada para el ecosistema móvil de **Grupo QTC**. Está construida utilizando **Expo SDK 54** y **React Native**, integrada con **Supabase** para la persistencia de datos, autenticación segura y sincronización en tiempo real.

---

## 🚀 Características Clave

* **Navegación Avanzada (File-based Routing):** Implementación de **Expo Router** para estructurar vistas de manera modular y limpia mediante pestañas (`bottom-tabs`) y pantallas apiladas (`stack`), facilitando el mantenimiento y escalabilidad.
* **Autenticación e Inicio de Sesión Seguro:** Sistema de autenticación de usuarios integrado con **Supabase Auth** y **Expo Secure Store** para almacenar tokens de sesión de manera cifrada en el llavero del dispositivo.
* **Componentes de Interfaz de Alta Calidad (UX Móvil):**
  * Pantallas deslizables utilizando `@gorhom/bottom-sheet` para una experiencia fluida.
  * Respuestas sensoriales interactivas mediante **Expo Haptics** (vibración física al pulsar botones o realizar acciones clave).
  * Iconografía optimizada mediante `@expo/vector-icons`.
* **Sincronización de Datos offline-first**: Configuración inicial de caché local usando `@react-native-async-storage/async-storage` para soportar consultas rápidas en zonas agrícolas con conectividad limitada.

---

## 🛠️ Stack Tecnológico

* **Framework Core**: React Native, Expo SDK 54.
* **Enrutamiento y Navegación**: Expo Router, React Navigation.
* **Base de Datos & Backend**: Supabase (`@supabase/supabase-js`) y persistencia con AsyncStorage.
* **Seguridad**: `expo-secure-store` para cifrado de tokens en el dispositivo.
* **Animaciones & UX**: `react-native-reanimated`, `expo-haptics`, `@gorhom/bottom-sheet`.
* **Utilidades de Fecha**: `date-fns` y `dayjs`.

---

## 📐 Estructura de Directorios

```text
appmovil/
├── app/                  # Enrutador principal (Expo Router: index, tabs, modales)
├── src/                  # Componentes reutilizables, hooks y llamadas de API
├── estilos/              # Ficheros de estilos, temas y tokens de diseño
├── scripts/              # Herramientas de build y reset de proyecto
├── package.json          # Gestión de dependencias y scripts de ejecución
└── app.json              # Configuración nativa de Expo para builds
```

---

## 🧠 Habilidades Técnicas & Aprendizajes

* **Manejo de Ciclo de Vida Nátivo y Sesiones**: Integración de estados de autenticación persistentes (`Auth Session`), asegurando la reconexión automática transparente para el usuario final sin comprometer la seguridad de las claves.
* **Animaciones Fluidas a 60 FPS**: Uso de `react-native-reanimated` para ejecutar transiciones complejas en el hilo nativo de la UI en lugar del hilo de JavaScript, evitando cuelgues o saltos visuales.
* **Configuración del Entorno EAS**: Experiencia práctica en la preparación del archivo `eas.json` para ejecutar compilaciones automáticas (Builds) en los servidores en la nube de Expo para distribución en tiendas (Google Play Console y Apple App Store).

---

## 🔧 Ejecución del Proyecto en Local

1. Instala **Node.js** (recomendado v18 o v20).
2. Instala la aplicación Expo Go en tu teléfono inteligente (iOS o Android) o levanta un emulador.
3. Instala las dependencias locales:
   ```bash
   npm install
   ```
4. Inicia el servidor de desarrollo de Expo:
   ```bash
   npx expo start
   ```
5. Escanea el código QR generado en la consola con la cámara de tu celular (iOS) o la app Expo Go (Android) para sincronizar y probar la aplicación en tiempo real.
