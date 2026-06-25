import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, ColorValue } from 'react-native';
import { Colors, FontFamily, FontSize } from '@/theme';
import { CareProvider } from '@/context/CareContext';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(focused: IoniconName, unfocused: IoniconName) {
  return ({ color, focused: f }: { color: ColorValue; focused: boolean }) => (
    <Ionicons name={f ? focused : unfocused} size={24} color={color as string} />
  );
}

export default function CaregiverTabLayout() {
  return (
    <CareProvider>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.buttonPrimary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: tabIcon('home', 'home-outline'),
        }}
      />
      <Tabs.Screen
        name="patient"
        options={{
          title: 'Patient',
          tabBarIcon: tabIcon('people', 'people-outline'),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Log',
          tabBarIcon: tabIcon('document-text', 'document-text-outline'),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: tabIcon('bar-chart', 'bar-chart-outline'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: tabIcon('person', 'person-outline'),
        }}
      />
    </Tabs>
    </CareProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.xs - 2,
  },
});
