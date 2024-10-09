"use client";
import React, { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles"; // Adicione esta importação
import {
  Button,
  Table,
  TableBody,
  TableCell,
  Typography,
  Box,
  Container,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
} from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import MenuIcon from "@mui/icons-material/Menu";
import { supabase } from "../../supabaseClient";
import Sidebar from "../../components/Sidebar";
import UserMenu from "../../components/UserMenu";
import {
  StyledTableContainer,
  StyledTableHead,
  StyledTableRow,
  StyledMaterialInput,
  ContentCard,
} from "../../styles/styledComponents";

const AppHeader = styled(AppBar)(({ theme }) => ({
  backgroundColor: "rgba(255, 255, 255, 0.8)",
  backdropFilter: "blur(10px)",
  boxShadow: "none",
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  color: theme.palette.text.primary,
}));

const MainContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  overflowY: "auto",
  backgroundColor: theme.palette.background.default,
}));

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
}));

export default function SAP() {
  const theme = useTheme(); // Adicione esta linha para acessar o tema
  const [searchTerm, setSearchTerm] = useState("");
  const [materialData, setMaterialData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleSearch = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setMaterialData(null);

    try {
      const { data, error } = await supabase
        .from("materials_database")
        .select("*")
        .eq("user_id", user.id)
        .eq("codigo_materia_prima", searchTerm);

      if (error) throw error;

      if (data && data.length > 0) {
        const groupedData = data.reduce((acc, item) => {
          if (!acc.codigo_materia_prima) {
            acc.codigo_materia_prima = item.codigo_materia_prima;
            acc.descricao = item.descricao;
            acc.unidade_medida = item.unidade_medida;
            acc.saldo_total = 0;
            acc.lotes = [];
          }
          acc.saldo_total += parseFloat(item.qtd_materia_prima) || 0;
          acc.lotes.push({
            lote: item.lote,
            quantidade: item.qtd_materia_prima,
          });
          return acc;
        }, {});

        setMaterialData(groupedData);
      } else {
        setError("Nenhum material encontrado com o código fornecido.");
      }
    } catch (error) {
      console.error("Erro na busca:", error);
      setError("Ocorreu um erro durante a busca. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const toggleDrawer = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <AppHeader
        position="fixed"
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.background.paper, // Use a cor do tema
          color: theme.palette.text.primary, // Use a cor do tema
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, fontWeight: "bold" }}
          >
            Consulta de Material
          </Typography>
          <UserMenu user={user} onUserUpdate={handleUserUpdate} />
        </Toolbar>
      </AppHeader>
      <Sidebar open={drawerOpen} toggleDrawer={toggleDrawer} />
      <MainContent 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          mt: 8,
          backgroundColor: theme.palette.background.default, // Use a cor do tema
        }}
      >
        <Container maxWidth="md">
          <ContentCard elevation={3} sx={{ mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <StyledMaterialInput
                variant="filled"
                label="Código do Material"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                size="small"
                sx={{ mr: 2, width: "200px" }}
              />
              <StyledButton
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                disabled={loading}
                size="medium"
                sx={{
                  backgroundColor: theme.palette.primary.main, // Use a cor do tema
                  color: theme.palette.primary.contrastText, // Use a cor do tema
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark, // Use a cor do tema
                  },
                }}
              >
                Buscar
              </StyledButton>
            </Box>
          </ContentCard>

          {loading && <Typography align="center">Carregando...</Typography>}

          {error && (
            <Typography color="error" align="center">
              {error}
            </Typography>
          )}

          {materialData && (
            <ContentCard elevation={3}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  color: theme.palette.primary.main, // Use a cor do tema
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                Detalhes do Material
              </Typography>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <Typography>
                  <strong>Código:</strong> {materialData.codigo_materia_prima}
                </Typography>
                <Typography>
                  <strong>Descrição:</strong> {materialData.descricao}
                </Typography>
              </Box>
              <Typography align="center" sx={{ mb: 2 }}>
                <strong>Saldo Total:</strong>{" "}
                {materialData.saldo_total.toFixed(3)}{" "}
                {materialData.unidade_medida}
              </Typography>

              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{
                  color: theme.palette.primary.main, // Use a cor do tema
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                Lotes Disponíveis
              </Typography>
              <StyledTableContainer>
                <Table size="small" stickyHeader>
                  <StyledTableHead>
                    <StyledTableRow>
                      <TableCell>Lote</TableCell>
                      <TableCell align="right">Quantidade</TableCell>
                    </StyledTableRow>
                  </StyledTableHead>
                  <TableBody>
                    {materialData.lotes.map((lote, index) => (
                      <StyledTableRow key={index}>
                        <TableCell>{lote.lote}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${parseFloat(lote.quantidade).toFixed(3)} ${
                              materialData.unidade_medida
                            }`}
                            sx={{
                              backgroundColor: (theme) =>
                                alpha(theme.palette.primary.main, 0.1),
                              color: (theme) => theme.palette.primary.main,
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                            }}
                          />
                        </TableCell>
                      </StyledTableRow>
                    ))}
                  </TableBody>
                </Table>
              </StyledTableContainer>
            </ContentCard>
          )}
        </Container>
      </MainContent>
    </Box>
  );
}
