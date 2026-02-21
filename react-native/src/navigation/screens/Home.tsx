import { Button, Text } from '@react-navigation/elements'
import type React from 'react'
import { StyleSheet, View } from 'react-native'

export function Home(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text>Home Screen</Text>
      <Text>Open up &apos;src/App.tsx&apos; to start working on your app!</Text>
      <Button screen="Profile" params={{ user: 'Rose' }}>
        Go to Profile
      </Button>
      <Button screen="Settings">Go to Settings</Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
})
