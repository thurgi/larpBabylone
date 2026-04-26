import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Text, Loader, Icon, useToaster } from '@gravity-ui/uikit';
import { ArrowLeft, Pencil } from '@gravity-ui/icons';
import { useMarkdownEditor, MarkdownEditorView } from '@gravity-ui/markdown-editor';
import { api } from '@/core/services';
import type { Document } from '@/core/types';
import './DocumentViewPage.scss';

export function DocumentViewPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const toaster = useToaster();
  const [document, setDocument] = useState<Document | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) return;
    setLoading(true);
    setError(null);

    Promise.all([
      api.get<Document>(`/api/documents/${documentId}`),
      fetch(`/api/documents/${documentId}/current`, { credentials: 'include' }),
    ])
      .then(async ([doc, res]) => {
        setDocument(doc);
        if (res.ok) {
          setContent(await res.text());
        } else {
          setContent(null);
          setError('Aucune version active pour ce document.');
        }
      })
      .catch(() => {
        setError('Document introuvable.');
      })
      .finally(() => setLoading(false));
  }, [documentId]);

  if (loading) {
    return (
      <div className="document-view__loader">
        <Loader size="l" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="document-view__not-found">
        <Text variant="body-2">Document introuvable</Text>
        <Button view="action" onClick={() => navigate('/')}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="document-view">
      <div className="document-view__toolbar">
        <Button view="flat" size="m" onClick={() => navigate('/')}>
          <Icon data={ArrowLeft} size={16} />
          Retour
        </Button>
        <Text variant="subheader-2" ellipsis>{document.title}</Text>
        <Button view="outlined" size="m" onClick={() => navigate(`/documents/${documentId}/edit`)}>
          <Icon data={Pencil} size={16} />
          Éditer
        </Button>
      </div>

      {error ? (
        <div className="document-view__empty">
          <Text variant="body-2" color="secondary">{error}</Text>
          <Button view="action" size="m" onClick={() => navigate(`/documents/${documentId}/edit`)}>
            Créer une version
          </Button>
        </div>
      ) : (
        <MarkdownViewer content={content || ''} toaster={toaster} />
      )}
    </div>
  );
}

function MarkdownViewer({ content, toaster }: { content: string; toaster: ReturnType<typeof useToaster> }) {
  const editor = useMarkdownEditor({
    initial: { markup: content, toolbarVisible: false },
    allowHTML: false,
  });

  return (
    <div className="document-view__content">
      <MarkdownEditorView editor={editor} stickyToolbar={false} settingsVisible={false} toaster={toaster} />
    </div>
  );
}
