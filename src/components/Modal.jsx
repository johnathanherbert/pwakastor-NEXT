import React, { useEffect, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md", // sm, md, lg, xl, full
  withCloseButton = true,
  footer,
  gradientHeader = true,
  closeOnClickOutside = true,
  showCloseIcon = true,
  variant = "default", // default, info, warning, success, danger
  loading = false,
  bodyClass = "",
  headerClass = "",
  footerClass = "",
  customIcon,
  hideBackdrop = false,
}) => {
  const modalRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200); // Match this with CSS duration
  };

  // Handle escape key press to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
      document.body.style.overflow = "hidden"; // Prevent scrolling when modal is open
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = ""; // Re-enable scrolling when modal closes
    };
  }, [isOpen, onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        closeOnClickOutside &&
        modalRef.current && 
        !modalRef.current.contains(event.target)
      ) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, closeOnClickOutside]);

  if (!isOpen) return null;

  const sizeClasses = {
    xs: "max-w-xs",
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    "2xl": "max-w-7xl",
    full: "max-w-full mx-4",
  };

  const variantClasses = {
    default: {
      header: gradientHeader
        ? "bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900"
        : "bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700",
      headerText: gradientHeader
        ? "text-white"
        : "text-gray-800 dark:text-gray-100",
      closeButton: gradientHeader
        ? "text-white/80 hover:text-white hover:bg-white/10"
        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
    },
    info: {
      header: "bg-blue-500 dark:bg-blue-700",
      headerText: "text-white",
      closeButton: "text-white/80 hover:text-white hover:bg-blue-600/40",
    },
    warning: {
      header: "bg-yellow-500 dark:bg-yellow-700",
      headerText: "text-white",
      closeButton: "text-white/80 hover:text-white hover:bg-yellow-600/40",
    },
    success: {
      header: "bg-green-500 dark:bg-green-700",
      headerText: "text-white",
      closeButton: "text-white/80 hover:text-white hover:bg-green-600/40",
    },
    danger: {
      header: "bg-red-500 dark:bg-red-700",
      headerText: "text-white",
      closeButton: "text-white/80 hover:text-white hover:bg-red-600/40",
    },
  };

  const currentVariant = variantClasses[variant] || variantClasses.default;

  const headerClasses = `${currentVariant.header} ${headerClass}`;
  const headerTextClasses = `${currentVariant.headerText} ${headerClass}`;
  const closeButtonClasses = `p-1 rounded-full ${currentVariant.closeButton} transition-colors duration-200`;

  const animationClasses = isClosing
    ? "animate-modalExit opacity-0 scale-95"
    : "animate-modalEntry opacity-100 scale-100";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      {/* Backdrop with blur effect */}
      {!hideBackdrop && (
        <div className={`fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm transition-opacity 
                       ${isClosing ? 'opacity-0' : 'opacity-100'}`} />
      )}

      {/* Modal content */}
      <div 
        className={`relative ${sizeClasses[size]} w-full transform transition-all duration-200 ease-in-out 
                  ${animationClasses}`}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
          {/* Header */}
          <div className={`${headerClasses} px-6 py-4 flex justify-between items-center`}>
            <div className="flex items-center space-x-2">
              {customIcon && <div className="flex-shrink-0">{customIcon}</div>}
              <h3 id="modal-title" className={`text-lg font-bold ${headerTextClasses}`}>
                {title}
              </h3>
            </div>
            {withCloseButton && showCloseIcon && (
              <button
                onClick={handleClose}
                className={closeButtonClasses}
                aria-label="Close modal"
                type="button"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className={`p-6 overflow-y-auto max-h-[calc(100vh-200px)] ${loading ? 'opacity-60' : ''} ${bodyClass}`}>
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 dark:border-gray-600 border-t-blue-600"></div>
              </div>
            ) : null}
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className={`bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 rounded-b-xl ${footerClass}`}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
