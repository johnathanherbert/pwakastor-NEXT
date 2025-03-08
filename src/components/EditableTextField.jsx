import React, { useState, useRef, useEffect } from "react";

const EditableTextField = ({ value, onChange, onFetch, isLoading, codigo }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [displayValue, setDisplayValue] = useState(value);
  const [sapValue, setSapValue] = useState(value); // Valor original do SAP
  const inputRef = useRef(null);

  useEffect(() => {
    setSapValue(value);
    setDisplayValue(value);
    setLocalValue(value);
  }, [value]);

  const handleClick = async () => {
    if (!isLoading) {
      // Restaura o valor do SAP
      setDisplayValue(sapValue);
      setLocalValue(sapValue);
      onChange(sapValue);
      onFetch(codigo);
    }
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== displayValue) {
      setDisplayValue(localValue);
      onChange(localValue); // Atualiza o valor para cálculos, mas mantém o valor do SAP separado
    }
  };

  const handleChange = (e) => {
    const newValue = e.target.value.replace(/[^0-9.]/g, "");
    setLocalValue(newValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setLocalValue(displayValue);
      setIsEditing(false);
    }
  };

  return (
    <div className="group relative">
      <div
        onDoubleClick={handleDoubleClick}
        className={`
          inline-flex items-center justify-end min-w-[80px] px-2 py-1 rounded
          transition-all duration-300
          ${isEditing ? "bg-blue-100 dark:bg-blue-900/40" : "bg-blue-50 dark:bg-blue-900/20"}
          ${isLoading ? "cursor-wait" : "cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50"}
          ${displayValue !== sapValue ? "border-l-4 border-yellow-400" : ""}
        `}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-right text-sm focus:outline-none"
          />
        ) : (
          <>
            <span className="text-sm text-gray-900 dark:text-gray-100">
              {isLoading ? "Carregando..." : displayValue}
            </span>
            <button
              onClick={handleClick}
              className="opacity-0 group-hover:opacity-100 ml-2 p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-all"
              title="Restaurar valor do SAP"
            >
              <ArrowPathIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </button>
          </>
        )}
      </div>
      {displayValue !== sapValue && (
        <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900/40 
                        text-yellow-800 dark:text-yellow-200 rounded-full border border-yellow-200 dark:border-yellow-800/50">
          Ajustado
        </span>
      )}
    </div>
  );
};

export default EditableTextField;
