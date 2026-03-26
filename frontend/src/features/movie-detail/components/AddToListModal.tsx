import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { UserListSummary } from '../../../services/listsServices';

interface AddToListModalProps {
  open: boolean;
  movieTitle: string;
  loading: boolean;
  saving: boolean;
  lists: UserListSummary[];
  selectedListId: number | null;
  createName: string;
  createDescription: string;
  creating: boolean;
  onClose: () => void;
  onSelectList: (listId: number) => void;
  onCreateNameChange: (value: string) => void;
  onCreateDescriptionChange: (value: string) => void;
  onCreateList: () => void;
  onConfirm: () => void;
}

export function AddToListModal({
  open,
  movieTitle,
  loading,
  saving,
  lists,
  selectedListId,
  createName,
  createDescription,
  creating,
  onClose,
  onSelectList,
  onCreateNameChange,
  onCreateDescriptionChange,
  onCreateList,
  onConfirm,
}: AddToListModalProps) {
  if (!open) return null;

  return (
    <div onClick={onClose} className="md-list-overlay">
      <motion.div
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 16, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="md-list-card"
      >
        <div className="md-modal-header">
          <div className="md-modal-header-title">
            Anadir a lista
          </div>
          <button onClick={onClose} className="md-modal-close-btn">
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: 16 }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: '#E2E2E2', marginBottom: 14 }}>
            {movieTitle}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div className="md-modal-section-title">
              Tus listas
            </div>

            {loading ? (
              <div style={{ color: '#A1A1A1', fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>Cargando listas...</div>
            ) : lists.length === 0 ? (
              <div style={{ color: '#A1A1A1', fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>No tienes listas todavia. Crea una debajo.</div>
            ) : (
              <div className="md-list-scroll-area">
                {lists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => onSelectList(list.id)}
                    className={`md-list-item-btn ${selectedListId === list.id ? 'md-list-item-btn--selected' : ''}`}
                  >
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17 }}>{list.name}</div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 11, color: '#A1A1A1' }}>
                      {list.items_count} films {list.is_public ? '· Publica' : '· Privada'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="md-list-create-section">
            <div className="md-modal-section-title">
              Crear nueva lista
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              <input
                value={createName}
                onChange={(event) => onCreateNameChange(event.target.value)}
                placeholder="Nombre de la lista"
                className="md-modal-input"
                style={{ fontSize: 16, marginBottom: 0 }}
              />
              <textarea
                value={createDescription}
                onChange={(event) => onCreateDescriptionChange(event.target.value)}
                placeholder="Descripcion (opcional)"
                rows={2}
                className="md-modal-textarea"
                style={{ fontSize: 15, marginBottom: 0 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={onCreateList}
                  disabled={creating}
                  className="md-modal-mode-btn"
                  style={{ opacity: creating ? 0.7 : 1 }}
                >
                  {creating ? 'Creando...' : 'Crear lista'}
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button onClick={onClose} className="md-modal-mode-btn">
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={saving || selectedListId === null}
              className="md-modal-btn-save"
              style={{ opacity: (saving || selectedListId === null) ? 0.7 : 1 }}
            >
              {saving ? 'Guardando...' : 'Anadir pelicula'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
