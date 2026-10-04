import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, Trash2 } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This operation cannot be undone.',
  confirmText = 'Delete',
  confirmVariant = 'danger',
  confirmIcon = Trash2,
  isLoading = false
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            size="sm"
          >
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            icon={confirmIcon}
            onClick={onConfirm}
            loading={isLoading}
            size="sm"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
