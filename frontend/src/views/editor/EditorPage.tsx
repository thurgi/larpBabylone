import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Text, Loader, Select, Icon } from '@gravity-ui/uikit';
import { ArrowLeft, Check, Plus, TrashBin } from '@gravity-ui/icons';
import { api } from '@/core/services';
import type { Document, Version, VersionFull, Group } from '@/core/types';
import { VersionEditor } from './VersionEditor';
import './EditorPage.scss';

export function EditorPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [versionFull, setVersionFull] = useState<VersionFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allGroups, setAllGroups] = useState<Group[]>([]);

  const fetchDocument = async () => {
    if (!documentId) return;
    try {
      const [doc, vers, groups] = await Promise.all([
        api.get<Document>(`/api/documents/${documentId}`),
        api.get<Version[]>(`/api/documents/${documentId}/versions`),
        api.get<Group[]>('/api/groups'),
      ]);
      setDocument(doc);
      setVersions(vers);
      setAllGroups(groups);

      if (vers.length > 0 && !selectedVersionId) {
        const valid = vers.find((v) => v.isValid);
        setSelectedVersionId(valid?.id ?? vers[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  useEffect(() => {
    if (!documentId || !selectedVersionId) {
      setVersionFull(null);
      return;
    }
    api
      .get<VersionFull>(`/api/documents/${documentId}/versions/${selectedVersionId}`)
      .then(setVersionFull);
  }, [documentId, selectedVersionId]);

  const handleSave = async (content: string) => {
    if (!documentId || !selectedVersionId) return;
    setSaving(true);
    try {
      const updated = await api.put<VersionFull>(
        `/api/documents/${documentId}/versions/${selectedVersionId}`,
        { content },
      );
      setVersionFull(updated);
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async () => {
    if (!documentId || !selectedVersionId) return;
    await api.patch(`/api/documents/${documentId}/versions/${selectedVersionId}/validate`);
    fetchDocument();
  };

  const handleCreateVersion = async () => {
    if (!documentId) return;
    const v = await api.post<VersionFull>(`/api/documents/${documentId}/versions`, {});
    setSelectedVersionId(v.id);
    fetchDocument();
  };

  const handleDeleteVersion = async () => {
    if (!documentId || !selectedVersionId) return;
    await api.delete(`/api/documents/${documentId}/versions/${selectedVersionId}`);
    setSelectedVersionId(null);
    setVersionFull(null);
    fetchDocument();
  };

  const handleGroupsChange = async (groupIds: string[]) => {
    if (!documentId) return;
    await api.put(`/api/documents/${documentId}`, { groupIds });
    setDocument((prev) => prev ? { ...prev, groupIds } : prev);
  };

  if (loading) {
    return (
      <div className="editor-page__loader">
        <Loader size="l" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="editor-page__not-found">
        <Text variant="body-2">Document introuvable</Text>
        <Button view="action" onClick={() => navigate('/')}>Retour</Button>
      </div>
    );
  }

  const versionOptions = versions.map((v) => ({
    value: v.id,
    content: `Version ${v.title}${v.isValid ? ' ✓' : ''}`,
  }));

  const groupOptions = allGroups.map((g) => ({
    value: g.id,
    content: g.name,
  }));

  return (
    <div className="editor-page">
      <div className="editor-page__toolbar">
        <Button view="flat" size="m" onClick={() => navigate('/')}>
          <Icon data={ArrowLeft} size={16} />
          Retour
        </Button>
        <Text variant="subheader-2" ellipsis>{document.title}</Text>
        {allGroups.length > 0 && (
          <Select
            size="m"
            multiple
            placeholder="Groupes"
            value={document.groupIds}
            options={groupOptions}
            onUpdate={handleGroupsChange}
            width={200}
          />
        )}
        <div className="editor-page__toolbar-right">
          {versions.length > 0 && (
            <Select
              size="m"
              value={selectedVersionId ? [selectedVersionId] : []}
              options={versionOptions}
              onUpdate={(val) => setSelectedVersionId(val[0])}
              width={200}
            />
          )}
          <Button view="flat" size="m" onClick={handleCreateVersion}>
            <Icon data={Plus} size={16} />
          </Button>
          {selectedVersionId && (
            <>
              <Button
                view="outlined-success"
                size="m"
                onClick={handleValidate}
                disabled={versionFull?.isValid}
              >
                <Icon data={Check} size={16} />
                Valider
              </Button>
              <Button view="flat-danger" size="m" onClick={handleDeleteVersion}>
                <Icon data={TrashBin} size={16} />
              </Button>
            </>
          )}
        </div>
      </div>

      {versionFull ? (
        <VersionEditor
          key={versionFull.id}
          content={versionFull.content}
          onSave={handleSave}
          saving={saving}
        />
      ) : (
        <div className="editor-page__empty">
          <Text variant="body-2" color="secondary">
            {versions.length === 0
              ? 'Aucune version. Créez-en une pour commencer à éditer.'
              : 'Sélectionnez une version.'}
          </Text>
        </div>
      )}
    </div>
  );
}
