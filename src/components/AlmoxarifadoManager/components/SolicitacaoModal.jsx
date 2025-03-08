export const SolicitacaoModal = ({ 
  show, 
  modalData, 
  onClose, 
  onSave, 
  onModalDataChange 
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" />
        <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-xl w-full max-w-md">
          {/* Modal content implementation here */}
        </div>
      </div>
    </div>
  );
};
