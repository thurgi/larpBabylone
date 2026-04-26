import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, Loader, ToasterComponent, ToasterProvider } from '@gravity-ui/uikit';
import { AuthProvider } from '@/core/services';
import { Header } from './shared/header';
import { ProtectedRoute } from './shared/protected-route';

import '@gravity-ui/uikit/styles/fonts.css';
import '@gravity-ui/uikit/styles/styles.css';
import './App.scss';

const LoginPage = lazy(() => import('./views/login/LoginPage').then(m => ({ default: m.LoginPage })));
const DocumentsPage = lazy(() => import('./views/documents/DocumentsPage').then(m => ({ default: m.DocumentsPage })));
const EditorPage = lazy(() => import('./views/editor/EditorPage').then(m => ({ default: m.EditorPage })));
const GroupsPage = lazy(() => import('./views/groups/GroupsPage').then(m => ({ default: m.GroupsPage })));

export function App() {
  return (
    <ThemeProvider theme="light">
      <ToasterProvider>
        <ToasterComponent />
        <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<div className="documents-page__loader"><Loader size="l" /></div>}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="*"
                element={
                  <ProtectedRoute>
                    <Header />
                    <Routes>
                      <Route path="/" element={<DocumentsPage />} />
                      <Route path="/documents/:documentId" element={<EditorPage />} />
                      <Route path="/groups" element={<GroupsPage />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
      </ToasterProvider>
    </ThemeProvider>
  );
}
