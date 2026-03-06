import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import StartseitePage from '@/pages/StartseitePage';
import AudioAufnahmenPage from '@/pages/AudioAufnahmenPage';
import TextDokumentePage from '@/pages/TextDokumentePage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="startseite" element={<StartseitePage />} />
          <Route path="audio-aufnahmen" element={<AudioAufnahmenPage />} />
          <Route path="text-dokumente" element={<TextDokumentePage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}