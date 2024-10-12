import React, { useState, useRef, useEffect } from "react";
import { TextField, Typography, Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";

const StyledBox = styled(Box)(({ theme, isEditing }) => ({
  backgroundColor: isEditing
    ? alpha(theme.palette.primary.main, 0.12)
    : alpha(theme.palette.primary.main, 0.04),
  borderRadius: 4,
  padding: "4px 8px",
  minWidth: "80px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-end",
  transition: "background-color 0.3s, box-shadow 0.3s",
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    cursor: "text",
  },
}));

const EditableTextField = ({ value, onChange, onFetch, isLoading, codigo }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClick = () => {
    if (!isEditing && !isLoading) {
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
    <StyledBox
      isEditing={isEditing}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      sx={{ cursor: isLoading ? "wait" : "pointer" }}
    >
      {isEditing ? (
        <TextField
          inputRef={inputRef}
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          variant="standard"
          size="small"
          InputProps={{
            disableUnderline: true,
            style: { textAlign: "right", fontSize: "0.875rem" },
          }}
          sx={{ width: "100%" }}
        />
      ) : (
        <Typography variant="body2" component="span">
          {isLoading ? "Carregando..." : value}
        </Typography>
      )}
    </StyledBox>
  );
};

export default EditableTextField;
