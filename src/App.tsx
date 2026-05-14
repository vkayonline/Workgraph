import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SettingsProvider } from './contexts/SettingsContext';
import { useSettingsContext } from './contexts/SettingsContext';
import { SetupScreen } from './components/onboarding/SetupScreen';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './components/home/HomePage';
import { EntryListPage } from './components/entries/EntryListPage';
import { ReplayPage } from './components/replay/ReplayPage';

function AppRoutes() {
  const { onboarded } = useSettingsContext();
  if (!onboarded) return <SetupScreen />;
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="entries" element={<EntryListPage />} />
        <Route path="replay" element={<ReplayPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <AppRoutes />
      </SettingsProvider>
    </BrowserRouter>
  );
}
