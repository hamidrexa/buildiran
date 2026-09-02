/**
 * BuildIran — Entry Point
 * Redirects directly to the game map.
 */

import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(game)" />;
}
