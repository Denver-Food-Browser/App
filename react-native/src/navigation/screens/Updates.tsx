import { Text } from '@react-navigation/elements'
import type React from 'react'
import { StyleSheet, View } from 'react-native'

export function Updates(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text>Updates Screen</Text>
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
