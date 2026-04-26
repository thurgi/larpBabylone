import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Text, TextInput, Loader, Icon, Modal, Select } from '@gravity-ui/uikit';
import { Plus, TrashBin, Pencil, Folder as FolderIcon, FolderOpen, FolderPlus, ArrowRight } from '@gravity-ui/icons';
import { api } from '@/core/services';
import type { Document, Folder } from '@/core/types';
import './DocumentsPage.scss';

export function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [moveModalDocId, setMoveModalDocId] = useState<string | null>(null);
  const [moveFolderModalId, setMoveFolderModalId] = useState<string | null>(null);
  const [selectedMoveTarget, setSelectedMoveTarget] = useState<string[]>([]);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docs, flds] = await Promise.all([
        api.get<Document[]>('/api/documents'),
        api.get<Folder[]>('/api/folders'),
      ]);
      setDocuments(docs);
      setFolders(flds);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentFolders = folders.filter((f) => f.parentId === currentFolderId);
  const currentDocuments = documents.filter((d) => d.folderId === currentFolderId);

  const breadcrumbs = (() => {
    const path: Folder[] = [];
    let id = currentFolderId;
    while (id) {
      const f = folders.find((fo) => fo.id === id);
      if (!f) break;
      path.unshift(f);
      id = f.parentId;
    }
    return path;
  })();

  const handleCreateDocument = async () => {
    if (!newTitle.trim()) return;
    await api.post('/api/documents', {
      title: newTitle.trim(),
      ...(currentFolderId ? { folderId: currentFolderId } : {}),
    });
    setNewTitle('');
    setCreating(false);
    fetchData();
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await api.post('/api/folders', {
      name: newFolderName.trim(),
      ...(currentFolderId ? { parentId: currentFolderId } : {}),
    });
    setNewFolderName('');
    setCreatingFolder(false);
    fetchData();
  };

  const handleDeleteDocument = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await api.delete(`/api/documents/${id}`);
    fetchData();
  };

  const handleDeleteFolder = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await api.delete(`/api/folders/${id}`);
    fetchData();
  };

  const handleMoveDocument = async () => {
    if (!moveModalDocId) return;
    const targetId = selectedMoveTarget.length > 0 ? selectedMoveTarget[0] : null;
    await api.patch(`/api/folders/move-document/${moveModalDocId}`, {
      folderId: targetId === '__root__' ? null : targetId,
    });
    setMoveModalDocId(null);
    setSelectedMoveTarget([]);
    fetchData();
  };

  const handleMoveFolder = async () => {
    if (!moveFolderModalId) return;
    const targetId = selectedMoveTarget.length > 0 ? selectedMoveTarget[0] : null;
    await api.put(`/api/folders/${moveFolderModalId}`, {
      parentId: targetId === '__root__' ? null : targetId,
    });
    setMoveFolderModalId(null);
    setSelectedMoveTarget([]);
    fetchData();
  };

  const openMoveDocModal = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    setSelectedMoveTarget([]);
    setMoveModalDocId(docId);
  };

  const openMoveFolderModal = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    setSelectedMoveTarget([]);
    setMoveFolderModalId(folderId);
  };

  const moveTargetOptions = [
    { value: '__root__', content: '/ (Racine)' },
    ...folders
      .filter((f) => f.id !== moveFolderModalId)
      .map((f) => ({ value: f.id, content: f.name })),
  ];

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
        <div className="documents-page__header-actions">
          <Button view="outlined" size="l" onClick={() => setCreatingFolder(true)}>
            <Icon data={FolderPlus} size={16} />
            Nouveau dossier
          </Button>
          <Button view="action" size="l" onClick={() => setCreating(true)}>
            <Icon data={Plus} size={16} />
            Nouveau document
          </Button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="documents-page__breadcrumbs">
        <Button
          view="flat"
          size="s"
          onClick={() => setCurrentFolderId(null)}
          disabled={!currentFolderId}
        >
          Racine
        </Button>
        {breadcrumbs.map((bc) => (
          <span key={bc.id} className="documents-page__breadcrumb-item">
            <Text variant="body-1" color="secondary">/</Text>
            <Button view="flat" size="s" onClick={() => setCurrentFolderId(bc.id)}>
              {bc.name}
            </Button>
          </span>
        ))}
      </div>

      {/* Create folder form */}
      {creatingFolder && (
        <Card className="documents-page__create-card" size="m">
          <TextInput
            size="l"
            placeholder="Nom du dossier"
            value={newFolderName}
            onUpdate={setNewFolderName}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            autoFocus
          />
          <div className="documents-page__create-actions">
            <Button view="action" size="m" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Créer
            </Button>
            <Button view="flat" size="m" onClick={() => { setCreatingFolder(false); setNewFolderName(''); }}>
              Annuler
            </Button>
          </div>
        </Card>
      )}

      {/* Create document form */}
      {creating && (
        <Card className="documents-page__create-card" size="m">
          <TextInput
            size="l"
            placeholder="Titre du document"
            value={newTitle}
            onUpdate={setNewTitle}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateDocument()}
            autoFocus
          />
          <div className="documents-page__create-actions">
            <Button view="action" size="m" onClick={handleCreateDocument} disabled={!newTitle.trim()}>
              Créer
            </Button>
            <Button view="flat" size="m" onClick={() => { setCreating(false); setNewTitle(''); }}>
              Annuler
            </Button>
          </div>
        </Card>
      )}

      {currentFolders.length === 0 && currentDocuments.length === 0 && !creating && !creatingFolder ? (
        <div className="documents-page__empty">
          <Text variant="body-2" color="secondary">
            Aucun contenu. Créez un dossier ou un document pour commencer.
          </Text>
        </div>
      ) : (
        <div className="documents-page__list">
          {currentFolders.map((folder) => (
            <Card
              key={folder.id}
              className="document-card document-card--folder"
              size="m"
            >
              <div className="document-card__body" onClick={() => setCurrentFolderId(folder.id)}>
                <div className="document-card__content">
                  <div className="document-card__title-row">
                    <Icon data={FolderIcon} size={18} />
                    <Text variant="subheader-2">{folder.name}</Text>
                  </div>
                  <Text variant="caption-2" color="secondary">
                    Modifié le {new Date(folder.updatedAt).toLocaleDateString('fr-FR')}
                  </Text>
                </div>
              </div>
              <div className="document-card__actions">
                <Button view="flat" size="s" onClick={(e) => openMoveFolderModal(e, folder.id)} title="Déplacer">
                  <Icon data={ArrowRight} size={14} />
                </Button>
                <Button view="flat" size="s" onClick={(e) => handleDeleteFolder(e, folder.id)}>
                  <Icon data={TrashBin} size={14} />
                </Button>
              </div>
            </Card>
          ))}

          {currentDocuments.map((doc) => (
            <Card
              key={doc.id}
              className="document-card"
              size="m"
            >
              <div className="document-card__body" onClick={() => navigate(`/documents/${doc.id}`)}>
                <div className="document-card__content">
                  <Text variant="subheader-2">{doc.title}</Text>
                  <Text variant="caption-2" color="secondary">
                    Modifié le {new Date(doc.updatedAt).toLocaleDateString('fr-FR')}
                  </Text>
                </div>
              </div>
              <div className="document-card__actions">
                <Button view="flat" size="s" onClick={(e) => openMoveDocModal(e, doc.id)} title="Déplacer">
                  <Icon data={ArrowRight} size={14} />
                </Button>
                <Button view="flat" size="s" onClick={() => navigate(`/documents/${doc.id}/edit`)}>
                  <Icon data={Pencil} size={14} />
                </Button>
                <Button view="flat" size="s" onClick={(e) => handleDeleteDocument(e, doc.id)}>
                  <Icon data={TrashBin} size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Move document modal */}
      <Modal open={!!moveModalDocId} onClose={() => setMoveModalDocId(null)}>
        <div className="documents-page__move-modal">
          <Text variant="subheader-2">Déplacer le document</Text>
          <Select
            size="m"
            placeholder="Choisir un dossier"
            value={selectedMoveTarget}
            options={moveTargetOptions}
            onUpdate={setSelectedMoveTarget}
            width="max"
          />
          <div className="documents-page__create-actions">
            <Button view="action" size="m" onClick={handleMoveDocument}>
              Déplacer
            </Button>
            <Button view="flat" size="m" onClick={() => setMoveModalDocId(null)}>
              Annuler
            </Button>
          </div>
        </div>
      </Modal>

      {/* Move folder modal */}
      <Modal open={!!moveFolderModalId} onClose={() => setMoveFolderModalId(null)}>
        <div className="documents-page__move-modal">
          <Text variant="subheader-2">Déplacer le dossier</Text>
          <Select
            size="m"
            placeholder="Choisir un dossier parent"
            value={selectedMoveTarget}
            options={moveTargetOptions}
            onUpdate={setSelectedMoveTarget}
            width="max"
          />
          <div className="documents-page__create-actions">
            <Button view="action" size="m" onClick={handleMoveFolder}>
              Déplacer
            </Button>
            <Button view="flat" size="m" onClick={() => setMoveFolderModalId(null)}>
              Annuler
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
