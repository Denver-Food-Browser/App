import { Text, Button } from '@react-navigation/elements'
import type React from 'react'
import { StyleSheet, View } from 'react-native'

export function NotFound(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text>404</Text>
      <Button screen="HomeTabs">Go to Home</Button>
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
