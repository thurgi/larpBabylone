import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Text,
  TextInput,
  Loader,
  Icon,
  Checkbox,
  Modal,
} from '@gravity-ui/uikit';
import { Plus, TrashBin, Pencil } from '@gravity-ui/icons';
import { api, useAuth } from '@/core/services';
import type { Group, GroupPermissions, User } from '@/core/types';
import './GroupsPage.scss';

const DEFAULT_PERMISSIONS: GroupPermissions = {
  documents: { create: false, read: false, update: false, delete: false },
  versions: { create: false, read: false, update: false, delete: false },
  publicRead: false,
  admin: false,
};

export function GroupsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState<GroupPermissions>(DEFAULT_PERMISSIONS);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  useEffect(() => {
    if (user && !user.isGroupAdmin) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const [data, users] = await Promise.all([
        api.get<Group[]>('/api/groups'),
        api.get<User[]>('/api/auth/users'),
      ]);
      setGroups(data);
      setAllUsers(users);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const openCreate = () => {
    setEditingGroup(null);
    setName('');
    setPermissions(DEFAULT_PERMISSIONS);
    setSelectedUserIds([]);
    setModalOpen(true);
  };

  const openEdit = (group: Group) => {
    setEditingGroup(group);
    setName(group.name);
    setPermissions(group.permissions);
    setSelectedUserIds(group.userIds);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const body = { name: name.trim(), permissions, userIds: selectedUserIds };
    if (editingGroup) {
      await api.put(`/api/groups/${editingGroup.id}`, body);
    } else {
      await api.post('/api/groups', body);
    }
    setModalOpen(false);
    fetchGroups();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await api.delete(`/api/groups/${id}`);
    fetchGroups();
  };

  const updatePerm = (
    scope: 'documents' | 'versions',
    action: 'create' | 'read' | 'update' | 'delete',
    value: boolean,
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [scope]: { ...prev[scope], [action]: value },
    }));
  };

  if (loading) {
    return (
      <div className="groups-page__loader">
        <Loader size="l" />
      </div>
    );
  }

  return (
    <div className="groups-page">
      <div className="groups-page__header">
        <Text variant="header-1">Groupes</Text>
        <Button view="action" size="l" onClick={openCreate}>
          <Icon data={Plus} size={16} />
          Nouveau groupe
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="groups-page__empty">
          <Text variant="body-2" color="secondary">
            Aucun groupe. Créez-en un pour commencer.
          </Text>
        </div>
      ) : (
        <div className="groups-page__list">
          {groups.map((group) => (
            <Card key={group.id} className="group-card" size="m">
              <div className="group-card__content">
                <Text variant="subheader-2">{group.name}</Text>
                <Text variant="caption-2" color="secondary">
                  {group.userIds.length} utilisateur{group.userIds.length !== 1 ? 's' : ''}
                </Text>
              </div>
              <div className="group-card__actions">
                <Button view="flat" size="s" onClick={() => openEdit(group)}>
                  <Icon data={Pencil} size={14} />
                </Button>
                <Button view="flat" size="s" onClick={(e) => handleDelete(e, group.id)}>
                  <Icon data={TrashBin} size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="groups-page__modal">
          <Text variant="header-2">
            {editingGroup ? 'Modifier le groupe' : 'Nouveau groupe'}
          </Text>
          <TextInput
            size="l"
            placeholder="Nom du groupe"
            value={name}
            onUpdate={setName}
            autoFocus
          />

          <div className="groups-page__permissions">
            <Text variant="subheader-1">Permissions Documents</Text>
            <div className="groups-page__perm-row">
              {(['create', 'read', 'update', 'delete'] as const).map((action) => (
                <Checkbox
                  key={action}
                  checked={permissions.documents[action] ?? false}
                  onUpdate={(v) => updatePerm('documents', action, v)}
                >
                  {action}
                </Checkbox>
              ))}
            </div>

            <Text variant="subheader-1">Permissions Versions</Text>
            <div className="groups-page__perm-row">
              {(['create', 'read', 'update', 'delete'] as const).map((action) => (
                <Checkbox
                  key={action}
                  checked={permissions.versions[action] ?? false}
                  onUpdate={(v) => updatePerm('versions', action, v)}
                >
                  {action}
                </Checkbox>
              ))}
            </div>

            <Checkbox
              checked={permissions.publicRead ?? false}
              onUpdate={(v) =>
                setPermissions((prev) => ({ ...prev, publicRead: v }))
              }
            >
              Lecture publique
            </Checkbox>

            <Checkbox
              checked={permissions.admin ?? false}
              onUpdate={(v) =>
                setPermissions((prev) => ({ ...prev, admin: v }))
              }
            >
              Administration
            </Checkbox>
          </div>

          <div className="groups-page__users">
            <Text variant="subheader-1">Utilisateurs</Text>
            {allUsers.length === 0 ? (
              <Text variant="body-2" color="secondary">Aucun utilisateur enregistré</Text>
            ) : (
              <div className="groups-page__user-list">
                {allUsers.map((u) => (
                  <Checkbox
                    key={u.id}
                    checked={selectedUserIds.includes(u.id)}
                    onUpdate={(checked) => {
                      setSelectedUserIds((prev) =>
                        checked ? [...prev, u.id] : prev.filter((id) => id !== u.id),
                      );
                    }}
                  >
                    {u.username}
                  </Checkbox>
                ))}
              </div>
            )}
          </div>

          <div className="groups-page__modal-actions">
            <Button view="action" size="m" onClick={handleSave} disabled={!name.trim()}>
              {editingGroup ? 'Enregistrer' : 'Créer'}
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
