import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, ToasterProvider } from '@gravity-ui/uikit';
import { VersionEditor } from './VersionEditor';

vi.mock('@gravity-ui/markdown-editor', () => {
  const handlers: Record<string, Function> = {};
  const mockEditor = {
    on: (event: string, handler: Function) => { handlers[event] = handler; },
    off: vi.fn(),
    getValue: () => 'edited content',
    _triggerChange: () => { if (handlers['change']) handlers['change'](); },
  };
  return {
    useMarkdownEditor: () => mockEditor,
    MarkdownEditorView: () => <div data-testid="md-editor">markdown editor</div>,
    __mockEditor: mockEditor,
  };
});

import { __mockEditor } from '@gravity-ui/markdown-editor';

describe('VersionEditor', () => {
  const renderEditor = (props?: Partial<{ content: string; onSave: (c: string) => Promise<void>; saving: boolean }>) => {
    const defaultProps = {
      content: '# Hello',
      onSave: vi.fn().mockResolvedValue(undefined),
      saving: false,
      ...props,
    };
    return {
      ...render(
        <ThemeProvider theme="light">
          <ToasterProvider>
            <VersionEditor {...defaultProps} />
          </ToasterProvider>
        </ThemeProvider>,
      ),
      onSave: defaultProps.onSave,
    };
  };

  it('should render the markdown editor', () => {
    renderEditor();
    expect(screen.getByTestId('md-editor')).toBeInTheDocument();
  });

  it('should show save button disabled when not dirty', () => {
    renderEditor();
    const saveBtn = screen.getByText('Sauvegarder');
    expect(saveBtn.closest('button')).toHaveAttribute('disabled');
  });

  it('should enable save button after change', async () => {
    renderEditor();

    act(() => {
      (__mockEditor as any)._triggerChange();
    });

    const saveBtn = screen.getByText('Sauvegarder');
    expect(saveBtn.closest('button')).not.toHaveAttribute('disabled');
  });

  it('should call onSave with editor content when clicking save', async () => {
    const user = userEvent.setup();
    const { onSave } = renderEditor();

    act(() => {
      (__mockEditor as any)._triggerChange();
    });

    await user.click(screen.getByText('Sauvegarder'));

    expect(onSave).toHaveBeenCalledWith('edited content');
  });
});
