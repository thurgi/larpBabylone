import { useEffect, useState } from 'react';
import {
  Button,
  Text,
  TextInput,
  Loader,
  Icon,
  Modal,
} from '@gravity-ui/uikit';
import { Plus } from '@gravity-ui/icons';
import { api } from '@/core/services';
import type { ObjectItem as ObjectItemType } from '@/core/types';
import { ObjectItem } from './ObjectItem';
import './ObjectsPage.scss';

export function ObjectsPage() {
  const [objects, setObjects] = useState<ObjectItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingObject, setEditingObject] = useState<ObjectItemType | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const fetchObjects = async () => {
    setLoading(true);
    try {
      const data = await api.get<ObjectItemType[]>('/api/objects');
      setObjects(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjects();
  }, []);

  const openCreate = () => {
    setEditingObject(null);
    setName('');
    setDescription('');
    setModalOpen(true);
  };

  const openEdit = (obj: ObjectItemType) => {
    setEditingObject(obj);
    setName(obj.name);
    setDescription(obj.description);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const body = { name: name.trim(), description: description.trim() };
    if (editingObject) {
      await api.put(`/api/objects/${editingObject.id}`, body);
    } else {
      await api.post('/api/objects', body);
    }
    setModalOpen(false);
    fetchObjects();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await api.delete(`/api/objects/${id}`);
    fetchObjects();
  };

  if (loading) {
    return (
      <div className="objects-page__loader">
        <Loader size="l" />
      </div>
    );
  }

  return (
    <div className="objects-page">
      <div className="objects-page__header">
        <Text variant="header-1">Objets</Text>
        <Button view="action" size="l" onClick={openCreate}>
          <Icon data={Plus} size={16} />
          Nouvel objet
        </Button>
      </div>
      <div className='objects-page__body'>
        {objects.length === 0 ? (
          <div className="objects-page__empty">
            <Text variant="body-2" color="secondary">
              Aucun objet. Créez-en un pour commencer.
            </Text>
          </div>
        ) : (
          <ul className="objects-page__list">
            {objects.map((obj) => (
              <ObjectItem
                key={obj.id}
                object={obj}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="objects-page__modal">
          <Text variant="header-2">
            {editingObject ? "Modifier l'objet" : 'Nouvel objet'}
          </Text>
          <TextInput
            size="l"
            placeholder="Nom de l'objet"
            value={name}
            onUpdate={setName}
            autoFocus
          />
          <TextInput
            size="l"
            placeholder="Description"
            value={description}
            onUpdate={setDescription}
          />
          <div className="objects-page__modal-actions">
            <Button view="action" size="m" onClick={handleSave} disabled={!name.trim()}>
              {editingObject ? 'Enregistrer' : 'Créer'}
            </Button>
            <Button view="flat" size="m" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
