import { StyleSheet, TextInput, Button, View } from 'react-native';
import { useState } from 'react';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Image } from 'expo-image';
import { useSocket } from '@/hooks/use-socket';

export default function HomeScreen() {
  const [ip, setIp] = useState('192.168.1.xxx');
  const { isConnected, status, currentStream, lastImage, connect, disconnect } = useSocket();

  const toggleConnection = () => {
    if (isConnected) {
      disconnect();
    } else {
      const url = `http://${ip}:3000`;
      connect(url);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Mobile Companion</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Status: {status}</ThemedText>

        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <TextInput
            style={styles.input}
            value={ip}
            onChangeText={setIp}
            placeholder="192.168.1.X"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="numeric"
          />
          <Button
            title={isConnected ? "Disconnect" : "Connect"}
            onPress={toggleConnection}
          />
        </View>
        <ThemedText>Enter your Mac's Local IP (e.g. 192.168.1.5)</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Live AI Feed:</ThemedText>
        <ThemedView style={styles.responseBox}>
          {lastImage ? (
            <Image
              source={{ uri: lastImage }}
              style={{ width: '100%', height: 300, borderRadius: 8, marginBottom: 10 }}
              contentFit="contain"
            />
          ) : null}
          <ThemedText style={{ fontSize: 18, lineHeight: 28 }}>
            {currentStream || "No active stream."}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}


const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  input: {
    backgroundColor: '#fff',
    color: '#000',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    fontSize: 16
  },
  responseBox: {
    padding: 15,
    backgroundColor: 'rgba(100,100,100,0.1)',
    borderRadius: 10,
    minHeight: 200
  }
});
