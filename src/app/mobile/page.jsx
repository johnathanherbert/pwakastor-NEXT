"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Toolbar,
  Typography,
  CircularProgress,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

// Componentes personalizados
import TabelaPrincipal from "../../components/TabelaPrincipal";
import DetalhamentoMateriais from "../../components/DetalhamentoMateriais";
import ExcelUploader from "../../components/ExcelUploader";
import Sap from "../../components/Sap";
import UserMenu from "../../components/UserMenu";

// Cliente Supabase
import { supabase } from "../../supabaseClient";

// Tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: "#004B5F",
    },
    secondary: {
      main: "#0a4064",
    },
    background: {
      default: "#F2F2F7",
      paper: "#FFFFFF",
    },
  },
});

export default function MobilePage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ordens, setOrdens] = useState([]);
  const [filteredExcipientes, setFilteredExcipientes] = useState({});
  const [materiaisNaArea, setMateriaisNaArea] = useState({});
  const [faltaSolicitar, setFaltaSolicitar] = useState({});
  const [expandedExcipient, setExpandedExcipient] = useState(null);
  const [allExpanded, setAllExpanded] = useState(false);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [openSapDialog, setOpenSapDialog] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openAddOrdemDialog, setOpenAddOrdemDialog] = useState(false);
  const [novaOrdem, setNovaOrdem] = useState({
    ativo: "",
    op: "",
    quantidade: "",
  });

  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleMateriaisNaAreaChange = () => {
    // Implementar lógica
  };

  const handleToggleExpandExcipient = () => {
    // Implementar lógica
  };

  const togglePesado = () => {
    // Implementar lógica
  };

  const calcularMovimentacaoTotal = () => {
    // Implementar lógica
    return 0;
  };

  const getOrdensAtendidas = () => {
    // Implementar lógica
    return [];
  };

  const handleUpdateSAPValues = () => {
    // Implementar lógica
  };

  const handleUpdateAllSAPValues = () => {
    // Implementar lógica
  };

  const handleCloseUploadDialog = () => {
    setOpenUploadDialog(false);
  };

  const handleCloseSapDialog = () => {
    setOpenSapDialog(false);
  };

  const handleAddOrdem = () => {
    // Implementar lógica para adicionar ordem
    console.log("Nova ordem:", novaOrdem);
    // Aqui você deve adicionar a lógica para salvar a nova ordem
    // e atualizar o estado das ordens
    setOpenAddOrdemDialog(false);
    setNovaOrdem({ ativo: "", op: "", quantidade: "" });
  };

  const handleOpenAddOrdemDialog = () => {
    setOpenAddOrdemDialog(true);
  };

  const handleCloseAddOrdemDialog = () => {
    setOpenAddOrdemDialog(false);
    setNovaOrdem({ ativo: "", op: "", quantidade: "" });
  };

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation" onClick={handleDrawerToggle}>
      <List>
        <ListItem button onClick={handleOpenAddOrdemDialog}>
          <ListItemText primary="Adicionar Ordem" />
        </ListItem>
        <ListItem button>
          <ListItemText primary="Opção 2" />
        </ListItem>
      </List>
    </Box>
  );

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          width: "100vw",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
        }}
      >
        <CircularProgress
          size={60}
          thickness={4}
          sx={{ color: theme.palette.primary.main }}
        />
      </Box>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Gestão de Materiais
            </Typography>
            <UserMenu user={user} />
          </Toolbar>
        </AppBar>
        <Drawer anchor="left" open={drawerOpen} onClose={handleDrawerToggle}>
          {drawer}
        </Drawer>
        <Box sx={{ p: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleOpenAddOrdemDialog}
            sx={{ mb: 2 }}
          >
            Adicionar Ordem
          </Button>
          <TabelaPrincipal
            filteredExcipientes={filteredExcipientes}
            materiaisNaArea={materiaisNaArea}
            faltaSolicitar={faltaSolicitar}
            handleMateriaisNaAreaChange={handleMateriaisNaAreaChange}
            handleToggleExpandExcipient={handleToggleExpandExcipient}
            expandedExcipient={expandedExcipient}
            allExpanded={allExpanded}
            togglePesado={togglePesado}
            theme={theme}
            calcularMovimentacaoTotal={calcularMovimentacaoTotal}
            getOrdensAtendidas={getOrdensAtendidas}
            handleUpdateSAPValues={handleUpdateSAPValues}
            handleUpdateAllSAPValues={handleUpdateAllSAPValues}
          />
          <DetalhamentoMateriais
            getFilteredAtivos={() => Object.keys(filteredExcipientes)}
            getAtivoStatus={() => "completo"}
            handleDetailClick={() => {}}
            theme={theme}
            ordens={ordens}
            filteredExcipientes={filteredExcipientes}
            materiaisNaArea={materiaisNaArea}
          />
        </Box>
      </Box>
      <ExcelUploader
        onDataUpdated={() => {}}
        openUploadDialog={openUploadDialog}
        handleCloseUploadDialog={handleCloseUploadDialog}
      />
      <Sap
        open={openSapDialog}
        onClose={handleCloseSapDialog}
        theme={theme}
        user={user}
      />
      <Dialog open={openAddOrdemDialog} onClose={handleCloseAddOrdemDialog}>
        <DialogTitle>Adicionar Nova Ordem</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Ativo"
            fullWidth
            value={novaOrdem.ativo}
            onChange={(e) =>
              setNovaOrdem({ ...novaOrdem, ativo: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="OP"
            fullWidth
            value={novaOrdem.op}
            onChange={(e) => setNovaOrdem({ ...novaOrdem, op: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Quantidade"
            type="number"
            fullWidth
            value={novaOrdem.quantidade}
            onChange={(e) =>
              setNovaOrdem({ ...novaOrdem, quantidade: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddOrdemDialog}>Cancelar</Button>
          <Button onClick={handleAddOrdem} color="primary">
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
