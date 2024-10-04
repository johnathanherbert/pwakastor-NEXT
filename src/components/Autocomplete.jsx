"use client";

import React, { useState, useEffect } from "react";
import { TextField, Autocomplete as MuiAutocomplete } from "@mui/material";
import { styled, alpha } from "@mui/material/styles";

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    transition: "all 0.3s",
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
    },
    "&.Mui-focused": {
      backgroundColor: alpha(theme.palette.primary.main, 0.12),
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
  },
  "& .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
  "& .MuiInputLabel-outlined": {
    color: alpha(theme.palette.text.primary, 0.7),
  },
  "& .MuiInputBase-input": {
    color: theme.palette.text.primary,
  },
}));

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
        <StyledTextField
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
