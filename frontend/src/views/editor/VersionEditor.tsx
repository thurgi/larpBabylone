import { useState, useCallback } from 'react';
import { useMarkdownEditor, MarkdownEditorView } from '@gravity-ui/markdown-editor';
import { Button, Icon, useToaster } from '@gravity-ui/uikit';
import { FloppyDisk } from '@gravity-ui/icons';
import './VersionEditor.scss';

interface Props {
  content: string;
  onSave: (content: string) => Promise<void>;
  saving: boolean;
}

export function VersionEditor({ content, onSave, saving }: Props) {
  const [dirty, setDirty] = useState(false);
  const toaster = useToaster();

  const editor = useMarkdownEditor({
    initial: {
      markup: content,
    },
    allowHTML: false,
  });

  const handleSave = useCallback(() => {
    const value = editor.getValue();
    onSave(value).then(() => setDirty(false));
  }, [editor, onSave]);

  return (
    <div className="version-editor">
      <div className="version-editor__actions">
        <Button
          view="action"
          size="m"
          onClick={handleSave}
          loading={saving}
          disabled={!dirty && !saving}
        >
          <Icon data={FloppyDisk} size={16} />
          Sauvegarder
        </Button>
      </div>
      <div className="version-editor__container" onChange={() => setDirty(true)}>
        <MarkdownEditorView stickyToolbar autofocus editor={editor} toaster={toaster} />
      </div>
    </div>
  );
}
