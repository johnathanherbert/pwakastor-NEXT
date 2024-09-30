"use client";

import React, { useState, useEffect } from "react";
import { TextField, Autocomplete as MuiAutocomplete } from "@mui/material";

const Autocomplete = ({ label, value, onChange, onKeyPress, sx, ...props }) => {
  const [suggestions, setSuggestions] = useState([]);

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

  return (
    <MuiAutocomplete
      freeSolo
      options={suggestions}
      renderInput={(params) => (
        <TextField
          {...params}
          {...props}
          label={label}
          onKeyPress={onKeyPress}
          sx={sx}
        />
      )}
      value={value}
      onChange={(event, newValue) => onChange(newValue)}
      onInputChange={(event, newInputValue) => onChange(newInputValue)}
    />
  );
};

export default Autocomplete;
