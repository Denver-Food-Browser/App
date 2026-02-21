import { Text } from '@react-navigation/elements'
import type { StaticScreenProps } from '@react-navigation/native'
import type React from 'react'
import { StyleSheet, View } from 'react-native'

type Props = StaticScreenProps<{
  user: string
}>

export function Profile({ route }: Props): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text>{route.params.user}&apos;s Profile</Text>
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
