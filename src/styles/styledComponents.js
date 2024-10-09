import { styled, alpha } from "@mui/material/styles";
import { TableContainer, TableHead, TableRow, TableCell, Paper } from "@mui/material";
import { TextField } from "@mui/material"; // Assuming TextField is needed for StyledMaterialInput

export const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  boxShadow: "none",
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

export const StyledTableHead = styled(TableHead)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  "& th": {
    color: theme.palette.primary.contrastText,
    fontWeight: "bold",
  },
}));

export const StyledDetailTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: alpha(theme.palette.primary.light, 0.05),
  },
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.light, 0.1),
  },
}));

export const StatusCell = styled(TableCell)(({ theme, status }) => ({
  backgroundColor:
    status === "completo"
      ? alpha(theme.palette.success.main, 0.1)
      : status === "parcial"
      ? alpha(theme.palette.warning.main, 0.1)
      : alpha(theme.palette.error.main, 0.1),
  color: theme.palette.text.primary,
  fontWeight: "medium",
  fontSize: "0.8rem",
  padding: "4px 8px",
  borderRadius: "4px",
}));

export const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: alpha(theme.palette.primary.light, 0.05),
  },
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.light, 0.1),
  },
}));

export const StyledExpandedRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.secondary.light, 0.05),
}));

export const StyledMaterialInput = styled(TextField)(({ theme }) => ({
  "& .MuiFilledInput-root": {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    borderRadius: 4,
    transition: "background-color 0.3s, box-shadow 0.3s",
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
    },
    "&.Mui-focused": {
      backgroundColor: alpha(theme.palette.primary.main, 0.12),
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
  },
  "& .MuiFilledInput-input": {
    padding: "10px 12px",
    fontSize: "0.875rem",
    textAlign: "right",
  },
  "& .MuiInputAdornment-root": {
    marginLeft: 0,
  },
}));

export const ContentCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
}));
