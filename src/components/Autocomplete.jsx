"use client";

import React, { useState, useEffect, useRef } from "react";

const Autocomplete = ({ label, value, onChange, onKeyPress, className }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const response = await fetch("/utils/medicamentos.txt");
        const data = await response.text();
        const items = data.split("\n").map((item) => item.trim());
        setSuggestions(items);
      } catch (error) {
        console.error("Erro ao carregar sugestões:", error);
      }
    };

    loadSuggestions();
  }, []);

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    const filtered = suggestions.filter((item) =>
      item.toLowerCase().includes(newValue.toLowerCase())
    );
    setFilteredSuggestions(filtered.slice(0, 10));
    setIsOpen(true);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    onChange(suggestion);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={onKeyPress}
          placeholder={label}
          className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 
            border border-gray-300 dark:border-gray-600 rounded-lg 
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            text-gray-900 dark:text-white placeholder-gray-500 
            dark:placeholder-gray-400 ${className}`}
        />
        {label && (
          <label className="absolute -top-2 left-2 px-1 text-xs font-medium 
            text-gray-600 dark:text-gray-400 
            bg-white dark:bg-gray-800">
            {label}
          </label>
        )}
      </div>

      {isOpen && filteredSuggestions.length > 0 && (
        <ul
          className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 
          border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg 
          max-h-60 overflow-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-2 cursor-pointer text-gray-900 dark:text-white 
                hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Autocomplete;
