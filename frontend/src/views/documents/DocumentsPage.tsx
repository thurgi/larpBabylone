import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Text, TextInput, Loader, Icon } from '@gravity-ui/uikit';
import { Plus, TrashBin, Pencil } from '@gravity-ui/icons';
import { api } from '@/core/services';
import type { Document } from '@/core/types';
import './DocumentsPage.scss';

export function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const navigate = useNavigate();

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const docs = await api.get<Document[]>('/api/documents');
      setDocuments(docs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await api.post('/api/documents', { title: newTitle.trim() });
    setNewTitle('');
    setCreating(false);
    fetchDocuments();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await api.delete(`/api/documents/${id}`);
    fetchDocuments();
  };

  if (loading) {
    return (
      <div className="documents-page__loader">
        <Loader size="l" />
      </div>
    );
  }

  return (
    <div className="documents-page">
      <div className="documents-page__header">
        <Text variant="header-1">Documents</Text>
        <Button view="action" size="l" onClick={() => setCreating(true)}>
          <Icon data={Plus} size={16} />
          Nouveau document
        </Button>
      </div>

      {creating && (
        <Card className="documents-page__create-card" size="m">
          <TextInput
            size="l"
            placeholder="Titre du document"
            value={newTitle}
            onUpdate={setNewTitle}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <div className="documents-page__create-actions">
            <Button view="action" size="m" onClick={handleCreate} disabled={!newTitle.trim()}>
              Créer
            </Button>
            <Button view="flat" size="m" onClick={() => { setCreating(false); setNewTitle(''); }}>
              Annuler
            </Button>
          </div>
        </Card>
      )}

      {documents.length === 0 && !creating ? (
        <div className="documents-page__empty">
          <Text variant="body-2" color="secondary">
            Aucun document. Créez-en un pour commencer.
          </Text>
        </div>
      ) : (
        <div className="documents-page__list">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onOpen={() => navigate(`/documents/${doc.id}`)}
              onDelete={(e) => handleDelete(e, doc.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentCard({
  document,
  onOpen,
  onDelete,
}: {
  document: Document;
  onOpen: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  return (
    <Card className="document-card" size="m" onClick={onOpen}>
      <div className="document-card__content">
        <Text variant="subheader-2">{document.title}</Text>
        <Text variant="caption-2" color="secondary">
          Modifié le {new Date(document.updatedAt).toLocaleDateString('fr-FR')}
        </Text>
      </div>
      <div className="document-card__actions">
        <Button view="flat" size="s" onClick={onOpen}>
          <Icon data={Pencil} size={14} />
        </Button>
        <Button view="flat" size="s" onClick={onDelete}>
          <Icon data={TrashBin} size={14} />
        </Button>
      </div>
    </Card>
  );
}
