import React, { useState, useRef, useEffect } from "react";

const EditableTextField = ({ value, onChange, onFetch, isLoading, codigo }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClick = () => {
    if (!isLoading && !isEditing) {
      onFetch(codigo);
    }
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onChange(localValue);
  };

  const handleChange = (e) => {
    const newValue = e.target.value.replace(/[^0-9.]/g, "");
    setLocalValue(newValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    }
  };

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`
        inline-flex items-center justify-end min-w-[80px] px-2 py-1 rounded
        transition-all duration-300
        ${
          isEditing
            ? "bg-blue-100 dark:bg-blue-900/40"
            : "bg-blue-50 dark:bg-blue-900/20"
        }
        ${
          isLoading
            ? "cursor-wait"
            : "cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50"
        }
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
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {isLoading ? "Carregando..." : value}
        </span>
      )}
    </div>
  );
};

export default EditableTextField;
