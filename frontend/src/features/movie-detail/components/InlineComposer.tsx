import React from 'react';

interface InlineComposerProps {
  mode: 'review' | 'reply' | null;
  text: string;
  onTextChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function InlineComposer({
  mode,
  text,
  onTextChange,
  onSubmit,
  onCancel,
}: InlineComposerProps) {
  if (!mode) return null;

  const title = mode === 'review' ? 'Escribe tu reseña' : 'Responder reseña';
  const cta = mode === 'review' ? 'Publicar reseña' : 'Enviar respuesta';

  return (
    <div className="md-inline-composer">
      <div className="md-composer-title">{title}</div>
      <textarea
        value={text}
        onChange={(event) => onTextChange(event.target.value)}
        rows={5}
        placeholder="Escribe aquí..."
        className="md-composer-textarea"
      />
      <div className="md-composer-actions">
        <button onClick={onCancel} className="md-composer-btn md-composer-btn--cancel">
          Cancelar
        </button>
        <button onClick={onSubmit} className="md-composer-btn md-composer-btn--submit">
          {cta}
        </button>
      </div>
    </div>
  );
}
