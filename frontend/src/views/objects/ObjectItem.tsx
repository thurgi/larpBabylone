import { Button, Card, Text, Icon } from '@gravity-ui/uikit';
import { TrashBin } from '@gravity-ui/icons';
import type { ObjectItem as ObjectItemType } from '@/core/types';

interface ObjectItemProps {
  object: ObjectItemType;
  onEdit: (obj: ObjectItemType) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

export function ObjectItem({ object, onEdit, onDelete }: ObjectItemProps) {
  return (
    <li className="object-item">
      <Card
        className="object-item__card"
        type="action"
        size="m"
        onClick={() => onEdit(object)}
      >
        <div className="object-item__content">
          <Text variant="subheader-2">{object.name}</Text>
          <Text variant="body-2" color="secondary">
            {object.description}
          </Text>
        </div>
        <div className="object-item__actions">
          <Button
            view="flat"
            size="s"
            onClick={(e) => onDelete(e, object.id)}
          >
            <Icon data={TrashBin} size={14} />
          </Button>
        </div>
      </Card>
    </li>
  );
}
